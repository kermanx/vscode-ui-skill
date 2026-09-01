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

There is no universal Classic spacing or radius scale. Use the exact geometry
of the component being implemented; do not snap arbitrary values to a ramp or
normalize different components. Representative component facts are:

| Component | Classic radius |
|---|---:|
| Text button, input, select, notification toast | `4px` |
| Workbench hover | `5px` |
| Workbench hover with pointer | `3px` |
| Editor hover, dropdown, custom select, context menu | `8px` |
| Dialog and quick input | `12px` |

These values are not elevation tiers. Joined edges may be square, and shell
parts and editor tabs should remain square where their component rules do.

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

| Concern | Semantic properties |
|---|---|
| Content | `--vscode-foreground`, `--vscode-descriptionForeground`, `--vscode-disabledForeground`, `--vscode-icon-foreground` |
| Workbench regions | `--vscode-editor-background`, `--vscode-sideBar-background`, `--vscode-panel-background`, `--vscode-titleBar-activeBackground`, `--vscode-statusBar-background` |
| Region seams | `--vscode-sideBar-border`, `--vscode-panel-border`, `--vscode-editorGroup-border`, `--vscode-editorGroupHeader-tabsBorder`, `--vscode-tab-border` |
| Classic tabs | `--vscode-tab-activeBackground`, `--vscode-tab-activeForeground`, `--vscode-tab-activeBorderTop`, `--vscode-tab-inactiveBackground`, `--vscode-tab-inactiveForeground`, `--vscode-tab-hoverBackground` |
| Inputs | `--vscode-input-background`, `--vscode-input-foreground`, `--vscode-input-border`, `--vscode-input-placeholderForeground` |
| Interaction | `--vscode-focusBorder`, `--vscode-list-hoverBackground`, `--vscode-list-activeSelectionBackground`, `--vscode-list-activeSelectionForeground` |
| Actions and links | `--vscode-button-background`, `--vscode-button-foreground`, `--vscode-button-hoverBackground`, `--vscode-textLink-foreground` |
| Overlays | `--vscode-editorWidget-background`, `--vscode-widget-border`, `--vscode-menu-background`, `--vscode-notifications-background` |
| State | `--vscode-errorForeground`, `--vscode-editorWarning-foreground`, `--vscode-editorInfo-foreground`, `--vscode-editorGutter-addedBackground`, `--vscode-editorGutter-modifiedBackground`, `--vscode-editorGutter-deletedBackground` |

Prefer the most specific component role. A generic foreground, border, or
background is only a fallback when the component has no dedicated role.

## Dark Modern and Light Modern palettes

These are color-theme values and work with Classic geometry. Use them only in
standalone theme definitions.

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

## Code rendering

Use Shiki for syntax highlighting.
