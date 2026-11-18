# Diagram dropdown refinement

User request: fix the boxy native popup and the chevron crowding the right boundary throughout the site. Retain the existing framed-sheet design and lesson behavior.

Inventory: the only native select elements are speed and scenario controls in the shared ScenePlayer. The appearance control already uses a styled popover.

Implementation:
1. Replace both selects with one small, reusable select-only combobox, using the browser top layer for an unclipped popup and existing theme tokens.
2. Give the trigger a separate chevron column, comfortable padding, rounded corners, and a menu with selected/focused states. Wrap long labels on narrow screens.
3. Preserve controlled values, hydration/reduced-motion disabled states, scenario reset and sharing. Provide arrow/Home/End/typeahead selection, Enter/Space/Tab commit, Escape cancellation, and outside dismissal.
4. Verify actual selection and cancellation in the existing browser journeys; inspect opened light/dark controls at 1440, 768 and 390px. Run source, domain, production and design checks.

No curriculum, simulation semantics or lab changes. No new dependencies or deployment.
