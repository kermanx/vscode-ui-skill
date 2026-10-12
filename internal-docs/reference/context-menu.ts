// Independent oracle: original ContextMenuHandler and real List/ObjectTree context-menu routes.
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { StandardMouseEvent } from '../../vscode/src/vs/base/browser/mouseEvent.js';
import { List } from '../../vscode/src/vs/base/browser/ui/list/listWidget.js';
import { ObjectTree } from '../../vscode/src/vs/base/browser/ui/tree/objectTree.js';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { ActionBar } from '../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js';
import { RenderIndentGuides } from '../../vscode/src/vs/base/browser/ui/tree/abstractTree.js';
import { defaultListStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import '../../vscode/src/vs/workbench/contrib/files/browser/views/media/openeditors.css';
import { contextMenuActions, contextMenuItems, longContextMenuActions, contextMenuVariants } from '../../components/stories/ContextMenuData';
import { actionsForMenu } from './menu';
export function mountContextMenu(root: HTMLElement, surface: HTMLElement, state: any) {
  const params = new URLSearchParams(location.search);
  const items = params.get('empty') === 'true' ? [] : contextMenuItems;
  Object.assign(state, { selection: [], treeSelection: [], focus: [], treeFocus: [], actions: [], visibility: [], contexts: [] });
  surface.className = 'specimen'; surface.style.cssText = 'display:flex;flex-direction:column;gap:20px';
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  window.addEventListener('resize', () => view.layout());
  const handler = new ContextMenuHandler({ showContextView: delegate => view.show(delegate), hideContextView: data => view.hide(data) } as any,
    { publicLog2() {} } as any, { error: console.error } as any, { lookupKeybinding() {} } as any);
  let dynamicVariant: keyof typeof contextMenuVariants = 'empty';
  function entries() { return params.get('emptyMenu') === 'true' ? [] : params.get('dynamic') === 'true' ? contextMenuVariants[dynamicVariant] : params.get('long') === 'true' ? longContextMenuActions : contextMenuActions; }
  function show(kind: string, item: any, event: MouseEvent | KeyboardEvent, anchor: any) {
    event.preventDefault(); event.stopPropagation();
    if (params.get('dynamic') === 'true') dynamicVariant = item?.id === 'alpha' ? 'first' : item?.id === 'beta' ? 'second' : 'empty';
    state.contexts.push({ kind, id: item?.id || null, keyboard: event instanceof KeyboardEvent });
    open(`${kind}:${item?.id || 'empty'}`, anchor);
  }
  function open(context: string, anchor: any) {
    if (!entries().length) return;
    handler.showContextMenu({ getAnchor: () => anchor, getActions: () => actionsForMenu(entries(), id => state.actions.push(`${context}:${id}`)),
      autoSelectFirstItem: params.get('first') === 'true', onHide: () => state.visibility.push(false), getKeyBinding: action => action.id === 'open' ? { getLabel: () => '↩' } as any : undefined });
    state.visibility.push(true);
  }
  const target = document.createElement('button'); target.className = 'context-target'; target.textContent = 'Right-click for actions'; surface.append(target);
  target.addEventListener('contextmenu', event => show('target', undefined, event, new StandardMouseEvent(window, event)));
  const listHost = document.createElement('div'); listHost.className = 'open-editors'; listHost.style.height = '88px'; surface.append(listHost);
  const list = new List<any>('context-list', listHost, { getHeight: () => 22, getTemplateId: () => 'item' }, [{
    templateId: 'item', renderTemplate(container) { return { container, actions: new ActionBar(container), label: new IconLabel(container) }; },
    renderElement(item, _index, data) { data.container.dataset.id = item.id; data.actions.setAriaLabel(`Actions for ${item.label}`); data.label.setLabel(item.label, undefined, { extraClasses: ['open-editor'], iconPath: { id: item.icon } }); },
    disposeTemplate(data) { data.actions.dispose(); data.label.dispose(); },
  }], { identityProvider: { getId: item => item.id }, multipleSelectionSupport: true, horizontalScrolling: false, smoothScrolling: false,
    keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: item => item.label }, accessibilityProvider: { getWidgetAriaLabel: () => 'Context files', getAriaLabel: item => item.label } });
  list.style({ ...defaultListStyles, listBackground: 'var(--vscode-sideBar-background)' }); list.splice(0, 0, items); list.layout(88, surface.clientWidth);
  list.onDidChangeSelection(event => { state.selection = event.elements.map(item => item.id); }); list.onDidChangeFocus(event => { state.focus = event.elements.map(item => item.id); });
  list.onContextMenu(event => show('list', event.element, event.browserEvent, event.anchor));
  const treeHost = document.createElement('div'); treeHost.className = 'customview-tree'; treeHost.style.height = '88px'; surface.append(treeHost);
  const tree = new ObjectTree<any>('context-tree', treeHost, { getHeight: () => 22, getTemplateId: () => 'item' }, [{
    templateId: 'item', renderTemplate(container) { container.classList.add('custom-view-tree-node-item'); const label = new IconLabel(container), icon = document.createElement('span'); label.element.prepend(icon); return { label, icon }; },
    renderElement({ element }, _index, data) { data.label.element.closest<HTMLElement>('.monaco-list-row')!.dataset.id = element.id; data.icon.className = `custom-view-tree-node-item-icon codicon codicon-${element.icon}`; data.label.setLabel(element.label, undefined, { extraClasses: ['custom-view-tree-node-item-resourceLabel'] }); }, disposeTemplate(data) { data.label.dispose(); },
  }], { indent: 8, renderIndentGuides: RenderIndentGuides.Always, multipleSelectionSupport: true, expandOnlyOnTwistieClick: true, horizontalScrolling: false, smoothScrolling: false,
    keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: node => node.label }, accessibilityProvider: { getAriaLabel: node => node.label, getWidgetAriaLabel: () => 'Context tree' }, identityProvider: { getId: node => node.id } });
  tree.setChildren(null, items.map(element => ({ element }))); tree.style({ ...defaultListStyles, listBackground: 'var(--vscode-sideBar-background)' }); tree.layout(88, surface.clientWidth);
  tree.onDidChangeSelection(event => { state.treeSelection = event.elements.map(node => node.id); }); tree.onDidChangeFocus(event => { state.treeFocus = event.elements.map(node => node.id); });
  tree.onContextMenu(event => show('tree', event.element, event.browserEvent, event.anchor));
  (window as any).showDynamicMenu = (variant: keyof typeof contextMenuVariants) => { dynamicVariant = variant; open(`dynamic:${variant}`, { x: 200, y: 100 }); };
  (window as any).showPointMenu = (x: number, y: number) => open('point', { x, y });
}
