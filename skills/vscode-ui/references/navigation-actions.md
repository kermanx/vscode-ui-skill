# Navigation and actions

Use navigation and action surfaces according to their scope:

| Surface | Use | Avoid |
|---|---|---|
| Action bar or toolbar | Commands for the current surface | Mixing navigation destinations into a command row |
| View-title actions | Commands whose target is the whole view | Persistent row-item commands |
| Editor tabs | Open editors within one editor group | One-shot commands |
| Pane or scope tabs | Peer workbench containers or settings scopes | Unrelated commands |
| Breadcrumbs | The current file, folder, or symbol path | General commands or unrelated history |
| Menu bar | Stable global command categories | Commands with no useful global category |
| Context, dropdown, or overflow menu | Commands local to a target or trigger | Permanent peer navigation |
| Activity item | Primary workbench destinations | Ordinary commands or persistent labels in the vertical rail |
| Command center | Global search and command entry | Local filtering or a duplicate global entry point |

## Action bars and toolbars

Build a toolbar as one ordered action list. Each item contains one button or menu
trigger; separators are non-interactive items. A horizontal bar uses Left/Right,
Home, and End; a vertical bar uses Up/Down, Home, and End. Enter or Space invokes
the focused action. Keep one item in the tab order and move that tab stop with
focus. Always skip separators. Skip disabled items only when the toolbar is
configured to focus enabled items exclusively; otherwise they remain
arrow-focusable but cannot invoke.

- Use a `16px × 16px` product-icon box. Text and keybinding labels are `11px`
  with `3px` padding and a `6px` radius.
- A horizontal separator is `1px × 16px` with `5px 4px` margins. A vertical
  separator is a `1px` rule with `4px .8em` margins.
- Disabled text uses the disabled-foreground role. An icon that cannot be
  recolored uses `opacity: .6`. Disabled actions keep the default cursor.
- Expose a toggle as pressed. In a tablist, expose the same checked state as
  selected.

Keep primary actions inline and put secondary actions under More. In workbench
title toolbars, the `navigation` group is primary; do not infer that every group
belongs inline. Responsive toolbars may shrink all actions or only the last
action. Measure a default minimum of `20px` plus `4px` action padding, or `24px`
per action, when deciding whether to overflow. Move trailing actions into More,
retain the configured minimum visible count, reserve the same `24px` for More,
and remove More when it is empty. Join overflowed and pre-existing secondary
actions with one separator.

A select inside an action bar may flex between `60px` and `170px`; clip its
container and leave `10px` after it. These bounds do not apply to ordinary text
actions or localized labels.

## View-title actions

Use `header → title → toolbar`. A pane header is `22px` high. Its title is
`11px`, bold, uppercase, ellipsized, and has `min-width: 3ch`. Place the toolbar
after the title with automatic leading space. Give the action area `8px` trailing
space, each item `4px` trailing space, and each label `2px` padding.

Actions may be quiet at rest, but reveal them when an expanded pane is hovered,
when the header or a descendant has focus, or when always-visible actions are
enabled. Never hide the action that owns focus. Row-local toolbars use the same
visibility conditions: row hover, row focus, toolbar hover, or an active action.

On narrow headers, truncate the title and apply responsive overflow to the
actions. Do not shrink product icons or separators to preserve a large inline
set.

## Editor tabs

Classic editor tabs are contiguous rectangles in a scrollable tab list followed
by an editor-actions toolbar. Do not inset the visible tab into a rounded fill or
create dead space between hit targets.

- Use `35px` tab height by default and `22px` for the compact editor-tab setting.
  Labels are `13px`. Start with `10px` inline-start padding; shrinking tabs with
  file icons may reduce it to `5px`.
- `fit` tabs are `120px` wide with `min-width: fit-content`. `shrink` tabs use an
  `80px` minimum. `fixed` tabs default to `50px–160px` and grow evenly.
- Compact pinned tabs are `38px` wide. Pinned tabs using shrink sizing are
  `80px` wide. Keep pinned tabs sticky while normal tabs scroll beneath them.
