class Portfolio {
    constructor() {
        this.projects = [];
        this.currentIndex = 0;
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        return mobileRegex.test(userAgent) || window.innerWidth <= 768;
    }

    applyConfig(config) {
        const root = document.documentElement.style;

        // Palette
        const paletteMap = {
            backgroundGradientStart: '--bg-gradient-start',
            backgroundGradientEnd:   '--bg-gradient-end',
            cardBackground:          '--card-bg',
            textPrimary:             '--text-primary',
            textSecondary:           '--text-secondary',
            accentStart:             '--accent-start',
            accentEnd:               '--accent-end'
        };
        if (config.palette) {
            for (const [key, cssVar] of Object.entries(paletteMap)) {
                if (config.palette[key]) root.setProperty(cssVar, config.palette[key]);
            }
        }

        // Font family
        if (config.style?.fontFamily) {
            root.setProperty('--font-family', config.style.fontFamily);
        }

        // Animation speed — accepts seconds e.g. 0.2, 0.5
        if (config.style?.animationSpeed != null) {
            root.setProperty('--animation-speed', `${config.style.animationSpeed}s`);
        }

        // Tech tag style — "pill" (default, fully rounded) or "square" (sharp corners)
        if (config.style?.techTagStyle) {
            const radius = config.style.techTagStyle === 'square' ? '4px' : '20px';
            root.setProperty('--tech-tag-radius', radius);
        }
    }

    async init() {
        try {
            const container = document.getElementById('carousel-container');
            container.innerHTML = '<div class="loading-throbber"><div class="loading-spinner"></div></div>';
            await this.loadProjects();
            this.projects.forEach(project => this.preloadMedia(project));
            this.render();
            this.setupControls();

            const params = new URLSearchParams(window.location.search);
            const startIndex = parseInt(params.get('project'), 10);
            if (!isNaN(startIndex) && startIndex >= 0 && startIndex < this.projects.length) {
                this.currentIndex = startIndex;
                this.updateCarousel();
            }
        } catch (error) {
            console.error('Portfolio initialization failed:', error);
            this.showError('Failed to load projects');
        }
    }

    async loadProjects() {
        let configs = [];
        try {
            const response = await fetch('projects.json');
            if (response.ok) {
                const data = await response.json();
                this.applyConfig(data);
                configs = data.projects || [];
            } else {
                console.error('Could not load projects.json');
            }
        } catch (error) {
            console.error('Failed to fetch projects.json:', error);
        }

        const projectPromises = configs.map(async (config) => {
            try {
                return await this.loadProject(config);
            } catch (error) {
                console.warn(`Failed to load project ${config.folder}:`, error);
                return null;
            }
        });

        const projects = await Promise.all(projectPromises);
        this.projects = projects.filter(p => p !== null);
    }

    async loadProject(config) {
        const project = {
            folder: config.folder,
            title: this.formatTitle(config.folder),
            description: 'Project description not found.',
            technologies: [],
            media: { videos: [], screenshots: [] }
        };

        try {
            const readme = await this.fetchFile(`${config.folder}/README.md`);
            if (readme) {
                Object.assign(project, this.parseMarkdown(readme));
            }
        } catch (error) {
            console.warn(`No README found for ${config.folder}`, error);
        }

        // Build media directly from config — no HEAD requests needed
        project.media = this.buildMedia(config);

        return project;
    }

    buildMedia(config) {
        const media = { videos: [], screenshots: [] };
        const folder = config.folder;

        // Videos: demo.mp4, demo2.mp4, demo3.mp4
        const videoCount = config.videos || 0;
        for (let i = 1; i <= Math.min(videoCount, 3); i++) {
            const filename = i === 1 ? 'demo.mp4' : `demo${i}.mp4`;
            media.videos.push(`${folder}/${filename}`);
        }

        // Screenshots: screenshot1.jpg ... screenshotN.jpg
        const screenshotCount = config.screenshots || 0;
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        for (let i = 1; i <= screenshotCount; i++) {
            media.screenshots.push(`${folder}/screenshot${i}.png`);
        }

        return media;
    }

    async fetchFile(path) {
        try {
            const response = await fetch(path);
            return response.ok ? await response.text() : null;
        } catch (error) {
            console.warn('fetchFile error for', path, error);
            return null;
        }
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const result = { technologies: [], keyFeatures: [], team: [] };

        const titleLine = lines.find(line => line.startsWith('# '));
        if (titleLine) result.title = titleLine.replace('# ', '').trim();

        const descriptionStart = lines.findIndex(line =>
            line.trim() && !line.startsWith('#') && !line.startsWith('![')
        );
        if (descriptionStart >= 0) {
            const descLines = [];
            for (let i = descriptionStart; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('##') || line.startsWith('###')) break;
                if (line || descLines.length > 0) descLines.push(line);
            }
            result.description = this.parseMarkdownText(descLines.join('  ').trim());
        }

