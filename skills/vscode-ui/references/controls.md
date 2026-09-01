# Controls

Use the native semantic control whenever it already expresses the interaction: a button or equivalent button semantics for an action, `input` or `textarea` for text entry, `select` for an ordinary option list, and radio or checkbox semantics for choices. Add custom presentation only for the compact workbench behaviors described here. Theme every control through semantic roles; do not freeze theme-derived foregrounds, fills, strokes, or focus colors.

## Buttons and action controls

### Primary and secondary buttons

Use a primary button for the leading action in a local action group. Render later actions as secondary; move surplus secondary actions into a trailing **More Actions** menu when the row cannot support them comfortably.

| Metric | Default | Compact |
| --- | ---: | ---: |
| Text | 12 px / 16 px | 11 px / 14 px |
| Padding | 4 px 8 px | 3 px 6 px |
| Border | 1 px | 1 px |
| Radius | 4 px | 4 px |
| Natural height | 26 px | 22 px |

- Center the label in a flex row. A leading icon uses the control icon size and a small text-relative gap; do not detach the icon from its label.
- Primary buttons use `--vscode-button-background`, `--vscode-button-foreground`, and `--vscode-button-hoverBackground`. Secondary buttons use `--vscode-button-secondaryBackground`, `--vscode-button-secondaryForeground`, and `--vscode-button-secondaryHoverBackground`. Use `--vscode-button-border` only when it resolves to a visible stroke.
- Hover changes the fill. Keyboard focus uses the focus border outside the button with a 2 px offset; focused text buttons also retain the hover fill. Pressed state may use the toolbar active fill when the button is presented as a toolbar action.
- Disabled text buttons keep their geometry, block activation, use the default cursor, and reduce the whole control to 40% opacity.
- A busy action replaces its leading icon with a spinner in the same slot. Reserve that slot before work starts so the label and button width do not jump.
- In horizontal dialog rows, buttons size to their content and long labels truncate with an ellipsis. In a vertical dialog stack, buttons fill the row.

### Icon buttons

Use an icon-only button for a familiar, repeatable action in a toolbar or compact trailing-action strip. Use a labeled button when the action is uncommon, consequential, or cannot be recognized from the glyph and its visible context.

- Use a button or equivalent button semantics containing one 16 px icon. The compact action label has 3 px padding, producing a 22 × 22 px visual footprint before any surface-specific row sizing.
- Use `--vscode-icon-foreground` at rest, `--vscode-toolbar-hoverBackground` on hover, and `--vscode-toolbar-activeBackground` while pressed. A high-contrast hover state may add a 1 px dashed inset outline.
- Use the standard 1 px focus border inset by 1 px. Do not remove the visible focus state just because the action is icon-only.
- Disabled toolbar actions remain in place and render at 60% opacity. This is intentionally less faded than a disabled text button.
- Keep the accessible name and hover title aligned with the action label used in menus. Do not put an unlabeled arbitrary glyph beside another unlabeled glyph and rely on position alone.

### Button groups and split buttons

A button bar is an ordered action group. A split button is one primary action plus a menu containing related alternatives. The following geometry describes the verified base/dialog button treatment; do not transfer it to toolbar or menu-driven split actions unchanged.

- A split button is one flex row: the primary segment, a 1 px separator, and a dropdown segment. The primary segment loses its right border and right radii. The dropdown segment loses its left border and left radii, and uses 0 4 px padding. The separator itself has 4 px vertical inset and uses `--vscode-button-separator`.
- Use one outer 4 px silhouette. In dialogs, `focus-within` outlines the whole split group with a 1 px focus border at a 2 px offset; the segments still expose their individual focus targets.
- Use the standard 16 px control icon for the menu affordance. The menu segment exposes expanded/collapsed state and opens the alternatives; the main segment immediately runs the current default action.
- Include the current primary action in the menu by default. If a submenu provides several primary candidates, promote its first item to the main segment and keep the remainder in the dropdown.
- Let the main segment grow and set its label container to `min-width: 0`, no wrapping, and ellipsis overflow. The menu segment and separator never shrink away.
- Arrow keys may move focus through a button bar, wrapping at either end. Horizontal bars use Left/Right; vertical bars use Up/Down.

## Text entry and validation

### Input and textarea

Use a native single-line input for a short value and a native textarea for wrapping or multi-line content. A flexible textarea may auto-grow, but the feature that contains it must set a maximum height.

