// Live oracle: Checkbox and CheckboxActionViewItem from the pinned source.
import { Checkbox, CheckboxActionViewItem } from '../../vscode/src/vs/base/browser/ui/toggle/toggle.js';
import { defaultCheckboxStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { ActionBar } from '../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js';
export function mountCheckbox(root: HTMLElement, surface: HTMLElement, state: any) {
  const form = document.createElement('form');
  form.className = surface.className; form.dataset.testid = 'specimen'; form.setAttribute('aria-label', 'Editor preferences');
  surface.replaceWith(form);
  Object.assign(state, { values: [false, true, false, true, false, true, false, true], changes: [], bubbled: 0 });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('click', () => state.bubbled++);
  ['Unchecked', 'Checked', 'Disabled unchecked', 'Disabled checked', 'Enable auto save', 'Format on save', 'Disabled option', 'Disabled selected option'].forEach((name, index) => {
    const host = document.createElement('div'); host.style.cssText = 'display:flex;align-items:center;min-height:22px'; host.dataset.index = String(index); form.append(host);
    const change = (checked: boolean, viaKeyboard: boolean) => { state.values[index] = checked; state.changes.push({ index, checked, viaKeyboard }); };
    if (index >= 4) {
      let keyboard = false;
      host.addEventListener('keydown', () => { keyboard = true; }, true);
      host.addEventListener('click', () => { keyboard = false; }, true);
      const action = new Action(`checkbox-${index}`, name, '', index < 6, async () => { change(!!action.checked, keyboard); });
      action.checked = state.values[index];
      const bar = new ActionBar(host, { focusOnlyEnabledItems: true, actionViewItemProvider: (entry, options) => new CheckboxActionViewItem(undefined, entry, { ...options, checkboxStyles: defaultCheckboxStyles }) });
      bar.push(action, { label: true });
    } else {
      const checkbox = new Checkbox(name, state.values[index], defaultCheckboxStyles);
      host.append(checkbox.domNode);
      if (index === 2 || index === 3) checkbox.disable(); else checkbox.enable();
      checkbox.onChange(viaKeyboard => change(checkbox.checked, viaKeyboard));
    }
  });
}
