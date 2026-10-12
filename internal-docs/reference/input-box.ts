// Independent oracle running the pinned InputBox and HistoryInputBox classes.
import { InputBox, HistoryInputBox } from '../../vscode/src/vs/base/browser/ui/inputbox/inputBox.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { defaultInputBoxStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { inputBoxExamples, validateEmail } from '../../components/stories/InputBoxData';
export function mountInputBox(root: HTMLElement, surface: HTMLElement, state: any) {
  surface.className = 'specimen';
  surface.style.cssText = 'display:flex;flex-direction:column;gap:16px;padding:4px;box-sizing:border-box';
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  const provider = { showContextView: delegate => view.show(delegate), hideContextView: () => view.hide(), layout: () => view.layout() } as any;
  const convertMessage = message => message ? { ...message, type: { info: 1, warning: 2, error: 3 }[message.type] } : null;
  Object.assign(state, { values: inputBoxExamples.map(item => item.value), changes: [], actions: [] });
  const inputs = inputBoxExamples.map((example, index) => {
    const host = document.createElement('div'); host.style.width = '280px'; host.dataset.index = String(index); surface.append(host);
    const actions = example.actions?.map(item => new Action(item.id, item.label, `codicon-${item.icon}`, !item.disabled, async () => { state.actions.push(`${index}:${item.id}`); if (item.id === 'clear') input.value = ''; }));
    const options = { ...example, type: example.password ? 'password' : 'text', inputBoxStyles: defaultInputBoxStyles, actions,
      history: example.history ? new Set(example.history) : undefined, showHistoryHint: () => true,
      validationOptions: example.validation ? { validation: value => convertMessage(validateEmail(value)) } : undefined };
    const input = example.history ? new HistoryInputBox(host, provider, options) : new InputBox(host, provider, options);
    input.value = example.value;
    input.inputElement.readOnly = !!example.readonly;
    input.setEnabled(!example.disabled);
    if (example.message) input.showMessage(convertMessage(example.message)!);
    if (actions) input.paddingRight = input.actionsWidth;
    input.onDidChange(value => { state.values[index] = value; state.changes.push(`${index}:${value}`); });
    if (input instanceof HistoryInputBox) input.inputElement.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); event.stopPropagation(); if (event.key === 'ArrowUp') input.showPreviousValue(); else input.showNextValue(); }
    });
    return input;
  });
  (window as any).fixtureInputs = inputs;
}
