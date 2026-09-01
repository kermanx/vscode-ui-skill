# Editor surfaces

Use this reference for the visual shell around code and terminal-like content.
It does not specify text layout, tokenization, editor behavior, or terminal
emulation. Use the code typography and syntax-color rule in
[foundations](./foundations.md), the editor-tab contract in
[navigation and actions](./navigation-actions.md), and the shared focus,
selection, disabled, and reveal rules in
[interaction states](./interaction-states.md).

## Editor frame and canvas

Treat one editor group as one framed surface:

```text
editor frame
├─ editor tabs and optional breadcrumbs
└─ editor canvas
   ├─ gutter: glyphs, line numbers, decorations
   ├─ code viewport
   ├─ minimap
   └─ overview ruler and scrollbar
```

The Modern frame encloses the title area and canvas together. Use the editor
background, a `1px` editor-border role, the Outer radius,
`box-sizing: border-box`, and `overflow: hidden`. Let that outer frame own the
corners; do not independently round the title strip and canvas. The frame
replaces a leading-edge separator shadow rather than stacking another separator
beside the border.

Keep the scrollable editor layers positioned and clipped inside the canvas.
Their foreground and background are the base layer; line, selection,
diagnostic, find, inline-completion, and diff decoration roles sit above it.
Keep the editor root able to host content and overlay widgets that explicitly
allow editor overflow. Suggest, parameter-hint, rename, and hover widgets may
extend beyond the canvas while remaining constrained by the surrounding
window or workbench surface.

### Gutter and line state

Lay gutter lanes out from left to right as glyph margin, line numbers, line
decorations, then code. A standard line-decoration lane is `10px`. Reserve at
least five character cells for line numbers, right-align them, and use tabular
numerals. Give ordinary, active, and dimmed line numbers distinct foreground
roles; do not signal the current line by changing alignment or weight.

The gutter has its own background role. The current-line treatment defaults to
the code line, but may instead cover the gutter or both. Keep separate roles for
the focused current-line fill, the inactive current-line fill, and an optional
current-line border. The highlight remains a line-wide layer rather than a
selected row component.

Use the active-selection background while the editor owns focus and the
inactive-selection background otherwise. Keep related selection highlights,
word highlights, and symbol highlights visually weaker than the primary
selection. Rounded multi-line selection joins are the normal treatment. High
contrast removes those rounded joins but keeps a solid semantic selection fill;
do not reduce the primary selection to an outline-only treatment.

Diagnostic marks stay attached to the text range:

| Severity | Range treatment |
|---|---|
| Error | `4px` double underline/border plus the error role |
| Warning | `4px` double underline/border plus the warning role |
| Information | `4px` double underline/border plus the information role |
| Hint | `2px` dotted underline/border |
| Unnecessary | `2px` dashed underline/border |

Do not replace those range treatments with a row fill. Overview-ruler and
minimap markers repeat information, warning, and error severities as secondary
locators.

### Minimap, overview ruler, and scrolling

The minimap is a secondary locator at the right edge by default. Its normal
mode is proportional, renders character shapes, uses scale `1`, and samples at
most `120` columns. Its viewport slider appears on pointer intent by default and
stays present while active.

Use the minimap size mode deliberately:

| Mode | Behavior |
|---|---|
| Proportional | Mirrors document proportion and may have its own scroll range |
| Fill | Stretches or shrinks to the available height and has no independent scroll |
| Fit | Shrinks to fit and has no independent scroll |

The overview ruler sits at the outer code edge, has a border role, and supports
three marker lanes. Map selection, find, diagnostics, diff changes, and cursor
location to separate semantic marker roles rather than one accent. When showing
full editor chrome, reserve a `14px` vertical scrollbar and a `12px` horizontal
scrollbar; these are editor-native metrics, not the thin workbench scrollbar.

## Editor tabs: surface delta

Follow the complete tab geometry and state model in
[navigation and actions](./navigation-actions.md). The editor-specific delta is
the ownership boundary: tabs, breadcrumbs, and the canvas share the editor
frame, background, border, and clipping. Modern inactive tab fills are
transparent, so the editor surface remains the visible base; active and hover
fills use their dedicated editor-tab roles. Use opaque action backgrounds over
tab labels so text cannot show through a revealed close or status action.

An inactive editor group keeps its active document and selection facts, but
uses the unfocused editor-tab palette and inactive editor-selection role. Do not
dim the canvas as a whole.

## Find widget

Place find at the canvas top-right. Its primary row contains the query, query
options, match count, previous/next actions, and close; the replace row expands
below it. The normal surface is `419px` wide and `34px` high, with a `1px`
border, Outer radius, Large shadow, `4px` top offset, and `0 4px 0 9px` outer
padding. Use a `13px` query and a minimum `25px` input/control row.

Opening find slides it into view over `200ms`; reduced-motion mode removes that
transition. Reserve space above the first code line while find is open so the
widget does not cover the start of the document.

