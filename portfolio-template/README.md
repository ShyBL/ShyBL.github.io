# Portfolio Template

A customizable, data-driven game dev portfolio site. Add your projects via JSON and Markdown — no code changes needed.

---

## Quickstart (GitHub Pages)

### 1. Fork or use this template

Click **"Use this template"** → **"Create a new repository"** at the top of this page.

### 2. Enable GitHub Pages

1. Go to your repo **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Set the branch to `main` and the folder to `/ (root)`
4. Click **Save**

Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

---

## Adding Your Projects

### Step 1 — Register projects in `projects.json`

Edit `projects.json` at the root. Each entry in the `projects` array maps to a folder:

```json
{
  "projects": [
    { "folder": "My Cool Game", "screenshots": 3, "videos": 1 },
    { "folder": "Another Project", "screenshots": 2, "videos": 0 }
  ]
}
```

| Field         | Type    | Description                                      |
|---------------|---------|--------------------------------------------------|
| `folder`      | string  | Folder name under `projects/` (must match exactly) |
| `screenshots` | number  | How many `screenshot1.png`, `screenshot2.png`... files exist |
| `videos`      | number  | How many `demo.mp4`, `demo2.mp4`... files exist  |

### Step 2 — Create a folder per project

Inside the `projects/` directory, create a folder matching the name you used in `projects.json`:

```
projects/
  My Cool Game/
    README.md
    screenshot1.png
    screenshot2.png
    screenshot3.png
    demo.mp4
```

### Step 3 — Write a `README.md` for each project

The site parses this file automatically. Use these headings:

```markdown
# My Cool Game

One-liner that becomes the bold intro sentence.

Longer description text goes here. Can be multiple lines.

## Tech
- Unity
- C#
- Photoshop

## Key Features
- Fast-paced combat
- Procedural level generation
- Online leaderboards

## Team
- Jane Doe — Programming
- John Smith — Art
```

Only `# Title` is required. All other sections are optional and are hidden if absent.

### Media naming conventions

| File           | Role                          |
|----------------|-------------------------------|
| `screenshot1.png` … `screenshotN.png` | Slideshow images (in order) |
| `demo.mp4`     | First gameplay video          |
| `demo2.mp4`    | Second video (optional)       |
| `demo3.mp4`    | Third video (optional)        |

Images can be `.jpg`, `.jpeg`, `.png`, `.gif`, or `.webp` — but the filename must still be `screenshot1.png`, `screenshot2.jpg`, etc. Update the extension accordingly in your folder; the site tries `.png` by default.

---

## Customising the Look

Open `projects.json` and edit the `palette` and `style` blocks:

```json
{
  "palette": {
    "backgroundGradientStart": "#667eea",
    "backgroundGradientEnd":   "#764ba2",
    "cardBackground":          "#ffffff",
    "textPrimary":             "#2d3748",
    "textSecondary":           "#4a5568",
    "accentStart":             "#667eea",
    "accentEnd":               "#764ba2"
  },
  "style": {
    "fontFamily": "sans-serif",
    "animationSpeed": 0.3,
    "techTagStyle": "pill"
  }
}
```

| Option           | Values                   | Effect                              |
|------------------|--------------------------|-------------------------------------|
| `animationSpeed` | number (seconds)         | Card slide and fade duration        |
| `techTagStyle`   | `"pill"` / `"square"`    | Fully rounded vs sharp-cornered tags |
| `fontFamily`     | any valid CSS font stack | Body font                           |

---

## Steam Widgets (optional)

`index.html` includes two Steam store iframes near the bottom of the page. To use them:

1. Open `index.html`
2. Find the `<section class="steam-section">` block
3. Replace the `src` URLs with your own Steam store widget URLs (format: `https://store.steampowered.com/widget/<APP_ID>/`)
4. To remove them entirely, delete the `<section class="steam-section">…</section>` block

---

## File Structure

```
├── README.md              ← You are here (GitHub Pages setup guide)
├── index.html
├── styles.css
├── mobile.css
├── script.js
├── projects.json          ← Site config + project list
└── projects/
    └── My Cool Game/
        ├── README.md
        ├── screenshot1.png
        └── demo.mp4
```

---

## Tips

- **File names are case-sensitive** on GitHub Pages (Linux servers). `Screenshot1.PNG` ≠ `screenshot1.png`.
- Screenshots auto-advance every 3 seconds. Hovering pauses the slideshow.
- The carousel supports keyboard navigation (arrow keys, Tab/Enter on dots).
- Markdown in `README.md` supports `**bold**`, `*italic*`, `` `code` ``, and `[links](url)`.
