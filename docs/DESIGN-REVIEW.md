# Design review — 2026-10-27

The approved direction is **framed-sheet**, seed **27102026**. IBM Plex Sans carries reading and controls; IBM Plex Mono is reserved for code. Kubernetes blue identifies active teaching state. A working reconciliation model is the signature element. No photography, invented adoption figures, or placeholder content is used.

The homepage asks “What does Kubernetes continually do?” Its main model connects desired replicas, observed Pods and ready endpoints. Lessons ask a narrower mechanism question beside a replayable narrated scene. The curriculum connects the next learning action to real lesson progress; the atlas connects a concept to its explanation and scene; the labs connect a mechanism to a downloadable local investigation.

## Screenshot critique

Inspected production screenshots at 1440px, 768px and 390px, including full-page overview composites, plus a 390px dark lesson scene. The final inspector artifacts are in ignored `.taste-skill/release-home/`; browser captures are in ignored `output/playwright/`.

1. **Reading order:** The title introduces the subject and the live model provides its concrete proof. At desktop they share the first reading surface; tablet and phone put the model directly after the introduction.
2. **Edges and space:** Introductory text, model, curriculum rows and practical-work section share the sheet edges. Tablet has a separate two-column introduction and stacked model. The phone has no dead side strip or horizontal page overflow.
3. **Colour and type:** Neutral frame and sheet tones keep focus on content. Active blue and labeled green/warning states encode model meaning. IBM Plex appears immediately. Light/dark/system choices use the same visual grammar.
4. **Repeated facts:** Desired, observed and ready counts derive from the actual simulation state. Readiness does not silently change during replica reconciliation. Curriculum totals derive from the 20 modules and 60 lessons; progress starts at zero and updates from local history.
5. **Zero and empty states:** Zero replicas render no Pods and zero endpoints. No fabricated user/community metrics or action badges appear. Empty progress is described as an incomplete learning path.
6. **Diagram grammar:** Node labels, ownership arrows and readiness text identify their meaning. The phone replaces scaled-down SVG with readable nodes and explicit relationship text. Status uses text and marks as well as colour. The viewed lesson has readable nearby controls and narration.
7. **Phone behavior:** Navigation folds away without leaving hidden keyboard targets. Controls wrap into thumb-sized rows; narration, scenario choice and the text transcript remain adjacent to the scene. Reading prose stays at approximately 18px.

## Inspection results and justified warnings

- Final production inspector: **0 failures, 1 warning** at 1440/768/390.
- The single `app-title-size` warning is intentional: the homepage is an editorial entry to the book, so its two-line title exceeds the application-screen title limit. Working lesson/control regions retain the restrained interface scale.
- Source lint: **0 failures, 2 warnings**, both shadows on actual floating overlays (search dialog and mobile navigation). No resting-panel shadow is needed.
- Previous passes corrected overlapping Pod geometry, undersized diagram annotation, mobile control sizing, hidden menu focus targets and reduced-motion sequence wrap.

This is a review of the implemented educational interface, not a claim that every scene has received an independent expert illustration review. The independent technical review sampled eight lessons; content/reference validation covers every lesson and declared scene. Future contributions should continue this screenshot and correctness review loop.

## Refinement after owner feedback

The owner found the original design generic and supplied an unreadable native theme-popup screenshot. The refinement keeps the approved framed-sheet direction (seed 27102026), IBM Plex and Kubernetes blue, with an illustrated-handbook interpretation. An initial draw invocation used the page-only `--direction` flag with app mode and was discarded; the corrected `--style framed-sheet --theme light` invocation retains the existing direction. No new design library or image dependency was added.

### What changed

- Larger editorial titles, more deliberate reading measures, clearer chapter and lesson hierarchy, consistent outline navigation icons and quieter surface boundaries.
- A topology illustration drawn from the real three-node kind configuration, a searchable lab catalogue with level filters, and setup in a disclosure. Every existing exercise/download and stable section ID remains available.
- A normal HTML appearance popover with a labeled native radio group, strong visible focus, Escape/outside dismissal, persisted preferences and device-mode support. It replaces the OS-rendered theme options shown in the owner's screenshot. [Popover behavior reference](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using).
- Diagram type marks, better long-label wrapping, bounded canvases, more readable control/narration text and a stable per-scene drawing height during replay.
- A visible progress meter derived from existing local completion history; storage keys and progress schema are preserved.

### Before / after evidence

| Observation | Before | Refined production build |
| --- | --- | --- |
| Labs at 1440px | Text-only introduction and setup; approximately 6.9 screens | Topology, download action, collapsed setup and two-column catalogue; approximately 5 screens |
| Theme choices in app browser | Unselected light text on a white native popup | Fully readable styled surface and selected-state check in light/dark; screenshots saved |
| Tablet homepage in first refinement pass | Two headings wrapped to three lines | Both fit two lines after recomposing the tablet introduction/closing section |
| Type families on labs in first refinement pass | Generic `monospace` fallback plus two Plex families | Two self-hosted Plex families; code inherits the loaded Mono face |
| Neutral diagram borders on phone | Too strong in the first pass | Quiet neutral boundaries; stronger active-state outline retained as teaching information |

### Final screenshot critique

