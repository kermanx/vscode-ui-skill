# Foundations

Use these scales directly in native CSS or express the same declarations with the project's atomic utility syntax. Prefer semantic custom properties so theme and density changes remain centralized.

## Contents

- [Spacing](#spacing)
- [Radius and elevation](#radius-and-elevation)
- [Typography](#typography)
- [Icons and strokes](#icons-and-strokes)
- [Semantic color contract](#semantic-color-contract)
- [Classic Dark Modern and Light Modern palettes](#classic-dark-modern-and-light-modern-palettes)
- [Code rendering](#code-rendering)
- [Native CSS and atomic equivalents](#native-css-and-atomic-equivalents)

## Spacing

Use only this spacing ramp for `padding`, `margin`, `gap`, and fixed spacers:

`0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40px`

Snap an off-scale value to the nearest step; round ties upward. Leave structural values such as `auto`, `%`, `fr`, `min-content`, `max-content`, `calc()`, and theme variables intact.

```css
:root {
  --ui-space-0: 0px;
  --ui-space-2: 2px;
  --ui-space-4: 4px;
  --ui-space-6: 6px;
  --ui-space-8: 8px;
  --ui-space-10: 10px;
  --ui-space-12: 12px;
  --ui-space-16: 16px;
  --ui-space-20: 20px;
  --ui-space-24: 24px;
  --ui-space-28: 28px;
  --ui-space-32: 32px;
  --ui-space-36: 36px;
  --ui-space-40: 40px;
}
```

## Radius and elevation

Choose radius by surface role, not taste.

| Role | Radius | Use |
|---|---:|---|
| Compact | 2px | Tiny, tightly packed elements |
| Control | 4px | Buttons, inputs, tabs, interactive rows |
| Inner | 6px | Containers nested inside another surface |
| Outer | 8px | Menus, hovers, dialogs, toasts, floating overlays |
| Extra-prominent | 12px | Rare, deliberately prominent outer surfaces |
| Circle | 9999px or 50% | Pills, dots, circular controls |

Do not replace a pill with the nearest fixed radius. Avoid rounding large structural panes merely to make them look modern.

```css
:root {
  --ui-radius-xs: 2px;
  --ui-radius-control: 4px;
  --ui-radius-inner: 6px;
  --ui-radius-outer: 8px;
  --ui-radius-xl: 12px;
  --ui-radius-circle: 9999px;
}
```

## Typography

Use the host UI font or a neutral system UI stack. Reserve monospace for code, identifiers, paths, key sequences, and aligned technical data.

| Role | Size | Default weight |
|---|---:|---:|
| Heading 1 | 26px | 600 |
| Heading 2 | 18px | 600 |
| Heading 3 | 13px | 600 |
| Body 1 | 13px | 400 |
| Body 2 | 11px | 400 |
| Label 1 | 12px | 400 |
| Label 2 | 11px | 400 |
| Label 3 | 10px | 400 |

Use only `400` and `600`. There is no medium `500`; “strong” means the same size role at `600`. Use `line-height: 1.4` for normal UI text. Use `12px/17px` for validation messages when a fixed validation treatment is needed.

## Icons and strokes

- Use `16px` icons for standalone or primary actions.
- Use `12px` icons for dense rows, inline glyphs, and secondary chrome. Use an optically tuned compact glyph when the icon family provides one.
- Do not use intermediate icon sizes such as `14px`.
- Use a `1px` standard border or separator. Preserve thicker strokes only when required for focus, accessibility, or semantic emphasis.

Prefer **Codicons** for product actions and developer-tool concepts. If the project uses UnoCSS, use `presetIcons` with Iconify's Codicons collection:

```sh
pnpm add -D @unocss/preset-icons @iconify-json/codicon
```

```ts
import presetIcons from '@unocss/preset-icons'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [presetIcons()],
})
```

Use the Iconify collection prefix `codicon`:

```html
<span class="i-codicon-search text-[16px]" aria-hidden="true"></span>
<span class="i-codicon-close-compact text-[12px]" aria-hidden="true"></span>
```

The equivalent colon syntax, such as `i-codicon:search`, is also valid. Prefer the individual `@iconify-json/codicon` package over the full icon-set bundle. Do not confuse Codicons with the separate `vscode-icons` collection, which is primarily a colorful file-type icon set.

Let monochrome icons inherit `currentColor`. Put the accessible name on the enclosing control; keep a decorative icon `aria-hidden="true"`. Keep class names statically discoverable by UnoCSS, or safelist any names assembled dynamically.

## Semantic color contract

Never put color literals in component CSS. Define them once in light, dark, high-contrast light, and high-contrast dark theme layers. Reuse the project's existing names where possible; otherwise expose this contract:

| Purpose | Tokens |
|---|---|
| Text | `--ui-fg`, `--ui-fg-muted`, `--ui-fg-disabled`, `--ui-fg-placeholder`, `--ui-selection-fg`, `--ui-link` |
| Surfaces | `--ui-bg-canvas`, `--ui-bg-pane`, `--ui-bg-elevated`, `--ui-bg-input` |
| Interaction | `--ui-bg-hover`, `--ui-bg-selection`, `--ui-focus` |
| Structure | `--ui-border`, `--ui-control-border`, `--ui-border-contrast`, `--ui-shadow` |
| Accent | `--ui-accent`, `--ui-accent-hover`, `--ui-accent-fg` |
| Status | `--ui-error`, `--ui-warning`, `--ui-info`, `--ui-success` |

Supply concrete values in the theme layer before rendering. Component rules must consume the tokens.

When running inside a VS Code theme host, adapt public host variables instead of duplicating the palette:

```css
.vscode-theme-adapter {
  --ui-font-sans: var(--vscode-font-family);
  --ui-font-code: var(--vscode-editor-font-family);
  --ui-code-font-size: var(--vscode-editor-font-size);
  --ui-code-font-weight: var(--vscode-editor-font-weight);
  --ui-fg: var(--vscode-foreground);
  --ui-fg-muted: var(--vscode-descriptionForeground);
  --ui-fg-disabled: var(--vscode-disabledForeground);
  --ui-bg-canvas: var(--vscode-editor-background);
  --ui-bg-pane: var(--vscode-sideBar-background);
  --ui-bg-elevated: var(--vscode-editorWidget-background);
  --ui-bg-input: var(--vscode-input-background);
  --ui-bg-hover: var(--vscode-list-hoverBackground);
  --ui-bg-selection: var(--vscode-list-activeSelectionBackground);
  --ui-border: var(--vscode-widget-border);
  --ui-border-contrast: var(--vscode-contrastBorder);
  --ui-focus: var(--vscode-focusBorder);
  --ui-accent: var(--vscode-button-background);
  --ui-accent-hover: var(--vscode-button-hoverBackground);
  --ui-accent-fg: var(--vscode-button-foreground);
  --ui-link: var(--vscode-textLink-foreground);
  --ui-error: var(--vscode-errorForeground);
  --ui-warning: var(--vscode-editorWarning-foreground);
  --ui-info: var(--vscode-editorInfo-foreground);
  --ui-shadow: var(--vscode-widget-shadow);
}
```

Use solid backgrounds and explicit contrast borders in high-contrast themes. Remove decorative shadows there.

## Classic Dark Modern and Light Modern palettes

Use these representative colors in standalone theme definitions. Keep the literals out of component rules. Prefer host theme variables when they are available.

| Role | Semantic token | Dark Modern | Light Modern |
|---|---|---:|---:|
| Editor canvas | `--ui-bg-canvas` | `#1F1F1F` | `#FFFFFF` |
| Sidebar, panel, title and status chrome | `--ui-bg-pane` | `#181818` | `#F8F8F8` |
| Elevated editor widget | `--ui-bg-elevated` | `#202020` | `#F8F8F8` |
| Input and control background | `--ui-bg-input` | `#313131` | `#FFFFFF` |
| List or tree hover | `--ui-bg-hover` | `#2A2D2E` | `#F2F2F2` |
| Active list selection | `--ui-bg-selection` | `#04395E` | `#E8E8E8` |
| Active selection foreground | `--ui-selection-fg` | `#FFFFFF` | `#000000` |
| Subtle structural border | `--ui-border` | `#2B2B2B` | `#E5E5E5` |
| Input and control border | `--ui-control-border` | `#3C3C3C` | `#CECECE` |
| Primary foreground | `--ui-fg` | `#CCCCCC` | `#3B3B3B` |
| Secondary foreground | `--ui-fg-muted` | `#9D9D9D` | `#616161` |
| Inactive foreground | `--ui-fg-disabled` | `#868686` | `#868686` |
| Input placeholder | `--ui-fg-placeholder` | `#989898` | `#767676` |
| Accent and keyboard focus | `--ui-accent`, `--ui-focus` | `#0078D4` | `#005FB8` |
| Accent hover | `--ui-accent-hover` | `#026EC1` | `#0258A8` |
| Accent foreground | `--ui-accent-fg` | `#FFFFFF` | `#FFFFFF` |
| Link | `--ui-link` | `#4DAAFC` | `#005FB8` |
| Error and deletion | `--ui-error` | `#F85149` | `#F85149` |
| Warning | `--ui-warning` | `#CCA700` | `#BF8803` |
| Information | `--ui-info` | `#59A4F9` | `#0063D3` |
| Success and addition | `--ui-success` | `#2EA043` | `#2EA043` |

Treat this as a compact starter palette, not a license to replace semantic tokens with literals. Add new colors only in the theme layer and name them by role.

## Code rendering

Use the platform's VS Code defaults when the host does not provide font settings:

| Platform | UI font | Editor code font | Default code size | Default code line height |
|---|---|---|---:|---:|
| macOS | `-apple-system, BlinkMacSystemFont, sans-serif` | `Menlo, Monaco, "Courier New", monospace` | `12px` | `18px` |
| Windows | `"Segoe WPC", "Segoe UI", sans-serif` | `Consolas, "Courier New", monospace` | `14px` | `19px` |
| Linux | `system-ui, "Ubuntu", "Droid Sans", sans-serif` | `"Droid Sans Mono", monospace` | `14px` | `19px` |

Use `13px/1.4` for normal workbench UI. Populate `--ui-font-sans`, `--ui-font-code`, `--ui-code-font-size`, and `--ui-code-line-height` from the target platform row. Inside a theme host, map the available font variables instead of freezing platform defaults.

Use **Shiki** for syntax highlighting. Do not maintain syntax colors with custom regular expressions, hand-authored token classes, or a mixed highlighter stack. Dark Modern inherits Dark+ syntax colors and Light Modern inherits Light+ syntax colors, so use Shiki's bundled `dark-plus` and `light-plus` themes. Do not invent `dark-modern` or `light-modern` Shiki IDs.

```sh
pnpm add shiki
```

```ts
import { codeToHtml } from 'shiki'

const html = await codeToHtml(source, {
  lang: language,
  themes: {
    light: 'light-plus',
    dark: 'dark-plus',
  },
  defaultColor: false,
})
```

Bind the generated dual-theme variables to the application theme without `!important`:

```css
.shiki {
  margin: 0;
  overflow: auto;
  padding: var(--ui-space-12) var(--ui-space-16);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-inner);
  font-family: var(--ui-font-code);
  font-size: var(--ui-code-font-size);
  font-weight: var(--ui-code-font-weight, 400);
  line-height: var(--ui-code-line-height);
}

[data-ui-theme='light-modern'] .shiki {
  color: var(--shiki-light);
  background-color: var(--ui-bg-canvas);
}

[data-ui-theme='light-modern'] .shiki span {
  color: var(--shiki-light);
}

[data-ui-theme='dark-modern'] .shiki {
  color: var(--shiki-dark);
  background-color: var(--ui-bg-canvas);
}

[data-ui-theme='dark-modern'] .shiki span {
  color: var(--shiki-dark);
}
```

Generate highlighted HTML at build time or on the server when possible. Reuse one highlighter instance for repeated runtime rendering, load only required languages and themes in performance-sensitive clients, and fall back to escaped plain `<pre><code>` when the language is unknown.

## Native CSS and atomic equivalents

Treat atomic classes as a serialization of CSS, not a separate design system. Adapt names to the selected atomic engine.

| Native CSS | Common atomic expression |
|---|---|
| `display: flex` | `flex` |
| `align-items: center` | `items-center` |
| `justify-content: space-between` | `justify-between` |
| `min-width: 0` | `min-w-0` |
| `flex: 1 1 0%` | `flex-1` |
| `flex-shrink: 0` | `shrink-0` |
| `overflow: hidden` | `overflow-hidden` |
| `white-space: nowrap` | `whitespace-nowrap` |
| `text-overflow: ellipsis` | `text-ellipsis` |
| `border-radius: var(--ui-radius-control)` | `rounded-[var(--ui-radius-control)]` |
| `gap: var(--ui-space-6)` | `gap-[var(--ui-space-6)]` |

Prefer class selectors, kebab-case component names, explicit state attributes/classes, and minimal specificity. Co-locate component styles. Do not add `!important` to escape cascade ownership.
