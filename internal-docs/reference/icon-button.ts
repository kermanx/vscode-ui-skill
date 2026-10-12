// Live oracle: each icon button is a single icon-only Action in a real ActionBar.
import { ActionBar } from '../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { iconButtonExamples } from '../../components/stories/IconButtonData';
export function mountIconButton(root: HTMLElement, surface: HTMLElement, state: any) {
  Object.assign(state, { clicks: [], bubbled: 0 });
  surface.addEventListener('click', () => state.bubbled++);
  const actions: Action[] = [];
  function add(host: HTMLElement, example: typeof iconButtonExamples[number], index: number, markRoot = false) {
    const bar = new ActionBar(host);
    if (markRoot) (host.lastElementChild as HTMLElement).dataset.index = String(index);
    const action = new Action('icon-button', example.label, `codicon-${example.icon}`, !example.disabled);
    action.tooltip = example.tooltip || '';
    if (example.checked !== undefined) action.checked = example.checked;
    bar.push(action, { icon: true, label: false });
    bar.onDidRun(event => { if (!event.error) state.clicks.push({ index, type: lastType }); });
    let lastType = '';
    bar.domNode.addEventListener('click', () => { lastType = 'click'; }, true);
    bar.domNode.addEventListener('keyup', () => { lastType = 'keyup'; }, true);
    actions.push(action);
  }
  iconButtonExamples.forEach((example, index) => {
    const host = document.createElement('div'); host.dataset.index = String(index); host.style.cssText = 'display:flex;align-items:center;height:22px'; surface.append(host); add(host, example, index);
  });
  const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:center;height:22px;gap:4px'; surface.append(row);
  const label = document.createElement('span'); label.style.marginRight = 'auto'; label.textContent = 'Project files'; row.append(label);
  add(row, { icon: 'new-file', label: 'Add file' }, 5, true);
  add(row, { icon: 'collapse-all', label: 'Collapse all' }, 6, true);
  const update = document.createElement('button'); update.className = 'fixture-update'; update.textContent = 'Update properties'; root.append(update);
  update.onclick = () => { actions[0].class = 'codicon-new-folder'; actions[0].label = 'New Folder'; actions[0].tooltip = 'Create a folder'; actions[1].enabled = true; actions[2].checked = false; };
}
