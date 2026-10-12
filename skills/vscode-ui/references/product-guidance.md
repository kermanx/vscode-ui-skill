# Product guidance

Use these directions where relevant, adapting to the product's needs and existing design.

- **Highlighting:** Prefer Shiki for syntax highlighting. Simple read-only snippets can use `pre > code`; prefer Monaco Editor when an embedded editor is needed.
- **Icons:** Use Codicons for workbench actions and chrome; keep file and language icons separate. With UnoCSS, use its icon preset with `@iconify-json/codicon` (for example, `i-codicon-search`).
- **Typography:** Prefer platform UI fonts (`-apple-system` on macOS, `"Segoe UI"` on Windows, `system-ui` on Linux) and monospace fonts for code, such as Menlo, Consolas, or DejaVu Sans Mono. Keep UI, body, and editor typography independently scoped.
- **Themes:** Prefer [Dark 2026](../assets/themes/2026-dark.json) or [Light 2026](../assets/themes/2026-light.json) for most interfaces. [High Contrast Dark](../assets/themes/hc_black.json) and [High Contrast Light](../assets/themes/hc_light.json) are also available. Preserve semantic color roles; omitted roles may use VS Code's registered defaults.
- **Composition:** Editor tabs suit open items, sidebars group related views, the Panel holds supporting views, and the Status Bar carries concise contextual information. Choose regions according to the product's workflow.
- **Feedback:** Prefer feedback near the operation or content it concerns. Use notifications or blocking dialogs when the situation calls for broader attention or an immediate decision.
