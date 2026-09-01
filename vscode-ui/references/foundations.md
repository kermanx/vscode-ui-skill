# Foundations

Choose a named role, tier, or semantic token before choosing a literal. Raw CSS
values are acceptable when they faithfully express the shared scales below.

## Design values

Reason from **Values → Principles → Moves**.

| Value | Principle | Practical move |
|---|---|---|
| Calm | Quiet at rest; present on intent | Let chrome recede until hover, focus, or interaction. |
| Calm | Leave room to breathe | Use spacing and soft edges to group before adding another line or fill. |
| Calm | Explain the interface plainly | Prefer a familiar word to a mystery glyph. |
| Focused | One thing leads; the rest supports | Demote secondary content with a quieter type, icon, or surface role. |
| Focused + Consistent | Elevation is encoded | Choose roundness and shadow from the surface's place in the stack. |
| Consistent | Sameness signals sameness | Equivalent elements use the same named scales and states. |
| Delightful | Delight earns its keep | Motion or polish must guide, confirm, orient, or smooth a jump. |

## Spacing

Use this ramp for `padding`, `margin`, `gap`, and fixed spacers:

`0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40px`

Represent it with project-native custom properties such as `--space-0`,
`--space-2`, …, `--space-40`, or use the raw lengths. Snap off-scale fixed pixel
values to the nearest step and round ties upward. Leave structural values such as `auto`, `%`,
`em`, `rem`, `fr`, custom properties, and `calc()` expressions unchanged.

## Radius and elevation

Choose radius by surface role, not taste.

| Role | Radius | Use |
|---|---:|---|
| Compact | `2px` | Very compact elements |
| Control | `4px` | Buttons, inputs, tabs, and interactive rows |
| Inner | `6px` | Non-control containers inside another surface |
| Outer | `8px` | Menus, hovers, dialogs, toasts, and other overlays |
| Extra-prominent | `12px` | Rare, deliberately prominent surfaces |
| Circle | `9999px` or `50%` | Pills, dots, and circular controls |

Control, Inner, and Outer are the normal elevation tiers. Use `0` at a joined
edge or seam. A pill uses Circle rather than the nearest fixed-radius tier.

## Strokes and shadows

The standard border and separator stroke is `1px`. Whether an ordinary stroke
exists is a yes/no decision; thicker strokes belong to a specific semantic state,
not the general scale.

Treat the shared shadows as CSS custom-property primitives:

| Tier | Value | Typical scope |
|---|---|---|
| Small | `0 0 4px rgba(0, 0, 0, 0.08)` | Classic component or shallow structural lift |
| Medium | `0 0 6px rgba(0, 0, 0, 0.08)` | Classic workbench-part lift |
| Large | `0 0 12px rgba(0, 0, 0, 0.14)` | Floating menus, notifications, and similar overlays |
| Extra-large | `0 0 20px rgba(0, 0, 0, 0.15)` | Dialogs, quick input, and modal editor surfaces |

Classic workbench structure may also use dedicated active-tab and directional
depth shadows. Modern UI is intentionally flatter: remove part, active-tab, and
panel-depth shadows, while retaining Large and Extra-large shadows for floating
overlays. When the host is already using a high-contrast theme, follow its solid
backgrounds and explicit contrast borders instead of adding decorative shadows.

## Typography

Choose a role by information rank. Within this ramp, regular is `400`, semibold
is `600`, and there is no `500` role. Strong text keeps its size role and changes
to `600`.

| Role | Size | Default weight |
|---|---:|---:|
| Heading 1 | `26px` | `600` |
| Heading 2 | `18px` | `600` |
| Heading 3 | `13px` | `600` |
| Body 1 | `13px` | `400` |
| Body 2 | `11px` | `400` |
| Label 1 | `12px` | `400` |
| Label 2 | `11px` | `400` |
| Label 3 | `10px` | `400` |

The workbench UI default is `13px` with `line-height: 1.4` on every platform.

Use host or user font settings when available. Otherwise use these base,
non-localized platform font families. The size and line-height column applies
only to the editor/code font, not the workbench UI font.

| Platform | UI font family | Editor/code font family | Editor/code size / line height |
|---|---|---|---:|
| macOS | `-apple-system, BlinkMacSystemFont, sans-serif` | `Menlo, Monaco, "Courier New", monospace` | `12px / 18px` |
| Windows | `"Segoe WPC", "Segoe UI", sans-serif` | `Consolas, "Courier New", monospace` | `14px / 19px` |
| Linux | `system-ui, "Ubuntu", "Droid Sans", sans-serif` | `"Droid Sans Mono", monospace` | `14px / 19px` |

## Icons

- Use Codicons for product actions and workbench chrome. The default glyph size
  is `16px`; use `12px` for dense or inline chrome. Do not invent an intermediate
  size such as `14px`.
- At `12px`, use the compact Codicon glyph where one exists; scaling the regular
  glyph does not optically tune it.
- Keep product icons and file icons as separate theme systems. Product icon
  themes can replace registered UI glyphs. File, folder, and language icons come
  from the active file-icon theme and may intentionally be absent when no such
  theme is enabled.
