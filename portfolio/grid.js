class ProjectGrid {
    constructor() {
        this.init();
    }

    applyConfig(config) {
        const root = document.documentElement.style;

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

        if (config.style?.fontFamily) {
            root.setProperty('--font-family', config.style.fontFamily);
        }

        if (config.style?.animationSpeed != null) {
            root.setProperty('--animation-speed', `${config.style.animationSpeed}s`);
        }

        if (config.style?.techTagStyle) {
            const radius = config.style.techTagStyle === 'square' ? '4px' : '20px';
            root.setProperty('--tech-tag-radius', radius);
        }
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="grid-loading">
                <div class="loading-throbber">
                    <div class="loading-spinner"></div>
                </div>
                <p class="loading-text">Loading projects…</p>
            </div>
        `;
    }

    updateProjectCount(count) {
        const el = document.getElementById('grid-project-count');
        if (el) {
            el.textContent = count === 1 ? '1 project' : `${count} projects`;
        }
    }

    async init() {
        const container = document.getElementById('project-grid');
        if (!container) return;

        this.showLoading(container);

        try {
            const response = await fetch('projects.json');
            if (!response.ok) throw new Error('Could not load projects.json');
            const data = await response.json();
            this.applyConfig(data);

            const configs = data.projects || [];
            const projectPromises = configs.map(async (config, index) => {
                const project = {
                    index,
                    folder: config.folder,
                    title: this.formatTitle(config.folder),
                    description: 'Project description not found.',
                    technologies: [],
                    keyFeatures: []
                };

                try {
                    const readmeResponse = await fetch(`${config.folder}/README.md`);
                    if (readmeResponse.ok) {
                        const readme = await readmeResponse.text();
                        Object.assign(project, this.parseMarkdown(readme));
                    }
                } catch (error) {
                    console.warn(`No README found for ${config.folder}`, error);
                }

                return project;
            });

            const projects = await Promise.all(projectPromises);
            this.updateProjectCount(projects.length);
            this.render(container, projects);
        } catch (error) {
            console.error('Grid initialization failed:', error);
            this.updateProjectCount(0);
            container.innerHTML = '<p class="error">Failed to load projects</p>';
        }
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const result = { technologies: [], keyFeatures: [] };

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

        return result;
    }

    parseMarkdownText(text) {
        return text
            .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    formatTitle(folder) {
        return folder.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    renderFeatureLines(features, lineClass) {
        if (!features.length) return '';
        return features.map(f => `<p class="${lineClass}">${f}</p>`).join('');
    }

    renderOverlayFeatures(features) {
        if (!features.length) {
            return '<p class="grid-overlay-line grid-overlay-empty">No key features listed</p>';
        }
        return `
            <p class="grid-overlay-label">Key Features</p>
            <div class="grid-overlay-features">
                ${this.renderFeatureLines(features, 'grid-overlay-line')}
            </div>
        `;
    }

    renderTouchFeatures(features) {
        if (!features.length) return '';
        return `
            <div class="grid-features-touch">
                <p class="grid-features-touch-label">Key Features</p>
                ${this.renderFeatureLines(features, 'grid-features-touch-line')}
            </div>
        `;
    }

    render(container, projects) {
        if (projects.length === 0) {
            container.innerHTML = '<p class="error">No projects found</p>';
            return;
        }

        container.innerHTML = projects.map(p => this.renderCard(p)).join('');
    }

    renderCard(project) {
        const thumb = `${project.folder}/screenshot1.png`;
        const projectUrl = `project.html?project=${project.index}`;

        // Render each tech tag as an image instead of text
        const techHTML = project.technologies.map(t => {
            const cleanTech = t.toLowerCase().trim();
            let iconUrl = '';
            
            // 1. Check manual overrides first
            if (cleanTech.includes('obs integration') || cleanTech === 'obs') {
                iconUrl = 'https://cdn.simpleicons.org/obsstudio/white';
            } else if (cleanTech === 'maya' || cleanTech.includes('autodesk maya')) {
                iconUrl = 'https://cdn.simpleicons.org/autodeskmaya/white';
            } else if (cleanTech.includes('toon boom') || cleanTech.includes('toonboom')) {
                // Use official SVG vector fallback since simpleicons doesn't have it
                iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Toon_Boom_2022_logo.svg';
            } else {
                // 2. Standard precise matching dictionary
                const manualSlugs = {
                    'c#': 'csharp',
                    'c++': 'cplusplus',
                    'js': 'javascript',
                    'html': 'html5',
                    'css': 'css3',
                    'three.js': 'threedotjs',
                    'node.js': 'nodedotjs',
                    'web audio api': 'web-audio-api',
                    'unity': 'unity',
                    'blender': 'blender'
                };

                const slug = manualSlugs[cleanTech] || cleanTech.replace(/[\s\.\-]+/g, '');
                iconUrl = `https://cdn.simpleicons.org/${slug}/white`;
            }

            return `
                <span class="tech-tag" title="${t}">
                    <img src="${iconUrl}" alt="${t}" class="tech-icon" onerror="this.parentElement.innerText='${t}'">
                </span>
            `;
        }).join('');

        return `
            <article class="grid-card">
                <div class="grid-thumb">
                    <img src="${thumb}" alt="${project.title}">
                </div>
                
                <div class="grid-card-content">
                    <div class="grid-info">
                        <h3 class="grid-title">${project.title}</h3>
                        <div class="tech-stack">${techHTML}</div>
                        ${this.renderTouchFeatures(project.keyFeatures)}
                        <a class="grid-btn grid-btn-card" href="${projectUrl}">View Project</a>
                    </div>
                </div>
                
                <div class="grid-overlay">
                    ${this.renderOverlayFeatures(project.keyFeatures)}
                    <a class="grid-btn grid-btn-overlay" href="${projectUrl}">View Project</a>
                </div>
            </article>
        `;
    }
}

function initSidePanels() {
    const panels = document.querySelectorAll('.side-panel');
    
    panels.forEach(panel => {
        const tab = panel.querySelector('.panel-toggle-tab');
        if (tab) {
            tab.addEventListener('click', () => {
                panel.classList.toggle('collapsed');
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => { new ProjectGrid();
    initSidePanels();
 });
