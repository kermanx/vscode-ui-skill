// Independent oracle: actual DropdownMenu with the actual context-menu service adapter.
import { DropdownMenu } from '../../vscode/src/vs/base/browser/ui/dropdown/dropdown.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { actionsForMenu, menuKeybinding } from './menu';
import { menuActions } from '../../components/stories/menuData';
export function mountDropdownPanel(root: HTMLElement, surface: HTMLElement, state: any) {
  state.actions = [];
  surface.className = 'specimen button-specimen';
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  window.addEventListener('resize', () => view.layout());
  const handler = new ContextMenuHandler({ showContextView: delegate => view.show(delegate), hideContextView: data => view.hide(data) } as any,
    { publicLog2() {} } as any, { error: console.error } as any, { lookupKeybinding: () => undefined } as any);
  for (const [index, disabled] of [false, true].entries()) {
    const host = document.createElement('div'); host.dataset.index = String(index); host.style.width = '184px'; host.style.height = '24px'; surface.append(host);
    const dropdown = new DropdownMenu(host, { contextMenuProvider: handler, isEnabled: () => !disabled,
      actions: actionsForMenu(menuActions, id => state.actions.push(id)), labelRenderer(container) {
        container.textContent = disabled ? 'Unavailable' : 'More Actions'; container.tabIndex = 0;
        container.setAttribute('role', 'button'); container.setAttribute('aria-haspopup', 'true'); container.setAttribute('aria-expanded', 'false'); container.setAttribute('aria-disabled', String(disabled));
        return null;
      },
    });
    dropdown.menuOptions = { getKeyBinding: menuKeybinding };
    dropdown.onDidChangeVisibility(visible => dropdown.label!.setAttribute('aria-expanded', String(visible)));
  }
}