- Keep the editor-actions toolbar after the tab list with `4px` start and `8px`
  end padding. Items have `4px` trailing space. In wrapped mode, place this
  toolbar at the end of the last row.

Use the active, inactive, focused-group, and unfocused-group tab roles directly.
Tabs meet edge to edge; use the tab border roles for their `1px` seams and
optional `1px` active top or bottom line. The modified-tab top indicator is
`2px`. When shadows are enabled, the active tab uses
`inset 0 8px 12px rgba(0, 0, 0, .02)` and inactive hover uses
`0 0 4px rgba(0, 0, 0, .08)`; remove both when workbench shadows are disabled.

For `shrink` and `fixed`, clip the label and use a `5px` end gradient; use an
ellipsis in high-contrast themes. A compact pinned tab without a file icon uses
its label fallback rather than a product glyph.

Reserve a `28px` tab-action column and center a `16px` icon with `2px` padding.
The active editor, hover, focus, dirty state, and non-compact pinned state reveal
the close, dirty, pin, or unpin affordance in that one column. In an inactive
editor group, a visible action uses `opacity: .5`; otherwise actions rest at
`opacity: 0`. Do not add a second status column. Only the active tab is in the
tab order.

When tabs do not fit, scroll the single row horizontally or wrap rows. A separate
pinned row may sit above the normal row. Keep the editor-actions toolbar outside
the scrollable tab list.

## Pane and scope tabs

Workbench pane composites use flat text or icon items with an active line, not
rounded inset fills.

- Text items use `11px` uppercase text, `10px` inline padding, `2px` block
  padding, and a `27px` line height. Their labels add `2px` padding, have no
  radius, and keep a transparent background.
- Icon items are `35px` high with `0 3px` padding around a `16px` icon.
- Checked text items use the active foreground and a `1px` line near the bottom.
  Keyboard focus strengthens that line to `2px`. Hover changes foreground; it
  does not turn the item into a pill.
- Checked icon items may use the flat, full-item active-background role, while
  retaining the same active line. Do not inset that background.
- For a top header, draw the active line at the bottom. For a footer, mirror it
  at the top. Use More when peer destinations do not fit.

The Settings scope switcher is a specific flat tablist. Its container is `32px`
high with a `1px` bottom border. Labels are `13px`, regular case, with
`7px 8px 6.5px`; they have `0` radius and no fill. Checked and hovered labels
use a `1px` bottom line; focus uses the focus-border role. Hide unavailable
targets: Remote without a remote authority, Workspace in an empty workbench,
and Folder outside a multi-folder workspace.

## Breadcrumbs

Use breadcrumbs as a horizontal `list` of `listitem` buttons containing a label
or icon and a registered chevron separator. Hide the separator after the final
item. Do not add unrelated actions to the list.

The row is `22px` high. Each leading separator slot is `16px × 22px`; leave
`8px` after the final item and `6px` after a symbol icon. A segment may use at
most `80%` of the row width. Keep one line and let items shrink. Focused and
selected labels are underlined. Resolve combined focus-and-selection before
either state alone, then hover.

Scroll horizontally when the path exceeds its container, translate wheel input
to the horizontal axis, and reveal the focused item. The default breadcrumb
scrollbar is `3px`; its large setting is `8px`. Left/Right changes the focused
segment, Enter or Down opens its picker, Space reveals it, and Escape returns
focus to the editor.

If an editor-type picker shares the row, cap it at `40%`, use
`0 4px 0 8px` padding, an `11px` ellipsized label, and a `13px` chevron. Give
the breadcrumb list `min-width: 0` so it yields the remaining space.

## Menus, dropdowns, and overflow

Use the menu bar for global categories, a context menu for the invocation target,
a dropdown for choices owned by one trigger, and More for toolbar actions that
do not fit. Use a submenu for one coherent group, not to preserve arbitrary
grouping.

### Menu bar

The top-level list is one clipped flex row. Each title uses `0 8px` padding and a
`5px` radius with a `1px` inset focus outline. More is `22px × 22px` with
`0 8px` padding; when it is the only visible item, the bar occupies `38px`.

