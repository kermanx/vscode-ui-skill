# Collections

Lists, trees, and tables are dense workbench navigation surfaces. Keep their structure flat, their state explicit, and their render cost proportional to what is visible. Feature renderers may add labels, counts, actions, or editors, but the collection owns navigation, focus, selection, scrolling, filtering, and item identity.

## Choose the collection family

| Family | Use it for | Structural difference |
| --- | --- | --- |
| List | A flat sequence of selectable items or commands | One virtual row axis; no disclosure or column contract. |
| Tree | Parent/child data that users expand, collapse, search, or trace by ancestry | Adds depth, disclosure, optional indent guides, recursive filtering, and optional sticky ancestors. |
| Table | Comparable records whose values need stable column alignment | Adds a separately rendered header whose column widths are shared with every visible row. The body retains list navigation and virtualization. |

Do not use a table merely to align one trailing badge. A list or tree row already supports leading, primary, metadata, and action slots without implying column comparison.

## Ownership and composition

Keep these layers distinct:

1. **Collection state:** ordered items, stable identities, focus, selection, anchor, scroll position, expanded nodes, filter query, and any active edit session.
2. **Viewport:** the bounded scroll owner and a positioned rows layer.
3. **Row template:** reusable DOM for one item kind. A renderer fills its slots and clears item-specific listeners and content before reuse.
4. **Feature content:** icon, primary label, description, count, decoration, inline actions, or an inline editor.

A reusable row template has this semantic anatomy, in order:

1. optional disclosure control;
2. optional leading icon;
3. a flexible label region with a primary name and optional suffix or description;
4. optional trailing decoration;
5. optional trailing actions.

Focus and selection belong to collection state; render them onto the row instead of storing them in the template.

Omit slots that the family or item kind does not use. Keep the row a single line in compact file, result, editor, and symbol collections. Settings are a verified exception: their descriptions and controls form a variable-height body beneath the title.

Organizational rows are their own item kind. A section header or separator is not selectable or activatable simply because it occupies a row. A collapsible group is different: it is an interactive tree node and keeps its disclosure state. This distinction allows one collection to mix headers and actionable rows without teaching navigation that every visual row is a command.

## Compact metrics

The `22px` row is a scoped compact workbench pattern, not a global list height. It is used by Explorer items, Open Editors groups and items, Search result headings, folders, files, and matches, and the built-in document-symbol Outline groups and symbols.

```css
.collection--compact {
  --collection-row-height: 22px;
}

.collection--compact .collection-row {
  height: var(--collection-row-height);
  line-height: var(--collection-row-height);
}
```

For the shared compact icon-label treatment, the leading file/icon slot is `16px` wide by `22px` high with a `6px` trailing gap. A standard tree disclosure lane is `16px` wide with `6px` trailing padding. Do not combine those into one oversized generic gutter: disclosure and content icon are separate slots.

Standard workbench trees start depth-one content with an `8px` indent and add `8px` per deeper level. That step is configurable from `4px` through `40px`; keep the disclosure lane fixed while changing the depth step. These metrics do not apply to settings rows or another feature that deliberately replaces the compact tree presentation.

## Labels, matches, and metadata

Make the primary label the row's shrinkable region:

```css
.collection-row {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
}

.collection-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-icon,
.collection-decoration,
.collection-actions {
  flex: 0 0 auto;
}
```

The shared icon-label primitive establishes these secondary treatments:

- a suffix follows the name at `0.7` opacity;
- a description follows with a `0.5em` leading gap, `0.9em` type, and `0.7` opacity;
- a trailing after-decoration uses `0.9em` type, `0.75` opacity, and semibold weight;
- descriptions return to full opacity on focused or selected rows so selection does not make supporting text harder to read.

Use a description for context such as a parent path or symbol detail, a suffix for text grammatically attached to the name, and a decoration for status or aggregate data that belongs at the trailing edge. Counts in Explorer folders, Search results, and Outline problem markers verify the trailing-decoration pattern. Do not put all three into every row.

Render matched substrings as spans inside the name or description; do not replace the label with an unrelated badge. Support more than one match range. Use `--vscode-list-highlightForeground` for a neutral row and `--vscode-list-focusHighlightForeground` when the row is focused. A filter UI may additionally use `--vscode-list-filterMatchBackground` and `--vscode-list-filterMatchBorder` for its bounded match treatment.

## Row states

Focus and selection are independent collection facts. A selected row uses the active-selection roles while its collection has keyboard focus and the inactive-selection roles otherwise. A focused but unselected row uses focus roles; combined focus and selection may use the dedicated combined outline. Apply neutral hover only when the row is neither focused nor selected.

Use the existing semantic roles rather than literal colors:

| State | Theme roles |
| --- | --- |
| Focused row | `--vscode-list-focusBackground`, `--vscode-list-focusForeground`, `--vscode-list-focusOutline` |
| Active selection | `--vscode-list-activeSelectionBackground`, `--vscode-list-activeSelectionForeground`, `--vscode-list-activeSelectionIconForeground` |
| Inactive selection | `--vscode-list-inactiveSelectionBackground`, `--vscode-list-inactiveSelectionForeground`, `--vscode-list-inactiveSelectionIconForeground` |
| Inactive focus | `--vscode-list-inactiveFocusBackground`, `--vscode-list-inactiveFocusOutline` |
| Neutral hover | `--vscode-list-hoverBackground`, `--vscode-list-hoverForeground` |
| Drop over / between | `--vscode-list-dropBackground`, `--vscode-list-dropBetweenBackground` |
| Error / warning / deemphasized | `--vscode-list-errorForeground`, `--vscode-list-warningForeground`, `--vscode-list-deemphasizedForeground` |