All final inspector folds and page composites for homepage, labs and the reference lesson were opened at 1440/768/390. Light and dark appearance states were additionally viewed in the actual in-app browser. These artifacts are under ignored `.taste-skill/refine-final-*` and `output/playwright/refined-*`.

1. **First question and hierarchy:** Home introduces a visual understanding of Kubernetes beside its working model. Labs introduces an investigation and its real cluster, with the bundle download on the first screen. Lesson titles, objectives, explanation and scene form a readable sequence.
2. **Frame and alignment:** Content shares one sheet and consistent gutters. The desktop catalogue is a two-column collection of peer exercises; tablet and phone use their own compositions. No horizontal page overflow was observed in the browser journeys.
3. **Colour and face:** IBM Plex is visibly loaded. The frame recedes; the teaching canvas and active controller state carry blue. Status also has text and marks. No gradients, stock photography or fabricated proof were introduced.
4. **Numbers and duplication:** Counts agree with the inventory: 20 modules, 60 lessons, 6/7/7 modules by level and 18/21/21 lessons. Desired/observed/ready and completion values retain their actual state derivations. Empty progress is still zero.
5. **Empty and missing states:** A lab search with no matches exposes an explanation and zero result count. The original malformed-import protections and unavailable-storage fallback remain. Missing-ready endpoints remain a meaningful state rather than a fabricated healthy display.
6. **Marks and labels:** Type marks distinguish control/Pod/machine/service objects, while state dots and narration retain their separate meaning. Long SVG labels wrap earlier. Scene bounds account for actual node positions, and a shared height avoids moving the reading controls during playback.
7. **Phone:** Navigation remains keyboard-safe when folded, filters stay in a compact row, setup is available on demand, and scene controls remain adjacent to their content. Paragraphs remain 18px with generous leading.

### Final gates and deliberate exceptions

- Homepage: **0 failures, 1 warning**; labs: **0 failures, 1 warning**; reference lesson: **0 failures, 2 warnings**.
- The editorial titles deliberately exceed the dashboard title-size rule: these are book/learning entry pages. Active diagram outlines deliberately exceed the neutral panel-border rule because they encode the current teaching state, paired with text and dots.
- Source lint: **0 failures, 5 warnings**. Three shadows belong to actual floating overlays (search, mobile navigation and appearance). The two Mono warnings are literal terminal notation and downloadable filenames, which are code/identifiers.
- Source/content diagnostics report zero errors/warnings/hints. The existing 13 unit checks and five production browser journeys pass. Browser coverage now also exercises lab filtering/empty state/setup, theme persistence and keyboard dismissal. No CSS snapshots or trivial label tests were added.

The review is an authored design assessment rather than an external award score. The site remains a deliberately restrained technical book; individual concept diagrams can continue gaining bespoke illustration as the curriculum evolves. No public hosting or repository publication occurred.


## 2026-10-28 — diagram dropdown correction

A component refinement of the approved **framed-sheet** direction; no direction/type/palette redraw was needed. The two native select types were the only remaining native dropdowns in the source. They now share SelectControl; the already styled appearance popover remains consistent with the same surfaces and marks.

ROUND 1 — component review

Seen in one second: a readable selected setting, with a clearly separated chevron.
Idea (one sentence): lesson settings use the book's quiet reading surfaces and meaningful blue selection state.
Live thing: speed and scenario selection update the existing narrated model.
Layout words by section: trigger=label/value/chevron / popup=padded option list / phone=stacked scenario label with full-width control.
Scores: design 8.0 · usability 8.5 · creativity 7.0 · content 8.0 → overall 8.0 (component scope, not a new score for the entire book).
Caps applied: none within this component review; the book's established illustration/editorial decisions remain outside this small correction.
Top three problems corrected:
1. The supplied speed screenshot crowds the arrow against a hard edge. The final trigger has its own 16px chevron column, explicit end padding, a 10px radius and a compact visible focus ring.
2. The supplied scenario screenshot uses a square OS popup. Both menus now share a 12px rounded surface, 6px inset, 44px option targets, selected checkmark and a separate focus/hover state; see `scenario-dark-1440.png` and `scenario-light-390.png`.
3. A scene's overflow boundary must not cut off a long menu. The popup uses the top layer, wraps option text and stays within the viewport; it closes when its trigger leaves the screen. The 390px captures also show the compact speed menu opening upward when lower space is unavailable.

All 12 settled open-menu captures (two menus × two themes × three widths) were viewed. Earlier captures caught transient chevron/node motion; final captures wait for those transitions to settle. The final inspector's three folds and six full-page sheets are byte-identical to the already viewed captures from the preceding pass, so the rendered page/frame was unchanged by the final interaction guards.

Inspection: **0 FAIL / 2 WARN**. The editorial h1 size is intentional for a reading lesson; the stronger blue/red mobile node outlines communicate actual model states and retain text labels. Source lint: **0 FAIL / 2 WARN**, both shadows on the real floating popup, with no shadow on its resting trigger. Keyboard selection/cancellation, typeahead, native outside dismissal, mobile layout and an open-menu Axe scan pass. Implementation follows the [select-only combobox keyboard pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/); a dedicated screen-reader/device matrix has not been executed.

Artifacts: ignored `output/playwright/dropdowns/` and `.taste-skill/dropdowns-final/`. The existing local preview remains available; no publication was performed.
