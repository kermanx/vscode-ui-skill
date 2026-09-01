# Layout and Component Patterns

Build a continuous desktop workbench: persistent navigation and utility chrome surround one dominant work surface. Add visual containers only when they communicate real hierarchy.

## Contents

- [Application shell](#application-shell)
- [Shared row primitive](#shared-row-primitive)
- [Toolbars and headers](#toolbars-and-headers)
- [Navigation, lists, and trees](#navigation-lists-and-trees)
- [Tabs and segmented choices](#tabs-and-segmented-choices)
- [Buttons, inputs, and form rows](#buttons-inputs-and-form-rows)
- [Menus, hovers, dialogs, and toasts](#menus-hovers-dialogs-and-toasts)
- [Command and search surfaces](#command-and-search-surfaces)
- [Empty, loading, and error states](#empty-loading-and-error-states)
- [Responsive and constrained layout](#responsive-and-constrained-layout)
- [Avoid generic dashboard styling](#avoid-generic-dashboard-styling)

## Application shell

- Use CSS Grid for the main shell and `minmax(0, 1fr)` for shrinkable content tracks.
- Keep the editor, canvas, terminal, preview, or primary table as the center of attention.
- Treat sidebars and bottom panels as adjacent panes, not floating cards.
- Make secondary panes resizable when their content benefits from variable space. Collapse the lowest-priority pane first.
- Use a single structural separator between major regions only when background contrast is insufficient.
- Keep part headers `35px` high. Use `8px` horizontal title padding, `12px` title-label inner padding, and `5px` action-area padding.

## Shared row primitive

Use the same geometry for tree rows, list rows, tabs, breadcrumbs, results, and compact settings rows.

```css
.ui-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--ui-space-6);
  padding-inline: var(--ui-space-8);
  color: var(--ui-fg);
}

.ui-row__icon,
.ui-row__actions {
  flex-shrink: 0;
}

.ui-row__label {
  flex: 1 1 0%;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ui-row__actions {
  opacity: 0;
  pointer-events: none;
}

.ui-row:hover .ui-row__actions,
.ui-row:focus-within .ui-row__actions {
  opacity: 1;
  pointer-events: auto;
}
```

Expose truncated text through an accessible tooltip on hover and focus. Never use a fixed width based on one locale.

## Toolbars and headers

- Keep the surface transparent or matched to its pane at rest.
- Use `13px/600` for a compact section title; demote descriptions and metadata.
- Use `16px` action icons, or `12px` in dense inline chrome.
- Reveal button backgrounds, borders, and secondary actions on hover or focus when their resting visibility is unnecessary.
- Prefer one primary action. Render the rest as quiet icon or text actions.
- Avoid separators between every action and avoid permanently boxed icon buttons.

## Navigation, lists, and trees

- Use rows, indentation, chevrons, and selection states; do not wrap each item in a card.
- Distinguish hover, focus, active selection, inactive selection, and drop target with semantic tokens.
- Keep icons and badges secondary to labels. Align metadata in a stable trailing column when comparison matters.
- Support arrow navigation and type-ahead where the pattern expects them.
- Reveal row actions on hover and `:focus-within`; keep them in the keyboard order.
- Use a fully rounded badge only for compact counts or status, not as a default container.

## Tabs and segmented choices

- Keep document tabs flat and attached to their content region. Use a restrained active indicator, foreground change, or selected background.
- Do not turn every tab into a pill. Reserve segmented controls for switching a small set of mutually exclusive views.
- Truncate long labels, preserve the close action, and provide the full label accessibly.

## Buttons, inputs, and form rows

- Prefer native `button`, `input`, `select`, `textarea`, and checkbox elements.
- Use the Control radius (`4px`) and one-stroke borders. Use spacing-ramp padding rather than fixed component-library sizes.
- Keep the primary button for the leading action. Use quiet secondary buttons and links for lower-priority actions.
- Pair ambiguous icons with text. Give every icon-only button an accessible name and tooltip.
- Place validation close to its field using `12px/17px` text and semantic error or warning tokens.
- Build settings as labeled rows or sections with plain descriptions. Do not wrap every setting in a card.

## Menus, hovers, dialogs, and toasts

- Treat floating surfaces as Outer elevation: `8px` radius, theme shadow, and a border only when required for separation.
- Keep menus compact and scannable. Group related commands sparingly; show keyboard shortcuts in a trailing column.
- Make dialogs focused tasks with a concise title, restrained body, and predictable action area.
- Keep notifications concise and actionable. Use severity styling only for meaningful status.
- Remove shadows and add explicit borders in high-contrast themes.

## Command and search surfaces

- Lead with the input and make the result list the next focus target.
- Keep filters, scopes, and secondary actions quiet until used.
- Show result labels first, descriptions second, and metadata last.
- Preserve query and keyboard flow when the result set updates. Announce counts or empty results without stealing focus.

## Empty, loading, and error states

- Use plain language, one clear next action, and restrained illustration or iconography.
- Avoid oversized hero text, marketing panels, and decorative empty-state cards.
- Preserve layout during loading where practical. Use subtle progress and avoid indefinite decorative animation.
- Make recovery the leading action in error states; keep technical details available but secondary.

## Responsive and constrained layout

- Prefer container-driven constraints to device categories. Use container queries or resize observation when behavior depends on the component's actual space.
- Set `min-width: 0` on shrinkable Grid and Flex children.
- Keep icons and action groups `flex-shrink: 0`; let text take remaining space.
- Use all three ellipsis declarations together: `overflow: hidden`, `white-space: nowrap`, and `text-overflow: ellipsis`.
- Stack or collapse secondary controls before hiding primary content or actions.
- Let user-resizable panes preserve the user's chosen size when possible.

## Avoid generic dashboard styling

- No card grid as the default page skeleton.
- No gratuitous borders, separators, nested fills, gradients, or glass surfaces.
- No oversized type, excessive whitespace, pill-shaped everything, or large corner radii.
- No emoji or mixed icon families.
- No mouse-only row actions or hover-only information.
- No clipped labels without ellipsis and access to the full text.
- No off-scale spacing, arbitrary font sizes, `500` weight, or `14px` product icons.
