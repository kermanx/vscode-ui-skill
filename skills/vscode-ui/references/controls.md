# Controls

Start with the native semantic control: a button for an action, `input` or `textarea` for text entry, `select` for an ordinary option list, and checkbox or radio semantics for choices. Add custom presentation only for the compact workbench behaviors below. Use semantic theme roles for colors; do not hard-code theme-derived foregrounds, fills, borders, or focus colors.

## Buttons and action controls

### Primary and secondary buttons

In a workbench button bar, render the first primary action as primary and later primary actions as secondary. Put separately supplied secondary actions in a trailing **More Actions** menu.

| Metric | Default | Compact |
| --- | ---: | ---: |
| Text | 12 px / 16 px | 11 px / 14 px |
| Padding | 4 px 8 px | 3 px 6 px |
| Border | 1 px | 1 px |
| Radius | 4 px | 4 px |
| Natural height | 26 px | 22 px |

- Center the label in a flex row. Keep a leading icon in the same row and use a 4 px gap before the label.
- Primary buttons use `--vscode-button-background`, `--vscode-button-foreground`, `--vscode-button-hoverBackground`, and the optional `--vscode-button-border`. Secondary buttons use `--vscode-button-secondaryBackground`, `--vscode-button-secondaryForeground`, `--vscode-button-secondaryHoverBackground`, and the optional `--vscode-button-secondaryBorder`.
- Hover changes the fill. Keyboard focus uses a 1 px focus outline with a 2 px outer offset; focused text buttons retain the hover fill.
- Disabled buttons keep their geometry, block activation, use the default cursor, and render at 40% opacity.
- A busy action may replace its leading icon with an equally sized spinner. This preserves width when an icon already occupied that slot; a button with no previous leading slot grows when the spinner appears.
- In a horizontal dialog row, buttons size to content and truncate long labels. In a vertical dialog stack, buttons fill the row.

### Icon buttons

Use icon-only actions in compact toolbars when the glyph and its local context identify a familiar action. Otherwise show a label.

- Use a button or equivalent button semantics containing one 16 px icon. The base action label uses 3 px padding and a 6 px radius, producing a 22 × 22 px footprint before surface-specific row sizing.
- Use `--vscode-icon-foreground` at rest, `--vscode-toolbar-hoverBackground` on hover, and `--vscode-toolbar-activeBackground` for the active action state.
- Use a 1 px focus outline inset by 1 px. High-contrast hover may add a 1 px dashed inset outline.
- Disabled icon actions stay in place and render at 60% opacity.
- Keep the accessible name and hover title consistent with the same action in menus.

### Button bars and split buttons

A button bar is an ordered action group. A split button combines one immediate action with a menu of related alternatives.

- Build a split button as one flex row: the primary segment, a 1 px separator, and the dropdown segment. The primary segment has no right border and uses `4px 0 0 4px` radii. The dropdown segment has no left border, uses `0 4px` padding, and uses `0 4px 4px 0` radii. Give the separator 4 px vertical padding and `--vscode-button-separator`.
- In dialogs, `focus-within` outlines the complete 4 px-radius group with a 1 px focus border at a 2 px outer offset. The segments remain separate focus targets.
- Use a 16 px dropdown icon. The main segment runs the current default action; the menu segment exposes expanded state and opens the alternatives.
- Include the current primary action in the menu by default. When a submenu supplies several primary candidates, promote the first to the main segment and place the rest in the menu.
- Arrow keys move focus through a button bar and wrap at both ends: Left/Right for horizontal bars and Up/Down for vertical bars.

## Text entry and validation

### Input and textarea

Use a single-line input for a short value and a textarea for wrapping or multi-line content. A flexible textarea may auto-grow, but its containing feature must define a maximum height.

| Part | Default |
| --- | --- |
| Outer shape | 1 px border, 4 px radius |
| Text inset | 4 px 6 px |
| Validation text | 12 px / 17 px |
| Trailing icon | 16 px |
| Trailing action position | 2 px from the right, 4 px from the top |

