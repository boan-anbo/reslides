---
framework: react
theme: exhibit
title: "Exhibit theme · example"
routerMode: hash
layout: cover
kicker: Digital Humanities · Project Presentation
meta: Week 9 Showcase
---

# Reading a source with an agent

Plain markdown is enough for most slides; components are for evidence.

::by::

Student Name · DAIHUM Reslides

---
kicker: Plain markdown
---

# A teaching slide is written in plain markdown.

- One point per slide; the title says it as a sentence.
- Lists, *red emphasis*, **bold**, `code` and [links](https://www.dhguide.org) are styled.
- 中文也可以：标题、正文和列表都有中文字体后备。

::foot::

Source line or credits go in the foot slot.

---
kicker: Table and quotation
---

# Tables and quotations need no extra markup.

| Step | Paper and pencil | With an agent |
|---|---|---|
| Discovering | the card catalogue | several indexes searched for you |
| Reading | notes on cards | notes with locations |

> A quotation is set in the serif, with a red rule.

---
layout: section
kicker: Part two
---

# Section slides carry one sentence.

A grey line under it, if needed.

---
kicker: Components
---

# Evidence goes in frames; sequences go in routes.

<div class="body col">
<div class="route">
<div class="step"><span class="yr">01</span><p class="what">Ask precisely</p><p class="how">a precise question</p></div><div class="arrow">→</div>
<div class="step"><span class="yr">02</span><p class="what">Find sources</p><p class="how">a list</p></div><div class="arrow">→</div>
<div class="step red"><span class="yr">03</span><p class="what">Read</p><p class="how">notes with locations</p></div>
</div>
<div class="frame hot"><span class="label">Source · 1981</span><div class="text">A quotation in a frame, with <mark>the words that matter</mark> in red.</div></div>
</div>
