// Live oracle: Radio from the pinned source, including its own Button implementation.
import { Radio } from '../../vscode/src/vs/base/browser/ui/radio/radio.js';
import { radioExamples, replacementRadioOptions } from '../../components/stories/RadioData';
export function mountRadio(root: HTMLElement, surface: HTMLElement, state: any) {
  Object.assign(state, { values: radioExamples.map(group => group.selected), selections: [], activations: [] });
  const radios: Radio[] = [];
  radioExamples.forEach((group, index) => {
    const host = document.createElement('div'); host.style.cssText = 'width:350px;max-width:100%'; host.dataset.index = String(index); surface.append(host);
    const radio = new Radio({ items: group.options.map((item, itemIndex) => ({ ...item, isActive: itemIndex === group.selected })), ariaLabel: group.label, className: group.segmented ? 'segmented' : undefined, arrowKeyBehavior: group.arrowKeyBehavior });
    host.append(radio.domNode); radios.push(radio);
    if (group.disabled) radio.setEnabled(false);
    radio.onDidSelect(value => { state.values[index] = value; state.selections.push({ group: index, index: value }); });
    radio.onDidActivate(value => state.activations.push({ group: index, index: value }));
  });
  let enabled = false;
  const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:8px;margin-top:12px'; root.append(actions);
  const add = (className: string, label: string, action: () => void) => { const button = document.createElement('button'); button.className = className; button.textContent = label; button.onclick = action; actions.append(button); };
  add('fixture-replace', 'Replace options', () => { radios[6].setItems(replacementRadioOptions); state.values[6] = 2; });
  add('fixture-select', 'Select first', () => { radios[6].setActiveItem(0); state.values[6] = 0; });
  add('fixture-enable', 'Toggle enabled', () => { enabled = !enabled; radios[3].setEnabled(enabled); });
}
