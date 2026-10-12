# Component index

- [Shared foundations](#shared-foundations)
- [Buttons and actions](#buttons-and-actions)
- [Text input and choices](#text-input-and-choices)
- [Menus and overlays](#menus-and-overlays)
- [Collections and scrolling](#collections-and-scrolling)
- [Workbench structure](#workbench-structure)
- [Composed views](#composed-views)
- [Feedback](#feedback)

## Shared foundations

### Theme / createTheme

Theme roles, shared typography, focus rules, and platform defaults.

- **Source:** `components/src/theme/`, `components/src/index.ts`.
- **Related components:** Codicon and each component's local styles.
- **Coverage:** precomputed Classic themes and theme conversion; component-specific geometry stays with its component.

### Codicon

Named icons and icon-marked text.

- **Source:** `components/src/components/codicon/`.
- **Coverage:** glyph mappings, modifiers, labels, and theme variables; the font is a separate normal package dependency.

### HighlightedLabel

Text match highlighting with optional icons.

- **Source:** `components/src/components/highlighted-label/HighlightedLabel.vue`.
- **Related components:** Codicon.
- **Coverage:** rendering supplied match ranges; search semantics belong to the caller or matching model.

### IconLabel

Icon, name, description, and decorations.

- **Source:** `components/src/components/icon-label/IconLabel.vue`.
- **Related components:** HighlightedLabel, Codicon.
- **Coverage:** composed labels; resource metadata comes from the caller.

### KeybindingLabel

Platform-aware key chords and matching highlights.

- **Source:** `components/src/components/keybinding-label/`.
- **Coverage:** shortcut display, not shortcut registration.

### CountBadge

Numeric and text badges.

- **Source:** `components/src/components/count-badge/`.
- **Related components:** Tooltip.
- **Coverage:** count formatting and presentation; the caller supplies the count.

## Buttons and actions

### Button

Primary or secondary text action.

- **Source:** `components/src/components/button/Button.vue`
- **Styles:** `components/src/components/button/button.css`.
- **Related components:** Tooltip.
- **Coverage:** button state and activation; the caller executes the action.

### DropdownButton

Primary action with an adjacent menu trigger.

- **Source:** `components/src/components/button/DropdownButton.vue`.
- **Related components:** Button, Dropdown, Menu.
- **Coverage:** split-action interaction and menu selection.

### ButtonBar

Related text and dropdown buttons.

- **Source:** `components/src/components/button-bar/`.
- **Related components:** Button, DropdownButton.
- **Coverage:** grouping and keyboard navigation; host layout supplies placement.

### ActionBar

Row or title actions with shared focus navigation.

- **Source:** `components/src/components/action-bar/`.
- **Related components:** Tooltip.
- **Coverage:** action rendering and activation; the host owns the actions and their effects.

### IconButton

A single labeled icon action.

- **Source:** `components/src/components/icon-button/IconButton.vue`.
- **Related components:** ActionBar.
- **Coverage:** the single-action wrapper, including inherited activation and focus behavior.

### Toolbar

Primary actions and an overflow menu.

- **Source:** `components/src/components/toolbar/`.
- **Related components:** ActionBar, Dropdown, Menu, Tooltip.
- **Coverage:** action layout and overflow; command execution belongs to the caller.

## Text input and choices

### InputBox

Text entry, validation, history, and input actions.

- **Source:** `components/src/components/input-box/`.
- **Related components:** ActionBar, Tooltip; local InputScrollSurface handles multiline scrolling.
- **Coverage:** single-line and multiline entry; rich tooltip content is not covered.

### FindInput

Query input with match options.

- **Source:** `components/src/components/find-input/`.
- **Related components:** InputBox, Toggle.
- **Coverage:** input, option state, history, validation, and composition events; the caller performs searching.

### ReplaceInput

Replacement input with preserve-case control.

- **Source:** `components/src/components/replace-input/`.
- **Related components:** InputBox, Toggle.
- **Coverage:** input and option behavior; the caller performs replacement.

### Checkbox / CheckboxControl

Checkbox with optional action label, or the inner checkbox control.

- **Source:** `components/src/components/checkbox/`.
- **Related components:** Tooltip.
- **Coverage:** checked, disabled, focus, and activation states.

### Toggle

Compact checked icon option.

- **Source:** `components/src/components/toggle/`.
- **Related components:** Tooltip.
- **Coverage:** a single option; option groups belong to the composing control.

### Radio

Exclusive options or a segmented choice.

- **Source:** `components/src/components/radio/`.
- **Coverage:** selection, activation, and keyboard policy; domain choices come from the caller.

### Switch

Boolean switch.

- **Source:** `components/src/components/switch/`.
- **Coverage:** checked and disabled states with native button activation.

### SelectBox

Native or custom option selector.

- **Source:** `components/src/components/select-box/`.
- **Related components:** Dropdown.
- **Coverage:** options, separators, details, and plain descriptions; Markdown descriptions and description hovers are not covered.

## Menus and overlays

### Menu

Action list with checked items, shortcuts, separators, and submenus.

- **Source:** `components/src/components/menu/`.
- **Related components:** Dropdown and shared keyboard helpers in `components/src/internal/`.
- **Coverage:** menu interaction; actions remain caller-owned.

### Dropdown

Anchored content popup.

- **Source:** `components/src/components/dropdown/`.
- **Coverage:** placement, outside dismissal, keyboard closing, and focus return; content comes from the caller.

### ContextMenu

Menu anchored to an element or pointer position.

- **Source:** `components/src/components/context-menu/`.
- **Related components:** Dropdown, Menu.
- **Coverage:** popup lifecycle; TreeView and List supply context-menu intents without changing selection.

### Hover

Rich hover surface with actions or content.

- **Source:** `components/src/components/hover/`.
- **Related components:** Dropdown, ScrollableElement.
- **Coverage:** placement, lifetime, scrolling, and focus; content rendering is supplied by the caller.

### Tooltip

Delayed hover trigger and content wrapper.

- **Source:** `components/src/components/tooltip/`.
- **Related components:** Hover.
- **Coverage:** trigger timing, cancellation, and focus integration.

### Dialog

Modal message, choices, optional inputs, and custom content.

- **Source:** `components/src/components/dialog/`.
- **Related components:** ButtonBar, InputBox, Checkbox, ActionBar, Dropdown.
- **Coverage:** result collection and focus lifecycle; business decisions remain caller-owned.

### QuickInput

Floating text prompt with validation, title actions, and progress.

- **Source:** `components/src/components/quick-input/QuickInput.vue`
- **Types:** `components/src/components/quick-input/types.ts`.
- **Related components:** QuickInputShell.
- **Coverage:** prompt interaction; acceptance is reported to the caller.

### QuickPick

Filterable single-select or multi-select picker.

- **Source:** `components/src/components/quick-input/QuickPick.vue`
- **Example:** `components/src/components/quick-input/CommandPicker.example.vue` — caller-owned closing, focus handoff, and command execution; not a library export.
- **Supporting code:** `components/src/components/quick-input/quickPickModel.ts`, `components/src/components/quick-input/quickPickMatch.ts`, `components/src/components/quick-input/QuickPickList.vue`, `components/src/components/quick-input/QuickPickRow.vue`, `components/src/components/quick-input/quickPickTypes.ts`.
- **Related components:** QuickInputShell, IconLabel, CheckboxControl, KeybindingLabel, Toolbar.
- **Coverage:** filtering, selection, navigation, and acceptance; command, file, or line providers are caller-owned.

### QuickInputShell

Shared prompt and picker surface.

- **Source:** `components/src/components/quick-input/QuickInputShell.vue`
- **Styles:** `components/src/components/quick-input/quickInput.css`.
- **Related components:** FindInput, Toolbar, ProgressBar, CheckboxControl, CountBadge, Button.
- **Coverage:** overlay layout, controls, busy state, dismissal, and focus lifecycle.

## Collections and scrolling

### List

Scrollable rows with separate focus and selection.

- **Source:** `components/src/components/list/`.
- **Related components:** ActionBar, ContextMenu, shared helpers in `components/src/internal/`.
- **Coverage:** virtual rows, keyboard navigation, multiselect, and stable identities; data acquisition belongs to the caller.

### TreeView

Hierarchical rows, expansion, selection, actions, and decorations.

- **Source:** `components/src/components/tree/`.
- **Related components:** ActionBar, ContextMenu, shared helpers in `components/src/internal/`.
- **Coverage:** synchronous nodes and virtual scrolling; asynchronous loading, drag-and-drop, filtering, and sticky scroll are not covered.

### Table

Resizable columns with selectable virtual rows.

- **Source:** `components/src/components/table/`.
- **Related components:** List, SplitView, ContextMenu, HighlightedLabel, KeybindingLabel.
- **Coverage:** row and column presentation; data processing and business editing are caller-owned.

### ScrollableElement

Shared scroll viewport, tracks, and shadows.

- **Source:** `components/src/components/scrollable-element/`.
- **Coverage:** sizing and pointer/wheel scrolling; the containing control owns keyboard navigation.

### Breadcrumbs

File or symbol path navigation.

- **Source:** `components/src/components/breadcrumbs/`.
- **Related components:** ScrollableElement, Codicon, HighlightedLabel.
- **Coverage:** focus, selection, and reveal requests; opening a destination or picker belongs to the caller.

## Workbench structure

### Sash

Draggable separator.

- **Source:** `components/src/components/sash/`.
- **Coverage:** pointer interaction and separator states; the caller applies size constraints.

### SplitView

Constrained resizable regions.

- **Source:** `components/src/components/split-view/`.
- **Related components:** Sash, ScrollableElement.
- **Coverage:** allocation, resizing, hiding, snapping, and restoration; region contents come from slots.

### Pane

Collapsible section with title actions and body content.

- **Source:** `components/src/components/pane/`.
- **Related components:** Toolbar, ActionBar, CountBadge, Codicon.
- **Coverage:** section state and body lifetime; the host allocates its size.

### PaneView

Multiple collapsible sections with shared size allocation.

- **Source:** `components/src/components/pane-view/`.
- **Related components:** SplitView, Pane.
- **Coverage:** section layout, resizing, collapse restoration, and header navigation.

### WorkbenchLayout

Activity rail, sidebar, editor, bottom panel, status, and overlays.

- **Source:** `components/src/components/workbench/WorkbenchLayout.vue`.
- **Related components:** SplitView.
- **Coverage:** a single sidebar and bottom panel; content is caller-supplied, with no editor or terminal engine.

### SidebarTitle

View title with primary and secondary actions.

- **Source:** `components/src/components/sidebar-title/`.
- **Related components:** Toolbar, ActionBar, Menu, Tooltip.
- **Coverage:** title presentation and action requests.

### ActivityBar

View navigation with badges and overflow.

- **Source:** `components/src/components/activity-bar/`.
- **Related components:** CompositeBar.
- **Coverage:** view activation, pinning, and visibility intents; the host opens and focuses content. Accounts, Manage, and workbench drag-and-drop are not covered.

### PanelTitle

Bottom-panel tabs and title actions.

- **Source:** `components/src/components/panel-title/`.
- **Related components:** CompositeBar, Toolbar, ActionBar.
- **Coverage:** panel selection and action requests; the host performs layout commands and focuses content.

### CompositeBar

Shared navigation model for ActivityBar and PanelTitle.

- **Source:** `components/src/components/composite-bar/`.
- **Related components:** ContextMenu, Hover, Tooltip.
- **Coverage:** shared item, badge, pinning, and overflow behavior within those compositions.

### EditorTabs

Editor tab strip with preview, pinned, dirty, and selection states.

- **Source:** `components/src/components/editor-tabs/`.
- **Related components:** ActionBar, IconLabel, ScrollableElement, Tooltip.
- **Coverage:** a single tab row; activation and close requests require host handling. Workbench drag-and-drop and editor content are not covered.

### StatusBar

Prioritized left and right status entries.

- **Source:** `components/src/components/status-bar/`.
- **Related components:** Codicon, ContextMenu, Hover, Tooltip.
- **Coverage:** status presentation, visibility, navigation, and command intents; the host executes commands and handles focus return.

## Composed views

### Explorer

Open editors and a workspace file tree.

- **Source:** `components/src/components/explorer/`.
- **Related components:** SidebarTitle, PaneView, Pane, TreeView, List, IconLabel, ContextMenu.
- **Coverage:** supplied file/editor data and navigation intents; file discovery, inline rename, compact folders, nesting, and drag-and-drop are not covered.

### SearchView

Search/replace inputs, filters, summaries, and result tree.

- **Source:** `components/src/components/search/`.
- **Related components:** FindInput, ReplaceInput, InputBox, TreeView, SidebarTitle, ContextMenu, CountBadge, Explorer file icons.
- **Coverage:** supplied results and search/replace requests; the search backend, disk writes, AI, Notebook, and Search Editor are not covered.

### SettingsEditor

Settings navigation and scalar editing.

- **Source:** `components/src/components/settings/`.
- **Related components:** InputBox, SelectBox, Toggle, Toolbar, ScrollableElement, SplitView.
- **Coverage:** User/Workspace values, local filtering, validation, and JSON requests; array/object editors, remote scopes, AI, and Monaco suggestions are not covered.

### Problems

Grouped diagnostics, filtering, related locations, and quick-fix intents.

- **Source:** `components/src/components/problems/`.
- **Related components:** InputBox, ScrollableElement, IconLabel, HighlightedLabel, ContextMenu, Explorer file icons.
- **Coverage:** tree presentation; diagnostic providers, fix execution, and table mode are not covered.

### Other product surfaces

No complete component implementation for Chat, Monaco editor content, terminal engines, SCM, debugging, extension marketplace, testing services, or port services.

- **Related components:** WorkbenchLayout, PaneView, TreeView, List, InputBox, Toolbar, QuickPick.
- **Coverage:** those individual controls only, not the complete business views.

## Feedback

### ProgressBar

Finite or indefinite progress indication.

- **Source:** `components/src/components/progress-bar/`.
- **Coverage:** display, progress state, and timing; work execution and progress reporting come from the caller.

### LoadingIndicator

Animated loading visual.

- **Source:** `components/src/components/loading-indicator/LoadingIndicator.vue`.
- **Coverage:** visual animation only.

### Banner

Dismissible messages with actions and priority.

- **Source:** `components/src/components/banner/`.
- **Related components:** ActionBar, Tooltip.
- **Coverage:** message presentation and queue behavior; the host supplies messages and executes actions.

### NotificationsList

Notification rows with actions, progress, and expansion.

- **Source:** `components/src/components/notifications/NotificationsList.vue`
- **Shared files:** `components/src/components/notifications/`.
- **Related components:** ActionBar, Button, ProgressBar, ScrollableElement, Tooltip.
- **Coverage:** list interaction and action intents; the caller supplies the notification model.

### NotificationToasts

Transient notification overlays.

- **Source:** `components/src/components/notifications/NotificationToasts.vue`.
- **Related components:** NotificationsList and shared notification model helpers.
- **Coverage:** toast placement, visibility, timers, and focus; overlay placement depends on host dimensions.

### NotificationsCenter

Persistent notification collection.

- **Source:** `components/src/components/notifications/NotificationsCenter.vue`.
- **Related components:** NotificationsList, Toolbar-style actions, ContextMenu.
- **Coverage:** center visibility, clearing, and source preferences; the caller applies preferences to future notifications.
