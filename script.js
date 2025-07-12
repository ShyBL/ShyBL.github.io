class Portfolio {
    constructor() {
        this.projects = [];
        this.currentIndex = 0;
        this.screenshotIntervals = new Map();
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        // Simple mobile detection
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileDevice = mobileRegex.test(userAgent);
        const isMobileViewport = window.innerWidth <= 768;
        
        return isMobileDevice || isMobileViewport;
    }

    async init() {
        try {
            await this.loadProjects();
            this.render();
            this.setupControls();
        } catch (error) {
            console.error('Portfolio initialization failed:', error);
            this.showError('Failed to load projects');
        }
    }

    async loadProjects() {
        // Project folders - update this array with your actual project names
        const projectFolders = ['Beat-Em-Up Across The Globe', 'Underneath'];
        
        for (const folder of projectFolders) {
            try {
                const project = await this.loadProject(folder);
                if (project) this.projects.push(project);
            } catch (error) {
                console.warn(`Failed to load project ${folder}:`, error);
            }
        }

        // Fallback to demo projects if none found
        if (this.projects.length === 0) {
            this.projects = this.getDemoProjects();
        }
    }

    async loadProject(folder) {
        const project = { 
            folder,
            title: this.formatTitle(folder),
            description: 'Project description not found.',
            technologies: [],
            media: { video: null, screenshots: [] }
        };

        // Try to load README
        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(project, parsed);
            }
        } catch (error) {
            console.warn(`No README found for ${folder}`);
        }

        // Load media files
        project.media = await this.loadMedia(folder);
        
        return project;
    }

    async fetchFile(path) {
        try {
            const response = await fetch(path);
            return response.ok ? await response.text() : null;
        } catch (error) {
            return null;
        }
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const result = { technologies: [], keyFeatures: [], team: [] };
        
        // Extract title
        const titleLine = lines.find(line => line.startsWith('# '));
        if (titleLine) {
            result.title = titleLine.replace('# ', '').trim();
        }
        
        // Extract description (all paragraphs after title until first section)
        const descriptionStart = lines.findIndex(line => 
            line.trim() && !line.startsWith('#') && !line.startsWith('![')
        );
        
        if (descriptionStart >= 0) {
            const descriptionLines = [];
            for (let i = descriptionStart; i < lines.length; i++) {
                const line = lines[i].trim();
                // Stop at first section header (## or ###)
                if (line.startsWith('##') || line.startsWith('###')) break;
                // Include non-empty lines and empty lines (for paragraph breaks)
                if (line || descriptionLines.length > 0) {
                    descriptionLines.push(line);
                }
            }
            // Join with double spaces to preserve paragraph breaks
            result.description = descriptionLines.join('  ').trim();
        }
        
        // Extract technologies
        const techStart = lines.findIndex(line => 
            /^##?\s*(tech|stack|built|tools)/i.test(line)
        );
        
        if (techStart >= 0) {
            for (let i = techStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.technologies.push(line.replace('- ', '').trim());
                }
            }
        }
        
        // Extract Key Features
        const featuresStart = lines.findIndex(line => 
            /^##?\s*key features/i.test(line)
        );
        
        if (featuresStart >= 0) {
            for (let i = featuresStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.keyFeatures.push(line.replace('- ', '').trim());
                }
            }
        }
        
        // Extract Team
        const teamStart = lines.findIndex(line => 
            /^##?\s*team/i.test(line)
        );
        
        if (teamStart >= 0) {
            for (let i = teamStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.team.push(line.replace('- ', '').trim());
                }
            }
        }
        
        return result;
    }

    async loadMedia(folder) {
        const media = { video: null, screenshots: [] };
        
        // Try to find video
        const videoExts = ['mp4', 'webm', 'mov'];
        for (const ext of videoExts) {
            const videoPath = `${folder}/demo.${ext}`;
            if (await this.fileExists(videoPath)) {
                media.video = videoPath;
                break;
            }
        }
        
        // Try to find screenshots
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        for (let i = 1; i <= 5; i++) {
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
            const response = await fetch(path, { method: 'HEAD' });
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

    getDemoProjects() {
        return [
            {
                title: "E-Commerce Platform",
                description: "A full-stack e-commerce solution with modern UI/UX, secure payment processing, and real-time inventory management.",
                technologies: ["React", "Node.js", "MongoDB", "Stripe", "AWS"],
                media: { video: null, screenshots: [] }
            },
            {
                title: "AI Chat Assistant",
                description: "An intelligent conversational AI powered by machine learning algorithms with natural language processing capabilities.",
                technologies: ["Python", "TensorFlow", "FastAPI", "React", "Docker"],
                media: { video: null, screenshots: [] }
            },
            {
                title: "Portfolio Dashboard",
                description: "A comprehensive analytics dashboard for tracking project performance and user engagement with real-time data visualization.",
                technologies: ["Vue.js", "D3.js", "Express", "PostgreSQL", "Redis"],
                media: { video: null, screenshots: [] }
            }
        ];
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
        const mediaHTML = this.renderMedia(project.media);
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

        return `
            <article class="project-card">
                <div class="project-media">
                    ${mediaHTML}
                </div>
                <div class="project-content">
                    <div class="project-header">
                        <h3 class="project-title">${project.title}</h3>
                        <div class="tech-stack">${techHTML}</div>
                    </div>
                    <div class="content-grid">
                        <div class="content-column">
                            <h4 class="section-title">Description</h4>
                            <div class="project-description">${project.description}</div>
                        </div>
                        ${featuresHTML}
                        ${teamHTML}
                    </div>
                </div>
            </article>
        `;
    }

    renderMedia(media) {
        let mediaHTML = '';
        
        // Add video button if available
        if (media.video) {
            mediaHTML += `
                <div class="video-button" data-video="${media.video}">
                    <div class="play-icon">▶</div>
                    <span>Watch Gameplay</span>
                </div>
            `;
        }
        
        // Add screenshot carousel
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
        
        if (mediaHTML) {
            return `<div class="project-media">${mediaHTML}</div>`;
        }
        
        return '<div class="media-placeholder">No media available</div>';
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
        
        carousels.forEach((carousel, carouselIndex) => {
            const screenshots = carousel.querySelectorAll('.screenshot');
            const prevBtn = carousel.querySelector('.screenshot-prev');
            const nextBtn = carousel.querySelector('.screenshot-next');
            const dots = carousel.querySelectorAll('.screenshot-dot');
            
            if (screenshots.length > 1) {
                let currentIndex = 0;
                let touchStartX = 0;
                let touchEndX = 0;
                
                const updateScreenshots = () => {
                    console.log(`Updating carousel ${carouselIndex}, currentIndex: ${currentIndex}`);
                    screenshots.forEach((screenshot, index) => {
                        const isActive = index === currentIndex;
                        screenshot.classList.toggle('active', isActive);
                        console.log(`Screenshot ${index}: ${isActive ? 'active' : 'inactive'}`);
                    });
                    
                    dots.forEach((dot, index) => {
                        const isActive = index === currentIndex;
                        dot.classList.toggle('active', isActive);
                    });
                };
                
                // Navigation buttons
                prevBtn?.addEventListener('click', () => {
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : screenshots.length - 1;
                    updateScreenshots();
                });
                
                nextBtn?.addEventListener('click', () => {
                    currentIndex = (currentIndex + 1) % screenshots.length;
                    updateScreenshots();
                });
                
                // Dot navigation
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        currentIndex = index;
                        updateScreenshots();
                    });
                });

                // Mobile touch gestures
                if (this.isMobile) {
                    carousel.addEventListener('touchstart', (e) => {
                        touchStartX = e.changedTouches[0].screenX;
                    }, { passive: true });

                    carousel.addEventListener('touchend', (e) => {
                        touchEndX = e.changedTouches[0].screenX;
                        handleSwipe();
                    }, { passive: true });

                    const handleSwipe = () => {
                        const swipeThreshold = 50;
                        const diff = touchStartX - touchEndX;

                        if (Math.abs(diff) > swipeThreshold) {
                            if (diff > 0) {
                                // Swipe left - next
                                currentIndex = (currentIndex + 1) % screenshots.length;
                            } else {
                                // Swipe right - previous
                                currentIndex = currentIndex > 0 ? currentIndex - 1 : screenshots.length - 1;
                            }
                            updateScreenshots();
                        }
                    };
                }
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
                
                // Mobile optimization: prevent body scroll when popup is open
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
            
            // Restore body scroll on mobile
            if (this.isMobile) {
                document.body.style.overflow = '';
            }
        };
        
        closeBtn?.addEventListener('click', closePopup);
        
        // Close on background click
        videoPopup.addEventListener('click', (e) => {
            if (e.target === videoPopup) {
                closePopup();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && videoPopup.classList.contains('active')) {
                closePopup();
            }
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Portfolio();
}); 