- Inherit the local typeface, size, and line height. Single-line text ellipsizes; textarea content wraps.
- Use `--vscode-input-background`, `--vscode-input-foreground`, `--vscode-input-border`, and `--vscode-input-placeholderForeground`. Keep the editable element borderless inside the 1 px outer control.
- A flexible textarea mirrors its wrapping content to calculate height. Hide its native scrollbar below the configured cap; after the cap, let the containing scrollable element handle vertical scrolling. Disable manual resize when automatic sizing owns the height.
- Put input actions on the trailing edge. Use 2 px between actions and subtract the measured action strip from the editable width so text never sits beneath the icons.
- Disabled input uses the native disabled state and dismisses any open validation message.

### Search and find controls

A find control combines an input with query-option toggles and trailing actions. Keep the text field as the focus anchor.

- Use 13 px input text. Put match-case, whole-word, and regular-expression options in a trailing strip; replacement can add preserve-case. Each option uses the 20 × 20 px toggle below and occupies 22 px including its leading margin.
- Measure visible toggles and input actions, then reserve their total width at the end of the field. Remove the reservation when controls are hidden.
- Left/Right moves between option toggles and wraps. Escape returns focus to the input. Pointer activation of an option also returns focus to the input.
- The editor find widget starts at 419 px wide and 34 px high; its input has a 25 px minimum height. The reduced form hides the match count. The narrow form caps width at 257 px. The collapsed form caps width at 170 px and hides previous, next, replace, replace-all, and inline query options; close remains available.
- The Search sidebar textarea starts at 26 px high and grows to at most 134 px. Keep its query controls pinned 3 px from the top as the field grows.

### Validation message

Validation is a state of its field. Show one current information, warning, or error message.

- Replace the ordinary 1 px input border with the matching validation border. Use the corresponding semantic foreground, background, and border triplet rather than deriving a severity tint.
- The severity border takes precedence over the ordinary focus outline.
- Anchor the explanation to the field's outer width. Use 0.4 em padding, 12 px / 17 px text, wrapping content, and a −1 px top margin so the message meets the field without a double seam.
- Show the explanation while the invalid field is focused or while its flow explicitly forces the message open. Blur hides the explanation but preserves the severity border; refocus restores it. Clearing validation restores the ordinary input border.
- Set `aria-invalid="true"` while validation is active.

## Choice controls

### Select and dropdown

Use a native `select` for an ordinary labeled list. Use the custom popup when options require detail text, a trailing decorator, separators, hidden disabled placeholders, or the managed keyboard behavior below.

- The closed select uses a 4 px radius. In an action row it has a 100 px minimum width, 18 px minimum height, and `2px 23px 2px 8px` padding. On macOS, the compact action-row select uses 11 px text and a 24 px minimum height.
- Theme the closed field with `--vscode-dropdown-background`, `--vscode-dropdown-foreground`, and `--vscode-dropdown-border`. The custom popup uses the dropdown-list background, an 8 px radius, and `0 0 12px rgba(0, 0, 0, 0.14)` shadow.
- Popup rows are 22 px high. Keep primary text, detail, and trailing decorators on one line and ellipsize them. Use 6 px leading text inset and keep a right decorator 10 px from the edge. Render detail at 70% opacity.
- Make the popup at least as wide as the closed field and wide enough for the longest option that fits the available viewport. Open below by default. If the list cannot fit there, fewer than three complete rows fit below, and more fit above, open above. Clip to complete 22 px rows.
- Opening focuses the selected option. Arrow, Page, Home, End, and first-character navigation skip disabled options; pointer hover also ignores them. Enter or Tab commits. Escape cancels and restores the value held when the popup opened.
- A disabled placeholder may remain selected in the closed field while being omitted from the popup. Escape restores that placeholder even if opening temporarily focused the first visible option.

