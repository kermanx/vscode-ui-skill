// Shared ActionBar rules precede the more specific styles loaded by components.
// theme.css supplies inherited typography, focus outlines, and semantic colors;
// a component's local stylesheet is only one part of its rendered appearance.
// These inherited rules are scoped to an enclosing .vc-theme element.
import './components/action-bar/actionbar.css';
import './theme/platform';
// Utility classes in component templates are supplied by this generated stylesheet.
import 'virtual:uno.css';
import './theme/theme.css';
export { default as Button } from './components/button/Button.vue';
export { default as DropdownButton } from './components/button/DropdownButton.vue';
export type { DropdownAction } from './components/button/dropdownTypes';
export { default as Checkbox } from './components/checkbox/Checkbox.vue';
export { default as Table } from './components/table/Table.vue';
export type {
  TableColumn,
  TableCell,
  TableRow,
  TableHandle,
} from './components/table/types';
export { default as TreeView } from './components/tree/TreeView.vue';
export type {
  TreeNode,
  TreeAction,
  TreeDecoration,
} from './components/tree/types';
export { createTheme } from './theme/createTheme';
export type {
  ColorTheme,
  ThemeBase,
  ThemeSource,
  ThemeOptions,
} from './theme/createTheme';
export { default as InputBox } from './components/input-box/InputBox.vue';
export type {
  InputBoxMessage,
  InputBoxAction,
  InputBoxSelection,
} from './components/input-box/types';
export { default as Menu } from './components/menu/Menu.vue';
export type { MenuAction, MenuEntry } from './components/menu/types';
export { default as Dropdown } from './components/dropdown/Dropdown.vue';
export { default as Toggle } from './components/toggle/Toggle.vue';
export { default as Radio } from './components/radio/Radio.vue';
export type { RadioOption } from './components/radio/types';
export { default as SelectBox } from './components/select-box/SelectBox.vue';
export type { SelectBoxOption } from './components/select-box/types';
export { default as Switch } from './components/switch/Switch.vue';
export { default as ButtonBar } from './components/button-bar/ButtonBar.vue';
export type { ButtonBarItem } from './components/button-bar/types';
export { default as ActionBar } from './components/action-bar/ActionBar.vue';
export type {
  ActionBarAction,
  ActionBarEntry,
} from './components/action-bar/types';
export { default as FindInput } from './components/find-input/FindInput.vue';
export type {
  FindInputToggle,
  FindInputOptionsState,
  FindInputEvent,
} from './components/find-input/types';
export { default as IconButton } from './components/icon-button/IconButton.vue';
export { default as List } from './components/list/List.vue';
export type { ListItem } from './components/list/types';
export { default as ReplaceInput } from './components/replace-input/ReplaceInput.vue';
export type { ReplaceInputOptionsState } from './components/replace-input/types';
export { default as Codicon } from './components/codicon/Codicon.vue';
export {
  asClassNameArray,
  asClassName,
  codiconClassNames,
  getCodiconAriaLabel,
  splitLabelWithIcons,
} from './components/codicon/icons';
export type {
  ThemeIconLike,
  LabelWithIconsPart,
} from './components/codicon/icons';
export { default as KeybindingLabel } from './components/keybinding-label/KeybindingLabel.vue';
export type {
  Chord,
  ChordMatches,
  Matches,
  OperatingSystem,
} from './components/keybinding-label/types';
export { default as ProgressBar } from './components/progress-bar/ProgressBar.vue';
export { default as CountBadge } from './components/count-badge/CountBadge.vue';
export type { CountBadgeVariant } from './components/count-badge/types';
export { default as Toolbar } from './components/toolbar/Toolbar.vue';
export { default as ScrollableElement } from './components/scrollable-element/ScrollableElement.vue';
export type {
  ScrollbarVisibility,
  ScrollPosition,
  ScrollDimensions,
  ScrollableEvent,
} from './components/scrollable-element/types';
export { default as ContextMenu } from './components/context-menu/ContextMenu.vue';
export type { ContextMenuAnchor } from './components/context-menu/types';
export { default as Breadcrumbs } from './components/breadcrumbs/Breadcrumbs.vue';
export type {
  BreadcrumbItem,
  BreadcrumbItemEvent,
} from './components/breadcrumbs/types';
export { default as Sash } from './components/sash/Sash.vue';
export type {
  SashOrientation,
  SashState,
  SashOrthogonalEdge,
  SashEvent,
  SashHandle,
} from './components/sash/types';
export { default as Pane } from './components/pane/Pane.vue';
export { default as SplitView } from './components/split-view/SplitView.vue';
export type {
  SplitViewOrientation,
  SplitViewItem,
  SplitViewLayout,
  SplitViewHandle,
} from './components/split-view/types';
export { default as Hover } from './components/hover/Hover.vue';
export type {
  HoverPosition,
  HoverTarget,
  HoverAction,
} from './components/hover/types';
export { default as Tooltip } from './components/tooltip/Tooltip.vue';
export { default as Dialog } from './components/dialog/Dialog.vue';
export type {
  DialogButton,
  DialogInput,
  DialogResult,
} from './components/dialog/types';
export { default as QuickInput } from './components/quick-input/QuickInput.vue';
export type {
  QuickInputButton,
  QuickInputHideReason,
  QuickInputSeverity,
  QuickInputProps,
} from './components/quick-input/types';
export { default as QuickPick } from './components/quick-input/QuickPick.vue';
export type {
  QuickPickItemButton,
  QuickPickItem,
  QuickPickSeparator,
  QuickPickEntry,
  QuickPickActivation,
  QuickPickFocus,
  QuickPickProps,
  QuickPickKeyMods,
  QuickPickAcceptEvent,
  QuickPickWillAcceptEvent,
  QuickPickItemButtonEvent,
  QuickPickSeparatorButtonEvent,
} from './components/quick-input/quickPickTypes';
export { default as Banner } from './components/banner/Banner.vue';
export type {
  BannerItem,
  BannerAction,
  BannerHandle,
} from './components/banner/types';

