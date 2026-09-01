# Workbench shell

Use this reference for the current Classic desktop workbench: persistent navigation, one or more editor groups, and optional supporting regions. Model the shell as semantic regions and layout state, not as unrelated containers.

## Composition

Build the outer shell as a vertical grid:

1. custom title bar and optional banner;
2. one flexible middle row;
3. optional status bar.

The middle row is a nested grid. When the activity bar is a vertical rail, keep it adjacent to the primary sidebar. Place the primary and auxiliary sidebars on opposite sides of the editor. A vertical panel sits immediately beside the editor on its configured side. A horizontal panel sits above or below the editor branch.

The banner normally follows the title bar. In a web window without a window-controls overlay, it precedes the title bar. Treat native window chrome as platform-owned.

For a horizontal panel, make its span an explicit layout state:

| Alignment | Panel span | Full-height sidebars |
| --- | --- | --- |
| Center | Editor only | Both |
| Justify | Editor and both sidebars | Neither |
| Left | Editor and the physical left sidebar | Physical right |
| Right | Editor and the physical right sidebar | Physical left |

Represent editor groups as another nested split grid. Keep every flexible grid or flex descendant shrinkable with `min-width: 0` and `min-height: 0`; let the region constraints below supply the real minima.

Keep top-level parts flush with no inter-region gap or outer padding. Use region borders as separators; retain the title-bar shadow and the activity-bar shadow when the sidebar is hidden or the activity bar is on the right. Structural regions remain rectangular; component-level controls such as the command center use their own geometry.

## Geometry

| Metric | Value |
| --- | ---: |
| Custom title bar with command center | 35px |
| Custom title bar without command center or window-controls overlay | 30px |
| Banner | 26px |
| Part title, header, or footer | 35px |
| Collapsible view header | 22px |
| Status bar | 22px |
| Default scrollbar | 10px |
| Top-level inter-region gap | 0px |

## Top chrome

Split the title bar into leading, center, and trailing zones:

- Leading: application and menu navigation. Give the menu bar a 36px minimum inline extent.
- Center: command center or ellipsized window/workspace title. It must be allowed to shrink.
- Trailing: global actions, layout controls, and platform window controls.

The command center is 22px high, `38vw` wide up to 600px, with a 1px stroke, 6px radius, and 6px inline margin. Truncate its label rather than expanding the title bar. Use its background and border at rest, active roles on hover, and inactive roles when the window is inactive.

The banner is a fixed 26px single line. Its icon, message actions, and dismissal control do not shrink; the message does and uses ellipsis. Keep dismissal at the far end.

Anchor status items in leading and trailing groups. Let the leading group grow; lay out the trailing group from the trailing edge so center-nearest items wrap first when space runs out. Cap an individual item at `40vw`.

## Activity bar and sidebars

Use a fixed-width activity rail and independently resizable sidebars.

| Activity rail size | Rail | Action box | Icon | Gap between actions |
| --- | ---: | ---: | ---: | ---: |
| Default | 48px | 48px | 24px | 0 |
| Compact | 36px | 28px | 16px | 0 |

The primary sidebar is the principal navigation/detail column. The auxiliary sidebar is an optional secondary column on the opposite side. Both have a 170px minimum width. Preserve their last visible widths across hide/show.

## Editor and panel

The editor is the primary flexible surface. Its default group minimum is 220px by 70px; an active editor may raise or lower those constraints. Resize the active group first. If that group cannot move farther along the requested axis, resize the whole editor region.

The panel is supporting horizontal or vertical work. Its minimum is 300px wide when vertical and 77px high when horizontal. Preserve its last visible extent across hide/show.

## Part and view anatomy

A part may contain a title, an optional secondary header, scrollable content, and an optional footer. Every visible title, secondary header, or footer consumes 35px; content receives the remaining block size.

Part titles use 8px inline outer padding, 12px before the label, and 5px before title actions. Keep the title label on one line with ellipsis. Put actions at the trailing edge.

A collapsible view header is a 22px control, not decoration. Support pointer activation, `Enter`/`Space` toggling, `Left` to collapse, and `Right` to expand. A collapsed view occupies only its header; an expanded view adds its constrained body. Use the header border between stacked views rather than enclosing each view in another structural frame.

Use semantic theme roles rather than literal colors:

- title-bar active and inactive surfaces and foregrounds;
- activity-bar background, foreground, active border, badge, and region border;
- sidebar title, sidebar body, auxiliary sidebar, panel, editor, and status-bar roles;
- semantic hover, active, focus, sash, and contrast-border roles.

## Resize, collapse, and maximize

Use nested resizable tracks rather than absolute positioning. Fixed bands keep their stated heights; each flexible region clamps at its minimum and maximum.

Automatic container resize follows priority **within each split**: High children absorb size changes before Normal children, then Low children. The editor is High, the panel is Normal, and both sidebars are Low. Apply this per nested split, not as a global flat ordering.

User sash dragging is constraint-led:

- The primary sidebar, auxiliary sidebar, and panel can snap closed. After a visible region reaches its minimum, another half-minimum of drag hides it; reversing through the corresponding threshold restores it.
- The primary sidebar always accepts snapping. A hidden auxiliary sidebar or panel can snap open when it contains a visible view container.
- The editor is snap-enabled only when panel alignment is Center.
- A hidden region retains its last visible extent and restores that extent when shown.

Do not leave both editor and panel hidden during ordinary operation. Maximizing a supported panel hides the editor and restores both the editor and saved panel extent on exit. Panel maximize is supported for vertical panels and center-aligned horizontal panels. Maximizing the auxiliary sidebar hides the primary sidebar, panel, and editor, then restores their prior visibility and the auxiliary width on exit.

## Sashes and scrollbars

The default sash hit target is 4px, centered on the split boundary. Delay the hover highlight by 300ms and transition it over 100ms. Keep the hit target independent of any 1px visible separator so the boundary remains easy to drag. On hover or drag, highlight the full sash boundary; do not add a persistent grip.

Use automatic scrollbars inside independently scrolling regions. The default thickness is 10px; an explicitly sized component keeps its override.

## Implementation checklist

- Region visibility, side, panel orientation, panel alignment, and maximize state drive the grid template.
- Structural parts are flush, square, and separated by one owned boundary rather than gaps or outer frames.
- Title and view actions stay at the trailing edge; labels shrink and ellipsize.
- Every scroll owner has a bounded grid track and does not enlarge the shell.
- One boundary owns each seam.
- Pointer, keyboard, and visible focus behavior remain available for view headers and commands.
