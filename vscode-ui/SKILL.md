---
name: vscode-ui
description: "Build or review framework-agnostic web interfaces in the VS Code visual language: calm, dense, hierarchical, theme-aware developer tooling expressed with semantic HTML, native CSS, or portable atomic CSS. Use for application shells, sidebars, panels, editors, trees, lists, toolbars, settings, dialogs, command surfaces, and other coding-tool UI; also use when an existing interface feels like a generic SaaS dashboard or needs VS Code-style visual and interaction consistency."
---

# Build VS Code-Style UI

Create an interface that feels consistent with VS Code without requiring the reader to know VS Code or copying, importing, or depending on its implementation code.

Preserve the project's framework, behavior, data model, and component boundaries. Express the result with semantic HTML, native CSS, or portable atomic CSS.

## Work from evidence

- Apply only the verified rules in the references. Do not extrapolate a missing design rule from taste, a nearby component, or a generic design-system convention.
- Inspect the product's hierarchy, actions, data, constraints, and existing patterns before choosing a composition.
- Respect each rule's stated scope. A component-specific value overrides a shared default only for that component.
- When the references do not settle a detail, preserve the project's existing choice or omit the unsupported detail.
- Do not load every reference by default. Read only the files needed for the current surface.

## Use the design philosophy

Reason from **Values → Principles → Moves**.

| Value | Principle | Move |
|---|---|---|
| Calm | Quiet at rest; present on intent | Let secondary chrome recede until hover, focus, or interaction. |
| Calm | Leave room to breathe | Group with spacing and soft edges before adding another line or fill. |
| Calm | Explain the interface plainly | Prefer a familiar word to an unfamiliar glyph. |
| Focused | One thing leads; the rest supports | Demote supporting content with quieter type, icons, or surfaces. |
| Focused + Consistent | Elevation is encoded | Choose roundness and shadow from the surface's place in the stack. |
| Consistent | Sameness signals sameness | Give equivalent elements the same named scales and states. |
| Delightful | Delight earns its keep | Use motion or polish only to guide, confirm, orient, or smooth a jump. |

Name the value and principle before choosing a concrete move.

## Read the relevant references

- Read [foundations.md](references/foundations.md) before selecting spacing, radius, type, icons, strokes, shadows, colors, motion, density, or code rendering.
- Read [interaction-states.md](references/interaction-states.md) when implementing or reviewing hover, focus, selection, disabled, checked, expanded, busy, drag, dirty, read-only, or reveal behavior.
- Read [workbench-shell.md](references/workbench-shell.md) for the application frame, title and status bars, activity rail, sidebars, editor region, panels, framing, resizing, and density profiles.
- Read [controls.md](references/controls.md) for buttons, action controls, text entry, search, validation, selects, checkboxes, compact toggles, segmented choices, keybinding labels, and badges.
- Read [collections.md](references/collections.md) for lists, trees, tables, rows, filtering, inline editing, empty results, and virtualization.
- Read [navigation-actions.md](references/navigation-actions.md) for toolbars, view-title actions, tabs, breadcrumbs, menus, activity items, and the command center.
- Read [overlays-feedback.md](references/overlays-feedback.md) for hovers, context views, quick input, dialogs, notifications, progress, spinners, severity, inline confirmation, and welcome states.
- Read [editor-surfaces.md](references/editor-surfaces.md) for the editor frame, gutter, minimap, editor widgets, peek, rename, inline edits, diff, code blocks, and terminal-like surfaces.
- Read [composition-patterns.md](references/composition-patterns.md) when assembling a complete developer-tool feature from the verified primitives and behaviors above.

Do not read [accessibility.md](references/accessibility.md) by default. Read it only when the user explicitly requests improved, audited, or comprehensive accessibility support.

## Build and review

1. Identify the primary work, supporting regions, commands, persistent state, and narrow-layout constraints.
2. Establish semantic structure and ownership before styling. Keep state on the component or region that owns it.
3. Apply the relevant verified contracts without replacing the project's working behavior or framework.
4. Verify hierarchy, overflow, constrained layouts, light and dark themes, and the interaction states that the surface actually supports.

When reviewing, report each issue as **feeling → surface → broken principle → corrective move → verified value, when useful**. Name the role, tier, or ramp before the literal value.
