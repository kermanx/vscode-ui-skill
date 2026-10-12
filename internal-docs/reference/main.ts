import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import { mountCodicon } from './codicon';
import { mountKeybindingLabel } from './keybinding-label';
import { mountProgressBar } from './progress-bar';
import { mountCountBadge } from './count-badge';
// Oracle only: real classes and CSS from the pinned clone. Never import this into src/.
import { Button } from '../../vscode/src/vs/base/browser/ui/button/button.js';
import { ObjectTree } from '../../vscode/src/vs/base/browser/ui/tree/objectTree.js';
import { RenderIndentGuides } from '../../vscode/src/vs/base/browser/ui/tree/abstractTree.js';
import { defaultButtonStyles, defaultListStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import '../../vscode/src/vs/workbench/browser/media/style.css';
import '../../vscode/src/vs/base/browser/ui/codicons/codicon/codicon.css';
import '@vscode/codicons/dist/codicon.css';
import { buttons, treeNodes, expandedNodes, largeNodes } from '../../components/stories/data';
import './fixture.css';
import { mountDropdown } from './dropdown';
import { mountCheckbox } from './checkbox';
import { mountToggle } from './toggle';
import { mountSwitch } from './switch';
import { mountButtonBar } from './button-bar';
import { mountIconButton } from './icon-button';
import { mountList } from './list';
import { mountScrollableElement } from './scrollable-element';
import { mountContextMenu } from './context-menu';
import { mountBreadcrumbs } from './breadcrumbs';
import { mountSash } from './sash';
import { mountPane } from './pane';
import { mountSplitView } from './split-view';
import { mountHover } from './hover';
import { installFixtureHoverService } from './hover-service';
import { mountDialog } from './dialog';
import { mountQuickPick } from './quick-pick';
import { mountQuickInput } from './quick-input';
import { mountNotificationsCenter } from './notifications-center';
import { mountNotificationToasts } from './notification-toasts';
import { mountNotificationsList } from './notifications-list';
import { mountStatusBar } from './status-bar';
import { mountProblems } from './problems';
import { mountSettings } from './settings';
import { mountSearch } from './search';
import { mountWorkbenchLayout } from './workbench-layout';
import { mountWorkbench } from './workbench';
import { mountExplorer } from './explorer';
import { mountPanelTitle } from './panel-title';
import { mountActivityBar } from './activity-bar';
import { mountEditorTabs } from './editor-tabs';
import { mountSidebarTitle } from './sidebar-title';
import { mountBanner } from './banner';
import { mountTable } from './table';
import { mountActionBar } from './action-bar';
import { mountToolbar } from './toolbar';
import { mountRadio } from './radio';
import { mountInputBox } from './input-box';
import { mountFindInput } from './find-input';
import { mountReplaceInput } from './replace-input';
import { mountSelectBox } from './select-box';
import { mountMenu } from './menu';
import { mountDropdownPanel } from './dropdown-panel';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { ActionBar } from '../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { DecorationsService } from '../../vscode/src/vs/workbench/services/decorations/browser/decorationsService.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import { URI } from '../../vscode/src/vs/base/common/uri.js';
import '../../vscode/src/vs/workbench/browser/parts/views/media/views.css';

const params = new URLSearchParams(location.search);
const theme = params.get('theme') || 'dark';
const colors = (await (await fetch('./themes.json')).json())[theme];
const iconStyles = document.createElement('style');
iconStyles.textContent = getIconsStyleSheet(undefined).getCSS();
document.head.append(iconStyles);
const root = document.querySelector<HTMLElement>('#fixture')!;
root.className = `monaco-workbench ${/Mac/.test(navigator.platform) ? 'mac' : /Win/.test(navigator.platform) ? 'windows' : 'linux'} ${({ dark: 'vs-dark', light: 'vs', hcDark: 'hc-black', hcLight: 'hc-light' })[theme]}`;
for (const [id, color] of Object.entries(colors)) root.style.setProperty(`--vscode-${id.replaceAll('.', '-')}`, color as string);
installFixtureHoverService(root);
const state = { focus: [] as string[], selection: [] as string[], expanded: [...expandedNodes], clicks: 0, escapes: 0, actions: [] as string[] };
(window as any).fixtureState = state;
const outside = document.createElement('button');
outside.className = 'outside'; outside.textContent = 'Move focus outside';
const kind = params.get('kind') || 'button';
const surface = document.createElement('div');
surface.className = `specimen ${kind !== 'tree' ? 'button-specimen' : 'tree-specimen'}`;
surface.dataset.testid = 'specimen';
root.append(surface, outside);

if (kind === 'search') {
  mountSearch(root, surface, state);
} else if (kind === 'workbench') {
  mountWorkbench(root, surface, state);
} else if (kind === 'settings') {
  mountSettings(root, surface, state);
} else if (kind === 'problems') {
  mountProblems(root, surface, state);
} else if (kind === 'workbench-layout') {
  mountWorkbenchLayout(root, surface, state);
} else if (kind === 'explorer') {
  mountExplorer(root, surface, state);
} else if (kind === 'panel-title') {
  mountPanelTitle(root, surface, state);
} else if (kind === 'activity-bar') {
  mountActivityBar(root, surface, state);
} else if (kind === 'editor-tabs') {
  mountEditorTabs(root, surface, state);
} else if (kind === 'quick-pick') {
  mountQuickPick(root, surface, state);
} else if (kind === 'sidebar-title') {
  mountSidebarTitle(root, surface, state);
} else if (kind === 'status-bar') {
  mountStatusBar(root, surface, state);
} else if (kind === 'notifications-center') {
  mountNotificationsCenter(root, surface, state);
} else if (kind === 'notification-toasts') {
  mountNotificationToasts(root, surface, state);
} else if (kind === 'notifications-list') {
  mountNotificationsList(root, surface, state);
} else if (kind === 'banner') {
  mountBanner(root, surface, state);
} else if (kind === 'quick-input') {
  mountQuickInput(root, surface, state);
} else if (kind === 'table') {
  mountTable(root, surface, state);
} else if (kind === 'dialog') {
  mountDialog(root, surface, state);
} else if (kind === 'hover' || kind === 'tooltip') {
  mountHover(root, surface, state);
} else if (kind === 'split-view') {
  mountSplitView(root, surface, state);
} else if (kind === 'pane') {
  mountPane(root, surface, state);
} else if (kind === 'sash') {
  mountSash(root, surface, state);
} else if (kind === 'context-menu') {
  mountContextMenu(root, surface, state);
} else if (kind === 'breadcrumbs') {
  mountBreadcrumbs(root, surface, state);
} else if (kind === 'scrollable-element') {
  mountScrollableElement(root, surface, state);
} else if (kind === 'toolbar') {
  mountToolbar(root, surface, state);
} else if (kind === 'codicon') {
  mountCodicon(root, surface, state);
} else if (kind === 'keybinding-label') {
  mountKeybindingLabel(root, surface, state);
} else if (kind === 'progress-bar') {
  mountProgressBar(root, surface, state);
} else if (kind === 'count-badge') {
  mountCountBadge(root, surface, state);
} else if (kind === 'replace-input') {
  mountReplaceInput(root, surface, state);
} else if (kind === 'list') {
  mountList(root, surface, state);
} else if (kind === 'icon-button') {
  mountIconButton(root, surface, state);
} else if (kind === 'find-input') {
  mountFindInput(root, surface, state);
} else if (kind === 'action-bar') {
  mountActionBar(root, surface, state);
} else if (kind === 'button-bar') {
  mountButtonBar(root, surface, state);
} else if (kind === 'switch') {
  mountSwitch(root, surface, state);
} else if (kind === 'select-box') {
  mountSelectBox(root, surface, state);
} else if (kind === 'radio') {
  mountRadio(root, surface, state);
} else if (kind === 'toggle') {
  mountToggle(root, surface, state);
} else if (kind === 'menu') {
  mountMenu(root, surface, state);
} else if (kind === 'dropdown-panel') {
  mountDropdownPanel(root, surface, state);
} else if (kind === 'input-box') {
  mountInputBox(root, surface, state);
} else if (kind === 'checkbox') {
  mountCheckbox(root, surface, state);
} else if (kind === 'dropdown') {
  mountDropdown(root, surface, state);
} else if (kind === 'button') {
  buttons.forEach((props, index) => {
    const host = document.createElement('div'); host.className = 'button-host'; surface.append(host);
    const button = new Button(host, {
      ...defaultButtonStyles, ...props, supportIcons: true,
    });
    button.label = props.icon ? `$(${props.icon}) ${props.label}` : props.label;
    button.element.dataset.index = String(index);
    button.onDidClick(() => state.clicks++);
    button.onDidEscape(() => state.escapes++);
  });
} else {
  const large = params.get('large') === 'true';
  const nodes = large ? largeNodes : treeNodes;
  surface.classList.add('customview-tree');
  const decorationData = new Map();
  function collect(items) { for (const node of items) { if (node.decoration) decorationData.set(`/${node.id}`, node.decoration); if (node.children) collect(node.children); } }
  collect(nodes);
  const decorations = new DecorationsService({ extUri: { ignorePathCasing: () => false } } as any, {} as any);
  decorations.registerDecorationsProvider({
    label: 'Fixture', onDidChange: Event.None,
    provideDecorations(uri) { const value = decorationData.get(uri.path); return value ? { letter: value.badge, color: value.color, tooltip: value.tooltip, strikethrough: value.strikethrough } : undefined; },
  });
  const expanded = new Set(large ? largeNodes.map(n => n.id) : expandedNodes);
  state.expanded = [...expanded];
  const tree = new ObjectTree('classic-reference', surface, { getHeight: () => 22, getTemplateId: () => 'item' }, [{
    templateId: 'item',
    renderTemplate(container) {
      container.classList.add('custom-view-tree-node-item');
      const label = new IconLabel(container);
      const icon = document.createElement('span'); label.element.prepend(icon);
      const actions = document.createElement('div'); actions.className = 'actions'; label.element.append(actions);
      const actionBar = new ActionBar(actions);
      return { label, icon, actionBar, decoration: undefined as any };
    },
    renderElement({ element }, index, data) {
      data.label.element.closest('.monaco-list-row').dataset.id = element.id;
      data.icon.className = `custom-view-tree-node-item-icon codicon codicon-${element.icon || (element.children ? 'folder' : 'file')}`;
      data.decoration?.dispose();
      data.decoration = decorations.getDecoration(URI.file(`/${element.id}`), false);
      const extraClasses = ['custom-view-tree-node-item-resourceLabel'];
      if (data.decoration) extraClasses.push(data.decoration.labelClassName, data.decoration.badgeClassName);
      data.label.setLabel(element.label, element.description, { extraClasses, strikethrough: data.decoration?.strikethrough, title: data.decoration?.tooltip });
      data.actionBar.clear();
      data.actionBar.setAriaLabel(`Actions for ${element.label}`);
      data.actionBar.push((element.actions ?? []).map(action => new Action(action.id, action.label, `codicon-${action.icon}`, !action.disabled, async () => { state.actions.push(`${element.id}:${action.id}`); })), { icon: true, label: false });
    },
    disposeTemplate(data) { data.decoration?.dispose(); data.label.dispose(); data.actionBar.dispose(); },
  }], {
    indent: 8, renderIndentGuides: RenderIndentGuides.Always,
    multipleSelectionSupport: params.get('multiple') !== 'false',
    expandOnlyOnTwistieClick: params.get('expandOnLabel') !== 'true',
    horizontalScrolling: false, smoothScrolling: false,
    keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: n => n.label },
    accessibilityProvider: { getAriaLabel: n => [n.label, n.decoration?.tooltip, n.actions?.length ? 'has actions' : undefined].filter(Boolean).join(', '), getWidgetAriaLabel: () => 'Project files' },
    identityProvider: { getId: n => n.id },
  });
  const toElements = items => items.map(element => ({ element, collapsed: element.children?.length ? !expanded.has(element.id) : undefined, children: element.children ? toElements(element.children) : undefined }));
  tree.setChildren(null, toElements(nodes));
  tree.style({ ...defaultListStyles, listBackground: 'var(--vscode-sideBar-background)' });
  tree.layout(264, surface.clientWidth);
  new ResizeObserver(() => tree.layout(264, surface.clientWidth)).observe(surface);
  tree.onDidChangeFocus(e => state.focus = e.elements.map(n => n.id));
  tree.onDidChangeSelection(e => state.selection = e.elements.map(n => n.id));
  tree.onDidChangeCollapseState(({ node }) => {
    if (node.collapsed) expanded.delete(node.element.id); else expanded.add(node.element.id);
    state.expanded = [...expanded];
  });
  (window as any).referenceTree = tree;
}
(window as any).fixtureReady = true;
