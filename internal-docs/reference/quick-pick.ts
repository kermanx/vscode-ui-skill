// Independent oracle: real QuickInputService.createQuickPick and its real QuickInputList.
import { createQuickInputHost } from './quick-input-host';
import {
  quickPickExamples,
  quickPickProps,
} from '../../components/stories/QuickPickData';
import {
  IQuickPick,
  IQuickPickItem,
  IQuickPickSeparator,
  ItemActivation,
  QuickInputHideReason,
  QuickPickFocus,
} from '../../vscode/src/vs/platform/quickinput/common/quickInput.js';
import { URI } from '../../vscode/src/vs/base/common/uri.js';
import Severity from '../../vscode/src/vs/base/common/severity.js';
import { KeyCodeUtils } from '../../vscode/src/vs/base/common/keyCodes.js';
import { KeyCodeChord } from '../../vscode/src/vs/base/common/keybindings.js';
import { OS } from '../../vscode/src/vs/base/common/platform.js';
import { USLayoutResolvedKeybinding } from '../../vscode/src/vs/platform/keybinding/common/usLayoutResolvedKeybinding.js';
export function mountQuickPick(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
) {
  root.style.position = 'relative';
  surface.className = 'specimen';
  surface.style.cssText =
    'display:grid;grid-template-columns:repeat(2,230px);gap:8px;padding:4px;box-sizing:border-box';
  Object.assign(state, {
    accepts: [],
    hides: [],
    buttons: [],
    changes: [],
    active: [],
    selection: [],
    itemButtons: [],
    separatorButtons: [],
    links: [],
  });
  const service = createQuickInputHost(root, (href) => state.links.push(href));
  let current: IQuickPick<IQuickPickItem, { useSeparators: true }> | undefined;
  let index = 0;
  let itemCache = new Map<string, IQuickPickItem | IQuickPickSeparator>();
  const ids = (items: readonly IQuickPickItem[]) =>
    items.map((item) => item.id);
  function buttons(items: any[] = []) {
    return items.map((button) => ({
      ...button,
      iconClass: `codicon codicon-${button.icon}`,
    }));
  }
  function entries(items: any[]) {
    return items.map((item) => {
      const entry = itemCache.get(item.id) || {};
      for (const key of Object.keys(entry)) delete (entry as any)[key];
      Object.assign(entry, item, {
        buttons: item.buttons && buttons(item.buttons),
      });
      if (item.type !== 'separator') {
        Object.assign(entry, {
          iconClass: item.icon && `codicon codicon-${item.icon}`,
          iconColor: item.iconColor && { id: item.iconColor },
          iconPath: item.iconPath && {
            dark: URI.parse(item.iconPath.dark),
            light: item.iconPath.light && URI.parse(item.iconPath.light),
          },
          keybinding:
            item.keybinding &&
            new USLayoutResolvedKeybinding(
              item.keybinding.map(
                (chord: any) =>
                  new KeyCodeChord(
                    !!chord.ctrlKey,
                    !!chord.shiftKey,
                    !!chord.altKey,
                    !!chord.metaKey,
                    KeyCodeUtils.fromString(chord.key || ''),
                  ),
              ),
              OS,
            ),
        });
      }
      itemCache.set(item.id, entry as IQuickPickItem | IQuickPickSeparator);
      return entry as IQuickPickItem | IQuickPickSeparator;
    });
  }
  function apply(
    input: IQuickPick<IQuickPickItem, { useSeparators: true }>,
    props: any,
  ) {
    const {
      items,
      activeIds,
      selectedIds,
      itemActivation,
      backButton,
      buttons: titleButtons,
      severity,
      value,
      ...rest
    } = props;
    if (value !== undefined) input.value = value;
    Object.assign(input, rest);
    if ('severity' in props)
      input.severity = {
        ignore: Severity.Ignore,
        info: Severity.Info,
        warning: Severity.Warning,
        error: Severity.Error,
      }[severity || 'ignore'];
    if ('buttons' in props || 'backButton' in props)
      input.buttons = [
        ...(backButton ? [service.backButton] : []),
        ...buttons(titleButtons),
      ];
    if (itemActivation)
      input.itemActivation = {
        first: ItemActivation.FIRST,
        second: ItemActivation.SECOND,
        last: ItemActivation.LAST,
        none: ItemActivation.NONE,
      }[itemActivation];
    if (items) input.items = entries(items);
    if (activeIds)
      input.activeItems = activeIds
        .map((id: string) => itemCache.get(id)!)
        .filter((item) => item?.type !== 'separator');
    if (selectedIds)
      input.selectedItems = selectedIds
        .map((id: string) => itemCache.get(id)!)
        .filter((item) => item?.type !== 'separator');
  }
  function show(next: number) {
    current?.dispose();
    index = next;
    itemCache = new Map();
    root.querySelector<HTMLButtonElement>(`[data-open="${index}"]`)?.focus();
    const input = (current = service.createQuickPick({ useSeparators: true }));
    const example = quickPickExamples[index];
    apply(input, {
      ...quickPickProps(example),
      value: example.value || '',
      activeIds: example.activeIds,
      selectedIds: example.selectedIds,
    });
    input.onDidChangeValue((value) => state.changes.push(value));
    input.onDidChangeActive((items) => state.active.push(ids(items)));
    input.onDidChangeSelection((items) => state.selection.push(ids(items)));
    input.onWillAccept((event) => {
      if (example.vetoAccept) event.veto();
    });
    input.onDidAccept((event) => {
      state.accepts.push({
        index,
        selectedIds: ids(input.selectedItems),
        inBackground: event.inBackground,
        keyMods: { ...input.keyMods },
      });
      if (!example.keepOpenOnAccept) input.hide();
    });
    input.onDidHide((event) =>
      state.hides.push({
        index,
        reason:
          event.reason === QuickInputHideReason.Blur
            ? 'blur'
            : event.reason === QuickInputHideReason.Gesture
              ? 'gesture'
              : 'other',
      }),
    );
    input.onDidTriggerButton((button) =>
      state.buttons.push(
        button === service.backButton ? 'back' : (button as any).id,
      ),
    );
    input.onDidTriggerItemButton((event) =>
      state.itemButtons.push({
        itemId: event.item.id,
        buttonId: (event.button as any).id,
      }),
    );
    input.onDidTriggerSeparatorButton((event) =>
      state.separatorButtons.push({
        separatorId: event.separator.id,
        buttonId: (event.button as any).id,
      }),
    );
    input.show();
    (window as any).fixtureQuickPick = {
      hide: () => input.hide(),
      accept: (background?: boolean) => input.accept(background),
      focus: () => input.focusOnInput(),
      focusItem: (name: string) =>
        input.focus(
          QuickPickFocus[
            (name[0].toUpperCase() +
              name.slice(1)) as keyof typeof QuickPickFocus
          ] as QuickPickFocus,
        ),
      snapshot: () => ({
        activeIds: ids(input.activeItems),
        selectedIds: ids(input.selectedItems),
        value: input.value,
        scrollTop: input.scrollTop,
      }),
    };
  }
  (window as any).fixtureOpenQuickPick = show;
  (window as any).fixtureUpdateQuickPick = (props: any) =>
    current && apply(current, props);
  quickPickExamples.forEach((example, index) => {
    const button = document.createElement('button');
    button.className = 'outside';
    button.dataset.open = String(index);
    button.style.cssText = 'margin:0;text-align:left';
    button.textContent = example.name;
    button.addEventListener('click', () => show(index));
    surface.append(button);
  });
  show(Number(new URLSearchParams(location.search).get('case') || 0));
}