- With UnoCSS, an optional portable setup is `presetIcons` plus
  `@iconify-json/codicon`; use the `codicon` collection prefix, typically
  `i-codicon-...`.

## Motion

Animate only to guide, confirm, orient, or smooth a jump. Keep motion subtle,
short, and interruptible; reveal chrome on intent rather than animating at rest.
Gate motion behind the effective reduced-motion preference so the same state
change remains understandable without animation.

## Semantic color roles

Component rules consume semantic custom properties; literal colors belong only
in standalone theme definitions. When hosted by VS Code, alias or use its public
`--vscode-*` properties directly. Outside that host, define project-owned
semantic custom properties for the same roles; the names below are an exact
reference contract, not a runtime or framework requirement.

| Concern | Semantic properties |
|---|---|
| Content | `--vscode-foreground`, `--vscode-descriptionForeground`, `--vscode-disabledForeground`, `--vscode-icon-foreground` |
| Workbench regions | `--vscode-editor-background`, `--vscode-sideBar-background`, `--vscode-panel-background`, `--vscode-titleBar-activeBackground`, `--vscode-statusBar-background` |
| Framed Modern UI surfaces | `--vscode-surface-background`, `--vscode-surface-foreground`, `--vscode-surface-border`, `--vscode-editor-border` |
| Inputs | `--vscode-input-background`, `--vscode-input-foreground`, `--vscode-input-border`, `--vscode-input-placeholderForeground` |
| Interaction | `--vscode-focusBorder`, `--vscode-list-hoverBackground`, `--vscode-list-activeSelectionBackground`, `--vscode-list-activeSelectionForeground` |
| Actions and links | `--vscode-button-background`, `--vscode-button-foreground`, `--vscode-button-hoverBackground`, `--vscode-textLink-foreground` |
| Overlays | `--vscode-editorWidget-background`, `--vscode-widget-border`, `--vscode-menu-background`, `--vscode-notifications-background` |
| State | `--vscode-errorForeground`, `--vscode-editorWarning-foreground`, `--vscode-editorInfo-foreground`, plus added, modified, and deleted roles |

Modern tabs use their own active, hover, foreground, and action-background roles;
inactive editor tabs are transparent by default. Do not reuse a classic tab
literal when a Modern UI semantic role exists.

## Dark Modern and Light Modern palettes

These are color-theme values, independent of whether Modern UI geometry is
enabled. Use them only in standalone theme definitions.

| Role | Dark Modern | Light Modern |
|---|---:|---:|
| Editor background | `#1F1F1F` | `#FFFFFF` |
| Active shell background | `#181818` | `#F8F8F8` |
| Editor widget background | `#202020` | `#F8F8F8` |
| Input background | `#313131` | `#FFFFFF` |
| List or tree hover background | `#2A2D2E` | `#F2F2F2` |
| Active list selection background | `#04395E` | `#E8E8E8` |
| Active list selection foreground | `#FFFFFF` | `#000000` |
| Shell and tab border | `#2B2B2B` | `#E5E5E5` |
| Input border | `#3C3C3C` | `#CECECE` |
| Foreground | `#CCCCCC` | `#3B3B3B` |
| Description foreground | `#9D9D9D` | `#3B3B3B` |
| Active tab foreground | `#FFFFFF` | `#3B3B3B` |
| Inactive tab foreground | `#9D9D9D` | `#868686` |
| Input placeholder | `#989898` | `#767676` |
| Focus and primary button background | `#0078D4` | `#005FB8` |
| Primary button hover background | `#026EC1` | `#0258A8` |
| Primary button foreground | `#FFFFFF` | `#FFFFFF` |
| Text link | `#4DAAFC` | `#005FB8` |
| Error and deleted | `#F85149` | `#F85149` |
| Warning | `#CCA700` | `#BF8803` |
| Information | `#59A4F9` | `#0063D3` |
| Added | `#2EA043` | `#2EA043` |
| Modified | `#0078D4` | `#005FB8` |

## Modern UI density and global metrics

Modern UI defaults to Default density. Compact density joins the workbench cards
and tightens selected internal spacing; it is distinct from the independent
compact Activity Bar setting.

| Metric | Default density | Compact density | Scope |
|---|---:|---:|---|
| Gap between workbench cards | `4px` | `0` | Cluster perimeter remains `4px` in both |
| Non-chat pane list-row side inset | `4px` | `2px` | Scrollbar remains at the pane edge |
| Default-size Activity Bar item gap | `8px` | `4px` | The independent compact Activity Bar uses `0` |
| Activity Bar inner lane | `8px` | `4px` | Excludes the shared outer perimeter |
| Editor tab fill / total title height | `24px / 32px` | `20px / 28px` | Multi-tab Modern UI |
| Status bar content / total height | `22px / 28px` | `22px / 26px` | Main window with floating layout |

These global changes apply in both Modern UI densities unless a component sets
an explicit local measurement:

| Metric | Classic | Modern UI |
|---|---:|---:|
| Implicit scrollbar size | `10px` | `8px` |
| Pane header height | `22px` | `28px` |
| Base notification row height | `42px` | `34px` |
| Part title, header, or footer height | `35px` | `32px` |

## Code rendering

Use Shiki for syntax highlighting.
