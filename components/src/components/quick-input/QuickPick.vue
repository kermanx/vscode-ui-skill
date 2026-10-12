<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import QuickInputShell from './QuickInputShell.vue';
import QuickPickList from './QuickPickList.vue';
import {
  createQuickPickModel,
  filterQuickPick,
  type QuickPickRow,
} from './quickPickModel';
import type { QuickInputHideReason } from './types';
import type {
  QuickPickAcceptEvent,
  QuickPickFocus,
  QuickPickItem,
  QuickPickItemButtonEvent,
  QuickPickKeyMods,
  QuickPickProps,
  QuickPickSeparatorButtonEvent,
  QuickPickWillAcceptEvent,
} from './quickPickTypes';
const props = withDefaults(defineProps<QuickPickProps>(), {
  enabled: true,
  matchOnLabel: true,
  sortByLabel: true,
  matchOnLabelMode: 'fuzzy',
  itemActivation: 'first',
  ok: 'default',
});
const open = defineModel<boolean>('open', { default: false });
const value = defineModel<string>('value', { default: '' });
const activeModel = defineModel<string[]>('activeIds', { default: () => [] });
const selectedModel = defineModel<string[]>('selectedIds', {
  default: () => [],
});
const activeIds = ref(activeModel.value.slice());
const selectedIds = ref(selectedModel.value.slice());
const checkedIds = ref(selectedModel.value.slice());
const emit = defineEmits<{
  accept: [event: QuickPickAcceptEvent];
  willAccept: [event: QuickPickWillAcceptEvent];
  hide: [reason: QuickInputHideReason];
  button: [id: string];
  link: [href: string];
  change: [value: string];
  activeChange: [ids: string[]];
  selectionChange: [ids: string[]];
  itemButton: [event: QuickPickItemButtonEvent];
  separatorButton: [event: QuickPickSeparatorButtonEvent];
}>();
const shell = ref<InstanceType<typeof QuickInputShell>>();
const list = ref<InstanceType<typeof QuickPickList>>();
const rows = ref<QuickPickRow[]>([]);
const scrollTop = ref(0);
let model = createQuickPickModel(props.items);
let initialized = false;
let bufferFocus = false;
let activation = props.itemActivation;
let keyMods: QuickPickKeyMods = { ctrlCmd: false, alt: false, shift: false };
const itemRows = computed(() =>
  rows.value.filter((row) => row.entry.type !== 'separator'),
);
const ariaLabel = computed(
  () =>
    props.ariaLabel ||
    (props.hideInput
      ? undefined
      : props.placeholder
        ? `${props.placeholder}${props.title ? ` - ${props.title}` : ''}`
        : props.title || 'Type to narrow down results.'),
);
const allVisibleChecked = computed(() => {
  const pickable = itemRows.value.filter(
    (row) => (row.entry as QuickPickItem).pickable !== false,
  );
  return (
    pickable.length > 0 &&
    pickable.every((row) => checkedIds.value.includes(row.entry.id))
  );
});
const picker = computed(() => ({
  canSelectMany: !!props.canSelectMany,
  hideInput: !!props.hideInput,
  hideCountBadge: !!props.hideCountBadge,
  hideCheckAll: !!props.hideCheckAll,
  visibleCount: itemRows.value.length,
  selectedCount: checkedIds.value.length,
  allVisibleChecked: allVisibleChecked.value,
  showOk: props.ok === 'default' ? !!props.canSelectMany : props.ok,
  okLabel: props.okLabel || 'OK',
  activeDescendant: rows.value.find(
    (row) => row.entry.id === activeIds.value[0],
  )
    ? list.value?.rowId(
        rows.value.find((row) => row.entry.id === activeIds.value[0])!,
      )
    : undefined,
}));
function equal(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
function active(ids: string[], force = false) {
  if (!force && equal(activeIds.value, ids)) return;
  activeIds.value = ids;
  activeModel.value = ids;
  if (!bufferFocus) emit('activeChange', ids.slice());
}
function selection(ids: string[], force = false) {
  if (!force && equal(selectedIds.value, ids)) return;
  selectedIds.value = ids;
  selectedModel.value = ids;
  emit('selectionChange', ids.slice());
}
function filter() {
  const result = filterQuickPick(model, props.items, props.filterValue?.(value.value) ?? value.value, props);
  rows.value = result.rows.map((row) => ({ ...row }));
  void nextTick(() => list.value?.layout());
  return result.didFilter;
}
async function initialize() {
  initialized = false;
  activeIds.value = activeModel.value.slice();
  selectedIds.value = selectedModel.value.slice();
  checkedIds.value = selectedModel.value.slice();
  model = createQuickPickModel(props.items);
  filter();
  await nextTick();
  await list.value?.layout();
  scrollTop.value = 0;
  if (activeIds.value.length) {
    active(
      activeIds.value.filter((id) =>
        itemRows.value.some((row) => row.entry.id === id),
      ),
      true,
    );
    if (activeIds.value[0]) list.value?.reveal(activeIds.value[0]);
  } else if (
    activation !== 'none' &&
    (!props.canSelectMany || activation !== 'first')
  )
    moveFocus(activation);
  if (selectedIds.value.length)
    selection(
      model.items
        .filter((row) => checkedIds.value.includes(row.entry.id))
        .map((row) => row.entry.id),
      true,
    );
  if (props.hideInput) {
    if (props.canSelectMany) moveFocus('first');
    list.value?.focus();
  }
  activation = 'first';
  initialized = true;
}
async function moveFocus(what: QuickPickFocus) {
  const items = itemRows.value;
  if (!items.length) {
    active([]);
    return;
  }
  const previous = items.findIndex(
    (row) => row.entry.id === activeIds.value[0],
  );
  let next = previous;
  let revealId: string | undefined;
  switch (what) {
    case 'first':
      next = 0;
      list.value?.setScrollTop(0);
      break;
    case 'second':
      next = Math.min(1, items.length - 1);
      list.value?.setScrollTop(0);
      break;
    case 'last':
      next = items.length - 1;
      list.value?.setScrollTop(list.value.getScrollHeight());
      break;
    case 'next':
      next = previous + 1;
      if (next >= items.length)
        next = props.canSelectMany ? items.length - 1 : 0;
      break;
    case 'previous':
      next = previous < 0 ? items.length - 1 : previous - 1;
      if (next < 0) next = props.canSelectMany ? 0 : items.length - 1;
      break;
    case 'nextPage':
    case 'previousPage': {
      const height = list.value?.getHeight() || 0;
      const top = scrollTop.value;
      const sourceRows = rows.value;
      const currentIndex = sourceRows.findIndex(
        (row) => row.entry.id === activeIds.value[0],
      );
      const indexAt = (offset: number) => {
        const index = sourceRows.findIndex(
          (row) => row.top + row.height > offset,
        );
        return index < 0 ? sourceRows.length : index;
      };
      let pageIndex: number;
      if (what === 'nextPage') {
        const index = indexAt(top + height);
        pageIndex = index === 0 ? 0 : index - 1;
      } else pageIndex = top === 0 ? indexAt(top) : indexAt(top - 1) + 1;
      if (
        currentIndex !== pageIndex &&
        (currentIndex < 0 ||
          (what === 'nextPage'
            ? pageIndex > currentIndex
            : currentIndex >= pageIndex))
      ) {
        const direction = what === 'nextPage' ? -1 : 1;
        let good = pageIndex;
        while (sourceRows[good]?.entry.type === 'separator') good += direction;
        const target =
          sourceRows[good] && good !== currentIndex ? good : pageIndex;
        const row = sourceRows[target];
        if (row?.entry.type !== 'separator' && row) {
          active([row.entry.id]);
          list.value?.reveal(row.entry.id);
        }
      } else {
        let nextTop = what === 'nextPage' ? top + height : top - height;
        if (what === 'nextPage' && pageIndex > currentIndex)
          nextTop -= sourceRows[pageIndex]?.height || 0;
        list.value?.setScrollTop(nextTop);
        await nextTick();
        if (scrollTop.value !== top) {
          active([]);
          await new Promise((resolve) => setTimeout(resolve, 0));
          await moveFocus(what);
        }
      }
      return;
    }
    case 'nextSeparator': {
      const boundaries = items
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row, index }) =>
            index === 0 ||
            row.separator ||
            (row.group && items[index - 1]?.group?.id !== row.group.id),
        );
      next =
        boundaries.find((entry) => entry.index > previous)?.index ??
        boundaries[0]?.index ??
        previous;
      if (next === previous) next = items.length - 1;
      revealId = items[next].group?.id || items[next].entry.id;
      break;
    }
    case 'previousSeparator': {
      const boundaries = items
        .map((row, index) => ({ row, index }))
        .filter(
          ({ row, index }) =>
            index === 0 ||
            row.separator ||
            (row.group && items[index - 1]?.group?.id !== row.group.id),
        );
      next =
        boundaries
          .slice()
          .reverse()
          .find((entry) => entry.index < previous)?.index ??
        boundaries.at(-1)?.index ??
        0;
      revealId = items[next].group?.id || items[next].entry.id;
      break;
    }
  }
  const row = items[next];
  if (!row) return;
  active([row.entry.id]);
  if (
    what === 'previous' &&
    row.group &&
    items[next - 1]?.group?.id !== row.group.id
  )
    revealId = row.group.id;
  list.value?.reveal(revealId || row.entry.id);
  if (
    next === previous &&
    props.canSelectMany &&
    (what === 'next' || what === 'previous')
  )
    leave();
}
async function focusItem(what: QuickPickFocus) {
  const moving = moveFocus(what);
  if (props.canSelectMany) list.value?.focus();
  await moving;
}
function handleAccept(inBackground: boolean) {
  let veto = false;
  emit('willAccept', {
    veto: () => {
      veto = true;
    },
  });
  if (!veto)
    emit('accept', {
      selectedIds: selectedIds.value.slice(),
      inBackground,
      keyMods: { ...keyMods },
    });
}
function accept(inBackground = false) {
  if (inBackground && !props.canAcceptInBackground) return;
  if (!props.canSelectMany && activeIds.value[0])
    selection([activeIds.value[0]], true);
  handleAccept(inBackground);
}
function uiAccept() {
  if (props.canSelectMany && !checkedIds.value.length) selection([], true);
  else if (!props.canSelectMany && activeIds.value[0])
    selection([activeIds.value[0]], true);
  handleAccept(false);
}
function checked(id: string, check: boolean) {
  const item = model.items.find((row) => row.entry.id === id)?.entry as
    QuickPickItem | undefined;
  if (!item || item.disabled || item.pickable === false) return;
  const ids = new Set(checkedIds.value);
  if (check) ids.add(id);
  else ids.delete(id);
  checkedIds.value = model.items
    .filter((row) => ids.has(row.entry.id))
    .map((row) => row.entry.id);
  selection(checkedIds.value.slice());
}
function toggleAll(check: boolean) {
  const ids = new Set(checkedIds.value);
  for (const row of itemRows.value) {
    const item = row.entry as QuickPickItem;
    if (item.disabled || item.pickable === false) continue;
    if (check) ids.add(item.id);
    else ids.delete(item.id);
  }
  checkedIds.value = model.items
    .filter((row) => ids.has(row.entry.id))
    .map((row) => row.entry.id);
  selection(checkedIds.value.slice());
}
function leave() {
  window.setTimeout(() => {
    shell.value?.focus();
    if (props.canSelectMany) active([]);
  }, 0);
}
function activateId(id: string) {
  active(
    rows.value.find((row) => row.entry.id === id)?.entry.type === 'separator'
      ? []
      : [id],
  );
}
function select(id: string, event: MouseEvent) {
  const group = rows.value.find(
    (row) => row.entry.id === id && row.entry.type === 'separator',
  );
  if (group) {
    const child = rows.value.find((row) => row.group?.id === id);
    if (child) active([child.entry.id]);
    list.value?.reveal(id, 0);
    if (!props.canSelectMany) selection([]);
    leave();
    return;
  }
  const item = model.items.find((row) => row.entry.id === id)?.entry as
    QuickPickItem | undefined;
  keyMods = {
    ctrlCmd: event.ctrlKey || event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
  };
  if (!props.canSelectMany || item?.pickable === false) {
    if (!equal(selectedIds.value, [id])) {
      selection([id]);
      handleAccept(event.button === 1);
    }
  }
  leave();
}
function button(row: QuickPickRow, id: string) {
  if (row.entry.type === 'separator')
    emit('separatorButton', { separatorId: row.entry.id, buttonId: id });
  else emit('itemButton', { itemId: row.entry.id, buttonId: id });
}
function keydown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing) return;
  keyMods = {
    ctrlCmd: event.ctrlKey || event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
  };
  const mac = navigator.platform.includes('Mac');
  const separator = mac ? event.metaKey : event.altKey;
  const inputFocused = shell.value?.getInput() === document.activeElement;
  let command: QuickPickFocus | undefined;
  if (event.key === 'ArrowDown') command = separator ? 'nextSeparator' : 'next';
  else if (event.key === 'ArrowUp')
    command = separator ? 'previousSeparator' : 'previous';
  else if (event.key === 'PageDown') command = 'nextPage';
  else if (event.key === 'PageUp') command = 'previousPage';
  else if (event.key === 'Home' && (event.ctrlKey || !inputFocused))
    command = 'first';
  else if (event.key === 'End' && (event.ctrlKey || !inputFocused))
    command = 'last';
  if (command) {
    event.preventDefault();
    event.stopPropagation();
    focusItem(command);
  } else if (
    event.key === ' ' &&
    event.ctrlKey &&
    !event.altKey &&
    !event.metaKey
  ) {
    event.preventDefault();
    event.stopPropagation();
    list.value?.toggleHover();
  } else if (event.key === ' ' && !inputFocused && props.canSelectMany) {
    event.preventDefault();
    event.stopPropagation();
    const id = activeIds.value[0];
    if (id) checked(id, !checkedIds.value.includes(id));
  } else if (
    event.key === 'ArrowRight' &&
    props.canAcceptInBackground &&
    (!inputFocused ||
      shell.value?.getInput()?.selectionEnd === value.value.length)
  ) {
    event.preventDefault();
    event.stopPropagation();
    accept(true);
  }
}
watch(value, (next, previous) => {
  if (!initialized || !open.value || next === previous) return;
  if (filter()) {
    active([]);
    if (!props.canSelectMany) {
      selection([]);
      void moveFocus('first');
    }
  }
  emit('change', next);
});
watch(
  () => props.items,
  async () => {
    if (!initialized || !open.value) return;
    const oldScrollTop = scrollTop.value;
    const previousActive = activeIds.value.slice();
    bufferFocus = true;
    model = createQuickPickModel(props.items);
    checkedIds.value = [];
    if (props.canSelectMany) selection([]);
    filter();
    await nextTick();
    await list.value?.layout();
    active([]);
    if (
      activation !== 'none' &&
      (!props.canSelectMany || activation !== 'first')
    )
      await moveFocus(activation);
    activation = 'first';
    bufferFocus = false;
    if (!equal(previousActive, activeIds.value))
      emit('activeChange', activeIds.value.slice());
    if (props.keepScrollPosition) list.value?.setScrollTop(oldScrollTop);
  },
  { deep: true },
);
watch(
  () => props.itemActivation,
  (next) => {
    activation = next;
  },
);
watch(
  () => props.canSelectMany,
  (next) => {
    if (initialized) {
      if (next) active([]);
      else moveFocus('first');
    }
  },
);
watch(
  () => props.hideInput,
  (next) => {
    if (initialized && next) {
      if (props.canSelectMany) moveFocus('first');
      list.value?.focus();
    }
  },
);
watch(activeModel, (ids) => {
  if (!equal(ids, activeIds.value)) {
    if (initialized) {
      active(ids.slice(), true);
      if (ids[0]) void nextTick(() => list.value?.reveal(ids[0]));
    } else activeIds.value = ids.slice();
  }
});
watch(selectedModel, (ids) => {
  if (!equal(ids, selectedIds.value)) {
    if (initialized) {
      if (props.canSelectMany) checkedIds.value = ids.slice();
      selection(ids.slice(), true);
      if (!props.canSelectMany && ids.length) handleAccept(false);
    } else selectedIds.value = ids.slice();
  }
});
function hide(reason: QuickInputHideReason) {
  initialized = false;
  emit('hide', reason);
}
defineExpose({
  hide: () => shell.value?.hide(),
  accept,
  focus: () => shell.value?.focus(),
  focusItem,
  reveal: (id: string) => list.value?.reveal(id),
  snapshot: () => ({
    activeIds: activeIds.value.slice(),
    selectedIds: selectedIds.value.slice(),
    value: value.value,
    scrollTop: scrollTop.value,
  }),
});
</script>
<template>
  <QuickInputShell
    ref="shell"
    v-bind="props"
    v-model:open="open"
    v-model:value="value"
    :picker="picker"
    @opened="initialize"
    @accept="uiAccept"
    @hide="hide"
    @button="emit('button', $event)"
    @link="emit('link', $event)"
    @keydown="keydown"
    @toggle-all="toggleAll"
    @focus-list="list?.focus()"
  >
    <template #default="{ listId, maxHeight }"
      ><QuickPickList
        ref="list"
        v-model:scroll-top="scrollTop"
        :rows="rows"
        :open="open"
        :active-ids="activeIds"
        :selected-ids="canSelectMany ? checkedIds : selectedIds"
        :can-select-many="!!canSelectMany"
        :enabled="enabled"
        :max-height="maxHeight"
        :list-id="listId"
        :aria-label="ariaLabel"
        @activate="activateId"
        @select="select"
        @checked="checked"
        @button="button"
        @keydown="keydown"
    /></template>
  </QuickInputShell>
</template>
