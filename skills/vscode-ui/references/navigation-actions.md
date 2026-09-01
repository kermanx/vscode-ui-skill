# Navigation and actions

Use the shared spacing, radius, typography, icon, stroke, and semantic-color
roles. This file adds component contracts; it does not redefine shell geometry
or the general interaction-state system.

Choose the surface by scope:

| Surface | Use | Avoid |
|---|---|---|
| Action bar or toolbar | A short row or column of commands for the current surface | Mixing navigation destinations into an undifferentiated command row |
| View-title actions | Commands whose target is the whole view | Persistent row-item commands or a second view switcher |
| Editor or pane tabs | Switching among peer documents or peer workbench panes | One-shot commands that do not change the current peer |
| Breadcrumbs | The current file, folder, or symbol path | General commands or unrelated history |
| Menu bar | Stable global command categories | Context-sensitive commands that have no useful global category |
| Context, dropdown, or overflow menu | Commands local to a target, trigger, or crowded toolbar | A permanently visible peer-navigation strip |
| Activity item | Switching primary workbench destinations, with an optional status badge | Ordinary commands or dense labels in the vertical rail |
| Command center | Global search and command entry in the title area | Local view filtering or a second copy while the top quick-input surface is open |

## Action bars and toolbars

Build a toolbar as a container with an ordered action list. Each item contains
one button or menu trigger; separators are non-interactive list items. A
horizontal bar uses Left/Right, Home, and End; a vertical bar uses Up/Down,
Home, and End. Enter or Space invokes the focused action. Keep one action item
in the tab order and move that tab stop with focus. Always skip separators during
arrow navigation. Skip disabled items only when the toolbar is configured to
focus enabled items exclusively; otherwise disabled items remain arrow-focusable
but cannot invoke.

- Product-action glyphs occupy a `16px × 16px` icon box. The generic text or
  keybinding label is `11px`, with `3px` padding and the control radius.
- A horizontal separator is `1px × 16px` with `5px 4px` margins. In a vertical
  bar, use a `1px` rule with `4px .8em` margins.
- Disabled text uses the disabled-foreground role; an icon that cannot be
  recolored uses `opacity: .6`. A disabled action keeps the default cursor and
  does not invoke.
- A toggle exposes its checked state as pressed. When the action bar is a
  tablist, expose the same state as selected instead.

Keep the primary group inline and put secondary groups under a More trigger.
Workbench title toolbars treat the `navigation` group as primary; do not infer
that every contributed group deserves inline space. A responsive toolbar may
shrink all actions or only the last action before overflow. The default shrink
budget is a `20px` minimum plus `4px` action padding, so measure `24px` per
candidate when deciding whether More is required. Move actions from the trailing
edge into overflow, retain the configured minimum visible count, and reserve the
same budget for More. Remove More when it would contain nothing. Join responsive
overflow and pre-existing secondary actions with one separator.

A select placed in an action bar may flex between `60px` and `170px`; clip its
container and leave `10px` after it. Do not apply those bounds to ordinary text
actions or localized labels.

## View-title actions

Use view-title actions for commands that operate on the whole view. A practical
inline set is creation, refresh, clear, collapse, or a mode toggle; longer and
less frequent groups belong in More. Mutually exclusive, state-dependent
commands may share one ordered slot—for example, cancel in place of refresh, or
expand in place of collapse—so the row does not jump as the state changes.

The anatomy is `header → title → toolbar`. Truncate the classic pane title
and give it `min-width: 3ch`; place the toolbar after it with automatic leading
space. In the classic pane header, the title is `11px`, bold, uppercase, and the
header is `22px` high. Its action area has `8px` trailing space; items have `4px`
trailing space and labels have `2px` padding. Modern UI raises the pane header to
`28px`; use the Modern pane surface and separator roles rather than carrying over
the classic header fill.

Actions may be quiet at rest, but reveal them when an expanded pane is hovered,
when the header or a descendant has focus, or when the user requests always-
visible actions. Do not hide an action that currently owns focus. A row-local
toolbar can use the same intent rule: hidden at rest, visible on row hover, row
focus, toolbar hover, or while one of its actions is active.

On narrow headers, let the title truncate and apply the toolbar's responsive
overflow rule to the actions. Do not shrink product icons or separators to make
a large inline set fit.

## Editor tabs

Use editor tabs for open editors inside one editor group. The structure is a
scrollable tab list followed by an editor-actions toolbar. The toolbar uses
`flex: 0 1 auto`: it does not grow, but it may shrink. Each tab contains a label,
an optional file icon, a reserved action or status column, and an inset visual
fill. Keep the tab hit targets contiguous even though the fills look separated.

### Modern UI direction

Modern editor tabs are rounded, inset fills rather than classic connected
rectangles:

| Metric | Default | Compact |
|---|---:|---:|
| Visual fill height | `24px` | `20px` |
| Total title height | `32px` | `28px` |
| Transparent space above and below the fill | `4px` each | `4px` each |

