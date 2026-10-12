// Live oracle: Toggle from the pinned source, using defaultToggleStyles.
import { Toggle } from '../../vscode/src/vs/base/browser/ui/toggle/toggle.js';
import { defaultToggleStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
export function mountToggle(_root: HTMLElement, surface: HTMLElement, state: any) {
  Object.assign(state, { values: [false, true, false, true, false, false, true, false], changes: [], keys: [], bubbled: 0 });
  surface.addEventListener('click', () => state.bubbled++);
  const options = [
    { title: 'Match Case', icon: 'case-sensitive' }, { title: 'Match Whole Word', icon: 'whole-word' },
    { title: 'Use Regular Expression', icon: 'regex', disabled: true }, { title: 'Preserve Case', icon: 'preserve-case', disabled: true },
    { title: '$(regex) Empty toggle', focusable: false },
  ];
  function add(host: HTMLElement, option: typeof options[number], index: number) {
    const toggle = new Toggle({ ...defaultToggleStyles, title: option.title, icon: option.icon ? { id: option.icon } : undefined, isChecked: state.values[index], notFocusable: option.focusable === false });
    host.append(toggle.domNode);
    if (option.disabled) toggle.disable(); else toggle.enable();
    toggle.onChange(viaKeyboard => { state.values[index] = toggle.checked; state.changes.push({ index, checked: toggle.checked, viaKeyboard }); });
    toggle.onKeyDown(event => state.keys.push(event.browserEvent.key));
  }
  options.forEach((option, index) => {
    const host = document.createElement('div'); host.style.cssText = 'display:flex;align-items:center;min-height:22px'; host.dataset.index = String(index); surface.append(host); add(host, option, index);
  });
  const toolbar = document.createElement('div'); toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', 'Find options'); toolbar.style.cssText = 'display:flex;align-items:center;min-height:22px'; toolbar.dataset.testid = 'find-options'; surface.append(toolbar);
  options.slice(0, 3).forEach((option, offset) => { const host = document.createElement('div'); host.dataset.index = String(offset + 5); toolbar.append(host); add(host, { ...option, disabled: false }, offset + 5); });
}
