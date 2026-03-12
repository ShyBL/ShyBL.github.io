class Portfolio {
    constructor() {
        this.projects = [];
        this.currentIndex = 0;
        this.screenshotIntervals = new Map();
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileDevice = mobileRegex.test(userAgent);
        const isMobileViewport = window.innerWidth <= 768;
        return isMobileDevice || isMobileViewport;
    }

    async init() {
        try {
            const container = document.getElementById('carousel-container');
            container.innerHTML = '<div class="loading-throbber"><div class="loading-spinner"></div></div>';
            await this.loadProjects();
            this.projects.forEach(project => this.preloadMedia(project));
            this.render();
            this.setupControls();
        } catch (error) {
            console.error('Portfolio initialization failed:', error);
            this.showError('Failed to load projects');
        }
    }

    async loadProjects() {
        // FIX #4: Load folder names from projects.json instead of hardcoding them here.
        // To add a new project, just add its folder name to projects.json.
        let projectFolders = [];
        try {
            const response = await fetch('projects.json');
            if (response.ok) {
                projectFolders = await response.json();
            } else {
                console.error('Could not load projects.json');
            }
        } catch (error) {
            console.error('Failed to fetch projects.json:', error);
        }

        const projectPromises = projectFolders.map(async (folder) => {
            try {
                return await this.loadProject(folder);
            } catch (error) {
                console.warn(`Failed to load project ${folder}:`, error);
                return null;
            }
        });

        const projects = await Promise.all(projectPromises);
        this.projects = projects.filter(project => project !== null);
    }

    async loadProject(folder) {
        const project = {
            folder,
            title: this.formatTitle(folder),
            description: 'Project description not found.',
            technologies: [],
            media: { video: null, screenshots: [] }
        };

        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(project, parsed);
            }
        } catch (error) {
            console.warn(`No README found for ${folder}`, error);
        }

        project.media = await this.loadMedia(folder);
        return project;
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
        if (titleLine) {
            result.title = titleLine.replace('# ', '').trim();
        }

        const descriptionStart = lines.findIndex(line =>
            line.trim() && !line.startsWith('#') && !line.startsWith('![')
        );

        if (descriptionStart >= 0) {
            const descriptionLines = [];
            for (let i = descriptionStart; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('##') || line.startsWith('###')) break;
                if (line || descriptionLines.length > 0) {
                    descriptionLines.push(line);
                }
            }
            result.description = this.parseMarkdownText(descriptionLines.join('  ').trim());
        }

        const techStart = lines.findIndex(line =>
            /^##?\s*(tech|stack|built|tools)/i.test(line)
        );
        if (techStart >= 0) {
            for (let i = techStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.technologies.push(this.parseMarkdownText(line.replace('- ', '').trim()));
                }
            }
        }

        const featuresStart = lines.findIndex(line =>
            /^##?\s*key features/i.test(line)
        );
        if (featuresStart >= 0) {
            for (let i = featuresStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.keyFeatures.push(this.parseMarkdownText(line.replace('- ', '').trim()));
                }
            }
        }

        const teamStart = lines.findIndex(line =>
            /^##?\s*team/i.test(line)
        );
        if (teamStart >= 0) {
            for (let i = teamStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.team.push(this.parseMarkdownText(line.replace('- ', '').trim()));
                }
            }
        }

        return result;
    }

    parseMarkdownText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    async loadMedia(folder) {
        const media = { video: null, screenshots: [] };

        const videoExts = ['mp4', 'webm', 'mov'];
        for (const ext of videoExts) {
            const videoPath = `${folder}/demo.${ext}`;
            if (await this.fileExists(videoPath)) {
                media.video = videoPath;
                break;
            }
        }

        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        for (let i = 1; i <= 4; i++) {
            for (const ext of imageExts) {
                const imagePath = `${folder}/screenshot${i}.${ext}`;
                if (await this.fileExists(imagePath)) {
                    media.screenshots.push(imagePath);
                    break;
                }
            }
        }

        return media;
    }

    async fileExists(path) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000);
            const response = await fetch(path, {
                method: 'HEAD',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    formatTitle(folder) {
        return folder
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    preloadMedia(project) {
        if (project.media && Array.isArray(project.media.screenshots)) {
            project.media.screenshots.forEach(src => {
                const img = new Image();
                img.src = src;
            });
        }
        // Video existence was already confirmed in loadMedia(), no need to HEAD again
    }

    render() {
        const container = document.getElementById('carousel-container');

        if (this.projects.length === 0) {
            container.innerHTML = '<div class="error">No projects found</div>';
            return;
        }

        container.innerHTML = `
            <div class="carousel-wrapper">
                <div class="carousel-track" id="carousel-track">
                    ${this.projects.map(project => this.renderProject(project)).join('')}
                </div>
            </div>
            ${this.renderControls()}
        `;
    }

    renderProject(project) {
        // FIX #1: renderMedia() now returns only the inner media content (no wrapper div).
        // The wrapping <div class="project-media"> lives here, exactly once.
        const mediaInnerHTML = this.renderMedia(project.media);
        const techHTML = project.technologies
            .map(tech => `<span class="tech-tag">${tech}</span>`)
            .join('');

        const featuresHTML = project.keyFeatures && project.keyFeatures.length > 0 ? `
            <div class="content-column">
                <h4 class="section-title">Key Features</h4>
                <ul class="feature-list">
                    ${project.keyFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
        ` : '<div class="content-column"></div>';

        const teamHTML = project.team && project.team.length > 0 ? `
            <div class="content-column">
                <h4 class="section-title">Team</h4>
                <ul class="team-list">
                    ${project.team.map(member => `<li>${member}</li>`).join('')}
                </ul>
            </div>
        ` : '<div class="content-column"></div>';

        let descriptionHTML = formatFirstParagraph(project.description);

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
                            <div class="project-description">${descriptionHTML}</div>
                        </div>
                        ${featuresHTML}
                        ${teamHTML}
                    </div>
                </div>
            </article>
        `;
    }

    renderMedia(media) {
        // FIX #1: Returns inner content only — no <div class="project-media"> wrapper here.
        // renderProject() provides the single wrapper.
        let mediaHTML = '';

        if (media.video) {
            mediaHTML += `
                <div class="video-button" data-video="${media.video}">
                    <div class="play-icon">▶</div>
                    <span>Watch Gameplay</span>
                </div>
            `;
        }

        if (media.screenshots.length > 0) {
            mediaHTML += `
                <div class="screenshot-carousel">
                    <div class="screenshot-track">
                        ${media.screenshots.map((screenshot, index) =>
                `<img src="${screenshot}" alt="Screenshot ${index + 1}" class="screenshot ${index === 0 ? 'active' : ''}">`
            ).join('')}
                    </div>
                    ${media.screenshots.length > 1 ? `
                        <div class="screenshot-nav">
                            <button class="screenshot-prev">‹</button>
                            <div class="screenshot-dots">
                                ${media.screenshots.map((_, index) =>
                `<button class="screenshot-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`
            ).join('')}
                            </div>
                            <button class="screenshot-next">›</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        if (!mediaHTML) {
            return '<div class="media-placeholder">No media available</div>';
        }

        return mediaHTML;
    }

    renderControls() {
        if (this.projects.length <= 1) return '';

        return `
            <div class="carousel-nav">
                <button class="nav-btn" id="prev-btn">← Previous</button>
                <button class="nav-btn" id="next-btn">Next →</button>
            </div>
            <div class="carousel-dots">
                ${this.projects.map((_, index) =>
            `<button class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`
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
            prevBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') prevBtn.click();
            });
        }
        if (nextBtn) {
            nextBtn.setAttribute('aria-label', 'Next project');
            nextBtn.tabIndex = 0;
            nextBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') nextBtn.click();
            });
        }
        dots.forEach((dot, index) => {
            dot.setAttribute('aria-label', `Go to project ${index + 1}`);
            dot.tabIndex = 0;
            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') dot.click();
            });
        });

        prevBtn?.addEventListener('click', () => this.goToPrevious());
        nextBtn?.addEventListener('click', () => this.goToNext());
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

        this.setupScreenshotCarousels();
        this.setupVideoPopup();
    }

    setupScreenshotCarousels() {
        const carousels = document.querySelectorAll('.screenshot-carousel');
        carousels.forEach((carousel) => {
            const screenshots = carousel.querySelectorAll('.screenshot');
            const prevBtn = carousel.querySelector('.screenshot-prev');
            const nextBtn = carousel.querySelector('.screenshot-next');
            const dots = carousel.querySelectorAll('.screenshot-dot');
            if (screenshots.length > 1) {
                let currentIndex = 0;
                let intervalId = null;
                const updateScreenshots = () => {
                    screenshots.forEach((screenshot, index) => {
                        screenshot.classList.toggle('active', index === currentIndex);
                    });
                    dots.forEach((dot, index) => {
                        dot.classList.toggle('active', index === currentIndex);
                    });
                };
                const goToNext = () => {
                    currentIndex = (currentIndex + 1) % screenshots.length;
                    updateScreenshots();
                };
                const goToPrev = () => {
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : screenshots.length - 1;
                    updateScreenshots();
                };
                prevBtn?.addEventListener('click', goToPrev);
                nextBtn?.addEventListener('click', goToNext);
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        currentIndex = index;
                        updateScreenshots();
                    });
                });
                function startAuto() {
                    if (intervalId) clearInterval(intervalId);
                    intervalId = setInterval(goToNext, 3000);
                }
                function stopAuto() {
                    if (intervalId) clearInterval(intervalId);
                }
                carousel.addEventListener('mouseenter', stopAuto);
                carousel.addEventListener('mouseleave', startAuto);
                carousel.addEventListener('touchstart', stopAuto, { passive: true });
                carousel.addEventListener('touchend', startAuto, { passive: true });
                updateScreenshots();
                startAuto();
            }
        });
    }

    setupVideoPopup() {
        const videoButtons = document.querySelectorAll('.video-button');
        const videoPopup = document.getElementById('video-popup');
        const popupVideo = document.getElementById('popup-video');
        const closeBtn = document.querySelector('.video-close');

        videoButtons.forEach(button => {
            button.addEventListener('click', () => {
                const videoSrc = button.getAttribute('data-video');
                popupVideo.src = videoSrc;
                videoPopup.classList.add('active');
                if (this.isMobile) {
                    document.body.style.overflow = 'hidden';
                }
                popupVideo.play();
            });
        });

        const closePopup = () => {
            videoPopup.classList.remove('active');
            popupVideo.pause();
            popupVideo.src = '';
            if (this.isMobile) {
                document.body.style.overflow = '';
            }
        };

        closeBtn?.addEventListener('click', closePopup);
        videoPopup.addEventListener('click', (e) => {
            if (e.target === videoPopup) closePopup();
        });
        document.addEventListener('keydown', (e) => {
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
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    showError(message) {
        const container = document.getElementById('carousel-container');
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

function formatFirstParagraph(descriptionHTML) {
    if (!descriptionHTML) return '';
    let firstPara = '';
    let rest = '';
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
    }
    let result = `<span style="font-weight:bold;font-style:italic;">${firstPara}</span>`;
    if (rest.trim()) {
        result += '<br>' + rest.trim();
    }
    return result;
}

document.addEventListener('DOMContentLoaded', () => {
    new Portfolio();
});