### Checkbox and compact option toggle

Use a checkbox for a durable Boolean or mixed state with a visible label. Use the compact icon toggle only in find fields and similarly dense option strips where the icon meaning is established.

**Checkbox**

- Use an 18 × 18 px box, a 1 px border, a 3 px radius, a 16 px check or mixed-state dash, and 9 px between box and label.
- Use the checkbox foreground, background, and border roles. Disabled checkboxes use their dedicated disabled foreground and background roles rather than opacity alone.
- Preserve the same box in unchecked, checked, and mixed states so surrounding content does not shift.

**Compact option toggle**

- Use a 20 × 20 px box with a 1 px transparent border, 1 px padding, 3 px radius, a 16 px icon, and 2 px leading margin. Allocate 22 px per toggle.
- Unchecked state inherits the local foreground. Hover uses `--vscode-inputOption-hoverBackground`. Checked state uses the active-option background, foreground, and border roles.
- Disabled toggles use 40% opacity, the default cursor, and no pointer activation. Preserve checked-state visibility under the disabled treatment.
- This is a checked option, not a sliding switch.

### Segmented text choice

Use a segmented text choice for a small, stable, mutually exclusive set. Use an ordinary radio list when labels are long, descriptions are needed, or options wrap.

- Join option labels into one horizontal row. Interior segments are square; the first and last receive 3 px outer radii.
- Use 0.9 em text, 1 em line height, and 0.5 em horizontal padding.
- Active and inactive segments use separate foreground, background, and border roles. Inactive hover changes the fill; high-contrast hover may add a 1 px dashed inset outline.
- Remove duplicate interior seams: every inactive segment except the last drops its right border, and the segment immediately after the active item drops its left border. The active segment keeps both borders.
- Select the explicitly active item, or the first item when none is active. Ignore activation of the current or disabled item.

### Segmented icon control

Use this control only for adjacent related icon actions whose availability can change. Use segmented radios for mutually exclusive choices.

- The housing is 56 × 24 px with a 1 px input/widget border and an 8 px radius. Each of two cells is 27 px wide, fills the height, and uses one icon with `--vscode-icon-foreground`.
- Hover fills the complete cell with `--vscode-toolbar-hoverBackground` and a 7 px radius. Visible focus uses a 1 px focus outline inset by 1 px.
- When one cell is present, expand it to 54 px and make the housing border transparent.
- Collapse an absent cell to zero width and zero opacity, disable pointer events, then hide visibility after the transition. Use a 300 ms width transition and a 220 ms opacity transition; remove transitions for reduced motion.

## Compact status labels

### Keybinding label

Render each key as a separate keycap; use `kbd` elements when the shortcut appears in ordinary document content.

- Each keycap is inline-flex with a 1 px border, 3 px radius, 12 px minimum width, 11 px text, `3px 5px` padding, and 2 px horizontal margins. Remove the outer margin from the first and last keycap.
- Render modifiers and the terminal key as separate keycaps with platform-appropriate labels. A chord separator occupies 6 px.
- Use the keybinding-label foreground, background, border, and bottom-border roles. When `--vscode-widget-shadow` is present, add it as an inset `0 -1px 0` shadow.

### Count badge

Use a count badge as compact supporting metadata beside a label.

| Variant | Padding | Radius | Text | Minimum |
| --- | ---: | ---: | ---: | ---: |
| Numeric | 3 px 5 px | 11 px | 11 px / 11 px | 18 × 18 px |
| Long text | 2 px 3 px | 2 px | Inherit | Content-sized |

- Center numeric content and use regular weight.
- Use `--vscode-badge-background` and `--vscode-badge-foreground`. Add `--vscode-contrastBorder` only when it resolves to a visible border.
- Use the long-text variant for a short state label, not a sentence.
- In a narrow Search result row, hide the badge on row hover or focus when the action strip needs the same space.
