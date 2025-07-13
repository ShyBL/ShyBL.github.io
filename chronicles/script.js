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
        const sessionFolders = [
            'Session-01', 'Session-02', 'Session-03', 'Session-04', 'Session-05',
            'Session-06', 'Session-07', 'Session-08', 'Session-09', 'Session-10'
        ];
        
        // Load sessions in parallel for faster loading
        const sessionPromises = sessionFolders.map(async (folder) => {
            try {
                const session = await this.loadSession(folder);
                return session;
            } catch (error) {
                console.warn(`Failed to load session ${folder}:`, error);
                return null;
            }
        });

        const sessions = await Promise.all(sessionPromises);
        this.sessions = sessions.filter(session => session !== null);

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
        
        // Extract tagline (first bold text after date)
        const taglineStart = lines.findIndex(line => 
            line.trim() && !line.startsWith('#') && !line.toLowerCase().includes('date:') && line.includes('**')
        );
        
        if (taglineStart >= 0) {
            const taglineLine = lines[taglineStart].trim();
            result.tagline = this.parseMarkdownText(taglineLine);
        }
        
        // Extract summary (text after tagline, before first ## header)
        const summaryStart = lines.findIndex(line => 
            line.trim() && !line.startsWith('#') && !line.toLowerCase().includes('date:') && !line.includes('**')
        );
        
        if (summaryStart >= 0) {
            const summaryLines = [];
            for (let i = summaryStart; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('##')) break;
                if (line || summaryLines.length > 0) {
                    summaryLines.push(line);
                }
            }
            result.summary = this.parseMarkdownText(summaryLines.join('\n').trim());
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
                    result.characters.push(this.parseMarkdownText(line.replace('- ', '').trim()));
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
            /^##?\s*(key events|events|highlights|key moments)/i.test(line)
        );
        
        if (eventsStart >= 0) {
            for (let i = eventsStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.keyEvents.push(this.parseMarkdownText(line.replace('- ', '').trim()));
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

    async loadImages(folder) {
        const images = [];
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        
        // Try numbered images first (limit to 5 for faster loading)
        for (let i = 1; i <= 5; i++) {
            for (const ext of imageExts) {
                const imagePath = `${folder}/${i}.${ext}`;
                if (await this.fileExists(imagePath)) {
                    images.push(imagePath);
                    break;
                }
            }
        }
        
        // If no numbered images, try common names (limit to 3)
        if (images.length === 0) {
            const commonNames = ['image1', 'screenshot1', 'photo1'];
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
            
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

    getDemoSessions() {
        return [
            {
                title: "The Jade Magistrate's Arrival",
                date: "Winter Court, 1158",
                tagline: "**The characters arrive at the provincial capital as representatives of their clans.**",
                summary: "A mysterious death at the governor's estate sets the stage for intrigue and investigation. Honor and duty clash as the samurai must navigate the treacherous waters of court politics while seeking the truth behind the murder.",
                characters: ["Kakita Haruto - Crane Duelist", "Hida Masa - Crab Berserker", "Isawa Yuki - Phoenix Shugenja", "Bayushi Kage - Scorpion Courtier"],
                locations: ["Governor's Estate", "Temple of the Seven Fortunes", "Sake House of the Floating Lily"],
                keyEvents: ["Arrival ceremony disrupted", "Discovery of the poisoned tea", "Midnight duel in the garden", "Interrogation of the servants"],
                images: []
            },
            {
                title: "Shadows in the Bamboo Grove",
                date: "Early Spring, 1158",
                tagline: "**Following leads from the previous investigation, the characters venture into the mysterious bamboo grove.**",
                summary: "Ancient spirits and hidden bandits threaten the peace of the land, forcing the samurai to confront both supernatural and mundane dangers. Local peasants report strange lights and whispered voices that lead to a deeper mystery.",
                characters: ["Kakita Haruto - Crane Duelist", "Hida Masa - Crab Berserker", "Isawa Yuki - Phoenix Shugenja", "Bayushi Kage - Scorpion Courtier", "Akodo Shin - Lion Tactician"],
                locations: ["Whispering Bamboo Grove", "Abandoned Shrine of Inari", "Bandit Cave Network", "Village of Peaceful Waters"],
                keyEvents: ["Encounter with the Fox Spirit", "Ambush by masterless ronin", "Purification ritual at dawn", "Discovery of the smuggling operation"],
                images: []
            },
            {
                title: "The Emperor's Tournament",
                date: "Late Spring, 1158",
                tagline: "**The characters are invited to participate in a grand tournament held in honor of the Emperor's birthday.**",
                summary: "But beneath the pageantry and competition lies a web of clan politics and hidden agendas. As the tournament progresses, it becomes clear that more than just honor is at stake.",
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
        
        const charactersHTML = session.characters.length > 0 ? `
            <div class="detail-section">
                <div class="detail-title">Characters</div>
                <ul class="detail-list characters-list">
                    ${session.characters.map(char => {
                        const plainName = this.extractPlainName(char);
                        const initials = this.getClanInitials(plainName);
                        return `
                            <li><span class="clan-icon-btn" data-char="${encodeURIComponent(char)}">${this.getClanIcon(this.getClanName(plainName))}</span> <span class="character-name">${this.parseMarkdownText(char)}</span></li>
                        `;
                    }).join('')}
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
            <article class="session-card" data-folder="${session.folder}">
                ${mediaHTML}
                <div class="session-content">
                    <div class="session-header">
                        <h2 class="session-title">${session.title}</h2>
                        <div class="session-date">${session.date}</div>
                    </div>
                    <div class="content-grid">
                        ${session.tagline ? `<div class="session-tagline">${session.tagline}</div>` : ''}
                        <div class="session-summary">
                            ${session.summary}
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
        this.setupSwipeNavigation();
        this.setupCharacterLinks();
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

    setupSwipeNavigation() {
        const carousel = document.querySelector('.session-carousel');
        if (!carousel) return;

        let startX = 0;
        let startY = 0;
        let isDragging = false;
        let currentTranslateX = 0;

        const handleTouchStart = (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            currentTranslateX = -this.currentIndex * 100;
            
            carousel.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            
            // Only handle horizontal swipes
            if (Math.abs(diffX) < Math.abs(diffY)) return;
            
            e.preventDefault();
            
            const translateX = currentTranslateX + diffX;
            const track = document.getElementById('session-track');
            track.style.transform = `translateX(${translateX}%)`;
        };

        const handleTouchEnd = (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            const endX = e.changedTouches[0].clientX;
            const diffX = endX - startX;
            const threshold = 50; // Minimum swipe distance
            
            carousel.style.transition = 'transform 0.6s ease';
            
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    this.goToPrevious();
                } else {
                    this.goToNext();
                }
            } else {
                // Snap back to current position
                this.updateCarousel();
            }
        };

        carousel.addEventListener('touchstart', handleTouchStart, { passive: false });
        carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
        carousel.addEventListener('touchend', handleTouchEnd, { passive: false });
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

    setupCharacterLinks() {
        document.addEventListener('click', async (e) => {
            const characterLink = e.target.closest('.clan-icon-btn');
            if (characterLink) {
                const charName = decodeURIComponent(characterLink.dataset.char);
                // Find the session for this character
                const sessionCard = characterLink.closest('.session-card');
                let sessionFolder = null;
                if (sessionCard) {
                    sessionFolder = sessionCard.dataset.folder || null;
                }
                if (!sessionFolder && this.sessions) {
                    for (const session of this.sessions) {
                        if (session.characters && session.characters.some(c => c.includes(charName))) {
                            sessionFolder = session.folder;
                            break;
                        }
                    }
                }
                await this.showPortraitModal(charName, this.parseMarkdownText(charName), sessionFolder);
            }
        });
    }

    async showPortraitModal(charName, displayText, sessionFolder) {
        // Close any open modal first
        const existingModal = document.querySelector('.portrait-modal-overlay');
        if (existingModal) existingModal.remove();
        // Extract plain name (strip markdown, remove role)
        const plainName = this.extractPlainName(charName);
        const initials = this.getClanInitials(plainName);
        // Try to load portrait image
        let imageUrl = null;
        if (sessionFolder) {
            const normalized = plainName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const exts = ['jpg', 'jpeg', 'png', 'webp'];
            for (const ext of exts) {
                const path = `${sessionFolder}/portraits/${normalized}.${ext}`;
                if (await this.fileExists(path)) {
                    imageUrl = path;
                    break;
                }
            }
        }
        // Create overlay and modal
        const overlay = document.createElement('div');
        overlay.className = 'portrait-modal-overlay';
        overlay.innerHTML = `
            <div class="portrait-modal">
                ${imageUrl ?
                    `<img src="${imageUrl}" alt="Portrait of ${plainName}" class="portrait-avatar">`
                    : `<div class="portrait-avatar"><div class="avatar-circle">${initials}</div></div>`
                }
                <div class="portrait-name">${this.parseMarkdownText(displayText)}</div>
            </div>
        `;
        document.body.appendChild(overlay);
        // Close on click of avatar, modal, or overlay
        const avatar = overlay.querySelector('.portrait-avatar');
        if (avatar) avatar.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    extractPlainName(text) {
        // Remove markdown tags and role after dash
        let name = text.replace(/<[^>]+>/g, '');
        name = name.replace(/\*\*(.*?)\*\*/g, '$1');
        name = name.replace(/\*(.*?)\*/g, '$1');
        name = name.split('-')[0].trim();
        return name;
    }

    getClanInitials(plainName) {
        const initialsMap = {
            "Kakita Haruto": "KH",
            "Hida Masa": "HM",
            "Isawa Yuki": "IY",
            "Bayushi Kage": "BK",
            "Akodo Shin": "AS",
            "Mirumoto Ryu": "MR"
        };
        return initialsMap[plainName] || (plainName.split(' ').map(w => w[0]).join('').toUpperCase());
    }

    getClanName(plainName) {
        const clanMap = {
            "Kakita Haruto": "Crane",
            "Hida Masa": "Crab",
            "Isawa Yuki": "Phoenix",
            "Bayushi Kage": "Scorpion",
            "Akodo Shin": "Lion",
            "Mirumoto Ryu": "Dragon"
        };
        return clanMap[plainName] || "Unknown";
    }

    getRole(plainName) {
        const roleMap = {
            "Kakita Haruto": "Crane Duelist",
            "Hida Masa": "Crab Berserker",
            "Isawa Yuki": "Phoenix Shugenja",
            "Bayushi Kage": "Scorpion Courtier",
            "Akodo Shin": "Lion Tactician",
            "Mirumoto Ryu": "Dragon Swordsman"
        };
        return roleMap[plainName] || "Unknown Role";
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    getClanIcon(clan) {
        const icons = {
            'crane': '🕊️',
            'lion': '🦁',
            'scorpion': '🦂',
            'phoenix': '🔥',
            'dragon': '🐉',
            'crab': '🦀',
            'mantis': '🦗',
            'unicorn': '🦄',
            'imperial': '👑',
            'default': '🎴'
        };
        return icons[clan.toLowerCase()] || icons['default'];
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RokuganChronicles();
}); 