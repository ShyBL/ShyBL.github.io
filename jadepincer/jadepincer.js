// Jade Pincer Chronicles Script (no config, hardcoded Act folders)

class JadePincerChronicles {
    constructor() {
        this.acts = [];
        this.currentIndex = 0;
        this.container = null;
        this.actFolders = ['Act-1', 'Act-2', 'Act-3', 'Act-4', 'Act-5', 'Act-6'];
        this.init().catch(error => {
            console.error('Failed to initialize Jade Pincer Chronicles:', error);
        });
    }

    async init() {
        try {
            this.container = document.getElementById('session-container');
            await this.loadActs();
            this.render();
            this.setupControls();
        } catch (error) {
            this.showError('Failed to load chronicles: ' + (error.message || error));
        }
    }

    async loadActs() {
        const actPromises = this.actFolders.map(async (folder) => {
            try {
                const act = await this.loadAct(folder);
                return act;
            } catch (error) {
                console.warn(`Failed to load act ${folder}:`, error);
                return null;
            }
        });
        const acts = await Promise.all(actPromises);
        this.acts = acts.filter(act => act !== null);
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
            images: []
        };
        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(act, parsed);
            }
        } catch (error) {
            console.warn(`No README found for ${folder}`);
        }
        act.images = await this.loadImages(folder);
        return act;
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
        // ... (copy the renderSession method from chronicles/script.js, rename as needed)
// ... existing code ...
    }

    renderMedia(images) {
        // ... (copy the renderMedia method from chronicles/script.js)
// ... existing code ...
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
        // ... (copy the setupControls method from chronicles/script.js)
// ... existing code ...
    }

    // ... (copy any other helper methods needed from chronicles/script.js)
// ... existing code ...
}

document.addEventListener('DOMContentLoaded', () => {
    new JadePincerChronicles();
}); 