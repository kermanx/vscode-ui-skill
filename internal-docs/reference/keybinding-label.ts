// Live oracle: KeybindingLabel from the pinned source, driven by real ResolvedKeybinding objects.
// Row data and row layout mirror the replica specimen, so both pages render the same list.
import { KeybindingLabel } from '../../vscode/src/vs/base/browser/ui/keybindingLabel/keybindingLabel.js';
import { KeyCode, KeyChord, KeyMod } from '../../vscode/src/vs/base/common/keyCodes.js';
import { KeyCodeChord } from '../../vscode/src/vs/base/common/keybindings.js';
import { OperatingSystem } from '../../vscode/src/vs/base/common/platform.js';
import { defaultKeybindingLabelStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { USLayoutResolvedKeybinding } from '../../vscode/src/vs/platform/keybinding/common/usLayoutResolvedKeybinding.js';
import { items } from '../../components/stories/keybindingLabelData';
import layoutCss from '../../components/stories/keybindingLabelLayout.css?inline';

const osOf: Record<string, OperatingSystem> = { macintosh: OperatingSystem.Macintosh, windows: OperatingSystem.Windows, linux: OperatingSystem.Linux };
/** Encoded chords per fixture id, keeping the platform mapping identical to the replica data. */
const encodedChords: Record<string, number[]> = {
  save: [KeyMod.CtrlCmd | KeyCode.KeyS],
  'command-palette': [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP],
  'keyboard-shortcuts': [KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyS)],
  'save-as': [KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyS],
  format: [KeyMod.Shift | KeyMod.Alt | KeyCode.KeyF],
  'split-editor': [KeyMod.CtrlCmd | KeyCode.Backslash],
  'match-ctrl': [KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyS)],
  'match-key': [KeyChord(KeyMod.CtrlCmd | KeyCode.KeyK, KeyMod.CtrlCmd | KeyCode.KeyS)],
  'no-title': [KeyMod.CtrlCmd | KeyCode.F2],
};
/** A real ResolvedKeybinding: USLayoutResolvedKeybinding over KeyCodeChords, like the workbench. */
function resolve(os: OperatingSystem, encoded: number[]) {
  const chords = encoded.flatMap(part => [part & 0x0000FFFF, (part >>> 16) & 0x0000FFFF])
    .filter(part => part !== 0)
    .map(part => new KeyCodeChord(
      os === OperatingSystem.Macintosh ? Boolean(part & KeyMod.WinCtrl) : Boolean(part & KeyMod.CtrlCmd),
      Boolean(part & KeyMod.Shift),
      Boolean(part & KeyMod.Alt),
      os === OperatingSystem.Macintosh ? Boolean(part & KeyMod.CtrlCmd) : Boolean(part & KeyMod.WinCtrl),
      part & 0x000000FF,
    ));
  return new USLayoutResolvedKeybinding(chords, os);
}
export function mountKeybindingLabel(_root: HTMLElement, surface: HTMLElement, state: any) {
  Object.assign(state, { labels: [] as (string | null)[], text: [] as (string | null)[], classes: [] as string[][], highlights: [] as number[], unbound: [] as boolean[] });
  // The standalone page only loads upstream CSS, so the shared row geometry is injected here.
  if (!document.querySelector('#fixture-keybinding-layout')) {
    const layout = document.createElement('style');
    layout.id = 'fixture-keybinding-layout';
    layout.textContent = layoutCss;
    document.head.append(layout);
  }
  const list = document.createElement('div');
  list.className = 'keybinding-list';
  list.dataset.testid = 'keybinding-list';
  surface.append(list);
  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'keybinding-row';
    row.dataset.index = String(index);
    const text = document.createElement('span');
    text.className = 'keybinding-label';
    text.textContent = item.label;
    row.append(text);
    list.append(row);
    const os = osOf[item.os];
    const label = new KeybindingLabel(row, os, {
      ...defaultKeybindingLabelStyles,
      renderUnboundKeybindings: !item.chords,
      disableTitle: item.disableTitle,
    });
    label.set(item.chords ? resolve(os, encodedChords[item.id]) : undefined, item.matches);
  });
  for (const row of list.children) {
    const element = row.querySelector('.monaco-keybinding')!;
    state.labels.push(element.getAttribute('aria-label'));
    state.text.push(element.textContent);
    state.classes.push([...element.children].map(child => child.className));
    state.highlights.push(element.querySelectorAll('.highlight').length);
    state.unbound.push(element.children.length === 1 && element.children[0].classList.contains('monaco-keybinding-key'));
  }
}
