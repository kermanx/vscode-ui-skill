---
name: vscode-ui
description: "Build or review framework-agnostic web interfaces in the current VS Code Classic workbench visual language: dense, flat, hierarchical, theme-aware developer tooling expressed with semantic HTML, native CSS, or portable atomic CSS. Use for application shells, sidebars, panels, editors, trees, lists, toolbars, settings, dialogs, command surfaces, and other coding-tool UI; also use when an existing interface feels like a generic SaaS dashboard or needs Classic VS Code-style visual and interaction consistency."
---

# Build VS Code-Style UI

Create an interface that feels consistent with the current default VS Code Classic workbench—the UI used when `workbench.experimental.modernUI` is disabled—without requiring the reader to know VS Code or copying, importing, or depending on its implementation code.

Preserve the project's framework, behavior, data model, and component boundaries. Express the result with semantic HTML, native CSS, or portable atomic CSS.

## Work from evidence

- Apply only rules supported by active Classic component CSS or TypeScript, theme-role registrations, real Classic usage, or official VS Code UX guidelines.
- Ignore Modern UI modules, classes, selectors, and overrides. Do not mix their floating framing, rounded geometry, density profiles, or typography into Classic surfaces.
- Do not normalize Classic components through generic radius, spacing, or font ramps. Use a value only where the Classic component itself or its official UX guidance supports it.
- Do not extrapolate a missing design rule from taste, a nearby component, or a generic design-system convention.
- Inspect the product's hierarchy, actions, data, constraints, and existing patterns before choosing a composition.
- Respect each rule's stated scope. A component-specific value overrides a shared default only for that component.
- When the references do not settle a detail, preserve the project's existing choice or omit the unsupported detail.
- Do not load every reference by default. Read only the files needed for the current surface.

## Follow the Classic contract

- **Dense, flat, adjoining regions:** compose the shell from fitted workbench regions. Use component-owned borders, separators, and background changes instead of turning ordinary regions into floating cards.
- **Component-owned geometry:** preserve each component's verified dimensions, padding, border, and corner treatment. Similar-looking components need not share a global tier.
- **Semantic theme roles:** express foregrounds, backgrounds, borders, focus, selection, and state through their semantic roles so light, dark, and high-contrast themes remain coherent.
- **Compact, scoped actions:** place commands with the row, title, toolbar, tab, menu, or surface that owns them. Follow that component's verified visibility and interaction behavior.
- **Native workbench patterns:** prefer the established Classic pattern for a list, tree, tab strip, menu, quick input, dialog, notification, editor widget, or status surface before inventing a new composition.
- **Constraint-led layout:** derive resizing, minimum sizes, overflow, clipping, scrolling, and action collapse from the content and region constraints verified for that surface.

## Read the relevant references

- Read [foundations.md](references/foundations.md) before selecting spacing, radius, type, icons, strokes, shadows, colors, motion, or code rendering.
- Read [interaction-states.md](references/interaction-states.md) when implementing or reviewing hover, focus, selection, disabled, checked, expanded, busy, drag, dirty, read-only, or reveal behavior.
- Read [layout.md](references/layout.md) when deciding whether content belongs in an editor tab, sidebar, panel, or status bar, or when planning the information architecture of a complete workbench surface.
- Read [workbench-shell.md](references/workbench-shell.md) for the application frame, title and status bars, activity rail, sidebars, editor region, panels, separators, resizing, and layout state.
- Read [controls.md](references/controls.md) for buttons, action controls, text entry, search, validation, selects, checkboxes, compact toggles, segmented choices, keybinding labels, and badges.
- Read [collections.md](references/collections.md) for lists, trees, tables, rows, filtering, inline editing, empty results, and virtualization.
- Read [navigation-actions.md](references/navigation-actions.md) for toolbars, view-title actions, tabs, breadcrumbs, menus, activity items, and the command center.
- Read [overlays-feedback.md](references/overlays-feedback.md) for hovers, context views, quick input, dialogs, notifications, progress, spinners, severity, inline confirmation, and welcome states.
- Read [editor-surfaces.md](references/editor-surfaces.md) for editor groups, the canvas, gutter, minimap, editor widgets, peek, rename, inline edits, diff, code blocks, and terminal-like surfaces.
- Read [composition-patterns.md](references/composition-patterns.md) when assembling a complete developer-tool feature from the verified primitives and behaviors above.

Do not read [accessibility.md](references/accessibility.md) by default. Read it only when the user explicitly requests improved, audited, or comprehensive accessibility support.

## Build and review

1. Identify the primary work, supporting regions, commands, persistent state, and narrow-layout constraints.
2. Establish semantic structure and ownership before styling. Keep state on the component or region that owns it.
3. Apply the relevant verified contracts without replacing the project's working behavior or framework.
4. Verify hierarchy, overflow, constrained layouts, light and dark themes, and the interaction states that the surface actually supports.

When reviewing, report each issue as **surface → observed mismatch → verified Classic behavior or value → correction**. Name the semantic role or component-specific value before the literal value when useful.