Keep outlines inside the row so they are not clipped by adjacent virtual rows. Drop-over temporarily replaces ordinary row backgrounds; drop-between is a `1px` edge marker rather than a selection fill.

## Inline actions and editing

Keep row actions at the trailing edge and reveal optional actions on row hover, focus, or selection. Preserve actions for persistent states that need them: Open Editors keeps the close or unpin affordance available for dirty and sticky items, while Settings keeps its toolbar available when the toolbar itself is active. Using `visibility` for the quiet state preserves the row's label/action geometry.

At narrow widths, keep the primary label shrinkable and the action container fixed. Search results hide a count badge while hover or focus reveals actions, preventing those actions from covering the result name.

Inline rename is an explicit collection state, not an input inserted opportunistically by the row renderer. Explorer verifies this sequence:

1. preserve the leading resource icon and replace only the displayed label with an input;
2. initialize selection for the likely edit target: the base name for a file, all text for a folder;
3. validate while typing and show the message at the editor;
4. commit with `Enter`; cancel with `Escape`; define blur behavior deliberately;
5. restore the ordinary label template when the edit session ends.

Because virtual rows are reusable, the collection must retain the edit target and value even if scrolling causes the original row DOM to be recycled.

## Trees

A tree row composes, in order, an indent layer, disclosure control, and overflow-clipped content. Indent guides are `1px` strokes with three modes: `none`, `onHover`, and `always`. In `onHover`, active ancestry guides remain visible and hovering the tree reveals all inactive guides; `always` keeps all guides visible. Use `--vscode-tree-indentGuidesStroke` for active guides and `--vscode-tree-inactiveIndentGuidesStroke` for inactive guides.

Filtering and type navigation are separate behaviors:

- type navigation moves focus and reveals the next matching row without changing collection membership;
- tree highlight mode retains the visible structure and marks matching ranges;
- tree filter mode removes nonmatching branches but keeps a nonmatching ancestor when a descendant matches.

Sticky rows are rendered copies of the same ancestor templates, not a second heading design. They keep their own focus and context-menu handling. The verified default cap is `7` sticky items, never fewer than `1`, and the sticky stack is additionally constrained to `40%` of the viewport. The final sticky ancestor may be pushed out as the next branch boundary arrives. Use the list background as the fallback sticky surface and the normal list hover treatment for a hovered sticky row.

## Tables

Compose a table as a resizable header above a virtual list body. A visible row contains one cell per column in the same order as the headers. Column resizing updates the measured width of the header and every currently rendered cell; new virtual rows receive the current widths when rendered.

Headers and cells do not wrap: they shrink within their assigned width and ellipsize. Column minima and maxima belong to the table instance because no universal column width is verified. Optional separators use `--vscode-tree-tableColumnsBorder`. Optional zebra striping uses `--vscode-tree-tableOddRowsBackground`, but do not apply the odd-row fill over focused, selected, or hovered states.

## Finding and filtering

Printable type navigation prioritizes a prefix match, then a constrained fuzzy match, starting after the current focus for a new query. Its input buffer clears after `800ms`. It changes focus and scroll reveal only; use a visible filter/search control when the user expects the data set to narrow.

A tree find control may switch between highlight and filter modes. When it reports no match, show a local “No results found” state in the find surface. Feature-level empty results are different: Explorer, Search, Outline, and Settings use a sibling message or welcome surface and hide or resize the collection. Do not manufacture a selectable empty row.

## Virtualization and variable height

Position virtual rows in a bounded rows layer and create DOM only for the visible range. Reuse released rows by template kind, but always rerender item content and dispose item-scoped state. Stable item identities let focus and selection survive insertions, removals, refreshes, and reordering.

Fixed-height rows are the efficient default for compact collections. Use measured variable heights when content genuinely wraps or grows asynchronously, as Settings does for descriptions, controls, validation, and rendered markdown. Preserve the scroll anchor when a measured height changes so content above the viewport does not make the user's target jump.

Do not combine variable-height measurement with horizontal scrolling. The verified collection engine treats those modes as incompatible. Choose one adaptation:

- compact navigation/result rows remain one line, ellipsize, and may scroll horizontally when the feature explicitly enables it;
- content-rich settings rows wrap vertically, remeasure, and adapt their internal layout to the available width.

## Feature precedents

Use these as scoped composition checks, not as a catalog of new primitives:

- **Explorer:** compact tree row, disclosure, resource icon-label, compressed path segments, optional result count, and inline rename.
- **Open Editors:** one flat list mixing organizational group rows with editor rows; a description carries path context and trailing actions express close, unpin, save-all, or close-group.
- **Search:** one tree mixing section headings, folders, files, and line matches; each item kind has its own renderer while count badges and action reveal adapt at narrow widths.
- **Outline:** compact groups and symbol rows; the symbol row combines kind icon, matched name, detail description, and a trailing error/warning aggregate.
- **Settings:** a tree-shaped grouping model with feature-owned title, description, indicators, control, validation, and toolbar; variable height and a separate empty state replace the ordinary compact-row treatment.

## Implementation checklist

- Pick list, tree, or table from the data relationship, not from visual preference.
- Keep focus, selection, expansion, filtering, editing, and stable identity in collection state.
- Reuse a small set of row templates and clean them before rebinding.
- Give the primary label `min-width: 0`; keep icons, actions, and essential decorations nonshrinking.
- Keep organizational headers distinct from selectable rows.
- Use scoped compact metrics only for the verified compact feature families.
- Keep match, selection, focus, hover, drag, error, and warning treatments semantic.
- Render empty results outside the selectable item model.
- Virtualize large collections; remeasure only rows that need variable height.
