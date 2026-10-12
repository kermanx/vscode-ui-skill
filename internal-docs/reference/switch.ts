// Live oracle: Switch from the pinned source and its tab-strip composition styles.
import { Switch } from '../../vscode/src/vs/base/browser/ui/toggle/switch.js';
import '../../vscode/src/vs/platform/actionWidget/browser/tabbedActionListWidget.css';
export function mountSwitch(root: HTMLElement, surface: HTMLElement, state: any) {
  const form = document.createElement('form'); form.className = surface.className; form.dataset.testid = 'specimen'; surface.replaceWith(form);
  Object.assign(state, { values: [false, true, false, true, false, true], changes: [], bubbled: 0, submits: 0 });
  form.addEventListener('click', () => state.bubbled++);
  form.addEventListener('submit', event => { event.preventDefault(); state.submits++; });
  const controls: Switch[] = [];
  ['Off switch', 'On switch', 'Disabled off', 'Disabled on', 'Choose model automatically', 'Organization policy'].forEach((ariaLabel, index) => {
    const host = document.createElement('div'); host.dataset.index = String(index); host.style.cssText = 'display:flex;align-items:center;min-height:22px'; form.append(host);
    const title = index === 4 ? 'Pick the best model for each request' : index === 5 ? 'This setting is controlled by your organization' : undefined;
    const control = new Switch({ checked: state.values[index], disabled: [2, 3, 5].includes(index), ariaLabel, title }); controls.push(control);
    if (index >= 4) {
      host.className = 'action-widget';
      const row = document.createElement('div'); row.className = 'tabbed-action-list-tab-toggle'; host.append(row);
      const label = document.createElement('span'); label.textContent = index === 4 ? 'Auto' : 'Managed'; row.append(label, control.domNode);
      control.domNode.setAttribute('aria-description', title!);
    } else host.append(control.domNode);
    control.onChange(checked => { state.values[index] = checked; state.changes.push({ index, checked }); });
  });
  const update = document.createElement('button'); update.className = 'fixture-update'; update.textContent = 'Update properties'; root.append(update);
  update.onclick = () => { controls[0].checked = true; state.values[0] = true; controls[2].disabled = false; controls[0].setAriaLabel('Updated setting'); };
}