Inset the fill `2px` from both inline edges and give it the control radius. Use
`13px` regular text, `6px` start padding, and `8px` end padding; when no file icon
is present, use `8px` at the start. Remove classic tab seams, right borders,
active-tab shadows, and the bottom strip. The inactive fill is transparent;
hover and active states consume the dedicated Modern tab roles. Select the
focused- or unfocused-group palette first, then the tab state. Active has its own
hover role, multi-selected can add its selection stroke, and keyboard focus adds
the focus outline without replacing active state. In high contrast, keep fills
transparent and distinguish active/focus with solid outlines and hover with a
dashed outline.

Use natural width for `fit` tabs and allow the flex item to reach `min-width: 0`.
For `shrink` and `fixed`, truncate the label with an ellipsis. A compact sticky
tab is `28px` wide around a `16px` file icon; when file icons are unavailable,
use the label fallback rather than inventing a product glyph.

Reserve a `24px` tab-action column by default. Persistent dirty and pinned states
always reserve that column; when optional reservation is off, only clean tabs
collapse it. The column becomes visible for dirty, pinned, hover, focus, and the
active editor group; an inactive group may render a visible action at
`opacity: .5`. Match the opaque action-overlay background to the tab's current
inactive, hover, active, and focused-group role so the label cannot show through.
If an unreserved overlay covers a clean label, use a `16px` fade bridge into that
overlay.

Dirty and pin indicators share the action column with close or unpin. On hover or
focus, expose the applicable close or unpin action in that same column; do not
add an adjacent action column. Keep the action bar focusable only on the active
editor tab.

When tabs do not fit, either scroll the single row horizontally or enable wrapped
rows. Keep the editor-actions toolbar after the tab list; in wrapped mode position
it at the end of the final row. A separate pinned row may sit above the normal
row, divided by a single `1px` semantic separator.

### Classic scope

Classic tabs remain connected rectangles: `35px` high by default or `22px`
compact, with `10px` start padding and classic borders and shadows. Classic
`fixed` sizing defaults to `50px–160px`; `fit` targets `120px`, while `shrink`
allows `80px`. Classic `shrink` and `fixed` labels may use a `5px` gradient fade
instead of the Modern ellipsis. Treat these as compatibility geometry, not the
direction for new Modern UI work.

## Pane and scope tabs

Use pane tabs to switch peer containers in a sidebar, panel, or auxiliary bar.
The Modern form stretches each hit target through the `32px` header and places a
`24px` rounded fill inside it with `4px` transparent space above and below. Keep
targets adjacent with `gap: 0`; visual spacing belongs to the inset fills, not to
dead space between buttons.

Text tabs use `10px` inline padding, `13px` regular text, and `22px` label line
height. Icon-only pane tabs are `28px` wide with `6px` inline padding around a
`16px` icon. Checked uses the Modern active roles; unchecked hover uses the
Modern hover roles; focus adds a `1px` inset outline. High contrast follows the
same solid-active, dashed-hover, solid-focus ordering as editor tabs. Use
overflow for pane tabs that cannot fit rather than shrinking icon boxes.

A settings scope switcher is a narrower, explicitly scoped variant: a tablist of
available scopes with `13px` semibold labels, `2px 8px` padding, control radius,
active fill, and hover fill. Keep User, Remote, Workspace, and Folder in the
switcher's action model. Disable Remote when no configured remote target is
available, Workspace in an empty workbench, and Folder outside a folder
workspace; the base presentation may suppress disabled items. Do not promote
this settings-specific pill treatment into a rule for ordinary command toolbars.

## Breadcrumbs

Use breadcrumbs to expose the current resource hierarchy and open a picker for a
path segment. The semantic structure is a horizontal `list` of `listitem`
buttons, each containing its icon or label and a registered chevron separator.
Hide the separator after the final item. Do not put unrelated actions in the
breadcrumb list.

The breadcrumb row is `22px` high. Give each leading separator slot a
`16px × 22px` box, leave `8px` after the final item, and leave `6px` after a
symbol icon. A segment may use at most `80%` of the row width. Keep the list on
one line and allow items to shrink; focused and selected labels use an underline.
State precedence is combined focus-and-selection, then either focus or selection,
then hover.

Scroll horizontally when the path is wider than its container, translate wheel
movement to the horizontal axis, and reveal the focused item. The default
breadcrumb scrollbar is `3px`; its large mode is `8px`. Left/Right changes the
focused segment, Enter or Down opens its picker, Space reveals it, and Escape
returns focus to the editor.

If an editor-type control shares the row, cap that control at `40%`, use
`0 4px 0 8px` padding, an `11px` ellipsized label, and a `13px` chevron. Give
the breadcrumb list `min-width: 0` so it yields the remaining space.

## Menus, dropdowns, and overflow

Use the menu bar for stable global categories, a context menu for commands
specific to the invocation target, a dropdown for choices owned by one trigger,
and More for actions displaced from a toolbar. A submenu is appropriate for one
coherent, sizeable group; do not use nested menus to preserve arbitrary command
grouping.

