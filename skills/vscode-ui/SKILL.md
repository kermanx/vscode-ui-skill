---
name: vscode-ui
description: "Build or review framework-agnostic web interfaces in the current VS Code Classic workbench visual language: dense, flat, hierarchical, theme-aware developer tooling expressed with semantic HTML, native CSS, or portable atomic CSS. Use for application shells, sidebars, panels, editors, trees, lists, toolbars, settings, dialogs, command surfaces, and other coding-tool UI; also use when an existing interface feels like a generic SaaS dashboard or needs Classic VS Code-style visual and interaction consistency."
---

# Build VS Code-Style UI

Create an interface that feels consistent with the VS Code Classic workbench—the UI used when `workbench.experimental.modernUI` is disabled—without requiring the reader to know VS Code or copying, importing, or depending on its implementation code.

Preserve the project's framework, behavior, data model, and component boundaries. Express the result with semantic HTML, native CSS, or portable atomic CSS.

## Work from evidence

- Present a rule as a Classic fact only when supported by active Classic component CSS or TypeScript, theme-role registrations, real Classic usage, or official VS Code UX guidelines. Product adaptation guidance preserves the product's requirements within that evidence boundary.
- Exclude Modern-only modules, classes, selectors, and overrides from the target styling. Check their activation gates when distinguishing Classic from Modern; shared theme-size variables remain valid when a Classic component consumes them. Do not mix their floating framing, rounded geometry, density profiles, or typography into Classic surfaces.
- Do not normalize Classic components through generic radius, spacing, or font ramps. Use a value only where the Classic component itself or its official UX guidance supports it.
- Do not extrapolate a missing design rule from taste, a nearby component, or a generic design-system convention.
- Inspect the product's hierarchy, actions, data, constraints, and existing patterns before choosing a composition.
- Respect each rule's stated scope. A component-specific value overrides a shared default only for that component.
- Distinguish verified Classic facts, product adaptation decisions, and optional implementation examples. A layout algorithm or DOM structure is not a visual requirement.
- When the references do not settle a detail, mark that detail as uncovered and preserve the product's working behavior and layout. Apply independently supported typography and theme roles only where the component mapping supports them.
- Do not load every reference by default. Read only the files needed for the current surface.

## Map before styling

Default to **product adaptation** unless the user asks for an exact replica. First map the product's components to reference components by purpose, content, interaction, and state ownership. A horizontal row alone does not make its children toolbar actions. Record the mapping and uncovered details in working notes; do not require the user to classify each control.

For an **exact replica**, establish the target Classic version, platform, theme, settings, and states from available evidence. Verify missing details from that target before claiming fidelity; state remaining gaps. In either mode, preserve product functionality and scope CSS to the mapped component and its variants. Do not let a local restyle change unrelated collapsed, nested, or inactive surfaces.

Read [application-and-review.md](references/application-and-review.md) when adapting an existing product or checking the rendered result. It contains mapping examples, measurement rules, annotated diagrams, and the visual acceptance procedure. Resolve ordinary implementation choices autonomously; ask only when a missing product decision materially changes behavior or requested scope.

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
- Read [chat-assistant.md](references/chat-assistant.md) for the source-verified Classic Chat view baseline, its font/configuration paths, user messages, reasoning and tool variants, composer controls, actions, streaming, and code blocks. It separates verified source facts from product adaptation and remaining runtime checks.
- Read [composition-patterns.md](references/composition-patterns.md) when assembling a complete developer-tool feature from the verified primitives and behaviors above.

Do not read [accessibility.md](references/accessibility.md) by default. Read it only when the user explicitly requests improved, audited, or comprehensive accessibility support.

## Build and review

1. Identify the primary work, supporting regions, commands, persistent state, and narrow-layout constraints; map components and flag uncovered details.
2. Establish semantic structure and state ownership. Separate glyph size, control border box, hit target, and external spacing before applying dimensions.
3. Apply the relevant verified contracts without replacing the project's working behavior or framework. Keep optional implementation examples optional.
4. Inspect the actual rendered product using [the visual acceptance procedure](references/application-and-review.md#visual-acceptance). Check computed dimensions, icon centering, text baselines, ancestor offsets and clipping, expanded/collapsed states, focus with selection, and long content in supported themes and constrained layouts. Review screenshots as a whole, not just individual numbers.

If the page cannot be run or inspected, report that limitation and the unverified states; document review or a reference diagram does not establish visual correctness.

When reviewing, report each issue as **surface → observed mismatch → verified Classic behavior or value → correction**. Name the semantic role or component-specific value before the literal value when useful.