| Part | Verified default |
| --- | --- |
| Outer shape | 1 px border, 4 px radius |
| Text inset | 4 px 6 px |
| Validation text | 12 px / 17 px |
| Trailing icon | 16 px |
| Trailing action inset | 2 px from the right, 4 px from the top |

- Inherit the local typeface, size, and line height. Single-line text truncates with an ellipsis; textarea content wraps.
- Use `--vscode-input-background`, `--vscode-input-foreground`, `--vscode-input-border`, and `--vscode-input-placeholderForeground`. Do not place an additional inner border on the native field.
- A flexible textarea mirrors its wrapping content to calculate height. Hide the native scrollbar while it is below the configured cap; after the cap, provide the feature's vertical scrolling behavior. Disable manual resize when automatic sizing owns the height.
- Reserve space for trailing actions instead of overlaying them on text. The verified composite places actions only on the trailing edge, with 2 px between adjacent actions, and reduces the editable width by the measured action strip.
- Disabled entry uses the native disabled state. If validation help is open, disabling the field also dismisses that help.

### Search and find controls

A find field is an input plus query-option toggles and trailing actions. Keep the text field as the focus anchor; the option strip is supporting content, not a separate form.

- Use 13 px input text. Place case-sensitive, whole-word, and regular-expression options in a trailing strip; replace can add preserve-case. Each compact option uses the 20 × 20 px toggle box described below and consumes a 22 px slot including its leading margin.
- Measure all visible toggles and trailing actions, then reserve exactly that width as end padding. When controls are hidden, remove the reservation so the text field reclaims the space.
- Left/Right arrows move between option toggles and wrap through the strip. Escape returns focus to the input. Changing an option with the pointer also returns focus to the input.
- Keep match count and navigation actions after the query options. A floating editor find surface is 419 px wide by default with a 34 px shell and a minimum 25 px input. Its reduced form hides the match count; a narrow form caps the shell at 257 px; a collapsed form caps it at 170 px and hides previous, next, replace, replace-all, and inline query-option controls. The close action remains available.
- A sidebar search textarea can start at 26 px high and auto-grow to 134 px. Keep its query controls aligned to the top rather than vertically centering them as the field grows.

### Validation message

Validation is a state of the field, not a second unrelated alert. Support one current message with information, warning, or error severity.

- Replace the normal 1 px input border with the severity border. Use the matching semantic foreground, background, and border triplet for information, warning, or error; never derive a severity by tinting the ordinary input colors.
- A severity border takes precedence over the ordinary focus outline. Focus may reveal the explanatory message, but it must not obscure or replace the severity stroke.
- Place the explanation directly below the field, aligned to its total outer width. Use 0.4 em padding, 12 px / 17 px text, wrapping content, and a −1 px top margin so the message and field meet without a double seam.
- Show the explanatory popover while the invalid field is focused, or when the containing flow explicitly forces the message open. Blur hides the popover but preserves the field's severity border. Refocus restores the message. Clearing validation restores the ordinary input border.
- Set `aria-invalid="true"` while validation is active; do not communicate severity through border color alone.

## Choice controls

### Select and dropdown

Use a native `select` for an ordinary labeled list. Use the custom popup treatment only when options need a secondary detail line, a trailing decorator, separators, hidden disabled placeholders, or consistent keyboard-managed popup behavior that the native menu cannot present.

- A compact action-row select has a minimum width of 100 px, a minimum height of 18 px, and 2 px 23 px 2 px 8 px padding. A compact native select on macOS uses 11 px text and a minimum height of 24 px.
- Theme the closed field with `--vscode-dropdown-background`, `--vscode-dropdown-foreground`, and `--vscode-dropdown-border`. Its popup surface uses the dropdown list background, large surface radius, and large widget shadow.
- Custom popup rows are 22 px high. Primary option text, secondary detail, and trailing decorators stay on one line and ellipsize. Give the row 6 px leading inset and keep a right decorator 10 px from the edge. Secondary detail uses 70% opacity relative to its foreground.
- Make the popup at least as wide as the closed field and wide enough for the longest option that fits the available viewport. Prefer opening below. If fewer than three complete rows fit below and more fit above, open above. Clip to complete 22 px rows rather than exposing partial options.
- Opening focuses the selected option. Arrow, Page, Home, End, and first-character navigation skip disabled items. Pointer hover also ignores disabled items. Enter commits; Escape cancels and restores the closed value.
- A disabled placeholder may remain visible in the closed field while being omitted from the open list. Cancelling the popup restores that placeholder instead of silently selecting the first enabled item.

### Checkbox and compact option toggle

