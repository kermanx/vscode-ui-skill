// Independent oracle: the original ActionBar and ActionViewItem.
import { ActionBar, ActionsOrientation } from '../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js';
import { Action, Separator } from '../../vscode/src/vs/base/common/actions.js';
import { actionBarActions, actionBarCases } from '../../components/stories/actionBarData';
export function mountActionBar(_root: HTMLElement, surface: HTMLElement, state: any) {
  state.actions = []; state.cancels = 0;
  surface.className = 'specimen';
  surface.style.cssText = 'display:flex;flex-direction:column;gap:20px';
  for (const item of actionBarCases) {
    const host = document.createElement('div'); host.dataset.case = item.id; host.style.width = '300px'; surface.append(host);
    const bar = new ActionBar(host, { ariaLabel: item.label, orientation: item.orientation === 'vertical' ? ActionsOrientation.VERTICAL : ActionsOrientation.HORIZONTAL, focusOnlyEnabledItems: item.focusOnlyEnabledItems, preventLoopNavigation: item.preventLoopNavigation });
    for (const entry of actionBarActions) {
      if ('separator' in entry) { bar.push(new Separator()); continue; }
      const action = new Action(entry.id, entry.label, entry.icon ? `codicon-${entry.icon}` : '', !entry.disabled, async () => { state.actions.push(`${item.id}:${entry.id}`); });
      if (entry.checked !== undefined) action.checked = entry.checked;
      bar.push(action, { icon: !!entry.icon, label: !entry.icon, keybinding: entry.keybinding });
    }
    bar.onDidCancel(() => state.cancels++);
  }
}