Reduce the widget in stages as the canvas narrows:

| State | Maximum width | Removed first |
|---|---:|---|
| Normal | `419px` | Nothing |
| Reduced | available width | Match count |
| Narrow | `257px` | Keep the reduced anatomy |
| Collapsed | `170px` | Previous, next, replace, replace-all, and query-option controls |

Close remains available in every visible state. Let the query flex and clip
inside the remaining width; do not scale icons. A replace-enabled widget grows
to a second `25px` row instead of compressing both inputs into one line.

Give the current match its own fill and a `2px` border. Other matches and the
find scope use separate translucent roles. A no-results match count uses the
error foreground without recoloring the whole widget.

## Suggest widget

Anchor suggestions to the insertion point. Place the list below when it fits;
otherwise place it above. Keep the surface within the available window bounds
and make the list scroll when space is constrained.

The normal suggest surface is `430px` wide, has an Outer radius, `1px` border,
and `0 2px 8px` shadow. Its list starts at twelve editor-line rows and never
shrinks below `220px` wide. A loading or empty message collapses to one row and
half the normal width. The optional status row is hidden by default; when
enabled, it occupies one item row, uses `0 4px` padding, and adds a `1px` top
border.

Each row contains a `16px` kind icon, label/signature, optional qualifier and
detail, then disclosure. Use `2px` leading content padding and `10px` trailing
padding. Truncate the main line. Qualifiers and details use `85%` text; the
trailing detail lane may consume at most `70%` of the row. A focused item uses
the selected foreground, background, icon, focus-outline, and focused-match
roles; an unfocused match uses the ordinary match role.

Documentation may open as a second surface. Start it at `330px` wide, never
below `220px`, and try the inline end side, inline start side, then below or
above. Use the first placement that fits; otherwise choose the placement with
the most usable area and scroll the documentation. Keep its border, background,
and foreground in the suggest family. The documentation surface does not add
an independent shadow; the shadow belongs to the main suggest widget.

## Parameter hints

Parameter hints share the hover palette but remain a distinct anchored widget.
Use an Outer radius, `1px` border, Large shadow, `1.5em` line height, and a
`440px` maximum width. Try above the call site first, then below. Wrap and
break long documentation, and scroll once content reaches the larger of one
quarter of the editor height or `250px`.

Use `4px 5px` padding around the signature and `0 10px 0 5px` around
documentation. Separate signature from documentation with a `1px` rule at
reduced emphasis. Highlight the active parameter and make it bold.

When multiple signatures exist, add a `22px` navigation rail containing
`16px` previous/next actions and a `12px` count line. Keep cycling enabled so
navigation continues from the last signature to the first.

## Hover

Anchor hover to the inspected range and use hover background, foreground,
border, highlight, and optional status-bar roles. The surface has a `1px`
border, Outer radius, Large shadow, a `150px` minimum width, and a minimum height
of one editor line plus `8px`. Prefer above; fall below when that produces the
usable placement. Constrain both axes to the available viewport and allow the
body to scroll and resize.

Hover opens after `300ms`, remains sticky while the pointer moves into it, and
uses a `300ms` hiding delay. If a row offers copy, place the `16px` action
`4px` from the top and end edges with `2px 4px` padding. Keep it visually hidden
until the row is hovered or contains focus. Put optional actions in the hover
status-bar role instead of adding a second popup.

Inline code inside hover uses the text-code-block background. Longer signature
or documentation sections wrap; horizontal overflow remains available for
content whose formatting must be preserved.

## Peek surface

Peek is an embedded editor zone, not a floating popup. Give it a top frame
border and Large shadow, then divide the body into results and preview. The
initial split is `30%` results and `70%` preview, with an initial height of
eighteen editor lines. Let the divider resize horizontally. Keep at least
`100px` for results and `200px` for preview.

The header height is `1.2` times the editor line height. Use a `13px` title,
`20px` leading inset, trailing actions, and truncation for both title and
metadata. Results use `23px` rows and receive initial focus. Give the selected
result, matched text, preview background, preview gutter, preview match, and
frame their own roles.

Keep peek clipped to the editor zone and let its results and preview scroll
independently. Do not give it the hover/suggest border radius; its visual
attachment to code is part of the hierarchy.

## Rename

Anchor rename to the symbol range. Use the editor-widget background and shadow,
the control radius, `3px` around the input group, and a minimum width of
`200px`. Size the input to at least twenty character cells and approximately
`1.1` times the symbol width when that is larger. Keep the editor font in the
input so the proposed name aligns with the code context.

Place rename below when there is room for more than six candidate rows;
otherwise place it above. A candidate row is one editor line plus `4px`. Show at
most seven candidate rows and scroll the rest. The optional preview adds
`4px 4px 0` outer padding and an `80%` label; do not reserve that space when no
preview is present.

Focus stays in the rename input. Candidate suggestions extend the anchored
surface rather than opening a second suggest popup. An empty or unchanged value
cancels; acceptance remains the input's primary action.

