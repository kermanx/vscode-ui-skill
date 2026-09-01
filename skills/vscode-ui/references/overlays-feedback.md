# Overlays and feedback

Use a notification only when the message genuinely needs the user's attention.
Keep progress in its owning view or editor when possible. Use a modal dialog only
when the current operation needs an immediate blocking decision.

Use the component's semantic theme roles for foreground, background, border,
links, selection, and severity. Current Classic overlay geometry is
component-specific: do not normalize all floating surfaces to one radius,
padding, or shadow.

## Hover

Use a hover for supplementary information attached to one target. Do not hide
required instructions or a required decision in it.

- A workbench hover uses `13px / 19px` text, `4px 8px` content padding, a `1px`
  editor-hover border, `5px` radius, and
  `0 0 12px rgba(0, 0, 0, .14)` shadow. Cap it at `700px` wide. Its compact
  form uses `12px` text and `2px 8px` padding.
- An editor hover uses the same editor-hover foreground, background, border,
  and shadow roles with an `8px` radius.
- Formatted hover content caps at `500px`, wraps long words, and gives
  paragraphs, lists, headings, and code blocks `8px` vertical margins. An
  optional status/action row uses `12px / 22px` text, `0 8px` padding, and
  `16px` between actions.
- Prefer placement above the target, then fit or flip to the available side.
  Unless a caller provides another limit, cap height at half the viewport and
  scroll the content.
- Plain text and link-free Markdown normally close when the pointer leaves the
  target. Links or actions keep the hover reachable by pointer. A sticky hover
  remains open until explicitly dismissed.
- Target activation, outside pointer down, `Escape`, window blur, or the target
  leaving the viewport dismisses a non-sticky hover. Restore previous focus if
  focus was inside the hover when it closed.

## Context view and action list

A context view is an anchored positioning layer, not a visual component. The
menu, action list, or picker inside it owns the visible shell.

- Default to left alignment, below the anchor, on a vertical placement axis.
  Fit or flip inside the viewport. Reposition on container layout when the popup
  supports relayout; otherwise close it. Showing another context view replaces
  the current one.
- An action-list shell uses `13px` text, `100px` minimum width, `80vw` maximum
  width, `4px` padding, a `1px` editor-hover border, `8px` radius, and
  `0 0 12px rgba(0, 0, 0, .14)` shadow.
- Action rows use `0 12px 0 6px` padding, a `6px` radius, and a `6px` gap from
  icon to label. Keep the row on one line and ellipsize title and detail.
  Separators use a `1px` rule with `4px 6px` margin. Divide an optional footer
  with a `1px` top border.
- Use menu foreground/background for the shell, disabled foreground for
  unavailable rows, list-hover roles for the focused row, description
  foreground for detail, and the optional menu-selection border.
- A menu-like popup closes on cancel, after invoking an action, on outside
  pointer down, on menu blur, and on window blur.

For full menu-row geometry and submenu behavior, read
[navigation-actions.md](navigation-actions.md).

## Quick Pick and Command Palette

Use quick input for command search, a single choice, multiple choices, or a
short free-form value. Use a local action list when the choices are only
commands for one target.

- Compose an optional title and actions, filter/input header, progress track,
  then a list or tree. Optional elements include select-all, description,
  message, inline actions, confirmation button, and custom fields. Multi-select
  uses checkboxes plus explicit confirmation; single-select accepts the focused
  item.
- Use quick-input foreground/background, title background, picker-group roles,
  list-focus roles, match-highlight roles, and an optional `1px` widget border.
  The shell uses a `12px` radius and
  `0 0 20px rgba(0, 0, 0, .15)` shadow.
- The header uses `6px 6px 4px`; the filter field uses a `6px` radius. A message
  directly below the header uses `5px` padding. Place progress between the
  header or message and results.
- Center the normal surface at `width: min(62% of the host, 600px)`. Rows use
  `22px` line height and the list caps at `20` rows (`440px`). Give the
  scrollable list `6px` inline padding and `7px` bottom padding.
- A standard anchored picker is `380px` wide and caps the list at the smaller
  of `20%` of the host height and `200px`. An overlay-attached picker matches
  its anchor width and caps the list at the smallest of `40%` of the host
  height, `400px`, and available space. Fit or flip anchored pickers above or
  below the anchor.
- Showing quick input focuses its input. Accept commits; cancel or `Escape`
  closes without committing. Blur closes unless focus-out is explicitly
  ignored. Restore the previously focused element when it closes.

## Dialog

Use a dialog for a blocking decision or input. Do not use one for passive
status, for unprompted messages, or to confirm several steps.

- Compose a full-viewport blocker, shell, message row with optional severity
  icon, heading/detail/body, optional input and checkbox, optional toolbar and
  close action, and a button row. Unless explicitly disabled, supply a default
  confirmation action when no actions are provided.
- Dim the blocker with `rgba(0, 0, 0, .5)`. Use editor-widget foreground and
  background, widget border, problem severity roles, and text-link foreground.
  The shell uses an optional `1px` border, `12px` radius,
  `0 0 20px rgba(0, 0, 0, .15)` shadow, `8px` padding, `480px` minimum width,
  and `90vw / 90vh` maximum bounds.
- The horizontal message row uses `0 8px 0 12px` padding. A severity icon is
  `24px`; message content after it adds `12px` leading padding. The heading is
  `14px`, weight `600`, with a `22px` minimum line. Detail text uses `20px`
  line height. Input and checkbox rows add `15px` top padding. The button row
  adds `20px` top padding.
- At the narrower vertical layout, use `350px` minimum width, stack the message
  and icon, enlarge the icon to `64px`, and make buttons fill the row.
  Horizontal buttons size to content and ellipsize long labels.
