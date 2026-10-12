// Independent oracle: pinned FindInput with the original HistoryInputBox and Toggle composition.
import { FindInput } from '../../vscode/src/vs/base/browser/ui/findinput/findInput.js';
import { Toggle } from '../../vscode/src/vs/base/browser/ui/toggle/toggle.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { defaultInputBoxStyles, defaultToggleStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { Codicon } from '../../vscode/src/vs/base/common/codicons.js';
import { findExamples, validateFind } from '../../components/stories/FindInputData';
export function mountFindInput(root: HTMLElement, surface: HTMLElement, state: any) {
  surface.className = 'specimen'; surface.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box';
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  const provider = { showContextView: delegate => view.show(delegate), hideContextView: () => view.hide(), layout: () => view.layout() } as any;
  Object.assign(state, { values: findExamples.map(item => item.value), cases: findExamples.map(item => !!item.matchCase), words: findExamples.map(item => !!item.wholeWord), regexes: findExamples.map(item => !!item.regex), activeOptions: findExamples.map(item => item.activeOptions ?? []), changes: [], options: [], inputEvents: [] });
  const finds = findExamples.map((example, index) => {
    const host = document.createElement('div'); host.dataset.index = String(index); host.style.width = '300px'; surface.append(host);
    const additional = (example.additionalToggles ?? []).map(toggle => new Toggle({ icon: { id: toggle.icon }, title: toggle.title, isChecked: (example.activeOptions ?? []).includes(toggle.id), ...defaultToggleStyles }));
    const find = new FindInput(host, provider, {
      label: example.ariaLabel, placeholder: 'Find', showCommonFindToggles: example.showOptions !== false,
      flexibleHeight: example.multiline, flexibleWidth: example.multiline && !example.wrap,
      additionalToggles: additional, history: example.history ? new Set(example.history) : undefined, showHistoryHint: () => true,
      inputBoxStyles: defaultInputBoxStyles, toggleStyles: defaultToggleStyles,
      validation: example.validation ? value => { const message = validateFind(value, { matchCase: find.getCaseSensitive(), wholeWord: find.getWholeWords(), regex: find.getRegex() }); return message ? { content: message.content, type: 3 } : null; } : undefined,
    });
    find.setValue(example.value); find.setCaseSensitive(!!example.matchCase); find.setWholeWords(!!example.wholeWord); find.setRegex(!!example.regex);
    find.setEnabled(!example.disabled); find.setFocusInputOnOptionClick(example.focusInputOnOptionClick !== false);
    if (example.collapsed) { find.domNode.querySelector<HTMLElement>('.controls')!.style.display = 'none'; find.layout({ collapsedFindWidget: true, narrowFindWidget: false, reducedFindWidget: false }); }
    [...find.domNode.querySelectorAll<HTMLElement>('.monaco-custom-toggle')].forEach((toggle, toggleIndex) => toggle.dataset.option = example.showOptions === false ? example.additionalToggles![toggleIndex].id : ['case', 'word', 'regex', ...(example.additionalToggles ?? []).map(toggle => toggle.id)][toggleIndex]);
    find.onDidChange(value => { state.values[index] = value; state.changes.push(`${index}:${value}`); });
    find.onDidOptionChange(viaKeyboard => {
      state.cases[index] = find.getCaseSensitive(); state.words[index] = find.getWholeWords(); state.regexes[index] = find.getRegex();
      state.activeOptions[index] = (example.additionalToggles ?? []).filter((_, i) => additional[i].checked).map(toggle => toggle.id);
      state.options.push(`${index}:${viaKeyboard}`);
    });
    find.onInput(event => state.inputEvents.push(`${index}:${event.fromCompositionEnd}`));
    if (example.history) find.inputBox.inputElement.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); event.stopPropagation(); if (event.key === 'ArrowUp') find.inputBox.showPreviousValue(); else find.inputBox.showNextValue(); }
    });
    return find;
  });
  (window as any).fixtureFindInputs = finds;
}
