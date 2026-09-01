# Accessibility

Read this reference only when the user explicitly requests improved, audited, or comprehensive accessibility support.

## Keyboard access

- Every pointer action must have a keyboard path. Keep the tab order logical and keep composite-widget navigation scoped to the active widget.
- Use `Tab` and `Shift+Tab` to enter, leave, and move between controls. Within lists, trees, tab lists, menus, and toolbars, use the widget's arrow-key model instead of adding every item to the page tab order.
- Custom buttons and toggles must respond to both `Enter` and `Space` and expose `aria-disabled` when disabled. Tab-order behavior is component-specific: a base button may remain tabbable while a toggle is removed from the tab order. Match the chosen component instead of imposing one rule on every custom control.
- Lists support arrow and page navigation; `Enter` selects the focused item. Trees add `Left` and `Right` for collapse, parent, expand, and child navigation.
- Do not reserve an action for hover. Make context actions, expansion, selection, and dismissal reachable from the keyboard.

## Names, roles, and states

- Use native controls when their semantics fit. A custom widget must provide the equivalent role, keyboard behavior, name, and state.
- Every interactive element needs an accessible name. For icon-only actions, name the action, not the icon. Associate existing visible text through `aria-labelledby` or `aria-describedby` when possible.
- Expose the state users need to understand the control: `aria-expanded`, `aria-selected`, `aria-checked`, `aria-pressed`, `aria-disabled`, and `aria-multiselectable` where each state applies.
- Hide decorative or redundant icons, separators, and visual duplicates from the accessibility tree.
- Keep DOM state synchronized after every interaction and after recycled content is rebound to new data.

## Virtualized collections

- Give the focusable collection an accessible name and the correct composite role. Keep DOM focus on the collection and point `aria-activedescendant` only to the currently rendered focused item; remove it when that item is not rendered.
- Give every rendered item an ID, an item role, and an accessible label. Reflect selection, checked state, hierarchy level, and expansion on the item that owns that state.
- Derive `aria-setsize` and `aria-posinset` from the collection model. The standard list defaults to the list length and the item's one-based model index; an accessibility provider may supply a different peer count and position. Recompute both when that model changes.
- For trees, expose `aria-level`; expose `aria-expanded` only on collapsible nodes. Position and set size are based on visible siblings, not the number of recycled DOM rows.

## Announcements

- Use an assertive `alert` only for urgent information that must interrupt current speech, such as a critical error or warning.
- Use a polite `status` for progress, result counts, loading, selection feedback, and other non-urgent updates. Prefer polite delivery unless interruption is necessary.
- Keep announcements concise and atomic. Do not announce an event twice through overlapping live regions, signals, or visible controls.
- A purely decorative loading indicator is hidden from assistive technology. If the indicator is the only busy-state message, give it status semantics and a useful label.

## Focus and modals

- Show focus with the semantic focus color. Base workbench controls use a solid `1px` outline with `-1px` offset; checkboxes use a `2px` outer offset. Match component-specific offsets where they differ.
- Do not replace the Classic workbench's general `:focus` treatment with a global keyboard-only rule. Use `:focus-visible` only for a component whose established behavior distinguishes keyboard and pointer focus, and never suppress its keyboard-visible indicator.
- A modal has dialog semantics, `aria-modal="true"`, a name, and a description. Move initial focus to the first input when present; otherwise use the primary action or the dialog itself.
- Trap `Tab` and `Shift+Tab` within a modal, allow `Escape` to dismiss when dismissal is available, and restore focus to the element that opened it.
- Preserve native editing keys inside text inputs and editable content embedded in a dialog or composite widget.

## High contrast and reduced motion

- Verify dedicated high-contrast light and high-contrast dark presentations in addition to regular light and dark themes. Keep focus, selection, active, disabled, error, and warning states distinguishable without relying on a subtle fill alone.
- Detect forced-colors mode and retain visible borders and focus indicators instead of assuming regular theme colors or shadows will survive.
- Honor `prefers-reduced-motion: reduce`. Gate nonessential transitions and looping animations behind motion permission, and keep loading or state feedback understandable when animation is removed.

## Verification

- Complete every flow with keyboard only, including opening and closing overlays, changing composite selection, and reaching secondary actions.
- Inspect the accessibility tree for names, roles, relationships, and live states. Verify the flow with a screen reader.
- Scroll and filter virtualized collections; confirm active descendants always exist and positions describe the logical collection rather than the rendered window.
- Open and close each modal from multiple launch points; confirm initial focus, focus containment, `Escape`, and focus restoration.
- Test regular light, regular dark, high-contrast light, high-contrast dark, forced-colors mode, and reduced motion.
