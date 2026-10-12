// Independent oracle: original WorkbenchToolBar, context menus and ObjectTree.
import { WorkbenchToolBar } from '../../vscode/src/vs/platform/actions/browser/toolbar.js';
import { Action, Separator } from '../../vscode/src/vs/base/common/actions.js';
import { ContextView, ContextViewDOMPosition, AnchorAlignment } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { getIconsStyleSheet } from '../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js';
import { ObjectTree } from '../../vscode/src/vs/base/browser/ui/tree/objectTree.js';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { RenderIndentGuides } from '../../vscode/src/vs/base/browser/ui/tree/abstractTree.js';
import { defaultListStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import '../../vscode/src/vs/workbench/browser/media/part.css';
import '../../vscode/src/vs/workbench/browser/parts/sidebar/media/sidebarpart.css';
import '../../vscode/src/vs/base/browser/ui/splitview/paneview.css';
import { toolbarExamples, toolbarTreeNodes, toolbarPrimary, toolbarSecondary } from '../../components/stories/ToolbarData';
import { actionsForMenu } from './menu';

export function mountToolbar(root: HTMLElement, surface: HTMLElement, state: any) {
  state.actions = []; state.visibility = []; state.selection = [];
  surface.className = 'specimen'; surface.style.cssText = 'display:flex;flex-direction:column;gap:20px';
  const icons = getIconsStyleSheet(undefined), style = document.createElement('style'); style.textContent = icons.getCSS(); document.head.append(style);
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  window.addEventListener('resize', () => view.layout());
  const lookup = (action: any) => {
    const id = typeof action === 'string' ? action : action.id;
    const entry = [...toolbarPrimary, ...toolbarSecondary].find(entry => 'id' in entry && entry.id === id);
    return entry && 'keybinding' in entry && entry.keybinding ? { getLabel: () => entry.keybinding } as any : undefined;
  };
  const handler = new ContextMenuHandler({ showContextView: delegate => view.show(delegate), hideContextView: data => view.hide(data) } as any,
    { publicLog2() {} } as any, { error: console.error } as any, { lookupKeybinding: lookup } as any);
  for (const item of toolbarExamples) {
    const wrapper = document.createElement('div'); wrapper.dataset.case = item.id; surface.append(wrapper);
    let host = wrapper;
    if (item.id === 'title') {
      wrapper.className = 'part sidebar';
      wrapper.innerHTML = '<div class="title"><div class="title-label"><h2>Explorer</h2></div><div class="title-actions"></div></div>';
      host = wrapper.querySelector('.title-actions')!;
    } else if (item.id === 'panel') {
      wrapper.className = 'monaco-pane-view'; wrapper.style.height = '88px';
      wrapper.innerHTML = '<div class="pane expanded"><div class="pane-header expanded actions-always-visible"><span class="codicon codicon-chevron-down"></span><span class="title">Project files</span><div class="actions"></div></div><div class="pane-body"><div class="customview-tree"></div></div></div>';
      host = wrapper.querySelector('.actions')!;
      const treeHost = wrapper.querySelector<HTMLElement>('.customview-tree')!;
      const tree = new ObjectTree<any>('toolbar-tree', treeHost, { getHeight: () => 22, getTemplateId: () => 'item' }, [{
        templateId: 'item', renderTemplate(container) {
          container.classList.add('custom-view-tree-node-item');
          const label = new IconLabel(container), icon = document.createElement('span'); label.element.prepend(icon);
          return { label, icon };
        }, renderElement({ element }, _index, data) {
          data.label.element.closest<HTMLElement>('.monaco-list-row')!.dataset.id = element.id;
          data.icon.className = `custom-view-tree-node-item-icon codicon codicon-${element.icon}`;
          data.label.setLabel(element.label, undefined, { extraClasses: ['custom-view-tree-node-item-resourceLabel'] });
        }, disposeTemplate(data) { data.label.dispose(); },
      }], { indent: 8, renderIndentGuides: RenderIndentGuides.Always, multipleSelectionSupport: true, expandOnlyOnTwistieClick: true, horizontalScrolling: false, smoothScrolling: false,
        keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: node => node.label }, accessibilityProvider: { getAriaLabel: node => node.label, getWidgetAriaLabel: () => 'Project files' }, identityProvider: { getId: node => node.id } });
      tree.setChildren(null, toolbarTreeNodes.map(element => ({ element })));
      tree.style({ ...defaultListStyles, listBackground: 'var(--vscode-sideBar-background)' }); tree.layout(66, surface.clientWidth);
      tree.onDidChangeSelection(event => { state.selection = event.elements.map(node => node.id); });
    } else wrapper.style.height = '26px';
    const toolbar = new WorkbenchToolBar(host, { ariaLabel: item.ariaLabel, getKeyBinding: lookup, anchorAlignmentProvider: () => item.alignment === 'right' ? AnchorAlignment.RIGHT : AnchorAlignment.LEFT,
      overflowBehavior: item.maxItems === undefined ? undefined : { maxItems: item.maxItems } }, {} as any, {} as any, handler as any, { lookupKeybinding: lookup } as any, {} as any, {} as any);
    const primary = item.primary.map(entry => {
      if ('separator' in entry) return new Separator();
      const action = new Action(entry.id, entry.label, entry.icon ? `codicon-${entry.icon}` : '', !entry.disabled, async () => { state.actions.push(`${item.id}:${entry.id}`); });
      if (entry.checked !== undefined) action.checked = entry.checked;
      if (entry.tooltip) action.tooltip = entry.tooltip;
      return action;
    });
    toolbar.setActions(primary, actionsForMenu(item.secondary, id => state.actions.push(`${item.id}:${id}`)));
    toolbar.onDidChangeDropdownVisibility(visible => { state.visibility.push(`${item.id}:${visible}`); });
  }
}
