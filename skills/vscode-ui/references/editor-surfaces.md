# Editor surfaces

Use this reference for code editors, editor widgets, diffs, code blocks, and
terminal-like content. Use the code typography and syntax-color rule in
[foundations](./foundations.md), the editor-tab contract in
[navigation and actions](./navigation-actions.md), and the shared focus and
selection rules in [interaction states](./interaction-states.md).

## Editor group and canvas

Classic editor groups are flat adjoining regions, not rounded cards. Separate
multiple groups with the editor-group separator role. Do not wrap tabs,
breadcrumbs, and the canvas in an outer border or radius.

```text
editor group
├─ tabs and optional breadcrumbs
└─ editor canvas
   ├─ glyph margin
   ├─ line numbers
   ├─ line decorations
   ├─ code viewport
   ├─ minimap
   └─ overview ruler and scrollbars
```

Keep the scrollable editor layers inside the canvas. Let anchored widgets such
as suggest, parameter hints, hover, and rename escape the editor bounds when
needed, but constrain them to the surrounding window.

### Gutter and line state

Lay gutter lanes out as glyph margin, line numbers, line decorations, then
code. Use a `10px` line-decoration lane. Reserve at least five character cells
for line numbers, right-align them, and use tabular numerals. Give ordinary,
active, and dimmed line numbers separate foreground roles.

The gutter has its own background role. Keep separate roles for the focused
current-line fill, inactive current-line fill, and optional current-line
border. A current-line highlight spans the line; it is not a list-row fill.

Use the active selection role while the editor owns focus and the inactive
selection role otherwise. Keep selection highlights, word highlights, and
symbol highlights weaker than the primary selection. Rounded joins between
adjacent lines are the default selection rendering.

Attach diagnostics to text ranges rather than filling the row:

| Severity | Range treatment |
|---|---|
| Error | `4px` double underline in the error role |
| Warning | `4px` double underline in the warning role |
| Information | `4px` double underline in the information role |
| Hint | `2px` dotted underline in the hint role |
| Unnecessary | `2px` dashed underline in the unnecessary-code role |

Repeat error, warning, and information locations in the minimap or overview
ruler only as secondary locators.

### Minimap, overview ruler, and scrolling

Place the minimap at the right edge by default. Its default mode is
proportional, renders character shapes at scale `1`, samples at most `120`
columns, and reveals its viewport slider on pointer intent.

| Minimap mode | Behavior |
|---|---|
| Proportional | Matches the editor contents and may scroll |
| Fill | Stretches or shrinks to fill the editor height without scrolling |
| Fit | Shrinks only as needed to stay within the editor height |

The overview ruler uses a border role and supports three marker lanes. Keep
selection, find, diagnostics, diff changes, and cursor markers semantically
distinct. Use a `14px` vertical editor scrollbar and a `12px` horizontal editor
scrollbar; these differ from the thinner workbench scrollbar.

## Editor tabs: surface delta

Follow [navigation and actions](./navigation-actions.md) for tab geometry and
states. Tabs and breadcrumbs sit directly above the canvas without an enclosing
card. Use the focused and unfocused editor-tab roles for the active document in
each group. Do not dim an inactive group's canvas as a whole.

When a close or status action is revealed over a tab label, give its action
area the matching tab background so label text cannot show through it.

## Find widget

Place find at the canvas top-right. Its first row contains the query, query
options, match count, previous and next actions, and close; replace expands as
a second row.

The initial surface is `419px` wide and `34px` high, with a `1px` widget border,
`8px` radius, `0 0 12px rgba(0, 0, 0, 0.14)` shadow, `4px` top offset, and
`0 4px 0 9px` outer padding. Use `13px` query text and a minimum `25px`
input/action row.

Opening find slides it into view over `200ms`; remove the transition when
reduced motion is requested. Reserve space above the first code line while the
widget is open by default.

Adapt it in this order as width decreases:

| State | Maximum width | Change |
|---|---:|---|
| Normal | `419px` | Full anatomy |
| Reduced | available width | Hide match count |
| Narrow | `257px` | Keep reduced anatomy |
| Collapsed | `170px` | Also hide previous, next, replace, replace-all, and query options |