export { default as NotificationToasts } from './components/notifications/NotificationToasts.vue';
export type { NotificationToastsHandle } from './components/notifications/types';
export { default as NotificationsList } from './components/notifications/NotificationsList.vue';
export type {
  NotificationItem,
  NotificationAction,
  NotificationProgress,
  NotificationTextPart,
  NotificationSeverity,
  NotificationPosition,
  NotificationsListHandle,
} from './components/notifications/types';

export { default as StatusBar } from './components/status-bar/StatusBar.vue';
export {
  StatusBarShowTooltipCommand,
  StatusBarToggleTooltipCommand,
} from './components/status-bar/types';
export type {
  StatusBarEntry,
  StatusBarAlignment,
  StatusBarEntryKind,
  StatusBarLocation,
  StatusBarPriority,
  StatusBarCommand,
  StatusBarTooltip,
} from './components/status-bar/types';

export { default as SidebarTitle } from './components/sidebar-title/SidebarTitle.vue';

export { default as EditorTabs } from './components/editor-tabs/EditorTabs.vue';
export type {
  EditorTab,
  EditorTabsProps,
} from './components/editor-tabs/types';
export { default as ActivityBar } from './components/activity-bar/ActivityBar.vue';
export type {
  CompositeItem as ActivityBarItem,
  CompositeBadge as ActivityBarBadge,
} from './components/composite-bar/types';

export { default as NotificationsCenter } from './components/notifications/NotificationsCenter.vue';
export type {
  NotificationSource,
  NotificationsCenterHandle,
} from './components/notifications/types';

export { default as PanelTitle } from './components/panel-title/PanelTitle.vue';
export type {
  CompositeItem as PanelTitleItem,
  CompositeBadge as PanelTitleBadge,
} from './components/composite-bar/types';

export { default as Explorer } from './components/explorer/Explorer.vue';
export type {
  ExplorerItem,
  ExplorerEditor,
  ExplorerEditorGroup,
  ExplorerOpenEvent,
  ExplorerProps,
} from './components/explorer/types';

export { default as Problems } from './components/problems/Problems.vue';
export type {
  ProblemSeverity,
  ProblemLocation,
  ProblemRelatedInformation,
  ProblemItem,
  ProblemOpenEvent,
  ProblemsHandle,
} from './components/problems/types';

export { default as WorkbenchLayout } from './components/workbench/WorkbenchLayout.vue';

export { default as SettingsEditor } from './components/settings/SettingsEditor.vue';
export type {
  SettingsTarget,
  SettingOption,
  SettingDefinition,
  SettingsGroup,
  SettingsValues,
  SettingChange,
} from './components/settings/types';

export { default as SearchView } from './components/search/SearchView.vue';
export type {
  SearchMatch,
  SearchFileResult,
  SearchSubmitEvent,
  SearchViewProps,
} from './components/search/types';

export { default as PaneView } from './components/pane-view/PaneView.vue';
export type { PaneViewItem } from './components/pane-view/types';
