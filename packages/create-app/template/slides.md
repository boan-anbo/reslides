---
framework: react
theme: exhibit
title: "DAIHUM Reslides · Starter Deck"
routerMode: hash
layout: cover
kicker: Digital Humanities · Project Presentation
meta: 15-Minute Talk
duration: 15min
timer: stopwatch
---

# Project Title: A Clear One-Sentence Claim

Subtitle or research question in one crisp sentence.

::by::

Your Name · DAIHUM Reslides

<!--
000–002 min · 2 minutes

Welcome! This is your presenter note for Slide 1.
- Open `/presenter/` in a second browser window to see these notes, the next-slide preview, and the live timer.
- State your central historical or humanities question clearly before showing your method or tool.
-->

---
kicker: 1 · Research Question & Sources
---

# Start with the historical problem and the primary sources.

- **Research question**: What specific phenomenon, corpus, or archive are you investigating?
- **Primary sources**: Which texts, images, catalogs, or records anchor your inquiry?
- **Why digital / AI methods**: Why can this question not be answered by traditional close reading alone?

::foot::

Source: Cite your archival collection, edition, or dataset here.

<!--
002–005 min · 3 minutes

Explain your corpus and why it matters.
Point to the specific constraints or scale of the material that motivated your workflow.
-->

---
kicker: 2 · Workflow & Evidence
---

# Show how your pipeline turns raw sources into verifiable evidence.

<div class="body col">
<div class="route">
<div class="step"><span class="yr">01</span><p class="what">Ingest & Clean</p><p class="how">OCR / structured records</p></div><div class="arrow">→</div>
<div class="step"><span class="yr">02</span><p class="what">Analyze & Query</p><p class="how">schema + agent verification</p></div><div class="arrow">→</div>
<div class="step red"><span class="yr">03</span><p class="what">Interpret</p><p class="how">historical argument with citations</p></div>
</div>
<div class="frame hot"><span class="label">Primary Source Evidence</span><div class="text">Quote a concrete example from your source material here, highlighting <mark>the exact phrase or pattern</mark> that supports your argument.</div></div>
</div>

::foot::

Every quantitative or computational claim should link back to an inspectable source record.

<!--
005–009 min · 4 minutes

Walk through the 3 steps of your workflow and show one concrete piece of primary evidence in the frame below.
-->

---
kicker: 3 · Comparative Findings
---

# Compare what changed between your initial hypothesis and the verified data.

| Stage | Initial Assumption | Verified Finding |
|---|---|---|
| Corpus coverage | Assumed uniform distribution across decades | Strong concentration in specific regional print centers |
| Classification | Single fixed category per item | Multi-label schema needed after pressure-testing edge cases |
| Verification | Trusted automated extraction at face value | Audited against original page scans; corrected false positives |

> Quantitative patterns do not replace close reading—they tell us *where* to read closely and *what* needs explanation.

::foot::

Table data: Replace with metrics or examples from your own project repository.

<!--
009–012 min · 3 minutes

Use a table or side-by-side comparison to show what your tool or analysis actually revealed—including where your initial assumptions had to be revised.
-->

---
kicker: 4 · Live Project Webpage / Interactive Demo
---

# Embed your interactive project webpage or visualization directly in a slide.

<div class="body col">
<div class="frame" style="flex: 1; padding: 28px 24px 20px;">
  <span class="label red">Interactive Demo · Replace src with your local or published URL</span>
  <iframe
    src="https://www.dhguide.org"
    title="Interactive Project Demo"
    style="width: 100%; height: 100%; min-height: 520px; border: 0; background: #fff;"
    loading="lazy"
  />
</div>
</div>

::foot::

Tip: You can embed any local dev server (`http://localhost:...`), GitHub Pages site, or interactive HTML file in `public/`.

<!--
012–015 min · 3 minutes

Interact with your embedded webpage live on screen, or replace the iframe `src` with a local HTML file placed in `public/demo.html` (`src="/demo.html"`).
Wrap up with your main takeaway and open the floor for Q&A!
-->
