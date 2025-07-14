// Chronicles - robust, portfolio-style implementation

class Chronicles {
    constructor() {
        this.sessions = [];
        this.currentIndex = 0;
        this.sessionFolders = [
            'Session-01', 'Session-02', 'Session-03', 'Session-04', 'Session-05',
            'Session-06', 'Session-07', 'Session-08', 'Session-09', 'Session-10'
        ];
        this.init();
    }

    async init() {
        try {
            this.container = document.getElementById('session-container');
            this.container.innerHTML = '<div class="loading-throbber"><div class="loading-spinner"></div></div>';
            await this.loadSessions();
            this.render();
            this.setupControls();
        } catch (error) {
            this.showError('Failed to load chronicles');
        }
    }

    async loadSessions() {
        const sessionPromises = this.sessionFolders.map(folder => this.loadSession(folder));
        const sessions = await Promise.all(sessionPromises);
        this.sessions = sessions.filter(Boolean);
    }

    async loadSession(folder) {
        const session = {
            folder,
            title: this.formatTitle(folder),
            summary: 'Session summary not found.',
            characters: [],
            locations: [],
            keyEvents: [],
            images: []
        };
        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(session, parsed);
            }
        } catch (error) {
            // No README, use placeholders
        }
        session.images = await this.loadImages(folder);
        return session;
    }

    async fetchFile(path) {
        try {
            const response = await fetch(path);
            return response.ok ? await response.text() : null;
        } catch {
            return null;
        }
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const result = { characters: [], locations: [], keyEvents: [] };
        // Title
        const titleLine = lines.find(line => line.startsWith('# '));
        if (titleLine) result.title = titleLine.replace('# ', '').trim();
        // Summary (first bold or paragraph after title)
        const summaryLine = lines.find(line => line.startsWith('**'));
        if (summaryLine) result.summary = summaryLine.replace(/\*\*/g, '').trim();
        // Characters
        const charStart = lines.findIndex(line => /^##?\s*Characters/i.test(line));
        if (charStart >= 0) {
            for (let i = charStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) result.characters.push(line.replace('- ', ''));
            }
        }
        // Locations
        const locStart = lines.findIndex(line => /^##?\s*Locations/i.test(line));
        if (locStart >= 0) {
            for (let i = locStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) result.locations.push(line.replace('- ', ''));
            }
        }
        // Key Events
        const eventStart = lines.findIndex(line => /^##?\s*Key Events/i.test(line));
        if (eventStart >= 0) {
            for (let i = eventStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) result.keyEvents.push(line.replace('- ', ''));
            }
        }
        return result;
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
        } catch {
            return false;
        }
    }

    formatTitle(folder) {
        return folder.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    render() {
        if (this.sessions.length === 0) {
            this.container.innerHTML = '<div class="error">No chronicles found</div>';
            return;
        }
        this.container.innerHTML = `
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
        const charactersHTML = session.characters.length ? `<div class="detail-section"><div class="detail-title">Characters</div><ul class="detail-list characters-list">${session.characters.map(char => `<li>${char}</li>`).join('')}</ul></div>` : '';
        const locationsHTML = session.locations.length ? `<div class="detail-section"><div class="detail-title">Locations</div><ul class="detail-list locations-list">${session.locations.map(loc => `<li>${loc}</li>`).join('')}</ul></div>` : '';
        const eventsHTML = session.keyEvents.length ? `<div class="detail-section"><div class="detail-title">Key Events</div><ul class="detail-list">${session.keyEvents.map(event => `<li>${event}</li>`).join('')}</ul></div>` : '';
        return `
            <article class="session-card" data-folder="${session.folder}">
                ${mediaHTML}
                <div class="session-content">
                    <div class="session-header">
                        <h2 class="session-title">${session.title}</h2>
                    </div>
                    <div class="content-grid">
                        <div class="session-summary">${session.summary}</div>
                        <div class="session-details">${charactersHTML}${locationsHTML}${eventsHTML}</div>
                    </div>
                </div>
            </article>
        `;
    }

    renderMedia(images) {
        if (!images.length) return '<div class="session-media"><div class="media-placeholder">⛩️ No Images Available ⛩️</div></div>';
        return `<div class="session-media"><div class="screenshot-carousel"><div class="screenshot-track">${images.map((img, i) => `<img src="${img}" loading="lazy" alt="Session Image ${i + 1}" class="screenshot${i === 0 ? ' active' : ''}">`).join('')}</div></div></div>`;
    }

    renderNavigation() {
        if (this.sessions.length <= 1) return '';
        return `<div class="navigation"><button class="nav-btn" id="prev-btn">← Previous Chronicle</button><button class="nav-btn" id="next-btn">Next Chronicle →</button></div><div class="session-dots">${this.sessions.map((_, i) => `<button class="dot${i === 0 ? ' active' : ''}" data-index="${i}"></button>`).join('')}</div>`;
    }

    setupControls() {
        // Add navigation and carousel controls as in portfolio/script.js
    }

    showError(message) {
        this.container.innerHTML = `<div class="error">${message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Chronicles();
}); 