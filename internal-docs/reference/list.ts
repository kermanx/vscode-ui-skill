// Real List with the classic Open Editors renderer structure and source workbench key commands.
import { List } from '../../vscode/src/vs/base/browser/ui/list/listWidget.js';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { ActionBar } from '../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js';
import { Action, Separator } from '../../vscode/src/vs/base/common/actions.js';
import { defaultListStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { DecorationsService } from '../../vscode/src/vs/workbench/services/decorations/browser/decorationsService.js';
import { URI } from '../../vscode/src/vs/base/common/uri.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import '../../vscode/src/vs/workbench/contrib/files/browser/views/media/openeditors.css';
import { listItems, manyListItems, changedListItems } from '../../components/stories/ListData';
import type { ListItem } from '../../components/src/components/list/types';
export function mountList(root: HTMLElement, surface: HTMLElement, state: any) {
  surface.className = 'specimen tree-specimen open-editors';
  const params = new URLSearchParams(location.search);
  let items = params.get('large') === 'true' ? manyListItems : listItems;
  const multiple = params.get('multiple') !== 'false';
  Object.assign(state, { focus: [], selection: [], actions: [], contexts: [] });
  const decorations = new DecorationsService({ extUri: { ignorePathCasing: () => false } } as any, {} as any);
  decorations.registerDecorationsProvider({ label: 'Fixture', onDidChange: Event.None, provideDecorations(uri) {
    const value = items.find(item => `/${item.id}` === uri.path)?.decoration;
    return value ? { letter: value.badge, color: value.color, tooltip: value.tooltip, strikethrough: value.strikethrough } : undefined;
  } });
  const list = new List<ListItem>('list-reference', surface, { getHeight: () => 22, getTemplateId: () => 'item' }, [{
    templateId: 'item',
    renderTemplate(container) { const actionBar = new ActionBar(container); const label = new IconLabel(container); return { actionBar, label, decoration: undefined as any, container }; },
    renderElement(item, index, data) {
      data.container.dataset.id = item.id;
      data.decoration?.dispose(); data.decoration = decorations.getDecoration(URI.file(`/${item.id}`), false);
      const extraClasses = ['open-editor']; if (data.decoration) extraClasses.push(data.decoration.labelClassName, data.decoration.badgeClassName);
      data.label.setLabel(item.label, item.description, { extraClasses, iconPath: item.icon ? { id: item.icon } : undefined, italic: item.italic, strikethrough: data.decoration?.strikethrough, title: data.decoration?.tooltip });
      data.actionBar.clear(); data.actionBar.setAriaLabel(`Actions for ${item.label}`);
      for (const entry of item.actions ?? []) {
        if ('separator' in entry) { data.actionBar.push(new Separator()); continue; }
        const action = new Action(entry.id, entry.label, entry.icon ? `codicon-${entry.icon}` : '', !entry.disabled, async () => { state.actions.push(`${item.id}:${entry.id}`); });
        action.tooltip = entry.tooltip || ''; if (entry.checked !== undefined) action.checked = entry.checked;
        data.actionBar.push(action, { icon: Boolean(entry.icon), label: entry.showLabel ?? !entry.icon, keybinding: entry.keybinding });
      }
    }, disposeTemplate(data) { data.decoration?.dispose(); data.actionBar.dispose(); data.label.dispose(); },
  }], { identityProvider: { getId: item => item.id }, multipleSelectionSupport: multiple, horizontalScrolling: false, smoothScrolling: false,
    keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: item => item.label },
    accessibilityProvider: { getWidgetAriaLabel: () => 'Open files', getAriaLabel: item => [item.label, item.decoration?.tooltip, item.actions?.length ? 'has actions' : undefined].filter(Boolean).join(', ') },
  });
  list.style({ ...defaultListStyles, listBackground: 'var(--vscode-sideBar-background)' });
  list.splice(0, 0, items); list.layout(264, surface.clientWidth);
  new ResizeObserver(() => list.layout(264, surface.clientWidth)).observe(surface);
  list.onDidChangeFocus(e => { state.focus = e.elements.map(item => item.id); });
  list.onDidChangeSelection(e => { state.selection = e.elements.map(item => item.id); });
  list.onContextMenu(e => { if (e.element) state.contexts.push(e.element.id); e.browserEvent.preventDefault(); });
  // These are the actual workbench listCommands adapters. Base List does not bind Home/End or Shift+arrows.
  list.getHTMLElement().addEventListener('keydown', event => {
    if (event.target !== list.getHTMLElement()) return;
    if ((event.key === 'Home' || event.key === 'End') && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); event.stopImmediatePropagation();
      const fake = new KeyboardEvent('keydown', { altKey: event.altKey });
      if (event.key === 'Home') list.focusFirst(fake); else list.focusLast(fake);
      const focused = list.getFocus(); if (focused.length) list.reveal(focused[0]); list.setAnchor(focused[0]); list.domFocus();
    } else if (multiple && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault(); event.stopImmediatePropagation();
      const previous = list.getFocus()[0];
      const fake = new KeyboardEvent('keydown');
      if (event.key === 'ArrowDown') list.focusNext(1, false, fake); else list.focusPrevious(1, false, fake);
      const focused = list.getFocus()[0], selection = list.getSelection();
      if (typeof focused === 'number') list.setSelection(selection.includes(focused) ? selection.filter(i => i !== previous) : selection.concat(focused));
      if (typeof focused === 'number') list.reveal(focused); list.domFocus();
    }
  }, true);
  function update(next: ListItem[]) { items = next; list.splice(0, list.length, items); }
  const change = document.createElement('button'); change.className = 'fixture-update'; change.textContent = 'Update items'; change.onclick = () => update(changedListItems(items)); root.append(change);
  const clear = document.createElement('button'); clear.className = 'fixture-clear'; clear.textContent = 'Clear items'; clear.onclick = () => update([]); root.append(clear);
  (window as any).referenceList = list;
}
