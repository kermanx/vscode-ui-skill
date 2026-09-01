# Overlays and feedback

Choose by interruption and lifetime before choosing a silhouette. A tooltip,
hover, context view, quick input, and toast are transient, nonmodal overlays. A
dialog is a modal overlay. The notification center is a persistent floating
region. Progress bars, spinners, severity indicators, inline confirmations, and
welcome states belong to their host surface; do not elevate them merely because
they report status.

Use semantic theme roles for foregrounds, fills, strokes, links, selection, and
severity. The shared modern overlay silhouette is an `8px` outer radius. Use a
`1px` semantic border when the component defines one, large shadow
`0 0 12px rgba(0, 0, 0, .14)` for hovers, menus, and notification regions, and
extra-large shadow `0 0 20px rgba(0, 0, 0, .15)` for quick input and modal
dialogs. These shadows remain on floating surfaces even when structural shell
shadows are disabled.

## Tooltip and simple hover

Use a simple hover for short, supplementary text attached to one target. Avoid
putting required instructions or a decision there: a plain hover is transient
and may close as soon as the pointer leaves its target or enters the hover.

- **Anatomy:** one selectable text content area. Use `13px / 19px` text and
  `4px 8px` padding. A compact variant uses `12px` text and `2px 8px` padding.
- **Surface:** use the editor-hover foreground, background, and border roles,
  a `1px` border, `8px` radius, and the large overlay shadow. Cap the outer
  surface at `700px`; wrap long text.
- **Placement and overflow:** anchor to the target and prefer above. Flip to
  another side when the preferred side lacks room. Unless the caller forces a
  side, the placement may choose above, below, left, or right from available
  space. Scroll tall content; the default maximum is half the viewport height.
  A forced side constrains the surface instead of flipping it.
- **State and dismissal:** a plain string or link-free text hover closes when
  the pointer leaves the target or enters the hover. Target activation, outside
  pointer down, `Escape`, window blur, context-menu opening, or the target
  leaving the viewport also closes it.

## Rich hover

Use a rich hover when the anchored explanation needs wrapped formatted content,
links, or a small action strip. It is still a transient, nonmodal overlay; use
an inline confirmation or dialog when completion depends on the user deciding.

- **Anatomy:** a scrollable content region plus an optional bottom status/action
  row. Formatted content has a `500px` maximum width, wraps long words, and uses
  `8px` vertical spacing between paragraphs, lists, headings, and code blocks.
  The bottom row uses `12px / 22px` text, `0 8px` item padding, and `16px`
  between actions.
- **Surface and colors:** use the same `1px` editor-hover border, `8px` radius,
  and large shadow as a simple hover. Use the text-link foreground for links,
  its active role on hover, the text-code-block background for code, and the
  hover-status-bar background for the action row.
- **Placement and overflow:** use the same side selection and half-viewport
  default height limit as a simple hover. Keep the content scrollable and the
  action row attached to the same outer silhouette.
- **State and dismissal:** links or actions make the surface hoverable, so the
  pointer can move from target to overlay without closing it. An explicit sticky
  state keeps it open. Outside pointer down, target activation, `Escape`, window
  blur, or loss of the anchor still closes a non-sticky rich hover. If the
  overlay takes focus, restore the previous focus when it closes.

## Context view

A context view is an anchored positioning layer, not a visual component by
itself. Use it to host a menu, action list, or other local popup whose position
belongs to an element, pointer event, or coordinate. Do not add a generic white
card around every context view; the hosted component owns its shell.

- **Placement:** the default anchor alignment is leading and below, on a
  vertical placement axis. Fit or flip against the viewport. A relayout-capable
  popup repositions when its container changes; a popup that disallows relayout
  closes instead. Showing a new context view replaces the current one.
- **Action-list composition:** use a semantic list inside a surface with
  `100px` minimum width, `80vw` maximum width, `4px` padding, a `1px` hover-widget
  border, `8px` radius, and the large shadow. Rows use `0 12px 0 6px` padding,
  a `6px` inner radius, a `6px` icon-to-label gap, and no wrapping; truncate
  title and detail text. A separator is `1px` high with `4px 6px` margin. An
  optional footer is divided by a `1px` top border.
- **Colors:** use menu foreground/background for the shell, disabled foreground
  for unavailable rows, list-hover foreground/background for the active row,
  description foreground for detail text, and the menu-selection border when
  the theme supplies one.
- **State and dismissal:** a menu-like context view closes on cancel, after an
  action, on outside pointer down, on menu blur, and on window blur. Keep those
  rules with the hosted menu rather than assigning them to the bare positioning
  layer.

## Quick Pick and Command Palette

Use quick input for a searchable command list, single choice, multiple choice,
or short free-form value. Use an anchored action list instead when the choices
are merely local commands for one target.

- **Anatomy:** optional title bar and actions; filter/input header; optional
  select-all control, description, message, inline actions, confirmation button,
  or custom field; a progress track; then a list or tree. Multi-select uses
  checkboxes and an explicit confirmation action. Single-select accepts the
  focused item.
