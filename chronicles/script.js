// Blog-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll effect to navbar
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollTop = scrollTop;
    });

    // Add animation to post cards on scroll
    const postCards = document.querySelectorAll('.post-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    postCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Newsletter form handling
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            // Simple validation
            if (email && email.includes('@')) {
                // Show success message
                const button = this.querySelector('button');
                const originalText = button.textContent;
                button.textContent = 'Subscribed!';
                button.style.background = '#059669';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#7c3aed';
                    this.reset();
                }, 2000);
            }
        });
    }

    // Add reading time estimation
    const articles = document.querySelectorAll('.post-content');
    articles.forEach(article => {
        const text = article.textContent;
        const wordCount = text.split(' ').length;
        const readingTime = Math.ceil(wordCount / 200); // Average reading speed
        
        const readingTimeElement = document.createElement('span');
        readingTimeElement.className = 'reading-time';
        readingTimeElement.textContent = `${readingTime} min read`;
        readingTimeElement.style.cssText = `
            color: #6b7280;
            font-size: 0.875rem;
            margin-left: 1rem;
        `;
        
        const postMeta = article.querySelector('.post-meta');
        if (postMeta) {
            postMeta.appendChild(readingTimeElement);
        }
    });

    // Add category filter functionality
    const categoryLinks = document.querySelectorAll('.category-list a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            categoryLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Here you would typically filter the posts
            // For now, we'll just show a message
            const category = this.textContent.split(' (')[0];
            console.log(`Filtering by category: ${category}`);
        });
    });

    // Add search functionality (placeholder)
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search posts...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.875rem;
    `;
    
    // Add search input to sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.insertBefore(searchInput, sidebar.firstChild);
        
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const posts = document.querySelectorAll('.post-card');
            
            posts.forEach(post => {
                const title = post.querySelector('h2, h3').textContent.toLowerCase();
                const content = post.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    post.style.display = 'block';
                } else {
                    post.style.display = 'none';
                }
            });
        });
    }

    // Add "back to top" functionality
    const backToTop = document.createElement('button');
    backToTop.textContent = '↑';
    backToTop.className = 'back-to-top';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #7c3aed;
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 1000;
    `;
    
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.style.opacity = '1';
        } else {
            backToTop.style.opacity = '0';
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    backToTop.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    
    backToTop.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}); 

class RokuganChronicles {
    constructor() {
        this.sessions = [];
        this.currentIndex = 0;
        this.init();
    }

    async init() {
        try {
            const container = document.getElementById('session-container');
            await this.loadSessions();
            this.render();
            this.setupControls();
        } catch (error) {
            console.error('Chronicles initialization failed:', error);
            this.showError('Failed to load chronicles');
        }
    }

    async loadSessions() {
        // Session folders - update this array with your actual session names
        const sessionFolders = ['Session-01', 'Session-02', 'Session-03'];
        
        for (const folder of sessionFolders) {
            try {
                const session = await this.loadSession(folder);
                if (session) this.sessions.push(session);
            } catch (error) {
                console.warn(`Failed to load session ${folder}:`, error);
            }
        }

        // Fallback to demo sessions if none found
        if (this.sessions.length === 0) {
            this.sessions = this.getDemoSessions();
        }
    }

