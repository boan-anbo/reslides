# slidev-theme-exhibit

The exhibit style of dhguide.org (`daihum/packages/exhibit`), as a theme for our React Slidev (the `slides-core` fork). For talks and teaching decks.

White page, ink, one red. Newsreader for titles and evidence, DM Sans for prose and apparatus, a system mono for labels. Evidence sits in thin-bordered frames whose label breaks the top edge (as `EmbeddedDocFrame`). The page stepper at bottom right is the guide's step control: ‹ · a progress track · 2/15 · ›. The track has a fixed width cut into one slice per page, lit red as the talk advances; there is no restart button, so a stray click cannot jump to the start. Tokens were measured from the live guide: `#ffffff` paper, `#111111` ink, `#6b7280` subtle, `#e31f27` accent.

## Use

```yaml
---
framework: react
theme: exhibit
title: "…"
routerMode: hash               # lets a built copy run from any static server
layout: cover
kicker: Course or event · session
meta: date
---
```

The theme sets canvas 1920 × 1080, 16/9, no transitions, light, and no web-font downloads (the two fonts ship in `fonts/`, OFL). Run with `npx @daihum/reslides slides.md` or `pnpm dev`. `example.md` here shows each layout and the plain-markdown styles.

## Layouts

| Layout | Frontmatter | Slots |
|---|---|---|
| `cover` | `kicker`, `meta`, `stepper` | `# Title`, a paragraph for the subtitle; `::by::` byline (bottom left); `::right::` |
| `default` | `kicker`, `meta`, `number` (grey number before the h1, default on), `stepper` | `# Claim`, content; `::foot::` source line (bottom left); `::right::` |
| `section` | `kicker`, `meta`, `stepper` | `# One sentence`, optional grey paragraph; `::foot::`; `::right::` |
| `full` | — | blank page with theme fonts and colours |

The bottom line has two slots and no rule: `::foot::` at the left, and at the right the page stepper, which `::right::` replaces (`stepper: false` hides it).

## Plain markdown (teaching slides)

Under `default`, these need no markup: paragraphs and lists (DM Sans, red square bullets), `*emphasis*` (red), `**bold**`, links, inline code and code blocks, tables (mono heads, ruled rows), `> quotations` (serif, red rule), `## mono subhead`, `### serif subhead`, images. Chinese falls back to PingFang/Songti.

## Components (talk slides)

Wrap a slide's evidence in `<div class="body">` (side by side) or `<div class="body col">` (stacked). Inside:

| Class | What | Markup |
|---|---|---|
| `frame` (+`hot`, `fit`) | exhibit frame; `hot` makes the label red | `<div class="frame hot"><span class="label">Source · 1981</span><div class="text">…</div></div>`; images: `<div class="pic"><img …></div>` |
| `rows` (+`small`) / `row` (+`hot`) | label · quotation, ruled | `<div class="rows"><div class="row"><span class="label">Who</span><p class="q">quoted words</p></div></div>` |
| `q`, `plain`, `say` | quotation (adds curly quotes), unquoted line, statement under a label | |
| `route` / `step` (+`red`) / `arrow` | boxes joined by arrows, as the guide's route figure | `<div class="route"><div class="step"><span class="yr">1972</span><p class="what">…</p><p class="how">…</p></div><div class="arrow">→</div>…</div>` |
| `tl` / `ev` (+`red`) | horizontal timeline, six columns (`style="--n:5"` to change) | `<div class="tl"><div class="ev"><span class="yr">1978</span><p>…</p><span class="note">…</span></div></div>` |
| `chron` / `y`, `t`, `divider` | year · event list; a red divider marks a date | `<div class="chron"><div class="y">1977</div><div class="t">…</div><div class="divider">1978 · the “spring”</div>…</div>` |
| `bars` / `n`, `b`, `v` | labelled bars | `<div class="n">Panel</div><div class="b" style="width:68%"></div><div class="v">20+</div>` |
| `pairs` / `k`, `v` | two-column table of short items | |
| `cols` / `head` (+`red`, `muted`) | two columns with ruled heads | `<div class="cols"><div class="muted"><div class="head">…</div><p>…</p></div>…</div>` |
| `grid` | equal frames in a row (`style="--n:2"`) | |
| `thesis` / `p.last` | closing statements, last one larger | |
| `stack` (+`center`) | vertical group inside a `body` | |
| `label` (+`red`) | mono apparatus label | |
| `mark` | the words that matter, in red | |

## Rules

- One red per slide, on the words or the item the slide is about; never a whole paragraph.
- Titles are claims, as sentences. Evidence is quoted, in a frame or a row, with its source in `::foot::`.
- Hard borders and whitespace; no shadows, rounded cards, gradients or icons.
- A big image fills its frame; trim white margins from scans first (`magick in.png -fuzz 12% -trim +repage out.png`).
- Check every slide as a screenshot at 1920 × 1080 before presenting.
