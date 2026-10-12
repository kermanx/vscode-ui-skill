// Independent oracle: construct Menu and actions directly from the pinned source.
import { Menu } from '../../vscode/src/vs/base/browser/ui/menu/menu.js';
import { Action, Separator, SubmenuAction } from '../../vscode/src/vs/base/common/actions.js';
import { defaultMenuStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { menuActions, longMenuActions } from '../../components/stories/menuData';

export function actionsForMenu(items: readonly any[], run: (id: string) => void) {
  return items.map(item => {
    if (item.separator) return new Separator();
    if (item.children) return new SubmenuAction(item.id, item.label, actionsForMenu(item.children, run));
    const action = new Action(item.id, item.label, '', !item.disabled, async () => run(item.id));
    if (item.checked !== undefined) action.checked = item.checked;
    return action;
  });
}
export function menuKeybinding(action: any) {
  function find(items: readonly any[]): any { for (const item of items) { if (item.id === action.id) return item; if (item.children) { const found = find(item.children); if (found) return found; } } }
  const item = find(menuActions);
  return item?.keybinding ? { getLabel: () => item.keybinding } as any : undefined;
}
export function mountMenu(_root: HTMLElement, surface: HTMLElement, state: any) {
  state.actions = []; state.cancels = 0;
  surface.className = 'specimen'; surface.style.width = 'max-content'; surface.style.position = 'relative';
  const menu = new Menu(surface, actionsForMenu(new URLSearchParams(location.search).get('long') === 'true' ? longMenuActions : menuActions, id => state.actions.push(id)), { ariaLabel: 'File menu', getKeyBinding: menuKeybinding }, defaultMenuStyles);
  menu.onDidCancel(() => state.cancels++);
  (window as any).referenceMenu = menu;
}