    async loadSession(folder) {
        const session = { 
            folder,
            title: this.formatTitle(folder),
            date: 'Date Unknown',
            summary: 'Session summary not found.',
            characters: [],
            locations: [],
            keyEvents: [],
            images: []
        };

        // Try to load README
        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(session, parsed);
            }
        } catch (error) {
            console.warn(`No README found for ${folder}`);
        }

        // Load images
        session.images = await this.loadImages(folder);
        
        return session;
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
        const result = { characters: [], locations: [], keyEvents: [] };
        
        // Extract title
        const titleLine = lines.find(line => line.startsWith('# '));
        if (titleLine) {
            result.title = titleLine.replace('# ', '').trim();
        }
        
        // Extract date
        const dateLine = lines.find(line => line.toLowerCase().includes('date:'));
        if (dateLine) {
            result.date = dateLine.replace(/date:\s*/i, '').trim();
        }
        
        // Extract summary (first paragraph after title)
        const summaryStart = lines.findIndex(line => 
            line.trim() && !line.startsWith('#') && !line.toLowerCase().includes('date:')
        );
        
        if (summaryStart >= 0) {
            const summaryLines = [];
            for (let i = summaryStart; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('##') || line.startsWith('###')) break;
                if (line || summaryLines.length > 0) {
                    summaryLines.push(line);
                }
            }
            result.summary = summaryLines.join('\n').trim();
        }
        
        // Extract characters
        const charactersStart = lines.findIndex(line => 
            /^##?\s*(characters|cast|players)/i.test(line)
        );
        
        if (charactersStart >= 0) {
            for (let i = charactersStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.characters.push(line.replace('- ', '').trim());
                }
            }
        }
        
        // Extract locations
        const locationsStart = lines.findIndex(line => 
            /^##?\s*(locations|places|settings)/i.test(line)
        );
        
        if (locationsStart >= 0) {
            for (let i = locationsStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.locations.push(line.replace('- ', '').trim());
                }
            }
        }
        
        // Extract key events
        const eventsStart = lines.findIndex(line => 
            /^##?\s*(events|highlights|key moments)/i.test(line)
        );
        
        if (eventsStart >= 0) {
            for (let i = eventsStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.keyEvents.push(line.replace('- ', '').trim());
                }
            }
        }
        
        return result;
    }

    async loadImages(folder) {
        const images = [];
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        
        // Try numbered images first
        for (let i = 1; i <= 10; i++) {
            for (const ext of imageExts) {
                const imagePath = `${folder}/${i}.${ext}`;
                if (await this.fileExists(imagePath)) {
                    images.push(imagePath);
                    break;
                }
            }
        }
        
        // If no numbered images, try common names
        if (images.length === 0) {
            const commonNames = ['image1', 'image2', 'image3', 'screenshot1', 'screenshot2', 'photo1', 'photo2'];
            for (const name of commonNames) {
                for (const ext of imageExts) {
                    const imagePath = `${folder}/${name}.${ext}`;
                    if (await this.fileExists(imagePath)) {
                        images.push(imagePath);
                        break;
                    }
                }
            }
        }
        
        return images;
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

    getDemoSessions() {
        return [
            {
                title: "The Jade Magistrate's Arrival",
                date: "Winter Court, 1158",
                summary: "The characters arrive at the provincial capital as representatives of their clans. A mysterious death at the governor's estate sets the stage for intrigue and investigation. Honor and duty clash as the samurai must navigate the treacherous waters of court politics while seeking the truth behind the murder.",
                characters: ["Kakita Haruto - Crane Duelist", "Hida Masa - Crab Berserker", "Isawa Yuki - Phoenix Shugenja", "Bayushi Kage - Scorpion Courtier"],
                locations: ["Governor's Estate", "Temple of the Seven Fortunes", "Sake House of the Floating Lily"],
                keyEvents: ["Arrival ceremony disrupted", "Discovery of the poisoned tea", "Midnight duel in the garden", "Interrogation of the servants"],
                images: []
            },
            {
                title: "Shadows in the Bamboo Grove",
                date: "Early Spring, 1158",
                summary: "Following leads from the previous investigation, the characters venture into the mysterious bamboo grove where local peasants report strange lights and whispered voices. Ancient spirits and hidden bandits threaten the peace of the land, forcing the samurai to confront both supernatural and mundane dangers.",
                characters: ["Kakita Haruto - Crane Duelist", "Hida Masa - Crab Berserker", "Isawa Yuki - Phoenix Shugenja", "Bayushi Kage - Scorpion Courtier", "Akodo Shin - Lion Tactician"],
                locations: ["Whispering Bamboo Grove", "Abandoned Shrine of Inari", "Bandit Cave Network", "Village of Peaceful Waters"],
                keyEvents: ["Encounter with the Fox Spirit", "Ambush by masterless ronin", "Purification ritual at dawn", "Discovery of the smuggling operation"],
                images: []
            },
            {
                title: "The Emperor's Tournament",
                date: "Late Spring, 1158",
                summary: "The characters are invited to participate in a grand tournament held in honor of the Emperor's birthday. But beneath the pageantry and competition lies a web of clan politics and hidden agendas. As the tournament progresses, it becomes clear that more than just honor is at stake.",
                characters: ["Kakita Haruto - Crane Duelist", "Hida Masa - Crab Berserker", "Isawa Yuki - Phoenix Shugenja", "Bayushi Kage - Scorpion Courtier", "Akodo Shin - Lion Tactician", "Mirumoto Ryu - Dragon Swordsman"],
                locations: ["Imperial Tournament Grounds", "Pavilion of the Clans", "Gardens of Contemplation", "The Emperor's Viewing Platform"],
                keyEvents: ["Opening ceremony blessing", "Haruto's victory in the dueling competition", "Midnight conspiracy meeting", "The Emperor's final judgment"],
                images: []
            }
        ];
    }

    render() {
        const container = document.getElementById('session-container');
        
        if (this.sessions.length === 0) {
            container.innerHTML = '<div class="error">No chronicles found</div>';
            return;
        }

        container.innerHTML = `
            <div class="session-carousel">
                <div class="session-track" id="session-track">
                    ${this.sessions.map(session => this.renderSession(session)).join('')}
                </div>
            </div>
            ${this.renderNavigation()}
        `;
    }

    renderSession(session) {
        const mediaHTML = this.renderMedia(session.images);
        
        const summaryParagraphs = session.summary.split('\n').filter(p => p.trim());
        const firstParagraph = summaryParagraphs[0] || '';
        const remainingParagraphs = summaryParagraphs.slice(1).join('\n');
        
        const charactersHTML = session.characters.length > 0 ? `
            <div class="detail-section">
                <div class="detail-title">Characters</div>
                <ul class="detail-list characters-list">
                    ${session.characters.map(char => `<li>${char}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        const locationsHTML = session.locations.length > 0 ? `
            <div class="detail-section">
                <div class="detail-title">Locations</div>
                <ul class="detail-list locations-list">
                    ${session.locations.map(loc => `<li>${loc}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        const eventsHTML = session.keyEvents.length > 0 ? `
            <div class="detail-section">
                <div class="detail-title">Key Events</div>
                <ul class="detail-list">
                    ${session.keyEvents.map(event => `<li>${event}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        return `
            <article class="session-card">
                ${mediaHTML}
                <div class="session-content">
                    <div class="session-header">
                        <h2 class="session-title">${session.title}</h2>
                        <div class="session-date">${session.date}</div>
                    </div>
                    <div class="content-grid">
                        <div class="session-summary">
                            <div class="first-paragraph">${firstParagraph}</div>
                            ${remainingParagraphs ? `<div style="margin-top: 1rem;">${remainingParagraphs}</div>` : ''}
                        </div>
                        <div class="session-details">
                            ${charactersHTML}
                            ${locationsHTML}
                            ${eventsHTML}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    renderMedia(images) {
        if (images.length === 0) {
            return `
                <div class="session-media">
                    <div class="media-placeholder">⛩️ No Images Available ⛩️</div>
                </div>
            `;
        }

        return `
            <div class="session-media">
                <div class="screenshot-carousel">
                    <div class="screenshot-track">
                        ${images.map((image, index) => 
                            `<img src="${image}" alt="Session Image ${index + 1}" class="screenshot ${index === 0 ? 'active' : ''}">`
                        ).join('')}
                    </div>
                    ${images.length > 1 ? `
                        <div class="screenshot-nav">
                            <button class="screenshot-prev">‹</button>
                            <div class="screenshot-dots">
                                ${images.map((_, index) => 
                                    `<button class="screenshot-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>`
                                ).join('')}
                            </div>
                            <button class="screenshot-next">›</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderNavigation() {
        if (this.sessions.length <= 1) return '';

        return `
            <div class="navigation">
                <button class="nav-btn" id="prev-btn">← Previous Chronicle</button>
                <button class="nav-btn" id="next-btn">Next Chronicle →</button>
            </div>
            <div class="session-dots">
                ${this.sessions.map((_, index) => 
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

        this.setupImageCarousels();
    }

    setupImageCarousels() {
        const carousels = document.querySelectorAll('.screenshot-carousel');
        carousels.forEach(carousel => {
            const images = carousel.querySelectorAll('.screenshot');
            const prevBtn = carousel.querySelector('.screenshot-prev');
            const nextBtn = carousel.querySelector('.screenshot-next');
            const dots = carousel.querySelectorAll('.screenshot-dot');
            
            if (images.length > 1) {
                let currentIndex = 0;
                let intervalId = null;
                
                const updateImages = () => {
                    images.forEach((img, index) => {
                        img.classList.toggle('active', index === currentIndex);
                    });
                    dots.forEach((dot, index) => {
                        dot.classList.toggle('active', index === currentIndex);
                    });
                };
                
                const goToNext = () => {
                    currentIndex = (currentIndex + 1) % images.length;
                    updateImages();
                };
                
                const goToPrev = () => {
                    currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                    updateImages();
                };
                
                prevBtn?.addEventListener('click', goToPrev);
                nextBtn?.addEventListener('click', goToNext);
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        currentIndex = index;
                        updateImages();
                    });
                });
                
                // Auto-advance images
                const startAuto = () => {
                    if (intervalId) clearInterval(intervalId);
                    intervalId = setInterval(goToNext, 4000);
                };
                
                const stopAuto = () => {
                    if (intervalId) clearInterval(intervalId);
                };
                
                carousel.addEventListener('mouseenter', stopAuto);
                carousel.addEventListener('mouseleave', startAuto);
                
                startAuto();
            }
        });
    }

    goToPrevious() {
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.sessions.length - 1;
        this.updateCarousel();
    }

    goToNext() {
        this.currentIndex = (this.currentIndex + 1) % this.sessions.length;
        this.updateCarousel();
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }

    updateCarousel() {
        const track = document.getElementById('session-track');
        const dots = document.querySelectorAll('.dot');
        
        track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    showError(message) {
        const container = document.getElementById('session-container');
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RokuganChronicles();
}); 