- Keep focus inside the dialog and restore prior focus on close. Focus and
  select the first input when present; otherwise focus the primary action.
  `Escape` and the close control invoke cancel unless disabled. Pointer down on
  the blocker returns focus to the dialog instead of dismissing it. `Enter` in
  an input invokes the first non-cancel action.

## Toast notification

Use a toast for brief, nonmodal information, warning, or error status that also
remains available in the notification center. Do not show toasts while the
center is open or for silent notifications.

- Compose a severity icon, message, optional source, trailing actions and close
  action, optional expanded details and buttons, and optional bottom-edge
  progress. The collapsed message is one `22px` line with ellipsis; expanded
  messages wrap.
- Use notification foreground/background, toast border, link, and notification
  severity roles. The surface uses an optional `1px` border, `4px` radius, and
  `0 0 12px rgba(0, 0, 0, .14)` shadow.
- Each item uses `10px 5px` padding. Reserve a `16px × 22px` severity slot,
  render the glyph at `18px`, and use `4px` margins on both inline sides. The
  expanded details row adds `5px` leading padding.
- Support bottom-right, bottom-left, and top-right placement. The visible toast
  sits `7px` from the inline or top edge. Bottom placement sits `29px` above the
  window edge with the `22px` status bar, or `7px` without it.
- Cap width at `450px` and at viewport width minus `16px`. Show at most three
  toasts, newest first; hide older items that do not fit the available height.
- Non-sticky information, warning, and error toasts leave the visible stack
  after `10s`, `12s`, and `15s`. Restart the timeout while the window is
  unfocused, the toast is hovered, or it contains focus. Sticky notifications
  stay visible. The close control removes the notification; an action also
  closes it unless that action explicitly keeps it open.

## Notification center

Use the notification center as persistent, nonmodal notification history. It
replaces the toast stack while open.

- Use a `35px` header with an uppercase `11px` title and
  clear/configure/hide actions, followed by the list. A collapsed notification
  row is `42px` high. Expansion adds wrapped message height and, when source or
  buttons exist, another `42px` row.
- Use notification foreground/background, notification-center border,
  center-header roles, link, separator, and notification severity roles. The
  surface uses a `1px` border, `4px` radius, and
  `0 0 12px rgba(0, 0, 0, .14)` shadow. Separate notifications with a `1px`
  notification-border rule.
- Cap the center at `450px × 400px`, then reduce it to available workbench
  space. Use a `7px` left or right inset and `7px` top inset. The bottom inset is
  `29px` with the status bar and `11px` without it.
- Showing the center focuses the first item. Hiding it restores editor focus
  when focus was inside. Hide it when no notifications remain. Clear-all skips
  active-progress notifications; those rows also omit their close action.

## Progress

Use determinate progress when a total is known and indeterminate progress when
it is not. Prefer a stable edge of the owning surface: between a quick-input
header and results, at a notification's bottom edge, or along a view or editor
edge.

- Use a clipped `2px`-high, full-width track and a `2px`-high progress bit.
  Determinate width is the completed fraction clamped to the total;
  indeterminate width is `2%`.
- Use the semantic progress-bar background. Determinate width transitions use
  `100ms linear`; indeterminate travel takes `4s`. Completion resets after
  `200ms`; stop resets immediately.
- Keep the track inline. Do not wrap it in another elevated surface.

## Spinner

Use a spinner for compact local work without a meaningful completed fraction.
Reserve its icon slot so nearby text and actions do not shift.

- Use a `16px × 16px` inline grid of six `2px` circular dots: two columns by
  three rows with `2px` gaps. The cascade runs in six steps over `1820ms`; the
  ring variant runs in four steps over `1200ms`. Under reduced motion, show all
  dots without animation.
- Inherit `currentColor` from the host state.
- Replace an action's leading icon inside the same reserved slot. Use a progress
  bar when the host can report a meaningful fraction.

## Severity indicator

Severity is an inline companion to a message, not a separate card.

- Map information to the information-circle glyph, warning to the warning
  triangle, and error to the error-circle glyph.
- Use problem information/warning/error icon roles in diagnostic surfaces and
  notification information/warning/error icon roles in notifications.
- Keep the glyph in the host's reserved icon slot; notification rows reserve
  `16px`. The host owns focus, expansion, progress, actions, and dismissal.

## Inline confirmation

Use an inline confirmation when a decision belongs to an ongoing local workflow
and that context should remain visible. It is persistent and nonmodal.

- Compose a title row with optional toolbar, scrollable message region, and
  button row. Use the host request background for the message and the request
  border for the shell and dividers.
- The shell uses a `1px` border, `6px` radius, and `8px` bottom margin without a
  floating shadow. Divide title, message, and optional embedded regions with
  `1px` rules.
- The title uses `4px 8px` padding, `13px` semibold text, and `10px` between
  title and toolbar. The message uses `6px 9px 0`; paragraphs use `9px` bottom
  spacing. The button row uses `4px 8px` padding and wraps with `4px` column
  gaps.
- Keep it present until an action or host update replaces it. Disable only the
  actions whose choices are unavailable.

## View welcome state

Use a welcome state when a view has no meaningful content and can explain how
to create or reveal it. Replace the normal view content; do not render a
floating centered card.

- Use short paragraphs, inline links, and primary actions. A line containing
  only one link becomes a button; a link inside a sentence stays inline. Show
  conditional content only while its host context matches.
- Fill the view and use a vertical column whose children are horizontally
  centered, with `0 20px 1em` padding. Give consecutive blocks `1em` top
  spacing. Action containers and buttons cap at `300px`.
- Above `640px`, allow the action container to use the full width while buttons
  retain the `300px` cap. Scroll vertically and hide horizontal overflow.
- Inherit the view foreground/background and semantic link/button roles. Show
  the state only while the host reports no meaningful content.