## Inline completions and edits

Present a completion first as ghost text in the code flow. Use dedicated ghost
foreground, background, and border roles; italic is the normal treatment.
Syntax-colored ghost text uses `0.7` opacity so it remains subordinate to real
code. A short suggestion may use a dotted underline, while text that will be
replaced uses an underline.

Keep the inline-completion toolbar hidden until pointer intent by default. When
shown as a bordered hint, use hover roles, `4px` padding, and a `1px` border.
Keep next/previous, count, and accept actions together in one compact toolbar.

For edits, choose the least expansive presentation that expresses the change:
inline insertion, inline deletion, word replacement, line replacement, then
side-by-side when automatic layout has enough room. Use separate original and
modified line/character roles. Deletions use strikethrough; inserted and
removed ranges keep their semantic fills and `1px` outlines. A long-distance
edit keeps a directional hint instead of painting all intervening lines.

## Diff surface

Use side-by-side diff by default with a resizable `50%` split. At `900px` or
narrower, switch to inline diff when compact inline mode is allowed. The
original side is read-only by default; keep its selection, scrolling, and code
legible rather than dimming the entire pane.

Separate inserted and removed line backgrounds from inserted and removed
character backgrounds. Give gutter marks, overview marks, and moved-block
borders their own roles. In high contrast, add a `1px` dashed range border. An
empty character change remains locatable with a `3px` vertical marker, and
inline deletions use strikethrough.

Side-by-side editors use a `1px` separator with a small directional edge shadow.
Alignment gaps may use an `8px × 8px` diagonal pattern so blank space is not
mistaken for unchanged code. Keep the overview visible by default.

Unchanged-region collapsing is optional and off by default. If enabled, keep
three context lines, require at least three hidden lines, and reveal twenty
lines per expansion action. The centered control is `24px` high, or `11px` in
compact mode. Preserve independent vertical overflow while synchronizing the
comparison position.

## Code blocks

Use a code block for read-only code embedded in prose, help, hover details, or a
result. The portable structure is `pre > code`. Apply the syntax-color rule from
foundations, use the text-code-block background, and preserve whitespace.

A standalone block uses `10px 12px` padding, a `1px` widget border, the Inner
radius, `overflow: auto`, and `16px` space below it in prose. Let the `code`
child be block-level with transparent background and no additional padding or
radius. This keeps one clipping and scrolling owner.

An actionable block may place a toolbar over its top edge. Use a `26px` toolbar
surface offset `-15px`, cap it at `70%` of the block width, and use `24px`
actions. Keep the toolbar hidden and non-interactive at rest; reveal it on block
hover, block focus, or focus within the toolbar. A focused code block changes
its border to the focus role.

## Terminal-like surface

Use this treatment for a static transcript, command output, or terminal-shaped
developer surface. It does not provide shell behavior. The anatomy is a clipped
surface containing a preformatted scroll viewport, optional command/status
gutter, and optional split panes.

Use terminal background and foreground roles rather than assuming a black
surface. In a panel, terminal background falls back to the panel background; in
an editor, it falls back to the editor-pane background. Keep a `20px` start
gutter for command or status decorations. Separate split panes with a `1px`
terminal-border role and clip each pane independently.

Use the editor monospace family when no terminal family is provided. Terminal
text defaults to `12px` on macOS and `14px` elsewhere, with `0` letter spacing.
Use a line-height multiplier of `1`, or `1.1` on Linux. Preserve preformatted
spacing inside an overflow viewport rather than wrapping output as body copy.

Keep terminal selection distinct for active and inactive focus. The focused
cursor is a block and does not blink by default; the inactive cursor is an
outline. Use separate cursor foreground and cursor-accent roles so a block
cursor does not erase the character beneath it.

Map ordinary and bright black, red, green, yellow, blue, magenta, cyan, and
white to sixteen semantic terminal roles. Keep command success, command error,
find-current, find-other, hover highlight, overview cursor, and overview find
markers separate from that ANSI palette. Search fills remain translucent so
they do not hide terminal text.

## Theme-role minimum

An editor-themed surface should expose at least these independent role groups:

| Group | Roles that must not collapse |
|---|---|
| Canvas | Foreground, background, gutter background, line numbers, active line number, focused current-line fill, inactive current-line fill |
| Selection and find | Active selection, inactive selection, current find match, other find matches, find scope |
| Widgets | Widget foreground/background/border/resize border/shadow; suggest selected and match roles; hover status role |
| Inline and diff | Ghost text; inserted/removed line and character fills; gutter and overview markers; moved-block border |
| Terminal | Foreground/background, active/inactive selection, cursor/cursor accent, split border, sixteen ANSI roles |

In high contrast, use solid theme roles, add explicit contrast borders where
the component defines them, and remove widget shadows. Do not merge editor,
widget, hover, suggest, diff, and terminal backgrounds into one generic dark
rectangle.