### Menu bar

The top-level list is a single-line flex row clipped by its container. Each title
uses `0 8px` padding and a `5px` radius, with a `1px` inset focus outline.
The More control is `22px × 22px` with `0 8px` padding; in overflow-only mode its
occupied width is `38px`.

Measure localized titles. As width falls, move trailing categories into More as
submenus and reserve More before accepting the remaining titles. If only about a
quarter of the categories would remain, collapse the complete menu bar to the
single overflow trigger. Compact mode starts in that overflow-only form. Left
and Right move among top-level categories; Escape closes the current menu.

### Context and dropdown menus

A menu popup contains a vertical action list. Each `24px` row contains a `2em`
check slot, label, optional keybinding, and optional submenu indicator. Use
`13px` text, `0 4px` row margins, `4px 0` list padding, an Outer-radius popup, a
`1px` border, a Large shadow, and `160px` minimum width. Give label and keybinding
`0 2em` padding and the submenu indicator `0 1.8em`. Keybinding and submenu
indicator may use `opacity: .7`; a disabled menu item uses `opacity: .4` and the
disabled foreground.

Use `1px` separators with `5px 0` margins, and remove leading, trailing, or
consecutive separators. A checked item adds the check glyph without replacing
its label. The currently focused row receives the menu-selection foreground and
background; disabled state still prevents invocation. Open a hovered submenu
after `250ms`, and flip it horizontally or vertically when it would leave the
viewport. Cap scrolling to the available viewport, keep the focused row visible,
and use a `7px` visible vertical scrollbar.

A dropdown trigger fills its toolbar height and centers its label. Expose popup
availability and expanded state on the trigger. Do not add a tooltip inside an
open menu; keybindings and submenu indicators already occupy the trailing lane.

### Split and connected controls

Use a split dropdown only when the primary click has a stable default and the
adjacent chevron opens alternatives from the same action family. Two verified
variants use different geometry:

- In an action-bar split dropdown, keep the primary action and dropdown in one
  flex row with a `5px` group radius. Use a `16px` primary icon and a `12px`
  chevron on a `16px` line box.
- In a connected text-button dropdown, keep the controls separately focusable.
  Use `4px 0 0 4px` on the primary button and `0 4px 4px 0` on the dropdown
  button, remove the adjoining border widths, and draw the separator as a `1px`
  rule when needed.

Do not transfer either variant's geometry to unrelated adjacent buttons.

## Activity items

Use the activity rail for primary workbench destinations. Each item is an
icon-only action with a selection indicator and optional badge. Keep the item
label available to the accessible name and overflow menu; do not add persistent
text inside the default vertical rail.

Modern UI uses a `36px` rail and `36px` action box with a `24px` icon. Its active
or hover fill is inset to `32px × 32px` and uses the control radius. The
independent compact rail uses a `28px` rail, `28px` action box, `16px` icon, and
`24px × 24px` fill. Modern UI removes the classic `2px` side marker: checked
uses the active fill and foreground, unchecked hover uses the hover roles, and
focus adds an inset outline. High contrast uses a solid checked outline, dashed
hover outline, and solid focus outline.

Badge text is `9px` semibold in a `16px` line box, with `8px` minimum content
width, `0 4px` padding, and a circular radius. Modern UI positions that badge
`18px` from the top and `3px` from the right. Compact badges move to `13px` from
the top while retaining the `3px` right offset, with `9px` minimum width,
`13px` line height, and `0 2px` padding. The classic rail's default offsets are
`24px` from the top and `8px` from the right; do not carry those offsets into the
narrower Modern rail.

When the rail cannot fit all pinned destinations, keep pinned and active items
in the visible set where possible and move trailing items to an Additional Views
menu. Reserve one activity-item slot for that overflow trigger, and include the
destination label and badge in its menu entry. A horizontally relocated activity
bar is a scoped alternative: keep the header hit targets contiguous and paint a
`24px × 24px` rounded fill behind each `16px` icon. Do not carry that visual-fill
geometry back to the vertical rail.

## Command center

Use the command center as one global search or command trigger in the title
area. Its structure is a centered toolbar region with optional leading
navigation actions followed by a button containing a search icon and a
shrinkable label. The main trigger is `22px` high, `38vw` wide up to `600px`,
with `0 6px` outer margin, a `1px` border, Inner radius, and clipped contents.
Use `0 12px` padding for grouped content and ellipsize the search label.

Hover switches the trigger to its active foreground, background, and border
roles. When the whole title bar is inactive, the command-center foreground
follows the inactive title-bar foreground, its border uses the dedicated
command-center inactive-border role, and the title-bar contents use
`opacity: .6`. Disabled back or forward actions use the shared disabled-action
treatment and cannot invoke.

In compact mode, hide the search icon, left-align the label, use `8px` start
padding, and let the trigger consume the available width. When a top-aligned
quick-input surface is already visible, hide the command-center trigger rather
than showing two global entry points.