Keep close visible. Let the query flex and clip; do not scale the icons. A
replace-enabled widget grows to a second `25px` row.

Give the current match its own fill and `2px` border. Use separate roles for
other matches and the find scope. Use the error foreground only on the match
count when there are no results.

## Suggest widget

Anchor suggestions to the insertion point. Place the list below when it fits
and above otherwise. Keep it inside the window and scroll the list when space
is constrained.

The default surface is `430px` wide, has an `8px` radius, `1px` suggest border,
and `0 2px 8px` shadow in the widget-shadow color. It starts at twelve editor
line rows and never shrinks below `220px` wide. Loading and empty states collapse
to one row and half the default width.

The optional status row is hidden by default. When enabled, make it one item row
high with `0 4px` padding and a `1px` top border.

Each suggestion row contains a `16px` kind icon, label and signature, optional
qualifier and detail, then disclosure. Use `2px` leading content padding and
`10px` trailing padding. Truncate the main line. Qualifiers and details use
`85%` text; the trailing detail lane may consume at most `70%` of the row. Give
a focused suggestion independent selected foreground, background, icon,
outline, and match roles.

Documentation may open as an attached second surface. Start it at `330px` wide
and never below `220px`. Try inline end, inline start, then below or above. Use
the first placement that fits; otherwise choose the placement with the most
usable area and scroll its contents. Give it the same `8px` radius and suggest
roles, but no independent shadow.

## Parameter hints

Parameter hints use the hover palette but remain a distinct anchored widget.
Use an `8px` radius, `1px` hover-widget border,
`0 0 12px rgba(0, 0, 0, 0.14)` shadow, `1.5em` line height, and a `440px`
maximum width. Try above the call site, then below. Wrap long documentation and
scroll when its content reaches the larger of one quarter of the editor height
or `250px`.

Use `4px 5px` padding around the signature and `0 10px 0 5px` around
documentation. Separate them with a `1px` reduced-emphasis rule. Highlight the
active parameter and make it bold.

For multiple signatures, add a `22px` navigation rail with `16px` previous and
next actions and a `12px` count line. Cycle from the last signature to the first
by default.

## Hover

Anchor hover to the inspected range. Use hover background, foreground, border,
highlight, and optional status-bar roles. The surface has an `8px` radius,
`1px` border, `0 0 12px rgba(0, 0, 0, 0.14)` shadow, `150px` minimum width, and
a minimum height of one editor line plus `8px`.

Prefer above by default and fall below when needed. Constrain both axes to the
available window; allow the contents to scroll and the widget to resize.

Hover opens after `300ms`, stays open while the pointer moves into it, and uses
a `300ms` hiding delay. For a copyable row, place a `16px` action icon `4px`
from the top and end edges with `2px 4px` padding. Hide it until the row is
hovered or contains focus. Put optional actions in the hover status area
instead of a second popup.

Use the text-code-block background for inline code. Wrap long documentation;
retain horizontal overflow where preserved formatting requires it.

## Peek surface

Peek is an embedded editor zone, not a popup. Give it a `1px` top frame border
and `0 0 12px rgba(0, 0, 0, 0.14)` shadow, then split its body into results and
preview. Start at `30%` results and `70%` preview with a height of eighteen
editor lines. Make the divider resizable. Keep at least `100px` for results and
`200px` for preview.

The header is `1.2` times the editor line height. Use a `13px` title, `20px`
leading inset, trailing actions, and truncation for title and metadata. Results
use `23px` rows and receive initial focus. Give selected results, matched text,
preview background, preview gutter, preview match, and frame separate roles.

Keep peek clipped to the editor zone and let results and preview scroll
independently. Do not round it like a floating widget.

## Rename

Anchor rename to the symbol range. Use the editor-widget background, an
optional `1px` widget border, `4px` radius, and
`0 0 8px 2px` shadow in the widget-shadow color. Use `3px` padding around the
input group and a `200px` minimum width.

Keep the editor font in the input. Size it to at least twenty character cells
or `1.1` times the symbol length, whichever is larger. Prefer below when there
is room for more than six candidate rows; otherwise prefer above.

Each candidate row is one editor line plus `4px`. Show at most seven rows and
scroll the rest. Preview mode adds `4px 4px 0` outer padding and an `80%` label;
do not reserve that space otherwise.