- **Surface:** use quick-input foreground/background, title background, picker
  group foreground/border, and quick-input-list focus foreground/background,
  icon foreground, and match-highlight roles. Use an `8px` outer radius and the
  extra-large shadow. The header uses `6px 6px 4px` padding; the filter field has
  a `6px` radius.
- **Geometry:** the centered surface is
  `width: min(62% of the host, 600px)`. Rows are `22px` high and the list caps at
  `20` rows (`440px`). Give the list `6px` inline padding and `7px` bottom
  padding. Place a message with `5px` padding directly below the header; place
  progress between header/message and results.
- **Anchored and narrow layouts:** a standard anchored picker is `380px` wide
  with list height capped at the smaller of `20%` of the viewport and `200px`.
  A picker attached to an overlay may match its anchor width and cap the list at
  the smaller of `40%` of the viewport, `400px`, and the available space. Fit or
  flip the anchored surface above or below rather than letting it leave the
  viewport.
- **State and dismissal:** showing the surface focuses its input. Accept commits
  the value; cancel or `Escape` closes without committing. Blur closes unless
  the caller explicitly keeps the surface open across focus changes. Closing
  restores the previously focused element.

## Dialog

Use a dialog for a blocking decision, confirmation, or input that suspends the
underlying work. It is the only modal family in this reference. Use a toast or
notification for passive status and an inline confirmation when the surrounding
workflow must remain available.

- **Anatomy:** full-viewport blocker; dialog shell; message row with optional
  severity icon, heading, detail, and body; optional input and checkbox; optional
  toolbar/close action; and a button row. A dialog with no supplied actions gets
  a default confirmation action.
- **Surface:** dim the blocker with `rgba(0, 0, 0, .5)`. Use editor-widget
  foreground/background, border, and shadow roles, a `1px` border when present,
  `8px` radius, and the extra-large shadow. The modern shell uses `4px` padding,
  a `440px` minimum width, and `90vw` / `90vh` maximum bounds.
- **Content geometry:** use `13px / 1.4` text and a `13px`, `600`-weight heading.
  Give the message row `16px 8px 0`; inset message content `8px` from the icon
  side and `20px` from the opposite side. Use `12px` below the heading and
  `16px` before the button row. Put a dialog toolbar `8px` from the top and
  trailing edge. Scroll vertically when content exceeds the height cap and wrap
  long words.
- **Narrow adaptation:** below the horizontal layout's needs, allow a `350px`
  minimum vertical layout. Stack the icon, message, and actions; make each
  button fill the row. Horizontal button rows size actions to content and
  ellipsize long labels.
- **State and dismissal:** keep focus inside the modal and restore prior focus
  on close. Focus the first input when present, otherwise the primary/default
  action. `Escape` invokes cancel unless escape cancellation is disabled; a
  close control maps to cancel. Pointer down on the dimmed blocker does not
  dismiss the dialog and returns focus to it. In an input dialog, `Enter`
  activates the non-cancel/default action.

## Toast notification

Use a toast for transient, nonmodal status that can be acted on later through
the notification center. Do not show toasts while the center is open, and do not
turn silent notifications into toasts.

- **Anatomy:** severity icon; message; optional source; trailing actions and
  close action; optional details, buttons, and bottom-edge progress. The
  collapsed message is one `22px` line with ellipsis. Expanded messages wrap;
  source and action buttons appear in the expanded detail row.
- **Surface:** use notification foreground/background, toast border, link, and
  notification severity roles. Use a `1px` border when present, `8px` radius,
  and the large shadow. The modern row uses `6px 2px` padding, a `16px` severity
  icon, `6px` leading icon margin, `8px` trailing icon margin, and source text
  indented `24px` from the row start.
- **Placement and limits:** choose bottom-trailing, bottom-leading, or
  top-trailing. Align the visible surface `8px` from the inline edge and `32px`
  from the bottom in bottom placement; use an `8px` inline inset and `36px` top
  inset in top-trailing placement. Cap width at `450px` and at viewport width
  minus `16px`. Show at most `3` toasts, newest first, and hide older items that
  cannot fit the available height.
- **State and dismissal:** non-sticky information, warning, and error toasts
  auto-close after `10s`, `12s`, and `15s` respectively. While the window is
  unfocused, the toast is hovered, or the toast contains focus, restart rather
  than complete that timeout. Sticky notifications never auto-close. Close
  removes the notification; an action closes it unless that action explicitly
  keeps it open.

## Notification center

Use the notification center as the persistent, nonmodal history and action
region for notifications. It remains until explicitly hidden, and it replaces
the toast stack while open.

- **Anatomy:** `35px` header with title and actions for clear/configure/hide,
  followed by a notification list. The header title is uppercase `11px`. A
  collapsed notification row is `34px` high in the compact modern layout;
  expansion adds a wrapped message region and one more `34px` row for source and
  actions.
- **Surface:** use notification foreground/background, notification-center
  border, center-header foreground/background, link, separator, and
  notification severity roles. Use a `1px` border, `8px` radius, and the large
  shadow. Separate adjacent notifications with the semantic notification border.
