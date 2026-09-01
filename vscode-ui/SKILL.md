---
name: vscode-ui
description: "Build or review framework-agnostic web interfaces in the VS Code visual language: calm, dense, hierarchical, theme-aware developer tooling expressed with semantic HTML, native CSS, or portable atomic CSS. Use for application shells, sidebars, panels, editors, trees, lists, toolbars, settings, dialogs, command surfaces, and other coding-tool UI; also use when an existing interface feels too much like a generic SaaS dashboard or needs VS Code-style visual and interaction consistency."
---

# Build VS Code-Style UI

Create a compact desktop-tool interface without copying or importing VS Code implementation code. Preserve the project's framework, build system, and component conventions. Express every rule as semantic HTML, native CSS, or standard atomic utilities; do not require a CSS library or frontend framework.

## Apply the design philosophy

Reason in this order: **Value → Principle → Move → Value**. Start with the intended feeling, choose the principle that serves it, apply a concrete token or behavior, then verify the feeling again.

| Value | Principle | Test |
|---|---|---|
| Calm | Quiet at rest, present on intent | Does idle chrome compete with the work? |
| Calm | Room to breathe | Is density organized by space instead of boxes and separators? |
| Calm | Explain plainly and kindly | Can the user understand labels and actions without guessing? |
| Focused | One thing leads; the rest supports | Is the primary content or action visually obvious? |
| Focused + Consistent | Encode elevation; do not eyeball it | Does each surface use the radius and treatment for its role? |
| Consistent | Sameness signals sameness | Do equivalent elements use the same named scales and states? |
| Delightful | Delight earns its keep | Does motion or polish guide, confirm, orient, or smooth a jump? |

Treat Calm, Focused, Consistent, and Delightful as constraints, not decoration. Break calm only for an intentional event such as a critical warning. Remove any flourish that cannot name the job it performs.

## Read the relevant references

- Read [foundations.md](references/foundations.md) before choosing CSS values, type, icons, borders, colors, focus styles, code rendering, or atomic utilities.
- Read [patterns.md](references/patterns.md) before building or changing layout, controls, lists, trees, navigation, overlays, settings, or responsive behavior.
- Do not read [accessibility.md](references/accessibility.md) by default. Read it only when the user explicitly asks to improve, audit, or provide comprehensive accessibility support.

## Follow the implementation workflow

1. **Inspect the product context.** Identify the existing stack, theme mechanism, icon source, reusable primitives, and visual constraints. Extend them instead of replacing them.
2. **Name the hierarchy.** Identify the central work surface, primary action, secondary panes, utility chrome, overlays, and transient feedback. Decide what leads before styling.
3. **Define semantic tokens.** Reuse existing tokens or introduce a small `--ui-*` contract. Keep color literals inside theme definitions only. Use the exact size ramps in [foundations.md].
4. **Build semantic structure.** Prefer native controls and meaningful document structure. Use Grid for the application shell and Flexbox for one-dimensional rows and toolbars. Keep component selectors shallow.
5. **Style by role.** Use continuous panes, compact rows, quiet toolbars, restrained borders, and role-based elevation. Avoid assembling the page as a grid of rounded cards.
6. **Implement every state.** Cover rest, hover, active, `:focus-visible`, selected, expanded, disabled, busy, empty, warning, and error states. Reveal secondary actions on hover and `:focus-within` without making them keyboard-inaccessible.
7. **Handle constrained space.** Let text columns shrink, truncate only with ellipsis and accessible full text, preserve fixed icons/actions, and collapse lower-priority panes before primary work.
8. **Verify the result.** Run the project's checks. Inspect the rendered UI at normal and narrow sizes, at zoom, with keyboard-only input, reduced motion, light/dark themes, and high contrast. Fix principle-level failures rather than isolated pixels.

## Enforce the visual character

- Keep typography small and functional. Use size and weight to establish rank, not to create marketing-style drama.
- Prefer flat, continuous work surfaces over card grids, decorative containers, and nested backgrounds.
- Use borders only to communicate structure, focus, selection, validation, or high-contrast separation.
- Keep chrome transparent or recessed at rest; reveal affordances on intent.
- Prefer a clear text label to a mystery glyph. Use icon-only actions only for universal meanings or truly constrained space, and label them accessibly.
- Write concise sentence-case labels. Use direct verbs for actions.
- Prefer Codicons as the product-icon family. When UnoCSS is available, use its Icons preset with Iconify's `codicon` collection as described in [foundations.md](references/foundations.md). Never use emoji as interface icons.
- Keep motion subtle, short, interruptible, and optional. Do not add bounce, parallax, or decorative loops.
- Avoid gradients, glass effects, oversized radii, large hero headings, floating-card dashboards, and ornamental shadows.

## Review in design terms

Report issues as: **feeling → surface → broken principle → corrective move → number, if useful**.

Example: “The sidebar is not Calm: its permanent fill and separators are loud at rest. Recess the surface, remove unneeded strokes, and reveal row actions on intent.”

Do not stop at “change 8px to 6px.” Say “this Inner surface is using the Outer radius tier,” then correct the shared role.
