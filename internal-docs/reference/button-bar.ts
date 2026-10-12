// Live oracle: ButtonBar owns real Button, ButtonWithDescription and ButtonWithDropdown instances.
import { ButtonBar, ButtonBarAlignment, type IButtonWithDescription } from '../../vscode/src/vs/base/browser/ui/button/button.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { ContextMenuHandler } from '../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js';
import { defaultButtonStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { formatRule } from '../../vscode/src/vs/base/browser/ui/menu/menu.js';
import { Codicon } from '../../vscode/src/vs/base/common/codicons.js';
import { Action, Separator } from '../../vscode/src/vs/base/common/actions.js';
import { buttonBarExamples } from '../../components/stories/ButtonBarData';
export function mountButtonBar(root: HTMLElement, surface: HTMLElement, state: any) {
  Object.assign(state, { clicks: [], actions: [] });
  const iconStyle = document.createElement('style'); iconStyle.textContent = formatRule(Codicon.dropDownButton); root.append(iconStyle);
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  const menu = new ContextMenuHandler({ showContextView: delegate => view.show(delegate), hideContextView: data => view.hide(data) } as any,
    { publicLog2() {} } as any, { error: console.error } as any, { lookupKeybinding: () => undefined } as any);
  buttonBarExamples.forEach((example, index) => {
    const host = document.createElement('div'); host.dataset.index = String(index); host.style.cssText = example.style; surface.append(host);
    const bar = new ButtonBar(host, { alignment: example.alignment === 'vertical' ? ButtonBarAlignment.Vertical : ButtonBarAlignment.Horizontal });
    example.items.forEach(item => {
      const options = { ...defaultButtonStyles, secondary: item.secondary, disabled: item.disabled, small: item.small, ariaLabel: item.ariaLabel, supportIcons: true };
      const button = item.actions ? bar.addButtonWithDropdown({ ...options, contextMenuProvider: menu, addPrimaryActionToDropdown: item.includePrimary,
        actions: item.actions.map(entry => { if ('separator' in entry) return new Separator(); const action = new Action(entry.id, entry.label, '', !entry.disabled, async () => { state.actions.push(`${item.id}:${entry.id}`); }); if ('checked' in entry) action.checked = entry.checked; return action; }),
      }) : item.description !== undefined ? bar.addButtonWithDescription(options) : bar.addButton(options);
      button.label = item.icon ? `$(${item.icon}) ${item.label}` : item.label;
      button.enabled = !item.disabled;
      if (item.description !== undefined) (button as IButtonWithDescription).description = item.description;
      button.onDidClick(() => state.clicks.push(item.id));
    });
  });
}