- **Placement and narrow adaptation:** cap the region at `450px × 400px`, then
  reduce width to the host width minus `16px` and height to the space remaining
  after visible workbench bars. In the modern inset layout, use an `8px` inline
  inset; bottom placements use a `32px` bottom inset and top-trailing uses a
  `36px` top inset.
- **State and dismissal:** showing the center focuses its first item. Hide
  restores the editor focus. Hide the center automatically when no notifications
  remain. Clear-all skips notifications with active progress. A notification
  with active progress omits its per-row close action.

## Progress

Use a progress bar for work whose advancement belongs to a surface. Use
determinate progress when a total is known and indeterminate progress when it is
not. This is inline feedback, not an overlay.

- **Anatomy and geometry:** a `2px`-high, full-width clipped track containing a
  `2px`-high progress bit. Determinate width is the completed fraction clamped to
  the total. Indeterminate mode uses a `2%`-wide moving bit.
- **Color and motion:** use the semantic progress-bar background for the bit.
  Determinate width updates use a `100ms` linear transition. Indeterminate travel
  takes `4s`. Completion resets the track after `200ms`; stopping resets it
  immediately.
- **Composition:** place the bar on a stable edge of its owner: between a quick
  input header and results, at the bottom edge of a notification, or at the
  leading edge of a view or editor region. Do not wrap the `2px` track in a
  separate elevated card.

## Spinner

Use a spinner for compact, localized work when no meaningful fraction is
available. Keep it inline and reserve its icon slot so nearby labels and actions
do not shift.

- **Geometry:** use a `16px × 16px` inline grid of six circular `2px` dots in
  `2` columns by `3` rows, with `2px` gaps. The grid variant advances in six
  steps over `1820ms`; the ring variant advances in four steps over `1200ms`.
  Under reduced motion, show all dots without animation.
- **Color and semantics:** inherit `currentColor`. A regular in-progress spinner
  can use the text-link foreground; a needs-attention ring can use the warning
  list foreground.
- **Composition:** replace an action's leading icon with the spinner inside the
  same reserved slot. Use a progress bar instead when the host can report a
  meaningful completed fraction.

## Severity indicator

Use a severity indicator as a compact inline companion to an information,
warning, or error message. It has no card, radius, shadow, or dismissal behavior
of its own.

- Map information to the information-circle shape, warning to the warning
  triangle, and error to the error-circle shape. An ignored diagnostic may reuse
  the information shape only when its ignored state is also exposed separately.
- Use the problem information/warning/error icon roles inside diagnostic and
  problem surfaces. Use the notification information/warning/error icon roles
  inside notifications. Do not substitute a single generic accent color across
  these contexts.
- Keep the glyph in the host row's `16px` icon slot and align the message and
  actions around that reserved column. The host component, not the indicator,
  owns expansion, focus, progress, and close behavior.

## Inline confirmation surface

Use an inline confirmation when a decision belongs to an ongoing local workflow
and its context should remain visible. It is persistent and nonmodal. Use a
dialog instead when the decision must block the rest of the interface.

- **Anatomy:** title row with optional toolbar; scrollable message region; button
  row with primary, secondary, and optional more-actions control; optional
  footer/banner. Keep the title and message capable of wrapping.
- **Surface:** use the host request/background and request-border roles. Give the
  outer card a `1px` border, `6px` radius, and `8px` bottom margin; do not add a
  floating shadow. Divide the title and message with `1px` borders.
- **Geometry:** title padding is `4px 8px`, title text is `13px` at weight `600`,
  and title-to-toolbar gap is `10px`. Message padding is `6px 9px 0`; paragraphs
  have `9px` bottom spacing. The button row uses `4px 8px` padding and wraps with
  `4px` column gaps when narrow. Scroll the message vertically and hide
  horizontal overflow.
- **State:** keep the surface in the workflow until an action or host update
  replaces it. Disable individual actions while their choices are unavailable.

## Empty and welcome state

Use a welcome state when a pane or tree has no meaningful content and can explain
how to create or reveal it. It is a persistent, nonmodal replacement for the
normal pane content, not a toast or centered floating card.

- **Anatomy:** short explanatory paragraphs, inline links, and standalone primary
  actions. Treat a line containing only one link as a button; keep links inline
  when they are part of a sentence. Conditional lines may appear only when their
  enabling context applies.
- **Geometry:** fill the pane, arrange content in a centered vertical column,
  and use `0 20px 1em` padding. Give consecutive content blocks `1em` top
  spacing. Standard action containers fill the available width up to `300px`,
  and each button also caps at `300px`.
- **Wide and overflow behavior:** switch to the wide composition above `640px`;
  the action container may then use the full available width while buttons keep
  their `300px` cap. Scroll vertically and hide horizontal overflow.
- **Surface and state:** inherit the pane foreground/background and use semantic
  link and button roles. Do not add overlay radius or shadow. Show the welcome
  content only while the host reports no meaningful content; replace it with the
  normal pane as soon as content becomes meaningful.
