// Live oracle: the pinned ButtonWithDropdown, ContextView and ContextMenuHandler.
import { ButtonWithDropdown } from '../../vscode/src/vs/base/browser/ui/button/button.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { defaultButtonStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { formatRule } from '../../vscode/src/vs/base/browser/ui/menu/menu.js';
import { Codicon } from '../../vscode/src/vs/base/common/codicons.js';
import { Action, Separator } from '../../vscode/src/vs/base/common/actions.js';
import { dropdownExamples, dropdownActions } from '../../components/stories/dropdownData';

export function mountDropdown(root: HTMLElement, surface: HTMLElement, state: any) {
  const iconStyle = document.createElement('style'); iconStyle.textContent = formatRule(Codicon.dropDownButton); root.append(iconStyle);
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  const handler = new ContextMenuHandler({ showContextView: delegate => view.show(delegate), hideContextView: data => view.hide(data) } as any,
    { publicLog2() {} } as any, { error: console.error } as any, { lookupKeybinding: () => undefined } as any);
  state.actions = [];
  dropdownExamples.forEach((props, index) => {
    const host = document.createElement('div'); host.className = 'button-host'; host.dataset.index = String(index); surface.append(host);
    const actions = dropdownActions.map(item => {
      if ('separator' in item) return new Separator();
      const action = new Action(item.id, item.label, '', !item.disabled, async () => { state.actions.push(item.id); });
      if ('checked' in item) action.checked = item.checked;
      return action;
    });
    const button = new ButtonWithDropdown(host, { ...defaultButtonStyles, ...props, actions, contextMenuProvider: handler });
    button.label = props.label;
    button.enabled = !props.disabled;
    button.onDidClick(() => state.clicks++);
  });
}