Use a native checkbox for a durable Boolean or mixed state with a visible label. Use the compact icon toggle only inside find fields and similarly dense option strips where the icon's meaning is already established.

**Checkbox**

- Use an 18 × 18 px box, 1 px border, 3 px radius, a 16 px check or mixed-state dash, and 9 px space before the label.
- Use the checkbox foreground, background, and border roles. Disabled checkboxes use their dedicated disabled foreground and background roles rather than opacity alone.
- Preserve the same box in unchecked, checked, and mixed states so surrounding text never shifts. The label and any description can activate the same checkbox when they form one setting row.

**Compact option toggle**

- Use a 20 × 20 px box with 1 px transparent border, 1 px padding, 3 px radius, a 16 px icon, and 2 px leading margin. Allocate 22 px per toggle in a row.
- Unchecked state inherits the local foreground. Hover uses `--vscode-inputOption-hoverBackground`. Checked state uses the active option background, foreground, and border roles.
- Disabled compact toggles use 40% opacity, the default cursor, and no pointer activation. Checked state remains visually legible under the disabled treatment.
- This pattern is a checked option, not an on/off switch. Do not introduce a sliding switch visual into settings rows that otherwise use checkboxes.

### Segmented text choice

Use a segmented text choice for a small, stable set of mutually exclusive options that benefits from immediate switching. Keep ordinary radio inputs and their labels as the semantic choice model; use a standard radio list when labels are long, explanations are needed, or options may wrap.

- Join the option labels into one horizontal row. Interior segments have square corners; the first and last segments receive 3 px outer radii.
- Use 0.9 em text, 1 em line height, and 0.5 em horizontal padding for the compact base treatment.
- Active and inactive segments use separate foreground, background, and border roles. Inactive hover changes the fill. A high-contrast hover state may add a 1 px dashed outline.
- Remove duplicate interior seams: each inactive segment except the last drops its right border, and the segment immediately after the active item drops its left border. The active segment keeps both borders.
- Default to the explicitly selected item; if none is provided, activate the first item. Ignore activation of the already-selected segment and of disabled segments.

### Segmented icon action rail

This is a limited action pattern, not a generic choice control. Use it for two adjacent, related icon actions in one mode when availability may collapse the rail to a single action. Use segmented radios for mutually exclusive choices.

- The default housing is 56 × 24 px with a 1 px input/widget border and 8 px radius. Two button cells are 27 px wide and fill the height. Use one icon per cell and the standard icon foreground.
- Hover fills the entire cell with the toolbar hover background and uses a 7 px inner radius. Visible focus uses the 1 px focus border inset by 1 px.
- When only one cell remains, expand it to 54 px and make the housing border transparent. When the entire rail is unavailable, collapse width to 0, fade opacity to 0, disable pointer events, and then hide visibility.
- The standard collapse uses a 300 ms width transition and a 220 ms opacity transition. Remove those transitions when reduced motion is requested.

## Compact status labels

### Keybinding label

Render a shortcut as a sequence of keycaps, using `kbd` elements when the label is ordinary document content.

- Each keycap is an inline-flex box with a 1 px border, 3 px radius, at least 12 px width, 11 px text, and 3 px 5 px padding. Adjacent keycaps have 2 px horizontal margins; remove the outer margin from the first and last keycap.
- Render modifiers and the terminal key as separate keycaps using platform-appropriate labels. A chord separator consumes 6 px; separate multi-chord sequences with a space.
- Use the keybinding-label foreground, background, border, and bottom-border roles. The optional bottom edge may use an inset widget-shadow treatment to give the keycap its pressed-key silhouette.

### Count badge

Use a count badge as compact supporting metadata beside a label, such as result totals. It must not compete with row actions when space is constrained.

| Variant | Padding | Radius | Text | Minimum |
| --- | ---: | ---: | ---: | ---: |
| Numeric | 3 px 5 px | 11 px | 11 px / 11 px | 18 × 18 px |
| Long text | 2 px 3 px | 2 px | Inherit | Content-sized |

- Center numeric content and use regular weight. The pill radius accommodates one-, two-, and three-digit counts without changing the height.
- Use `--vscode-badge-background` and `--vscode-badge-foreground`. Add the contrast border only when the active theme supplies it.
- Use the long-text variant for a short state word, not for a sentence. Give the full value to the surrounding row's title when the row can truncate or hide it.
- In narrow result rows, actions and the primary label take precedence. Hide the badge on row hover or keyboard focus when the action strip occupies its space.