Measure localized titles. Move trailing categories into More and reserve More's
width before accepting the remaining titles. When no more than roughly one
quarter of the categories would remain, collapse the whole bar to More. Compact
menu-bar mode starts in that overflow-only form. Left and Right move among
top-level categories; Escape closes the current menu.

### Context and dropdown menus

A menu popup uses `13px` text, an `8px` radius, a `1px` border,
`0 0 12px rgba(0, 0, 0, .14)` shadow, and `160px` minimum width. The vertical
list has `4px 0` padding. Each row is `24px` high with `0 4px` margins and a
`6px` radius. It contains a `2em` check slot, label, optional keybinding, and
optional submenu indicator. Give labels and keybindings `0 2em` padding and the
submenu indicator `0 1.8em`. Keybindings and submenu indicators use
`opacity: .7`; when disabled they use `opacity: .4`, while the label uses the
disabled-foreground role.

Use `1px` separators with `5px 0` margins. Remove leading, trailing, and
consecutive separators. A checked item adds the check glyph without replacing
its label. Focused rows use the menu-selection foreground, background, and
optional `1px` inset border. Disabled rows cannot invoke.

Open a hovered submenu after `250ms`. Flip it horizontally or vertically when
needed to remain in the viewport. Cap scrolling to the available viewport, keep
the focused row visible, and use a `7px` vertical scrollbar. Menus do not show
tooltips.

A dropdown trigger fills its toolbar height and centers its label. Expose popup
availability and expanded state on the trigger.

### Split and connected controls

Use a split dropdown only when the primary click has a stable default and the
adjacent chevron offers alternatives from the same action family.

- An action-bar split dropdown is one flex row with a `5px` group radius. Use a
  `16px` primary icon and a `12px` chevron on a `16px` line box.
- A connected text-button dropdown keeps both controls focusable. The primary
  button uses `4px 0 0 4px`; the dropdown uses `0 4px 4px 0`. Remove the two
  adjoining border widths and draw their separator as a `1px` rule.

Do not transfer either variant's geometry to unrelated adjacent buttons.

## Activity items

Use the vertical Activity Bar for primary workbench destinations. Each item is
an icon-only action with a selection marker and optional badge. Keep its label
as the accessible name and in the overflow menu; do not render persistent text
in the rail.

The default rail is `48px` wide. Items are `48px × 48px` with a `24px` icon.
The independent compact Activity Bar setting uses a `36px` rail,
`36px × 28px` items, and `16px` icons. Do not separate items with gaps.

Checked items keep a full-height `2px` marker on the edge adjoining the window
edge: left for a left rail, right for a right rail. Focus reuses this marker with
the focus role. A theme may additionally provide the active-background role,
but do not replace the marker with an inset rounded fill. Hover and checked
states use the Activity Bar foreground roles.

Default badges use `9px` semibold text, `16px` height and line height, `8px`
minimum content width, `0 4px` padding, and a `20px` radius; position them
`24px` from the top and `8px` from the right. In the compact Activity Bar,
use `13px` height and line height, `9px` minimum width, `0 2px` padding, and a
`13px` radius; position the badge `13px` from the top and `6px` from the right.

When space runs out, preserve pinned and active destinations where possible and
move trailing items into Additional Views. Reserve one item slot for that
overflow trigger and retain each destination's label and badge in its menu item.

## Command center

Use one command center for global search and command entry in the title area. It
is a centered toolbar region with optional leading navigation actions and a
search trigger containing a shrinkable label.

The main trigger is `22px` high, `38vw` wide up to `600px`, with `0 6px`
margin, a `1px` border, `6px` radius, and clipped contents. Use `0 12px` padding
when it contains multiple groups and ellipsize the search label. The search icon
is `14px`, uses `opacity: .8`, and has `3px` inline margins. A label-only form is
left aligned with `8px` start padding and consumes the available width.

At rest, use the command-center foreground, background, and border roles. Hover
switches all three to their active roles. When the title bar is inactive, use
the inactive title-bar foreground and command-center inactive-border role; the
title-bar contents use `opacity: .6`. Disabled navigation actions use the shared
disabled treatment and cannot invoke.

When a top-aligned quick-input surface is visible, hide the command-center
trigger rather than showing two global entry points.
