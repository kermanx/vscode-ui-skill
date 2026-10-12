// Independent oracle: the pinned ReplaceInput, HistoryInputBox, Toggle and FindInput classes.
import { ReplaceInput } from '../../vscode/src/vs/base/browser/ui/findinput/replaceInput.js';
import { FindInput } from '../../vscode/src/vs/base/browser/ui/findinput/findInput.js';
import { Button } from '../../vscode/src/vs/base/browser/ui/button/button.js';
import { ContextView, ContextViewDOMPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { defaultInputBoxStyles, defaultToggleStyles, defaultButtonStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { buildReplaceStringWithCasePreserved } from '../../vscode/src/vs/base/common/search.js';
import { replaceExamples, validateReplacement, compositionSample, compositionStyle } from '../../components/stories/ReplaceInputData';
export function mountReplaceInput(root: HTMLElement, surface: HTMLElement, state: any) {
  surface.className = 'specimen'; surface.style.cssText = 'display:flex;flex-direction:column;gap:12px;padding:4px;box-sizing:border-box';
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  const provider = { showContextView: delegate => view.show(delegate), hideContextView: () => view.hide(), layout: () => view.layout() } as any;
  Object.assign(state, { values: replaceExamples.map(item => item.value), preserves: replaceExamples.map(item => !!item.preserveCase), changes: [], options: [], inputEvents: [], optionKeys: [] });
  const replacements = replaceExamples.map((example, index) => {
    const host = document.createElement('div'); host.dataset.index = String(index); host.style.width = '300px'; surface.append(host);
    const replacement = new ReplaceInput(host, provider, example.showOptions !== false, {
      label: example.ariaLabel, placeholder: 'Replace', appendPreserveCaseLabel: example.preserveCaseTitleSuffix,
      flexibleHeight: example.multiline, flexibleWidth: example.multiline && !example.wrap, flexibleMaxHeight: example.maxHeight,
      history: example.history ? new Set(example.history) : undefined, showHistoryHint: () => true,
      inputBoxStyles: defaultInputBoxStyles, toggleStyles: defaultToggleStyles,
      validation: example.validation ? value => { const message = validateReplacement(value); return message ? { content: message.content, type: 2 } : null; } : undefined,
    });
    replacement.width = 300; replacement.setValue(example.value); replacement.setPreserveCase(!!example.preserveCase);
    replacement.setEnabled(!example.disabled); replacement.setFocusInputOnOptionClick(example.focusInputOnOptionClick !== false);
    replacement.domNode.querySelector<HTMLElement>('.monaco-custom-toggle')!.dataset.option = 'preserve';
    replacement.inputBox.onDidChange(value => { state.values[index] = value; state.changes.push(`${index}:${value}`); });
    replacement.onDidOptionChange(viaKeyboard => { state.preserves[index] = replacement.getPreserveCase(); state.options.push(`${index}:${viaKeyboard}`); });
    replacement.onInput(() => state.inputEvents.push(index));
    replacement.onPreserveCaseKeyDown(event => state.optionKeys.push(`${index}:${event.browserEvent.key}`));
    if (example.history) replacement.inputBox.inputElement.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.cancelBubble || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); event.stopPropagation(); if (event.key === 'ArrowUp') replacement.inputBox.showPreviousValue(); else replacement.inputBox.showNextValue(); }
    });
    return replacement;
  });
  (window as any).fixtureReplaceInputs = replacements;
  const host = document.createElement('div'); host.dataset.composition = ''; host.style.cssText = compositionStyle; surface.append(host);
  const composition = { query: 'example', replacement: 'result', matchCase: false, wholeWord: false, regex: false, preserveCase: true, text: compositionSample, replacements: 0 };
  const find = new FindInput(host, provider, { label: 'Search to replace', placeholder: 'Find', showCommonFindToggles: true, inputBoxStyles: defaultInputBoxStyles, toggleStyles: defaultToggleStyles });
  const replacement = new ReplaceInput(host, provider, true, { label: 'Replacement value', placeholder: 'Replace', inputBoxStyles: defaultInputBoxStyles, toggleStyles: defaultToggleStyles });
  replacement.width = 300; find.setValue(composition.query); replacement.setValue(composition.replacement); replacement.setPreserveCase(true);
  [...find.domNode.querySelectorAll<HTMLElement>('.monaco-custom-toggle')].forEach((toggle, index) => toggle.dataset.option = ['case', 'word', 'regex'][index]);
  replacement.domNode.querySelector<HTMLElement>('.monaco-custom-toggle')!.dataset.option = 'preserve';
  find.onDidChange(value => composition.query = value); replacement.inputBox.onDidChange(value => composition.replacement = value);
  find.onDidOptionChange(() => { composition.matchCase = find.getCaseSensitive(); composition.wholeWord = find.getWholeWords(); composition.regex = find.getRegex(); });
  replacement.onDidOptionChange(() => composition.preserveCase = replacement.getPreserveCase());
  const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:8px'; host.append(actions);
  const replaceButton = new Button(actions, { ...defaultButtonStyles, supportIcons: true, ariaLabel: 'Replace All' }); replaceButton.label = '$(replace-all) Replace All';
  const resetButton = new Button(actions, { ...defaultButtonStyles, secondary: true }); resetButton.label = 'Reset';
  const output = document.createElement('div'); output.dataset.output = ''; output.style.whiteSpace = 'pre-wrap'; output.textContent = composition.text; host.append(output);
  replaceButton.onDidClick(() => {
    if (!composition.query) return;
    try {
      const source = composition.regex ? composition.query : composition.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const expression = new RegExp(composition.wholeWord ? `\\b(?:${source})\\b` : source, composition.matchCase ? 'gu' : 'giu');
      composition.text = composition.text.replace(expression, match => composition.preserveCase ? buildReplaceStringWithCasePreserved([match], composition.replacement) : composition.replacement);
      composition.replacements++; find.onSearchSubmit(); replacement.onSearchSubmit(); output.textContent = composition.text;
    } catch { /* An invalid search expression has no matches. */ }
  });
  resetButton.onDidClick(() => { composition.text = compositionSample; output.textContent = composition.text; });
  // These Tab routes are supplied by the real editor/search callers, not by either input primitive.
  find.onKeyDown(({ browserEvent: event }) => { if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.key === 'Tab') { replacement.focus(); event.preventDefault(); } });
  replacement.onKeyDown(({ browserEvent: event }) => {
    if (!event.altKey && !event.ctrlKey && !event.metaKey && event.key === 'Tab') { if (event.shiftKey) find.focus(); else find.focusOnCaseSensitive(); event.preventDefault(); }
  });
  host.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.key !== 'Tab') return;
    const option = (event.target as HTMLElement).dataset.option;
    if (option === 'case' && event.shiftKey) { replacement.focus(); event.preventDefault(); }
    else if (option === 'regex' && !event.shiftKey) { replacement.focusOnPreserve(); event.preventDefault(); }
    else if (option === 'preserve' && !event.shiftKey) { replaceButton.focus(); event.preventDefault(); }
  });
  (window as any).fixtureComposition = { state: composition, reset: () => { composition.text = compositionSample; output.textContent = composition.text; } };
}
