# DAIHUM Reslides

**DAIHUM Reslides** is a React-and-Markdown presentation engine for Digital Humanities researchers, students, and developers.

Built on top of [Slidev](https://github.com/slidevjs/slidev) (MIT, created by [Anthony Fu](https://github.com/antfu)), **DAIHUM Reslides** replaces the slide rendering runtime with a full **React 19 + JSX/TSX** client (`@slidev/client-react`) and Vite React pipeline (`vite-react` / `virtual-react`), and ships with the **Exhibit** theme (`slidev-theme-exhibit`)—designed after the typography and archival evidence frames of [dhguide.org](https://www.dhguide.org).

---

## Features

- **Markdown + React JSX**: Write slides in plain Markdown (`slides.md`), or mix in React components, interactive HTML, and `<iframe>` embeds for live project demos.
- **Built-in Exhibit Theme (`theme: exhibit`)**: Crisp paper-and-ink aesthetic (`#ffffff` paper, `#111111` ink, `#e31f27` accent), bundled open-source fonts (`Newsreader` and `DM Sans` — no external font downloads required), numbered claim titles, step-through animations (`data-s="1"`), and bordered archival evidence frames (`.frame`, `.route`, `.tl`, `.chron`, `.bars`).
- **Presenter Mode & Live Timer**: Open `/#/presenter/` (or `/presenter/`) in a second window to see your speaker notes, next-slide preview, click progress, and a live stopwatch or countdown timer.
- **Interactive Web Demos**: Embed your own local or hosted project webpage directly inside a slide using `<iframe>` or custom React layouts (`layouts-react/*.tsx`).
- **Cross-Platform (macOS & Windows)**: Works identically on macOS, Windows, and Linux with Node.js `>= 18`.
- **Static Export & Hosting**: Build a self-contained static web app (`dist/`) ready for GitHub Pages, Netlify, Vercel, or any static server, or export to PDF / PNG / PPTX with Playwright.

---

## Quick Start (For Students & Non-Programmers)

### Prerequisite
Install **[Node.js](https://nodejs.org/)** (LTS version 18, 20, or 22) and **[Git](https://git-scm.com/)** on your Mac or Windows computer.

### Option A: Clone and Run Directly (Recommended for Coursework)

Open your terminal (**Terminal** on macOS, or **PowerShell** / **Git Bash** on Windows) — or ask your coding agent (such as **OpenCode**) to run:

```bash
git clone https://github.com/boan-anbo/reslides.git
cd reslides
npm run setup
npm run dev
```

*(If you have `pnpm` installed, you can also run `pnpm install && pnpm dev`.)*

Then open your browser to:
- **Slide Show**: <http://localhost:3030/>
- **Presenter Mode (Speaker Notes + Timer)**: <http://localhost:3030/#/presenter/>
- **Slide Overview**: <http://localhost:3030/#/overview/>

Edit [`examples/starter/slides.md`](./examples/starter/slides.md) in any text editor or with your AI coding agent—your browser updates automatically as you save!

### Option B: Use inside Your Own Course / Project Folder

If you already have a project workspace (for example, `dhg508-workspace`), you can clone `reslides` into your workspace or a sibling folder and launch any `slides.md` file directly:

```bash
node /path/to/reslides/packages/slidev/bin/reslides.mjs slides.md --open
```

---

## Writing Slides in `slides.md`

Slides are separated by `---` in a single Markdown file (`slides.md`).

### 1. Frontmatter & Presenter Timer

At the very top of `slides.md`, configure your deck title, theme, and talk duration:

```yaml
---
framework: react
theme: exhibit
title: "My Digital History Project"
routerMode: hash
layout: cover
kicker: Digital Humanities · Project Showcase
meta: 15-Minute Presentation
duration: 15min
timer: stopwatch   # or 'countdown'
---

# Project Title: State Your Main Claim as a Sentence

One-sentence subtitle explaining your corpus and research question.

::by::

Your Name · Lingnan University

<!--
000–002 min · 2 minutes

Speaker notes go inside an HTML comment at the end of each slide.
They appear in Presenter Mode (/presenter/) alongside the timer.
-->
```

### 2. Plain Markdown Slides

Under `theme: exhibit`, standard Markdown needs no special markup:

```markdown
---
kicker: 1 · Research Question & Corpus
---

# A teaching or research slide is written in plain Markdown.

- **One claim per slide**: Write the `#` heading as a complete sentence.
- Use *italic* for red emphasis, **bold** for key terms, and `inline code` for field names.
- Tables and `> blockquotes` are automatically styled.

| Field | Raw Source | Cleaned Schema |
|---|---|---|
| Date | Lunar reign year | ISO date + original string preserved |
| Location | Historical prefecture | Historical name + modern coordinates |

::foot::

Source: Cite your archival collection or dataset at the bottom left.

<!--
002–005 min · 3 minutes

Remind yourself which row of the table to highlight.
-->
```

### 3. Archival Evidence Frames & Process Routes

Use Exhibit's built-in CSS classes (`.frame`, `.route`, `.cols`, `.tl`) to display primary sources and workflows cleanly:

```markdown
---
kicker: 2 · Method & Primary Evidence
---

# Show how your pipeline turns raw sources into verifiable evidence.

<div class="body col">
  <div class="route">
    <div class="step"><span class="yr">01</span><p class="what">Digitize</p><p class="how">page scans & OCR</p></div>
    <div class="arrow">→</div>
    <div class="step"><span class="yr">02</span><p class="what">Structure</p><p class="how">JSON / CSV table</p></div>
    <div class="arrow">→</div>
    <div class="step red"><span class="yr">03</span><p class="what">Verify</p><p class="how">audit against scan</p></div>
  </div>

  <div class="frame hot">
    <span class="label">Primary Source · 1924 Gazetteer</span>
    <div class="text">
      Quote your primary source here and wrap <mark>the decisive phrase</mark> in a mark tag to highlight it in red.
    </div>
  </div>
</div>
```

### 4. Embedding Your Project Webpage (`<iframe>`)

For a project presentation where you want to showcase a live webpage, interactive map, or chart alongside your slides, either place your static files in `public/` or embed any URL via `<iframe>`:

```markdown
---
kicker: 3 · Live Interactive Demo
---

# Walk through the interactive project interface live on screen.

<div class="body col">
  <div class="frame" style="flex: 1; padding: 28px 24px 20px;">
    <span class="label red">Interactive Project Webpage</span>
    <iframe
      src="/my-project/index.html"
      title="Project Demo"
      style="width: 100%; height: 100%; min-height: 520px; border: 0; background: #fff;"
    />
  </div>
</div>
```

---

## Presenter Mode & Timing Your Talk

When presenting (for example, a **15-minute** showcase):
1. Start the server (`npm run dev` or `pnpm dev`).
2. Open the audience view (<http://localhost:3030/>) on the projector / shared screen.
3. Open **Presenter Mode** (<http://localhost:3030/#/presenter/>) on your laptop screen.
   - The **Current** and **Next** slide previews stay synchronized with your audience window.
   - Your **Speaker Notes** (`<!-- ... -->`) appear in the notes panel (with `+` / `-` font-size buttons).
   - The **Timer** at the bottom right tracks your elapsed time (or countdown from `duration: 15min`) with a progress bar at the top of the presenter window.

---

## Building a Static Website (`dist/`)

To build your deck into a self-contained static website (`dist/`) that can be hosted on GitHub Pages or opened from any static web server:

```bash
npm run build:starter
```

---

## Repository Structure

- `packages/slidev`: CLI (`reslides` / `slidev`) and Vite plugin pipeline, including `node/vite-react` and `node/virtual-react`.
- `packages/client-react`: React 19 client runtime (slides, layouts, presenter mode, overview, timer, drawing controls, notes, Monaco, Shiki Magic Move, KaTeX, Mermaid).
- `packages/theme-exhibit`: The **Exhibit** React theme (`slidev-theme-exhibit`), layouts (`layouts-react/`), stylesheet (`styles/exhibit.css`), and bundled OFL fonts (`DM Sans`, `Newsreader`).
- `packages/parser`: Slidev Markdown & frontmatter parser.
- `packages/types`: Shared TypeScript definitions.
- `packages/client`: Shared base CSS and upstream Vue client compatibility layer.
- `examples/starter`: Ready-to-edit 15-minute student presentation starter deck (`examples/starter/slides.md`).
- `examples/exhibit`: Focused showcase of the Exhibit theme's layouts and components (`examples/exhibit/slides.md`).

---

## License & Attribution

Released under the [MIT License](./LICENSE).

- **Upstream Foundation**: Forked from [Slidev](https://github.com/slidevjs/slidev) (`v52.11.2`), Copyright (c) 2020-PRESENT [Anthony Fu](https://github.com/antfu) and Slidev contributors.
- **DAIHUM Reslides**: React 19 client (`@slidev/client-react`), Vite React pipeline (`vite-react`, `virtual-react`), cross-platform standalone packaging, and Exhibit theme (`slidev-theme-exhibit`), Copyright (c) 2026-PRESENT Bo An / [DAIHUM](https://www.dhguide.org).
- **Bundled Fonts**: `Newsreader` (Production Type) and `DM Sans` (Colophon Foundry), licensed under the SIL Open Font License 1.1 (`packages/theme-exhibit/fonts/OFL-*.txt`).
