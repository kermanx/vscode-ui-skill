# Workbench shell

Use this reference for a desktop workbench with persistent navigation, one or more editor groups, and optional supporting regions. Model the shell as semantic regions and state, not as a collection of unrelated cards.

## Composition

Build the outer shell as a vertical grid:

1. custom title bar and optional banner;
2. one flexible middle row;
3. optional status bar.

The middle row is a nested grid. The activity rail stays adjacent to the primary sidebar. The primary and auxiliary sidebars occupy opposite sides of the editor. A vertical panel sits immediately beside the editor on its configured side. A horizontal panel sits above or below the editor branch.

The banner normally follows the title bar. In a web window without a window-controls overlay, it precedes the title bar. Treat native window chrome as platform-owned.

For a horizontal panel, make its span an explicit layout state:

| Alignment | Panel span | Full-height sidebars |
| --- | --- | --- |
| Center | Editor only | Both |
| Justify | Editor and both sidebars | Neither |
| Left | Editor and the physical left sidebar | Physical right |
| Right | Editor and the physical right sidebar | Physical left |

Represent editor groups as another nested split grid. Keep every flexible grid or flex descendant shrinkable with `min-width: 0` and `min-height: 0`; let the region constraints below supply the real minima.

## Geometry profile

Classic is the baseline profile. Modern UI is an optional profile; when it is enabled, use its framing and density rules together instead of mixing them with Classic spacing.

| Metric | Classic | Modern UI | Modern compact density |
| --- | ---: | ---: | ---: |
| Custom title bar with command center | 35px | 35px | 35px |
| Banner | 26px | 26px | 26px |
| Part title, header, or footer | 35px | 32px | 32px |
| Collapsible view header | 22px | 28px | 28px |
| Status bar | 22px | 28px | 26px |
| Default scrollbar | 10px | 8px | 8px |
| Top-level inter-region gap | 0px | 4px | 0px |
| Window perimeter | Profile-owned | 4px | 4px |
| Structural frame | Profile-owned | 1px / 8px radius | 1px / outer cluster corners only |

A custom browser title bar without the command center may reduce to 30px. The two compact modes are independent: compact **layout density** joins structural regions and tightens vertical chrome; compact **activity rail** changes rail actions and icons.

## Top chrome

Split the title bar into leading, center, and trailing zones:

- Leading: application/menu navigation. Give the menu bar a 36px minimum inline extent.
- Center: command center or ellipsized window/workspace title. It must be allowed to shrink.
- Trailing: global actions, layout controls, and platform window controls.

The command center is 22px high, `38vw` wide up to 600px, with a 1px stroke, 6px radius, and 6px inline margin. Truncate its label rather than expanding the title bar. In the Modern treatment it is visually transparent at rest; hover and active interaction reveal the interactive surface and border.

The banner is a fixed 26px single line. Its icon and actions do not shrink; the message does and uses ellipsis. Keep dismissal at the far end.

Anchor status items in leading and trailing groups. Let the leading group grow; lay out the trailing group from the trailing edge so center-nearest items wrap first when space runs out. Cap an individual item at `40vw`. Modern UI adds 6px inline and 2px block padding; compact density uses the 4px cluster perimeter as its inline padding.

## Activity rail and sidebars

Use a fixed-width rail and independently resizable sidebars.

| Activity mode | Action box | Icon | Gap between actions |
| --- | ---: | ---: | ---: |
| Classic standard | 48px | 24px | 0 |
| Classic compact rail | 28px in a 36px rail | 16px | 0 |
| Modern standard, default density | 36px | 24px | 8px |
| Modern standard, compact density | 36px | 24px | 4px |
| Modern compact rail | 28px | 16px | 0 |

In Modern standard density, the framed rail is 44px wide before its 4px outer window perimeter; compact density reduces the frame to 40px. Hovered and selected items use a 32px visual surface at standard size or 24px at compact rail size, with a 4px radius.

When the Modern activity rail touches the primary sidebar, connect them: use no gap, square their facing corners, and draw exactly one 1px seam. Keep the outer perimeter corners at 8px. This connected seam applies in both Modern densities.

The primary sidebar is the principal navigation/detail column. The auxiliary sidebar is an optional secondary column on the opposite side. Both have a 170px minimum width. Preserve their last visible widths across hide/show.

