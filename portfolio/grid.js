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

    async init() {
        const container = document.getElementById('project-grid');
        if (!container) return;

        container.innerHTML = '<p class="loading-text">Loading projects...</p>';

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
            this.render(container, projects);
        } catch (error) {
            console.error('Grid initialization failed:', error);
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

    render(container, projects) {
        if (projects.length === 0) {
            container.innerHTML = '<p class="error">No projects found</p>';
            return;
        }

        container.innerHTML = projects.map(p => this.renderCard(p)).join('');
    }

    renderCard(project) {
        const thumb = `${project.folder}/screenshot1.png`;
        const techHTML = project.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('');
        const featuresHTML = project.keyFeatures.length > 0
            ? `<ul class="feature-list">${project.keyFeatures.map(f => `<li>${f}</li>`).join('')}</ul>`
            : '';

        return `
            <div class="grid-card">
                <div class="grid-thumb">
                    <img src="${thumb}" alt="${project.title}">
                    <div class="grid-overlay">
                        <p class="grid-description">${project.description}</p>
                        <a class="grid-btn" href="project.html?project=${project.index}">View Project</a>
                    </div>
                </div>
                <div class="grid-info">
                    <h3 class="grid-title">${project.title}</h3>
                    <div class="tech-stack">${techHTML}</div>
                    ${featuresHTML}
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => { new ProjectGrid(); });
