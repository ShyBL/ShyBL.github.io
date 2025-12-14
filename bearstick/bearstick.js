// BearStick Studio - Team showcase implementation

class BearStickTeam {
    constructor() {
        this.members = [];
        this.memberFolders = [
            'member-1', 
            'member-2', 
            'member-3', 
            'member-4'
        ];
        this.init();
    }

    async init() {
        try {
            this.container = document.getElementById('team-container');
            this.container.innerHTML = '<div class="loading-throbber"><div class="loading-spinner"></div></div>';
            await this.loadTeam();
            this.render();
        } catch (error) {
            console.error('Failed to load team:', error);
            this.showError('Failed to load team members');
        }
    }

    async loadTeam() {
        const memberPromises = this.memberFolders.map(folder => this.loadMember(folder));
        const members = await Promise.all(memberPromises);
        this.members = members.filter(Boolean);
    }

    async loadMember(folder) {
        const member = {
            folder,
            name: this.formatName(folder),
            roles: [],
            bio: '',
            avatar: null
        };

        try {
            const readme = await this.fetchFile(`${folder}/README.md`);
            if (readme) {
                const parsed = this.parseMarkdown(readme);
                Object.assign(member, parsed);
            }
        } catch (error) {
            console.warn(`No README found for ${folder}`, error);
        }

        member.avatar = await this.loadAvatar(folder);
        
        return member;
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
        const result = { roles: [] };
        
        // Extract name
        const nameLine = lines.find(line => line.startsWith('# '));
        if (nameLine) {
            result.name = nameLine.replace('# ', '').trim();
        }
        
        // Extract roles
        const rolesStart = lines.findIndex(line => 
            /^##?\s*(role|roles|position|positions)/i.test(line)
        );
        
        if (rolesStart >= 0) {
            for (let i = rolesStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line || line.startsWith('#')) break;
                if (line.startsWith('- ')) {
                    result.roles.push(line.replace('- ', '').trim());
                }
            }
        }
        
        // Extract bio
        const bioStart = lines.findIndex(line => 
            /^##?\s*(bio|about|description)/i.test(line)
        );
        
        if (bioStart >= 0) {
            const bioLines = [];
            for (let i = bioStart + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#')) break;
                if (line) bioLines.push(line);
            }
            result.bio = bioLines.join(' ');
        }
        
        return result;
    }

    async loadAvatar(folder) {
        const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
        const possibleNames = ['avatar', 'headshot', 'portrait', 'photo'];
        
        for (const name of possibleNames) {
            for (const ext of imageExts) {
                const path = `${folder}/${name}.${ext}`;
                if (await this.fileExists(path)) {
                    return path;
                }
            }
        }
        
        return null;
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

    formatName(folder) {
        return folder
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    render() {
        if (this.members.length === 0) {
            this.container.innerHTML = '<div class="error">No team members found</div>';
            return;
        }

        this.container.innerHTML = `
            <div class="team-grid">
                ${this.members.map(member => this.renderMember(member)).join('')}
            </div>
        `;
    }

    renderMember(member) {
        const avatarHTML = member.avatar 
            ? `<img src="${member.avatar}" alt="${member.name}" class="avatar">`
            : `<div class="avatar">${this.getInitials(member.name)}</div>`;

        const rolesHTML = member.roles.length > 0
            ? member.roles.map(role => `<div class="role">${role}</div>`).join('')
            : '<div class="role">Team Member</div>';

        return `
            <div class="team-card">
                <div class="avatar-container">
                    ${avatarHTML}
                </div>
                <h3 class="member-name">${member.name}</h3>
                <div class="member-roles">
                    ${rolesHTML}
                </div>
                <div class="member-bio">${member.bio || 'A valued member of the BearStick team.'}</div>
            </div>
        `;
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    showError(message) {
        this.container.innerHTML = `<div class="error">${message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BearStickTeam();
});