Keep focus in the rename input and append candidates to the same anchored
surface. An empty, whitespace-only, or unchanged value cancels.

## Inline completions and edits

Present a completion first as ghost text in the code flow. Use dedicated ghost
foreground, background, and border roles; italic is the default treatment.
Syntax-colored ghost text uses `0.7` opacity. A short suggestion may use a
dotted underline; replaced text uses an underline.

Show the inline-completion toolbar on ghost-text hover by default. A bordered
toolbar uses hover roles, `4px` padding, and a `1px` border. Keep previous,
next, count, and related actions together.

For edits, choose the smallest active presentation that explains the change:
inline insertion or deletion, word replacement, line replacement, then
side-by-side when enough width is available. Use separate original and modified
line and character roles. Deletions use strikethrough. Empty inserted or
removed ranges remain locatable with a `3px` vertical marker. Use a directional
hint for a long-distance edit instead of filling every intervening line.

## Diff surface

Use side-by-side diff by default with a resizable `50%` split. When the surface
is `900px` wide or narrower, switch to inline diff by default. Keep the original
side read-only unless editing it is an explicit feature.

Separate inserted and removed line fills from inserted and removed character
fills. Keep gutter marks, overview marks, and moved-block borders independent.
Inline deletions use strikethrough; an empty character change uses a `3px`
vertical marker.

Separate side-by-side editors with a `1px` diff border and directional edge
shadows. Use an `8px × 8px` diagonal pattern for alignment gaps so blank space
is not mistaken for unchanged code. Show the overview ruler by default.

Unchanged-region collapsing is off by default. When enabled, keep three context
lines, require at least three hidden lines, and reveal twenty lines per action.
Use a `24px` control in normal mode and an `11px` control in compact mode.

## Code blocks

Use `pre > code` for a simple read-only snippet and apply the syntax-color rule
from foundations. Preserve whitespace and make the block, not the `code` child,
own clipping and overflow.

For an editor-backed interactive code block, use a `1px` semantic border, `6px`
radius, and `16px` space below it. Change the border to the focus role when its
editor owns focus.

An actionable block may overlay a toolbar on its top edge. Use a `26px` toolbar
offset `-15px`, cap it at `70%` of the block width, and use `24px` actions. Keep
it hidden and non-interactive until the block is hovered, focused, or contains
focus.

## Terminal-like surface

Use this treatment for a terminal or static terminal-shaped developer surface.
Use terminal background and foreground roles instead of assuming black. In a
panel, terminal background falls back to the panel background; in an editor, it
falls back to the editor-pane background.

Reserve a `20px` start gutter for command or status decorations. Separate split
panes with a `1px` terminal-border role and clip each pane independently.

Use the editor monospace family unless a terminal family is configured. Terminal
text defaults to `12px` on macOS and `14px` elsewhere, with `0` letter spacing.
Use a line-height multiplier of `1`, or `1.1` on Linux. Preserve preformatted
spacing inside an overflow viewport.

Keep active and inactive terminal selection backgrounds distinct. The focused
cursor is a non-blinking block by default; the inactive cursor is an outline.
Use separate cursor foreground and cursor-background roles so the character
beneath a block cursor remains legible.

Map ordinary and bright black, red, green, yellow, blue, magenta, cyan, and
white to sixteen terminal roles. Keep command success, command error, current
find, other find matches, hover highlight, overview cursor, and overview find
markers outside that ANSI palette. Find backgrounds remain translucent so text
stays legible.

## Theme-role minimum

Keep these role groups independent:

| Group | Roles that must not collapse |
|---|---|
| Canvas | Foreground, background, gutter, line numbers, active line number, focused current line, inactive current line |
| Selection and find | Active selection, inactive selection, current find match, other matches, find scope |
| Widgets | Widget foreground, background, border, resize border, shadow; suggest selection and match; hover status |
| Inline and diff | Ghost text; inserted and removed line and character fills; gutter and overview markers; moved-block border |
| Terminal | Foreground, background, active and inactive selection, cursor foreground and background, split border, sixteen ANSI roles |

When explicit high-contrast support is requested, use the component's contrast
roles instead of flattening editor, widget, hover, suggest, diff, and terminal
surfaces into one rectangle.
