# Foundations

This reference targets the connected Classic workbench with
`workbench.experimental.modernUI` disabled. Do not introduce floating workbench
cards, gaps around workbench parts, a rounded editor frame, Modern density
metrics, or Modern-only surface and tab roles. The Dark Modern and Light Modern
names below are color themes; they do not imply Modern UI geometry.

## Classic visual structure

Build the shell as connected regions. The title bar, Activity Bar, Side Bar,
editor groups, Panel, Auxiliary Bar, and Status Bar meet edge to edge. Use a
component-owned `1px` border where that boundary role resolves visibly;
otherwise let adjacent region backgrounds form the seam. Use sashes for resize
hit areas rather than adding outer gaps, rounded cards, or a global frame.

Classic components are not governed by one universal spacing or radius scale.
Shared size tokens do exist and are injected into Classic too; use them only
where the component consumes them. For example, the Chat request bubble uses
the shared medium radius (`6px`), while its normal composer uses large (`8px`);
see the [verified Chat source paths](chat-assistant.md#establish-the-classic-baseline).
Do not snap arbitrary values to a ramp or normalize different components.
Representative component facts are:

| Component | Classic radius |
|---|---:|
| Text button, input, select, notification toast | `4px` |
| Workbench hover | `5px` |
| Workbench hover with pointer | `3px` |
| Editor hover, dropdown, custom select, context menu | `8px` |
| Dialog and quick input | `12px` |

These values are not elevation tiers. Joined edges may be square, and shell
parts and editor tabs should remain square where their component rules do.

Use the [measurement contract](application-and-review.md#measurement-contract)
when translating geometry: graphic viewport, clickable border box, and external
spacing are different quantities. Component dimensions include their borders
unless explicitly labeled otherwise; padding must not be added twice.

## Strokes and focus

- Use `1px` for ordinary borders, separators, and the default focus stroke. A
  component may omit its ordinary border when its theme role is unset or
  transparent.
- General keyboard focus uses a `1px solid` outline in the focus-border color
  with `outline-offset: -1px`. Text buttons and checkboxes use an outward
  `2px` offset; preserve such component exceptions.
- Use the component's focus or active state token instead of changing border
  thickness. High-contrast themes may add explicit contrast borders and should
  not depend on shadows alone.

## Classic shadows

Use the existing shadow assigned to the component. Do not infer a general
elevation hierarchy or exchange shadows because two surfaces have similar
sizes.

| Existing primitive | Value | Active Classic uses |
|---|---|---|
| Small | `0 0 4px rgba(0, 0, 0, 0.08)` | Inactive-tab hover, Extensions item, Settings TOC, and SCM provider |
| Medium | `0 0 6px rgba(0, 0, 0, 0.08)` | Title Bar, Activity Bar, minimap, and Extensions item hover |
| Large | `0 0 12px rgba(0, 0, 0, 0.14)` | Menus, hovers, notifications, find and editor widgets |
| Extra large | `0 0 20px rgba(0, 0, 0, 0.15)` | Dialog, quick input, and modal editor surface |
| Active tab | `0 8px 12px rgba(0, 0, 0, 0.02)` | Inset active-tab depth |
| Horizontal depth | `5px 0 10px -4px rgba(0, 0, 0, 0.05)` | Directional editor-part seam |
| Vertical depth | `0 5px 10px -4px rgba(0, 0, 0, 0.04)` | Directional editor-part seam |

When workbench shadows are disabled, remove the part, tab, and directional
depth shadows; floating overlays retain their own assigned shadows.

## Typography

The workbench root uses `13px` type with `line-height: 1.4`. Individual compact
surfaces set their own sizes; do not impose a separate global typography ramp.
Use the host or user font settings when available.

| Platform | Workbench UI family | Workbench monospace family | Default editor family | Editor size / computed line height |
|---|---|---|---|---:|
| macOS | `-apple-system, BlinkMacSystemFont, sans-serif` | `"SF Mono", Monaco, Menlo, Courier, monospace` | `Menlo, Monaco, "Courier New", monospace` | `12px / 18px` |
| Windows | `"Segoe WPC", "Segoe UI", sans-serif` | `Consolas, "Courier New", monospace` | `Consolas, "Courier New", monospace` | `14px / 19px` |
| Linux | `system-ui, "Ubuntu", "Droid Sans", sans-serif` | `"Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace` | `"Droid Sans Mono", monospace` | `14px / 19px` |

Use the localized platform fallbacks when the interface language needs CJK
coverage.

### Typography scopes

- **Workbench UI:** labels, tabs, ordinary selectors, and menus use the UI
  family and baseline size unless their mapped component defines an override.
  Compact action labels and uppercase pane headers are specific `11px` cases.
- **Readable body:** assistant replies, document prose, and explanatory content
  use the product's body preference and content line height. Changing that
  preference must not resize all toolbar labels, model pickers, or icons.
- **Editor:** code in an editor viewport uses editor family, size, and line-height
  settings. Inline code and ordinary Markdown fences belong to the content
  renderer unless the product explicitly shares its code preference with them.

Classify a model selector as a choice control and a labeled dropdown by its own
variant, not by its horizontal parent. A button beside prose keeps its button
contract; a text link remains content. Do not set `11px` on a common container
and rely on inheritance to classify everything inside it. When no compact
variant is established, preserve the existing UI setting or use the `13px`
workbench baseline for a newly introduced ordinary UI control.

## Icons

- Use Codicons for workbench actions and product chrome. The default glyph size
  is `16px`; dense components may set `12px`, `13px`, or `14px`. Match the
  component instead of forcing every icon to one compact size.
- Keep product icons and file icons separate. Product icon themes can replace
  registered UI glyphs. File, folder, and language icons come from the active
  file-icon theme and may be absent when no file-icon theme is enabled.
- With UnoCSS, use `presetIcons` with `@iconify-json/codicon`; address the
  collection with classes such as `i-codicon-search`.

## Motion

Classic motion is component-local. Do not add the scale-open animation used by
other profiles to quick input or action widgets.

- Context menus use an `83ms linear` fade-in.
- Notification toasts transition transform and opacity over `300ms ease-out`;
  reduced motion changes both durations to `0ms`.
- Scrollbars reveal over `100ms linear` and may fade over `800ms linear`; the
  no-animation state removes those transitions.
- Determinate progress width changes over `100ms linear`; indeterminate progress
  uses a `4s linear` loop.
- Status Bar color and editor drop-target transitions run only when motion is
  enabled.

## Semantic color roles

Component rules consume semantic custom properties; literal colors belong only
in standalone theme definitions. When hosted by VS Code, use its public
`--vscode-*` properties directly. Outside that host, define project-owned
properties with the same responsibilities.

Use the most specific component role. The theme role `list.hoverBackground`
maps to `--vscode-list-hoverBackground`; project-owned tokens should preserve
that responsibility even when their names differ. Do not alias unrelated roles
because today's literal values happen to match.

- Content roles: `foreground`, `descriptionForeground`, `disabledForeground`,
  and `icon.foreground`.
- Region roles: `editor.background`, `sideBar.background`, `panel.background`,
  `titleBar.activeBackground`, and `statusBar.background`.
- Boundary roles: `sideBar.border`, `panel.border`, `editorGroup.border`,
  `editorGroupHeader.tabsBorder`, and `tab.border` are independent.
- Tab roles: `tab.activeBackground`, `tab.activeForeground`,
  `tab.activeBorderTop`, `tab.inactiveBackground`, `tab.inactiveForeground`,
  and `tab.hoverBackground`.
- Input roles: `input.background`, `input.foreground`, `input.border`, and
  `input.placeholderForeground`; validation has separate information, warning,
  and error foreground/background/border roles.
- List roles: `list.hoverBackground`, `list.hoverForeground`,
  `list.activeSelectionBackground`, `list.activeSelectionForeground`,
  `list.inactiveSelectionBackground`, `list.inactiveSelectionForeground`,
  `list.focusOutline`, and `list.focusAndSelectionOutline`. Active means the
  list owns keyboard focus; selection is a separate state.
- Action roles: `button.background`, `button.foreground`,
  `button.hoverBackground`, `button.secondaryBackground`,
  `button.secondaryForeground`, `button.secondaryHoverBackground`,
  `toolbar.hoverBackground`, `toolbar.activeBackground`, and
  `toolbar.hoverOutline`. `focusBorder` is independent of button fills.
- Guide roles: `tree.indentGuidesStroke` and `tree.inactiveIndentGuidesStroke`
  are tree guides; `editorIndentGuide.background1` and
  `editorIndentGuide.activeBackground1` are editor guides. Do not share them.
- Content/overlay roles: `textLink.foreground`, `textCodeBlock.background`,
  `textPreformat.foreground`, `textPreformat.background`,
  `editorWidget.background`, `widget.border`, `menu.background`, and
  `notifications.background`.
- State roles: `errorForeground`, `editorWarning.foreground`,
  `editorInfo.foreground`, `editorGutter.addedBackground`,
  `editorGutter.modifiedBackground`, and `editorGutter.deletedBackground`.
  Validation, diagnostics, and source-control changes remain separate consumers.

### Missing roles and defaults

An omitted theme entry can inherit from an included theme or the role registry;
it does not automatically mean transparent. Resolve those layers first. Outside
VS Code, supply explicit standalone defaults for the roles the product consumes.

- A nullable foreground override, such as `list.inactiveSelectionForeground`,
  leaves the row's ordinary foreground in place; it does not borrow active
  selection's foreground. The corresponding icon override is independent.
- An absent optional hover outline or contrast border draws no extra stroke.
  For absent ordinary borders, follow the component's geometry: retain a
  transparent reserved border if its dimensions include one, or omit the stroke
  if the component does. Do not turn every missing border into `focusBorder`.
- Keep a visible focus treatment using the component's focus role or its
  documented `focusBorder` fallback. Missing optional fills must not remove focus.
- Tree inactive guides default to the active guide color at 40% alpha. Apply the
  alpha to the stroke, not the whole nested subtree. If guides are disabled by
  the product, do not manufacture them through a fallback.
- Do not create global fallback chains between unrelated roles. Any project
  fallback is a theme-definition decision, not an undocumented per-component tint.

## Dark Modern and Light Modern palettes

These color themes work with Classic geometry. Each row is one exact theme role;
shared literals still need separate tokens. Values below are a source snapshot,
not a promise that a future release or user theme has the same palette.

| Theme role | Dark Modern | Light Modern |
|---|---|---|
| `editor.background` | `#1F1F1F` | `#FFFFFF` |
| `sideBar.background` | `#181818` | `#F8F8F8` |
| `panel.background` | `#181818` | `#F8F8F8` |
| `titleBar.activeBackground` | `#181818` | `#F8F8F8` |
| `statusBar.background` | `#181818` | `#F8F8F8` |
| `editorWidget.background` | `#202020` | `#F8F8F8` |
| `input.background` | `#313131` | `#FFFFFF` |
| `list.hoverBackground` | `#2A2D2E` | `#F2F2F2` |
| `list.activeSelectionBackground` | `#04395E` | `#E8E8E8` |
| `list.activeSelectionForeground` | `#FFFFFF` | `#000000` |
| `list.inactiveSelectionBackground` | `#37373D` | `#E4E6F1` |
| `list.inactiveSelectionForeground` | Unset; retain row foreground | Unset; retain row foreground |
| `toolbar.hoverBackground` | `#5A5D5E50` | `#B8B8B850` |
| `toolbar.activeBackground` | Registry lightens hover by 0.1 | Registry darkens hover by 0.1 |
| `toolbar.hoverOutline` | Unset; no extra outline | Unset; no extra outline |
| `tree.indentGuidesStroke` | `#585858` | `#A9A9A9` |
| `tree.inactiveIndentGuidesStroke` | Guide stroke at 40% alpha | Guide stroke at 40% alpha |
| `editorIndentGuide.background1` | `#404040` | `#D3D3D3` |
| `editorIndentGuide.activeBackground1` | `#707070` | `#939393` |
| `sideBar.border` | `#2B2B2B` | `#E5E5E5` |
| `panel.border` | `#2B2B2B` | `#E5E5E5` |
| `titleBar.border` | `#2B2B2B` | `#E5E5E5` |
| `statusBar.border` | `#2B2B2B` | `#E5E5E5` |
| `editorGroup.border` | `#FFFFFF17` | `#E5E5E5` |
| `editorGroupHeader.tabsBorder` | `#2B2B2B` | `#E5E5E5` |
| `tab.border` | `#2B2B2B` | `#E5E5E5` |
| `input.border` | `#3C3C3C` | `#CECECE` |
| `foreground` | `#CCCCCC` | `#3B3B3B` |
| `descriptionForeground` | `#9D9D9D` | `#3B3B3B` |
| `tab.activeForeground` | `#FFFFFF` | `#3B3B3B` |
| `tab.inactiveForeground` | `#9D9D9D` | `#616161` |
| `input.placeholderForeground` | `#989898` | `#767676` |
| `focusBorder` | `#0078D4` | `#005FB8` |
| `button.background` | `#0078D4` | `#005FB8` |
| `button.hoverBackground` | `#026EC1` | `#0258A8` |
| `button.foreground` | `#FFFFFF` | `#FFFFFF` |
| `textLink.foreground` | `#4DAAFC` | `#005FB8` |
| `errorForeground` | `#F85149` | `#F85149` |
| `editorGutter.deletedBackground` | `#F85149` | `#F85149` |
| `editorWarning.foreground` | `#CCA700` | `#BF8803` |
| `editorInfo.foreground` | `#59A4F9` | `#0063D3` |
| `editorGutter.addedBackground` | `#2EA043` | `#2EA043` |
| `editorGutter.modifiedBackground` | `#0078D4` | `#005FB8` |

Sources at VS Code revision `114d61e889475758fd1c3b3fcbdd04e9717940c4`:
[Dark Modern](https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/extensions/theme-defaults/themes/dark_modern.json),
[Light Modern](https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/extensions/theme-defaults/themes/light_modern.json),
their inherited [Dark](https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/extensions/theme-defaults/themes/dark_vs.json)
and [Light](https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/extensions/theme-defaults/themes/light_vs.json) themes,
[list/tree registrations](https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/platform/theme/common/colors/listColors.ts),
and [toolbar/diagnostic registrations](https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/platform/theme/common/colors/editorColors.ts).
The [official theme-role reference](https://code.visualstudio.com/api/references/theme-color)
describes each role's scope. These sources establish colors, not Modern UI geometry.

## Code rendering

Use Shiki for syntax highlighting.
