# Portfolio Template

A customizable, data-driven game dev portfolio site. Add your projects via JSON and Markdown — no code changes needed.

---

# Quickstart (GitHub Pages)
> Already know how to fork? Fork this repo instead and skip to Step 3.

### Step 1 — Download the template

Click the green **Code** button at the top of this page, then click **Download ZIP**. Unzip the folder somewhere on your computer — you'll upload its contents shortly.

---

### Step 2 — Create a GitHub account (if you don't have one)

Go to [github.com](https://github.com) and sign up for a free account.

---

### Step 3 — Create a new repository

1. In the upper-right corner of any GitHub page, click the **+** icon, then click **New repository**.
2. Under **Owner**, make sure your own account is selected.
3. Name the repository exactly: `yourusername.github.io` — replacing `yourusername` with your GitHub username, all lowercase.
   > ⚠️ The name must match your username exactly, or GitHub Pages won't work.
4. Leave **everything else as-is** — keep "Add a README file" **off**, and leave the licence and .gitignore set to **None**.
5. Click **Create repository**.

---

### Step 4 — Enable GitHub Pages

1. In your new (empty) repository, go to **Settings** → **Pages** (in the left sidebar under "Code and automation").
2. Under **Source**, select **Deploy from a branch**.
3. Set the branch to `main` and the folder to `/ (root)`.
4. Click **Save**.

> GitHub Pages is now configured. Your site will go live at `https://yourusername.github.io` once you upload the files in the next step.

---

### Step 5 — Upload the template files

1. In your repository, click **Add file** → **Upload files**.
2. Open the unzipped folder from Step 1 and drag **all the files inside it** into the upload area (not the folder itself — its contents).
3. Scroll down and click **Commit changes**.

GitHub will automatically build and publish your site. It can take **up to 2 minutes** to go live. Visit `https://yourusername.github.io` to see it.

---

# Adding Your Projects

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

Github Pages supports `.jpg`, `.jpeg`, `.png`, `.gif`, or `.webp` — but the filename must still be `screenshot1.png`, `screenshot2.jpg`, etc. Extend the scripts if you'd like to add other file types; the site uses `.png` by default.

---

# Customising the Look

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

# File Structure

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

# Tips

- **File names are case-sensitive** on GitHub Pages (Linux servers). `Screenshot1.PNG` ≠ `screenshot1.png`.
- Screenshots auto-advance every 3 seconds. Hovering pauses the slideshow.
- The carousel supports keyboard navigation (arrow keys, Tab/Enter on dots).
- Markdown in `README.md` supports `**bold**`, `*italic*`, `` `code` ``, and `[links](url)`.