## Editor and panel

The editor is the primary flexible surface. Its default group minimum is 220px by 70px; an active editor may raise or lower those constraints. Resize the active group first. If that group cannot move farther along the requested axis, resize the whole editor region.

The panel is supporting horizontal or vertical work. Its minimum is 300px wide when vertical and 77px high when horizontal. Preserve its last visible extent across hide/show.

In Modern UI, frame the editor as one structural region—including its tabs, breadcrumbs, and content—and frame each sidebar and panel at the same level. Do not turn editor groups, view bodies, or ordinary rows into nested outer cards.

## Part and view anatomy

A part may contain a title, an optional secondary header, scrollable content, and an optional footer. The visible chrome bands consume the profile height in the geometry table; content receives the remaining block size.

Classic part titles use 8px inline outer padding, 12px before the label, and 5px before title actions. Modern titles use 4px inline outer padding, 8px before the label, and 4px before actions.

A collapsible view header is a control, not decoration. Support pointer activation, `Enter`/`Space` toggling, `Left` to collapse, and `Right` to expand. A collapsed view occupies only its header; an expanded view adds its constrained body. In Modern UI, use a 4px header radius and replace a full-width separator with a 1px rule inset 4px from each side. Do not draw a top rule on the first view in a vertical stack.

## Modern framing

Default Modern density uses separate framed structural regions with 4px gaps. Compact density uses 0px gaps and makes adjacent parts a connected cluster. In the cluster, keep only the window-facing 8px corners and a single 1px seam between neighbors.

Assign the 4px perimeter to the outermost visible region at each window edge; do not double it as both a region margin and a shell padding. If both title and banner are absent, expose the 4px top perimeter. Keep the status bar outside the connected middle cluster.

Use semantic theme roles rather than literal colors:

- the active title-bar surface for the shell backdrop;
- surface background, foreground, and border for structural framing;
- region-specific title, sidebar, panel, editor, and status roles for content;
- semantic hover, active, focus, and contrast-border roles for interaction.

## Resize, collapse, and maximize

Use nested resizable tracks rather than absolute positioning. Fixed bands keep their profile heights; each flexible region clamps at its minimum and maximum.

Automatic container resize follows priority **within each split**: High children absorb size changes before Normal children, then Low children. The editor is High, the panel is Normal, and both sidebars are Low. Apply this per nested split, not as a global flat ordering.

User sash dragging is constraint-led:

- The primary sidebar, auxiliary sidebar, and panel can snap closed. After a visible region reaches its minimum, another half-minimum of drag hides it; reversing through the same threshold restores it. The primary sidebar always accepts snapping; a hidden auxiliary sidebar or panel can snap open when it contains a visible view container.
- The editor is snap-enabled only when panel alignment is Center.
- A hidden region retains its last visible extent and restores that extent when shown.

Do not leave both editor and panel hidden during ordinary operation. Maximizing a supported panel hides the editor and restores both the editor and saved panel extent on exit. Panel maximize is supported for vertical panels and center-aligned horizontal panels. Maximizing the auxiliary sidebar hides the primary sidebar, panel, and editor, then restores their prior visibility and the auxiliary width on exit.

## Sashes and scrollbars

The default resize hit target is 4px, centered on the boundary. Delay the hover highlight by 300ms and transition it over 100ms. Keep the hit target independent of the visible separator so a 1px seam remains easy to drag; in Modern UI, a top-level sash fills at least the 4px inter-region gap.

Only top-level Modern sashes get a persistent grip: three 2px dots with 5px center spacing. Hide the grip during hover/drag, in compact density, and on internal view or editor-group sashes. On hover or drag, use the full clipped boundary highlight instead.

Use automatic scrollbars inside independently scrolling regions. The default thickness is 10px in Classic and 8px in Modern UI; an explicitly sized component keeps its override. Modern scrollbar thumbs use a 4px radius.

## Implementation checklist

- Region visibility, side, panel orientation, panel alignment, density, and maximize state drive the grid template.
- Title/view actions stay at the trailing edge; labels shrink and ellipsize.
- Every scroll owner has a bounded grid track and does not enlarge the shell.
- One boundary owns each seam, perimeter, and Modern cluster corner.
- Keyboard operation and visible focus remain available for view headers, commands, and resize controls.
