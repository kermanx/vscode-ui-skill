/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { computed, onBeforeUnmount, ref, watch, type ModelRef } from 'vue';
import type { ListItem } from './types';

export function useList(
  props: { items: readonly ListItem[]; multiple: boolean },
  selected: ModelRef<string[]>,
  reveal: (index: number) => void,
  onFocus: (id: string | undefined) => void,
  rowHeight: () => number = () => 22,
) {
  const focused = ref<string>();
  const ids = computed(() => props.items.map((item) => item.id));
  let anchor: string | undefined;
  let typed = '';
  let timer: ReturnType<typeof setTimeout>;
  function focus(id?: string, scroll = false) {
    if (focused.value !== id) {
      focused.value = id;
      onFocus(id);
    }
    if (scroll && id !== undefined) reveal(ids.value.indexOf(id));
  }
  function singleModifier(event: MouseEvent | KeyboardEvent) {
    return /Mac/.test(navigator.platform) ? event.metaKey : event.ctrlKey;
  }
  function click(item: ListItem, event: MouseEvent) {
    const id = item.id;
    if (props.multiple && event.shiftKey) {
      anchor ??= focused.value ?? id;
      const a = Math.max(0, ids.value.indexOf(anchor)),
        b = ids.value.indexOf(id);
      const previous = new Set([...selected.value, anchor]);
      let first = a,
        last = a;
      while (first > 0 && previous.has(ids.value[first - 1])) first--;
      while (last + 1 < ids.value.length && previous.has(ids.value[last + 1]))
        last++;
      const keep = selected.value.filter(
        (key) => !ids.value.slice(first, last + 1).includes(key),
      );
      selected.value = [
        ...new Set([
          ...keep,
          ...ids.value.slice(Math.min(a, b), Math.max(a, b) + 1),
        ]),
      ].sort((x, y) => ids.value.indexOf(x) - ids.value.indexOf(y));
      focus(id);
      return;
    }
    if (props.multiple && singleModifier(event)) {
      focus(id);
      anchor = id;
      selected.value = selected.value.includes(id)
        ? selected.value.filter((key) => key !== id)
        : [...selected.value, id];
      return;
    }
    focus(id);
    anchor = id;
    if (event.button !== 2) selected.value = [id];
  }
  function blank() {
    focus();
    selected.value = [];
    anchor = undefined;
  }
  function keydown(
    event: KeyboardEvent,
    scrollTop: number,
    height: number,
    setScroll: (top: number) => void,
  ) {
    const index = ids.value.indexOf(focused.value!);
    let handled = true;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const previous = focused.value;
        const next =
          index < 0
            ? 0
            : Math.max(
                0,
                Math.min(
                  ids.value.length - 1,
                  index + (event.key === 'ArrowDown' ? 1 : -1),
                ),
              );
        if (ids.value[next] !== undefined) focus(ids.value[next], true);
        if (
          event.shiftKey &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          props.multiple
        ) {
          if (focused.value !== undefined)
            selected.value = selected.value.includes(focused.value)
              ? selected.value.filter((id) => id !== previous)
              : [...selected.value, focused.value];
        } else anchor = focused.value;
        break;
      }
      case 'Home':
      case 'End':
        if (event.shiftKey || event.ctrlKey || event.metaKey) {
          handled = false;
          break;
        }
        focus(event.key === 'Home' ? ids.value[0] : ids.value.at(-1), true);
        anchor = focused.value;
        break;
      case 'Enter':
        selected.value = focused.value === undefined ? [] : [focused.value];
        break;
      case 'Escape':
        if (selected.value.length) {
          selected.value = [];
          anchor = undefined;
        } else handled = false;
        break;
      case 'PageDown':
      case 'PageUp': {
        const down = event.key === 'PageDown';
        let top = scrollTop;
        let edge = down
          ? Math.max(0, Math.floor((top + height) / rowHeight()) - 1)
          : Math.ceil(top / rowHeight());
        if (index === edge || (down ? index > edge : index < edge)) {
          top = Math.max(
            0,
            Math.min(
              ids.value.length * rowHeight() - height,
              top + (down ? height : -height),
            ),
          );
          setScroll(top);
          edge = down
            ? Math.max(0, Math.floor((top + height) / rowHeight()) - 1)
            : Math.ceil(top / rowHeight());
        }
        if (ids.value[edge] !== undefined) focus(ids.value[edge], true);
        anchor = focused.value;
        break;
      }
      default:
        if (
          event.key.toLowerCase() === 'a' &&
          singleModifier(event) &&
          props.multiple
        ) {
          selected.value = [...ids.value];
          anchor = undefined;
        } else if (
          event.key.length === 1 &&
          event.key !== ' ' &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          const delta = typed ? 0 : 1;
          typed += event.key.toLocaleLowerCase();
          clearTimeout(timer);
          timer = setTimeout(() => {
            typed = '';
          }, 800);
          for (let i = 0; i < props.items.length; i++) {
            const candidate =
              props.items[
                ((index < 0 ? 0 : index) + i + delta) % props.items.length
              ];
            if (candidate.label.toLocaleLowerCase().startsWith(typed)) {
              focus(candidate.id, true);
              break;
            }
          }
        } else handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  watch(ids, (next) => {
    if (focused.value !== undefined && !next.includes(focused.value)) focus();
    const set = new Set(selected.value);
    selected.value = next.filter((id) => set.has(id));
    if (anchor !== undefined && !next.includes(anchor)) anchor = undefined;
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return { focused, focus, click, blank, keydown };
}
