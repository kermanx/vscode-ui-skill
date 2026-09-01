# Interaction states

Treat state as component semantics, not as a stack of color overlays. A row can be selected without being focused; a tab can be active inside an inactive group; a window can be inactive while the underlying document state remains current. Keep those facts in the DOM, then let the component choose the matching semantic theme roles.

Resolve overlapping states per component. For these Classic workbench surfaces, use the verified behavior below instead of assuming one shared precedence order.

## Portable state markers

- Use native pseudo-classes for transient input state: `:hover`, `:active`, and `:focus-visible`.
- Use native or role-backed state attributes for durable state: `disabled` / `aria-disabled`, `checked` / `aria-checked`, `aria-pressed`, `aria-selected`, `aria-expanded`, `readonly` / `aria-readonly`, and `aria-busy`.
- Put owner state on the owner: the list's focus, the editor group's activity, and the window's activity are separate facts. A class or data attribute may mirror those facts when a descendant needs to style against them.
- Use explicit markers for visual states without a native selector, such as dirty, drag source, drop-over, insert-before, insert-after, and severity.

## Rows, trees, and tabs

| State | Treatment |
|---|---|
| Rest | Use the component's base foreground and background. In custom view rows, keep optional row actions out of view; persistent facts such as checked, dirty, or read-only remain independent from hover. |
| Hover | Use hover foreground/background only on an otherwise neutral list or tree row. Do not repaint selected or focused rows, and suspend ordinary row hover feedback while the list is dragging or showing a drop target. |
| Focus | Lists and trees put the focus outline on the focused row rather than around the whole container. Use the active focus outline while the list has DOM focus; use the inactive focus outline when supplied after focus leaves the list. |
| Selected | Keep selection independent from focus. A selected row uses the active-selection roles while its owning list has DOM focus, and the inactive-selection roles otherwise. Hover does not replace either selection palette. |
| Focused + selected | Use the dedicated combined foreground, background, and outline roles when supplied. For the outline only, the verified fallback order is combined focus-and-selection, then selection, then focus. |
| Inactive surface or window | Preserve the underlying selection/current marker. Lists become visually inactive when the list lacks DOM focus; tabs use unfocused roles when their editor group is inactive; window chrome uses its own inactive state driven by actual window focus. Do not collapse these into one global flag. |
| Expanded | Mark only collapsible rows with `aria-expanded`. Keep the disclosure indicator present and change its direction between collapsed and expanded; loading may temporarily replace that indicator with a spinner. |

Tabs have their own state model:

- Active means the editor currently shown; selected can also include other tabs in a multi-selection. The active tab keeps the active treatment. In the active group, selected non-active tabs use the selected foreground and background; a selected tab may use the selected top border when no active top border occupies that slot.
- The focused or unfocused hover palette applies to every tab that is not selected, including an active tab when it is not selected. Classic tabs do not have a separate active-hover background.
- An active editor in an inactive group uses the unfocused-active foreground, background, and border roles; other tabs in that group use unfocused-inactive roles.
- A configured modified-tab strip takes the top-border slot, so the ordinary active/selected top border is not added. The modified strip is `2px` and yields while the tab itself shows focus.

## Controls and menus

| State | Treatment |
|---|---|
| Hover | Text buttons switch to their hover background; the same background is used as feedback when those buttons receive focus. Toggle hover has a separate hover role from its checked fill. |
| Pressed / active | Keep transient `:active` separate from persistent state. The standard text-button palette has no separate pressed color. Persistent toggle buttons use `aria-pressed` or checked state; tabs and navigation items use their active/current marker. |
| Disabled | Mark the control disabled, stop activation, and use the default cursor. Base buttons and compact toggles use `0.4` opacity; icon action labels use `0.6`, so opacity is component-specific rather than a global constant. |
| Checked | A toggle uses the active-option background, foreground, and border. A checkbox uses checkbox roles and a check glyph. A checked menu item keeps the normal focused/menu palette and adds its checkmark; a checked navigation item uses its active fill. |
| Severity / validation | Inputs keep separate info, warning, and error foreground/background/border roles. The severity border replaces the base input border; while a severity is present, suppress the ordinary focus outline so the validation decoration remains the border signal. |
| Read-only | Model read-only separately from disabled. Keep the surface's normal active, selection, hover, and focus styling; disable mutating actions through capability state instead of dimming the entire editor or row. |

For menus, focus is the selection treatment: focused items use the menu selection foreground, background, and border. Checked adds a checkmark without replacing that focus treatment. Disabled uses the disabled foreground. Pointer focus omits the selection outline, while keyboard-visible focus retains it; high-contrast themes keep the outline for either input mode.

## Work and drag states

| State | Treatment |
|---|---|
| Busy / loading | Use a `2px` progress bar for surface-level work: determinate work changes the bar width and indeterminate work animates. For one asynchronous tree node, replace its disclosure indicator with an inline spinner rather than restyling the row. Keep busy semantics on the affected surface or control. |
| Drag source | Mark dragging on the source owner, use a drag preview, and suspend its ordinary hover treatment. Source and target are separate states; the source does not inherit the drop-target fill. |
| Drop-over | Apply the dedicated drop background to the actual row, rows area, or whole list target. In lists and trees this target fill overrides ordinary hover, focus, and selection backgrounds for the duration of the drag. |
| Insert before / after | Use an edge marker rather than a row fill. List and tree insertion uses a `1px` line at the relevant top or bottom edge; editor-tab insertion uses a `2px` vertical line between tabs. |
| Dirty / modified | Keep dirty independent from active and selected. Editor tabs show a persistent modified dot in the action slot; hovering that action reveals the close affordance. When modified-tab highlighting is enabled, use the `2px` top strip with roles for active/inactive tab and active/inactive group. Do not show dirty while saving. |

## Reveal on intent

Keep secondary actions quiet at rest. Reveal them through both pointer intent and keyboard-reachable focus; never make hover the only path.

- List/tree row actions appear when the row is hovered, selected, or focused.
- Settings-row toolbars reveal on row pointer intent, row focus, toolbar hover, or an active toolbar item.
- Tab actions reveal for the active tab, tab hover, action focus, dirty state, or sticky state. The same active, hover, dirty, and sticky cases render dimmed in an inactive editor group.

Persistent status is not a reveal-on-intent affordance: checked, dirty, validation, and busy indicators remain visible for as long as their state is true.
