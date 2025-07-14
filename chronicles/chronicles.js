// Chronicles Script (no config, hardcoded Session folders)

class Chronicles {
    constructor() {
        this.sessions = [];
        this.currentIndex = 0;
        this.container = null;
        this.sessionFolders = [
            'Session-01', 'Session-02', 'Session-03', 'Session-04', 'Session-05',
            'Session-06', 'Session-07', 'Session-08', 'Session-09', 'Session-10'
        ];
        this.init().catch(error => {
            console.error('Failed to initialize Chronicles:', error);
        });
    }

    async init() {
        try {
            this.container = document.getElementById('session-container');
            await this.loadSessions();
            this.render();
            this.setupControls();
        } catch (error) {
            this.showError('Failed to load chronicles: ' + (error.message || error));
        }
    }

    async loadSessions() {
        const sessionPromises = this.sessionFolders.map(async (folder) => {
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
        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(session, parsed);
            }
        } catch (error) {
            console.warn(`No README found for ${folder}`);
        }
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
        // ... (copy the parseMarkdown method from chronicles/script.js)
// ... existing code ...
    }

    async loadImages(folder) {
        // ... (copy the loadImages method from chronicles/script.js)
// ... existing code ...
    }

    fileExistsCache = new Map();
    async fileExists(path) {
        // ... (copy the fileExists method from chronicles/script.js)
// ... existing code ...
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
        // ... (copy the renderSession method from chronicles/script.js)
// ... existing code ...
    }

    renderMedia(images) {
        // ... (copy the renderMedia method from chronicles/script.js)
// ... existing code ...
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
        // ... (copy the setupControls method from chronicles/script.js)
// ... existing code ...
    }

    // ... (copy any other helper methods needed from chronicles/script.js)
// ... existing code ...
}

document.addEventListener('DOMContentLoaded', () => {
    new Chronicles();
}); 