        const techStart = lines.findIndex(line => /^##?\s*(tech|stack|built|tools)/i.test(line));
        if (techStart >= 0) {
            for (let i = techStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) result.technologies.push(this.parseMarkdownText(line.replace('- ', '').trim()));
            }
        }

        const featuresStart = lines.findIndex(line => /^##?\s*key features/i.test(line));
        if (featuresStart >= 0) {
            for (let i = featuresStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) result.keyFeatures.push(this.parseMarkdownText(line.replace('- ', '').trim()));
            }
        }

        const teamStart = lines.findIndex(line => /^##?\s*team/i.test(line));
        if (teamStart >= 0) {
            for (let i = teamStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) result.team.push(this.parseMarkdownText(line.replace('- ', '').trim()));
            }
        }

        return result;
    }

    parseMarkdownText(text) {
        return text
            // Links must be parsed BEFORE bold/italic to avoid mangling the brackets
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    formatTitle(folder) {
        return folder.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    preloadMedia(project) {
        project.media.screenshots.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    render() {
        const container = document.getElementById('carousel-container');
        if (this.projects.length === 0) {
            container.innerHTML = '<div class="error">No projects found</div>';
            return;
        }
        container.innerHTML = `
        ${this.renderControls()}
        <div class="carousel-wrapper">
            <div class="carousel-track" id="carousel-track">
                ${this.projects.map(p => this.renderProject(p)).join('')}
            </div>
        </div>
    `;
    }

    renderProject(project) {
        const mediaInnerHTML = this.renderMedia(project.media);
        const techHTML = project.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');

        const featuresHTML = project.keyFeatures && project.keyFeatures.length > 0 ? `
            <div class="content-column">
                <h4 class="section-title">Key Features</h4>
                <ul class="feature-list">
                    ${project.keyFeatures.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>` : '<div class="content-column"></div>';

        const teamHTML = project.team && project.team.length > 0 ? `
            <div class="content-column">
                <h4 class="section-title">Team</h4>
                <ul class="team-list">
                    ${project.team.map(m => `<li>${m}</li>`).join('')}
                </ul>
            </div>` : '<div class="content-column"></div>';

        return `
            <article class="project-card">
                <div class="project-media">
                    ${mediaInnerHTML}
                </div>
                <div class="project-content">
                    <div class="project-header">
                        <h3 class="project-title">${project.title}</h3>
                        <div class="tech-stack">${techHTML}</div>
                    </div>
                    <div class="content-grid">
                        <div class="content-column">
                            <h4 class="section-title">Description</h4>
                            <div class="project-description">${formatFirstParagraph(project.description)}</div>
                        </div>
                        ${featuresHTML}
                        ${teamHTML}
                    </div>
                </div>
            </article>
        `;
    }

    renderMedia(media) {
        let html = '';

        // Video buttons — one per video file
        if (media.videos.length > 0) {
            html += '<div class="video-buttons">';
            media.videos.forEach((videoPath, index) => {
                const label = media.videos.length > 1 ? `Watch Video ${index + 1}` : 'Watch Video';
                html += `
            <div class="video-button" data-video="${videoPath}">
                <div class="play-icon">▶</div>
                <span>${label}</span>
            </div>
        `;
            });
            html += '</div>';
        }

        // Screenshot carousel
        if (media.screenshots.length > 0) {
            html += `
                <div class="screenshot-carousel">
                    <div class="screenshot-track">
                        ${media.screenshots.map((src, i) =>
                `<img src="${src}" alt="Screenshot ${i + 1}" class="screenshot ${i === 0 ? 'active' : ''}">`
            ).join('')}
                    </div>
                    ${media.screenshots.length > 1 ? `
                        <div class="screenshot-nav">
                            <button class="screenshot-prev">‹</button>
                            <div class="screenshot-dots">
                                ${media.screenshots.map((_, i) =>
                `<button class="screenshot-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
            ).join('')}
                            </div>
                            <button class="screenshot-next">›</button>
                        </div>` : ''}
                </div>
            `;
        }

        if (!html) return '<div class="media-placeholder">No media available</div>';
        return html;
    }

    renderControls() {
        if (this.projects.length <= 1) return '';
        return `
            <div class="carousel-nav">
                <button class="nav-btn" id="prev-btn">← Previous</button>
                <button class="nav-btn" id="next-btn">Next →</button>
            </div>
            <div class="carousel-dots">
                ${this.projects.map((_, i) =>
            `<button class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`
        ).join('')}
            </div>
        `;
    }

    setupControls() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const dots = document.querySelectorAll('.dot');

        if (prevBtn) {
            prevBtn.setAttribute('aria-label', 'Previous project');
            prevBtn.tabIndex = 0;
            prevBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') prevBtn.click(); });
        }
        if (nextBtn) {
            nextBtn.setAttribute('aria-label', 'Next project');
            nextBtn.tabIndex = 0;
            nextBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') nextBtn.click(); });
        }
        dots.forEach((dot, i) => {
            dot.setAttribute('aria-label', `Go to project ${i + 1}`);
            dot.tabIndex = 0;
            dot.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') dot.click(); });
            dot.addEventListener('click', () => this.goToSlide(i));
        });

        prevBtn?.addEventListener('click', () => this.goToPrevious());
        nextBtn?.addEventListener('click', () => this.goToNext());

        this.setupScreenshotCarousels();
        this.setupVideoPopup();
    }

    setupScreenshotCarousels() {
        document.querySelectorAll('.screenshot-carousel').forEach(carousel => {
            const screenshots = carousel.querySelectorAll('.screenshot');
            const prevBtn = carousel.querySelector('.screenshot-prev');
            const nextBtn = carousel.querySelector('.screenshot-next');
            const dots = carousel.querySelectorAll('.screenshot-dot');
            if (screenshots.length <= 1) return;

            let current = 0;
            let intervalId = null;

            const update = () => {
                screenshots.forEach((s, i) => s.classList.toggle('active', i === current));
                dots.forEach((d, i) => d.classList.toggle('active', i === current));
            };
            const next = () => { current = (current + 1) % screenshots.length; update(); };
            const prev = () => { current = current > 0 ? current - 1 : screenshots.length - 1; update(); };

            prevBtn?.addEventListener('click', prev);
            nextBtn?.addEventListener('click', next);
            dots.forEach((d, i) => d.addEventListener('click', () => { current = i; update(); }));

            const startAuto = () => { if (intervalId) clearInterval(intervalId); intervalId = setInterval(next, 3000); };
            const stopAuto = () => { if (intervalId) clearInterval(intervalId); };

            carousel.addEventListener('mouseenter', stopAuto);
            carousel.addEventListener('mouseleave', startAuto);
            carousel.addEventListener('touchstart', stopAuto, { passive: true });
            carousel.addEventListener('touchend', startAuto, { passive: true });

            update();
            startAuto();
        });
    }

    setupVideoPopup() {
        const videoPopup = document.getElementById('video-popup');
        const popupVideo = document.getElementById('popup-video');
        const closeBtn = document.querySelector('.video-close');

        document.querySelectorAll('.video-button').forEach(button => {
            button.addEventListener('click', () => {
                popupVideo.src = button.getAttribute('data-video');
                videoPopup.classList.add('active');
                if (this.isMobile) document.body.style.overflow = 'hidden';
                popupVideo.play();
            });
        });

        const closePopup = () => {
            videoPopup.classList.remove('active');
            popupVideo.pause();
            popupVideo.src = '';
            if (this.isMobile) document.body.style.overflow = '';
        };

        closeBtn?.addEventListener('click', closePopup);
        videoPopup.addEventListener('click', e => { if (e.target === videoPopup) closePopup(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && videoPopup.classList.contains('active')) closePopup();
        });
    }

    goToPrevious() {
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.projects.length - 1;
        this.updateCarousel();
    }

    goToNext() {
        this.currentIndex = (this.currentIndex + 1) % this.projects.length;
        this.updateCarousel();
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }

    updateCarousel() {
        const track = document.getElementById('carousel-track');
        const dots = document.querySelectorAll('.dot');
        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === this.currentIndex));
    }

    showError(message) {
        document.getElementById('carousel-container').innerHTML = `<div class="error">${message}</div>`;
    }
}

function formatFirstParagraph(descriptionHTML) {
    if (!descriptionHTML) return '';
    let firstPara, rest;
    if (descriptionHTML.includes('<br>')) {
        const parts = descriptionHTML.split('<br>');
        firstPara = parts[0].trim();
        rest = parts.slice(1).join('<br>');
    } else if (descriptionHTML.includes('  ')) {
        const parts = descriptionHTML.split('  ');
        firstPara = parts[0].trim();
        rest = parts.slice(1).join('  ');
    } else {
        firstPara = descriptionHTML;
        rest = '';
    }
    let result = `<span style="font-weight:bold;font-style:italic;">${firstPara}</span>`;
    if (rest.trim()) result += '<br>' + rest.trim();
    return result;
}

document.addEventListener('DOMContentLoaded', () => { new Portfolio(); });