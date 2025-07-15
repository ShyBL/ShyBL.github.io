// Jade Pincer - robust, portfolio-style implementation with full features

class JadePincerChronicles {
    constructor() {
        this.acts = [];
        this.currentIndex = 0;
        this.actFolders = ['Act-1', 'Act-2', 'Act-3', 'Act-4', 'Act-5', 'Act-6'];
        this.characterClickHandler = null;
        this.portraitManifests = {}; // store loaded manifests
        this.preloadedActs = new Set(); // track preloaded acts
        this.init();
    }

    async init() {
        try {
            this.container = document.getElementById('session-container');
            this.container.innerHTML = '<div class="loading-throbber"><div class="loading-spinner"></div></div>';
            await this.loadActs();
            // Preload images for all acts
            for (const act of this.acts) {
                await this.preloadImages(act.folder);
            }
            this.render();
            this.setupControls();
        } catch (error) {
            this.showError('Failed to load chronicles');
        }
    }

    async loadActs() {
        const actPromises = this.actFolders.map(folder => this.loadAct(folder));
        const acts = await Promise.all(actPromises);
        this.acts = acts.filter(Boolean);
    }

    async loadAct(folder) {
        const act = {
            folder,
            title: this.formatTitle(folder),
            date: 'Date Unknown',
            summary: 'Act summary not found.',
            characters: [],
            locations: [],
            keyEvents: [],
            characterDetails: [],
            locationDetails: [],
            images: []
        };
        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(act, parsed);
            }
        } catch (error) {
            console.warn(`No README found for ${folder}`, error);
        }
        act.images = await this.loadImages(folder);
        // NEW: Load portrait manifest for this act
        try {
            const manifestPath = `${folder}/portraits/manifest.json`;
            const manifestText = await this.fetchFile(manifestPath);
            if (manifestText) {
                this.portraitManifests[folder] = JSON.parse(manifestText);
            }
        } catch (e) {
            console.warn('Error loading portrait manifest for', folder, e);
            this.portraitManifests[folder] = {};
        }
        return act;
    }

    async fetchFile(path) {
        try {
            const response = await fetch(path);
            return response.ok ? await response.text() : null;
        } catch (e) {
            console.warn('fetchFile error for', path, e);
            return null;
        }
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const result = { characters: [], locations: [], keyEvents: [], characterDetails: [], locationDetails: [] };
        
        // Extract title
        const titleLine = lines.find(line => line.startsWith('# '));
        if (titleLine) {
            result.title = titleLine.replace('# ', '').trim();
        }
        
        // Extract date - handle multiple date formats
        const dateLine = lines.find(line => 
            line.toLowerCase().includes('date:') || 
            line.toLowerCase().includes('date -') ||
            line.toLowerCase().includes('date:') ||
            line.toLowerCase().startsWith('date')
        );
        if (dateLine) {
            result.date = dateLine.replace(/^date[:\-]?\s*/i, '').trim();
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
            let summary = summaryLines.join('\n').trim();
            result.summary = this.parseMarkdownText(summary);
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
        
        // Extract character details
        const characterDetailsStart = lines.findIndex(line => 
            /^##?\s*(character details|character detail|character info|character information)/i.test(line)
        );
        
        if (characterDetailsStart >= 0) {
            for (let i = characterDetailsStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.characterDetails.push(this.parseMarkdownText(line.replace('- ', '').trim()));
                }
            }
        }
        
        // Extract location details
        const locationDetailsStart = lines.findIndex(line => 
            /^##?\s*(location details|location detail|location info|location information)/i.test(line)
        );
        
        if (locationDetailsStart >= 0) {
            for (let i = locationDetailsStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.locationDetails.push(this.parseMarkdownText(line.replace('- ', '').trim()));
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
                    result.keyEvents.push(line.replace('- ', '').trim());
                }
            }
        }
        
        return result;
    }

    parseMarkdownText(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/<br\s*\/?>/gi, '<br>');
    }

    async loadImages(folder) {
        const images = [];
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        for (let i = 1; i <= 5; i++) {
            for (const ext of imageExts) {
                const imagePath = `${folder}/${i}.${ext}`;
                if (await this.fileExists(imagePath)) {
                    images.push(imagePath);
                    break;
                }
            }
        }
        return images;
    }

    async fileExists(path) {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            return response.ok;
        } catch (e) {
            console.warn('fileExists error for', path, e);
            return false;
        }
    }

    async preloadImages(actFolder) {
        if (this.preloadedActs.has(actFolder)) return;
        // Preload portraits from manifest
        const manifest = this.portraitManifests[actFolder];
        if (manifest) {
            Object.values(manifest).forEach(filename => {
                const img = new Image();
                img.src = `${actFolder}/portraits/${filename}`;
            });
        }
        // Preload main images (carousel)
        const act = this.acts.find(a => a.folder === actFolder);
        if (act && act.images) {
            act.images.forEach(imagePath => {
                const img = new Image();
                img.src = imagePath;
            });
        }
        this.preloadedActs.add(actFolder);
    }

    formatTitle(folder) {
        return folder.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    render() {
        if (this.acts.length === 0) {
            this.container.innerHTML = '<div class="error">No chronicles found</div>';
            return;
        }
        this.container.innerHTML = `
            <div class="session-carousel">
                <div class="session-track" id="session-track">
                    ${this.acts.map(act => this.renderAct(act)).join('')}
                </div>
            </div>
            ${this.renderNavigation()}
        `;
    }

    renderAct(act) {
        const mediaHTML = this.renderMedia(act.images);
        
        const charactersHTML = act.characters.length > 0 ? `
            <div class="detail-section">
                <div class="detail-title">Characters</div>
                <ul class="detail-list characters-list">
                    ${act.characters.map(char => {
                        const plainName = this.extractPlainName(char);
                        return `
                            <li><span class="character-btn" data-char="${encodeURIComponent(char)}" style="user-select: none;">${this.parseMarkdownText(char)}</span></li>
                        `;
                    }).join('')}
                </ul>
            </div>
        ` : '';

        const locationsHTML = act.locations.length > 0 ? `
            <div class="detail-section">
                <div class="detail-title">Locations</div>
                <ul class="detail-list locations-list">
                    ${act.locations.map(loc => `
                        <li><span class="location-btn" data-location="${encodeURIComponent(loc)}" style="user-select: none;">${loc}</span></li>
                    `).join('')}
                </ul>
            </div>
        ` : '';

        const eventsHTML = act.keyEvents.length > 0 ? `
            <div class="detail-section">
                <div class="detail-title">Key Events</div>
                <ul class="detail-list">
                    ${act.keyEvents.map(event => `<li>${event}</li>`).join('')}
                </ul>
            </div>
        ` : '';

        return `
            <article class="session-card" data-folder="${act.folder}">
                ${mediaHTML}
                <div class="session-content">
                    <div class="session-header">
                        <h2 class="session-title">${act.title}</h2>
                        <div class="session-date">${act.date}</div>
                    </div>
                    <div class="content-grid">
                        ${act.tagline ? `<div class="session-tagline">${act.tagline}</div>` : ''}
                        <div class="session-summary">
                            ${act.summary}
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
                            `<img src="${image}" alt="Act Image ${index + 1}" class="screenshot ${index === 0 ? 'active' : ''}">`
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
        if (this.acts.length <= 1) return '';

        return `
            <div class="navigation">
                <button class="nav-btn" id="prev-btn">← Previous Act</button>
                <button class="nav-btn" id="next-btn">Next Act →</button>
            </div>
            <div class="session-dots">
                ${this.acts.map((_, index) => 
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

    goToPrevious() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }

    goToNext() {
        if (this.currentIndex < this.acts.length - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }

    goToSlide(index) {
        if (index >= 0 && index < this.acts.length) {
            this.currentIndex = index;
            this.updateCarousel();
        }
    }

    updateCarousel() {
        const track = document.getElementById('session-track');
        if (track) {
            track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        }
        
        // Update navigation dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    setupCharacterLinks() {
        // Store reference for potential cleanup
        this.characterClickHandler = async (e) => {
            const characterLink = e.target.closest('.character-btn');
            const locationLink = e.target.closest('.location-btn');
            
            if (characterLink) {
                const charName = decodeURIComponent(characterLink.dataset.char);
                // Find the act for this character
                const actCard = characterLink.closest('.session-card');
                let actFolder = null;
                if (actCard) {
                    actFolder = actCard.dataset.folder || null;
                }
                if (!actFolder && this.acts) {
                    for (const act of this.acts) {
                        if (act.characters && act.characters.some(c => c.includes(charName))) {
                            actFolder = act.folder;
                            break;
                        }
                    }
                }
                await this.showPortraitModal(charName, this.parseMarkdownText(charName), actFolder);
            }
            
            if (locationLink) {
                const locationName = decodeURIComponent(locationLink.dataset.location);
                // Find the act for this location
                const actCard = locationLink.closest('.session-card');
                let actFolder = null;
                if (actCard) {
                    actFolder = actCard.dataset.folder || null;
                }
                if (!actFolder && this.acts) {
                    for (const act of this.acts) {
                        if (act.locations && act.locations.some(l => l.includes(locationName))) {
                            actFolder = act.folder;
                            break;
                        }
                    }
                }
                await this.showLocationModal(locationName, actFolder);
            }
        };
        document.addEventListener('click', this.characterClickHandler);
    }

    async showPortraitModal(charName, displayText, actFolder) {
        // Close any open modal first
        const existingModal = document.querySelector('.portrait-modal-overlay');
        if (existingModal) existingModal.remove();
        // Extract plain name (strip markdown, remove role)
        const plainName = this.extractPlainName(charName);
        // Find character details from act data
        let characterDetails = '';
        if (actFolder && this.acts) {
            const act = this.acts.find(a => a.folder === actFolder);
            if (act && act.characterDetails) {
                const detailEntry = act.characterDetails.find(detail => 
                    detail.toLowerCase().includes(plainName.toLowerCase())
                );
                if (detailEntry) {
                    characterDetails = detailEntry;
                }
            }
        }
        // Robust portrait matching: scan the portraits folder for a file that matches the plain name (ignore case, dashes, spaces)
        let imageUrl = null;
        if (actFolder) {
            try {
                // List of portrait files (simulate by fetching manifest and using its values)
                const manifest = this.portraitManifests[actFolder];
                if (manifest) {
                    const files = Object.values(manifest);
                    // Normalize function: lower, remove spaces/dashes/underscores
                    const normalize = s => s.toLowerCase().replace(/[-_\s]/g, '');
                    const plainNorm = normalize(plainName);
                    // Try to find a file whose base name matches the normalized plain name
                    for (const file of files) {
                        const base = file.replace(/\.[^.]+$/, '');
                        if (normalize(base) === plainNorm) {
                            imageUrl = `${actFolder}/portraits/${file}`;
                            break;
                        }
                    }
                }
            } catch (e) {
                console.warn('Portrait modal: error matching portrait for', plainName, 'in', actFolder, e);
            }
        }
        // Parse character details for display
        const parsedDetails = this.parseCharacterDetails(characterDetails);
        // Create overlay and modal
        const overlay = document.createElement('div');
        overlay.className = 'portrait-modal-overlay';
        overlay.innerHTML = `
            <div class="portrait-modal">
                ${imageUrl ?
                    `<img src="${imageUrl}" alt="Portrait of ${plainName}" class="portrait-avatar">`
                    : `<div class="portrait-avatar" style="background-color: ${this.getClanColor(this.getClanName(charName))};"></div>`
                }
                <div class="portrait-name">${this.parseMarkdownText(displayText)}</div>
                ${parsedDetails ? `
                    <div class="portrait-details">
                        <div class="character-trait">${parsedDetails.trait}</div>
                        <div class="character-elements">${parsedDetails.elements}</div>
                    </div>
                ` : ''}
                <div class="portrait-clan-icon">${this.getClanIcon(this.getClanName(charName))}</div>
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
        
        // Handle edge cases where there might be no dash
        if (name.includes('-')) {
            name = name.split('-')[0].trim();
        }
        
        // Handle empty or whitespace-only names
        if (!name || name.trim() === '') {
            return 'Unknown Character';
        }
        
        return name.trim();
    }

    getClanName(originalChar) {
        // Define all known clans
        const knownClans = ['Crane', 'Crab', 'Phoenix', 'Scorpion', 'Lion', 'Dragon', 'Mantis', 'Unicorn', 'Imperial'];
        
        // Search for clan keywords in the entire character string
        for (const clan of knownClans) {
            if (originalChar.toLowerCase().includes(clan.toLowerCase())) {
                return clan;
            }
        }
        
        return "Unknown";
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
            'unknown': '🎴'
        };
        return icons[clan.toLowerCase()] || icons['unknown'];
    }

    getClanColor(clan) {
        const colors = {
            'crane': '#87CEEB',      // Light Blue
            'crab': '#808080',       // Gray
            'phoenix': '#FFA500',    // Orange
            'scorpion': '#FF0000',   // Red
            'lion': '#FFD700',       // Yellow/Gold
            'dragon': '#32CD32',     // Green
            'mantis': '#008080',     // Teal
            'unicorn': '#800080',    // Purple
            'imperial': '#50C878',   // Emerald Green
            'unknown': '#D3D3D3'     // Light Gray
        };
        return colors[clan.toLowerCase()] || colors['unknown'];
    }

    getElementEmoji(element) {
        const elementEmojis = {
            'fire': '🟠',
            'water': '🔵',
            'earth': '🟤',
            'air': '⚪',
            'void': '⚫'
        };
        return elementEmojis[element.toLowerCase()] || element;
    }

    getLocationEmoji(locationName) {
        const locationEmojis = {
                        // Religious & Spiritual
                        'temple': '⛩️',
                        'shrine': '🎐',
                        'lotus': '🪷',
                        'meditation': '🧘',
                        'prayer': '📿',
                        'spiritual': '☯️',
                        
                        // Royal & Political
                        'castle': '🏯',
                        'palace': '🏯',
                        'throne': '👑',
                        'imperial': '👑',
                        'royal': '👑',
                        'noble': '👑',
                        
                        // Nature & Gardens
                        'garden': '🎋',
                        'bamboo': '🎋',
                        'cherry': '🌸',
                        'lotus garden': '🪷',
                        'mountain': '🗻',
                        'cave': '🗻',
                        'forest': '🎋',
                        'grove': '🎋',
                        
                        // Commercial & Social
                        'market': '🎏',
                        'shop': '🎏',
                        'store': '🎏',
                        'inn': '🍵',
                        'tavern': '🍵',
                        'restaurant': '🍱',
                        'food': '🍱',
                        
                        // Training & Combat
                        'dojo': '🥋',
                        'training': '🥋',
                        'martial': '🥋',
                        'combat': '⚔️',
                        'weapon': '🏹',
                        'armory': '🗡️',
                        'barracks': '🗡️',
                        
                        // Cultural & Entertainment
                        'theater': '🎭',
                        'stage': '🎭',
                        'performance': '🎭',
                        'gambling': '🎴',
                        'game': '🎴',
                        'festival': '🎆',
                        'celebration': '🎆',
                        
                        // Traditional & Ceremonial
                        'tea house': '🍵',
                        'tea room': '🍵',
                        'ceremony': '🎎',
                        'ritual': '🎎',
                        'traditional': '🎎',
                        'doll': '🎎',
                        
                        // Food & Hospitality
                        'kitchen': '🍱',
                        'dining': '🍱',
                        'dinner': '🍱',
                        'banquet': '🍱',
                        'feast': '🍱',
                        'hospitality': '🍵',
                        
                        // Architecture & Structures
                        'tower': '🏯',
                        'fortress': '🏯',
                        'watchtower': '🏯',
                        'gate': '🏯',
                        'wall': '🏯',
                        'bridge': '🏯',
                        
                        // Living Quarters
                        'quarters': '🏯',
                        'room': '🏯',
                        'chamber': '🏯',
                        'suite': '🏯',
                        'apartment': '🏯',
                        'residence': '🏯',
                        
                        // Transportation & Travel
                        'stables': '🏯',
                        'stable': '🏯',
                        'road': '🏯',
                        'path': '🏯',
                        'waystation': '🏯',
                        'station': '🏯',
                        
                        // Urban & Administrative
                        'capital': '🏯',
                        'city': '🏯',
                        'town': '🏯',
                        'village': '🏯',
                        'district': '🏯',
                        'ward': '🏯',
                        
                        // Specific Areas
                        'grounds': '🌸',
                        'yard': '🌸',
                        'courtyard': '🌸',
                        'plaza': '🌸',
                        'square': '🌸',
                        'hall': '🏯',
                        'lobby': '🏯',
                        'entrance': '🏯',
                        
                        // Seasonal & Festive
                        'festival': '🎆',
                        'celebration': '🎆',
                        'party': '🎆',
                        'holiday': '🎆',
                        'tanabata': '🎋',
                        'children': '🎏',
                        
                        // Mystical & Supernatural
                        'mystical': '👹',
                        'supernatural': '👹',
                        'spirit': '👹',
                        'ghost': '👹',
                        'demon': '👹',
                        'oni': '👹',
                        
                        // Lucky & Prosperous
                        'lucky': '🧧',
                        'fortune': '🧧',
                        'prosperity': '🧧',
                        'wealth': '🧧',
                        'treasure': '🧧',
                        'gold': '🧧'
        };
        
        const lowerName = locationName.toLowerCase();
        for (const [keyword, emoji] of Object.entries(locationEmojis)) {
            if (lowerName.includes(keyword)) {
                return emoji;
            }
        }
        
        return '🏛️'; // Default fallback
    }

    parseCharacterDetails(details) {
        if (!details) return null;
        
        // Parse format: "Doji Shizua : Ambitious (+2 Fire, -2 Water)"
        const match = details.match(/^(.+?)\s*:\s*([^(]+?)\s*\(([^)]+)\)$/);
        if (!match) return null;
        
        const [, characterName, trait, elements] = match;
        
        // Parse elements: "+2 Fire, -2 Water"
        const elementMatches = elements.match(/([+-]\d+)\s+(\w+)/g);
        if (!elementMatches) return null;
        
        const formattedElements = elementMatches.map(match => {
            const [, modifier, element] = match.match(/([+-]\d+)\s+(\w+)/);
            const emoji = this.getElementEmoji(element);
            return `${modifier} ${emoji}`;
        }).join(' ');
        
        return {
            trait: trait.trim(),
            elements: formattedElements
        };
    }

    parseLocationDetails(details) {
        if (!details) return null;
        
        // Parse format: "Topaz Championship Grounds - Ceremony Yard, Training Yard, Melee Stage, Dinner Hall (Hollowed)"
        const match = details.match(/^(.+?)\s*-\s*(.+?)\s*\((.+?)\)$/);
        if (!match) return null;
        
        const [, locationName, subLocations, terrainQualities] = match;
        
        // Split sub-locations by comma and clean them up
        const subLocationList = subLocations.split(',').map(loc => loc.trim());
        
        return {
            locationName: locationName.trim(),
            subLocations: subLocationList,
            terrainQualities: terrainQualities.trim()
        };
    }

    async showLocationModal(locationName, actFolder) {
        // Close any open modal first
        const existingModal = document.querySelector('.portrait-modal-overlay');
        if (existingModal) existingModal.remove();
        
        // Find location details from act data
        let locationDetails = '';
        if (actFolder && this.acts) {
            const act = this.acts.find(a => a.folder === actFolder);
            if (act && act.locationDetails) {
                const detailEntry = act.locationDetails.find(detail => 
                    detail.toLowerCase().includes(locationName.toLowerCase())
                );
                if (detailEntry) {
                    locationDetails = detailEntry;
                }
            }
        }
        
        // Try to load location image
        let imageUrl = null;
        if (actFolder) {
            const normalized = locationName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const exts = ['jpg', 'jpeg', 'png', 'webp'];
            for (const ext of exts) {
                const path = `${actFolder}/locations/${normalized}.${ext}`;
                if (await this.fileExists(path)) {
                    imageUrl = path;
                    break;
                }
            }
        }
        
        // Parse location details for display
        const parsedDetails = this.parseLocationDetails(locationDetails);
        
        // Create overlay and modal
        const overlay = document.createElement('div');
        overlay.className = 'portrait-modal-overlay';
        overlay.innerHTML = `
            <div class="portrait-modal">
                ${imageUrl ?
                    `<img src="${imageUrl}" alt="Image of ${locationName}" class="portrait-avatar">`
                    : `<div class="portrait-avatar" style="background-color: #228B22;"></div>`
                }
                <div class="portrait-name">${locationName}</div>
                ${parsedDetails ? `
                    <div class="portrait-details">
                        <div class="character-trait">Sub-locations</div>
                        <div class="character-elements">
                            <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
                                ${parsedDetails.subLocations.map(loc => `<li>${loc}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="character-trait" style="margin-top: 8px;">Terrain</div>
                        <div class="character-elements">${parsedDetails.terrainQualities}</div>
                    </div>
                ` : `
                    <div class="portrait-details">
                        <div class="character-trait">Location</div>
                        <div class="character-elements">${this.getLocationEmoji(locationName)} ${locationName}</div>
                    </div>
                `}
                <div class="portrait-clan-icon">${this.getLocationEmoji(locationName)}</div>
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

    showError(message) {
        this.container.innerHTML = `<div class="error">${message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JadePincerChronicles();
}); 