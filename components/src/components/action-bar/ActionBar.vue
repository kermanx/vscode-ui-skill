<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import './actionbar.css';
import {
  Comment,
  getCurrentInstance,
  onBeforeUnmount,
  ref,
  useSlots,
  watch,
} from 'vue';
import Tooltip from '../tooltip/Tooltip.vue';
import type { ActionBarAction, ActionBarEntry } from './types';
const props = withDefaults(
  defineProps<{
    actions: readonly ActionBarEntry[];
    ariaLabel?: string;
    ariaRole?: 'toolbar' | 'tablist';
    orientation?: 'horizontal' | 'vertical';
    focusOnlyEnabledItems?: boolean;
    preventLoopNavigation?: boolean;
  }>(),
  { orientation: 'horizontal', ariaRole: 'toolbar' },
);
const emit = defineEmits<{
  action: [id: string, event: Event];
  cancel: [];
  blur: [];
}>();
defineSlots<{
  item?: (props: {
    entry: ActionBarEntry;
    index: number;
    tabindex: number;
    focused: boolean;
    onFocus: () => void;
  }) => unknown;
}>();
const slots = useSlots();
function hasCustomItem(entry: ActionBarEntry, index: number) {
  return slots
    .item?.({
      entry,
      index,
      tabindex: tabStops.value.has(index) ? 0 : -1,
      focused: itemFocus.value === index,
      onFocus: () => itemFocused(index),
    })
    ?.some((node) => node.type !== Comment);
}
const instance = getCurrentInstance();
const root = ref<HTMLElement>(),
  list = ref<HTMLElement>();
const itemElements = ref<Record<string, HTMLElement>>({});
const itemRefs = new Map<string, (element: unknown) => void>();
function itemRef(entry: ActionBarEntry) {
  if (!isAction(entry)) return undefined;
  let callback = itemRefs.get(entry.id);
  if (!callback) {
    const id = entry.id;
    callback = (element) => {
      if (element instanceof HTMLElement) itemElements.value[id] = element;
      else {
        delete itemElements.value[id];
        itemRefs.delete(id);
      }
    };
    itemRefs.set(id, callback);
  }
  return callback;
}
const active = ref<number>(),
  tabStops = ref(new Set<number>());
const itemFocus = ref<number>();
let focusable = true;
function setFocusable(value: boolean) {
  focusable = value;
  if (value) {
    const index = props.actions.findIndex(enabled);
    if (index >= 0) tabStops.value.add(index);
  } else {
    tabStops.value.clear();
    list.value
      ?.querySelectorAll<HTMLElement>('.action-label')
      .forEach((label) => {
        label.tabIndex = -1;
      });
  }
}
let focused: number | undefined,
  previous: number | undefined,
  triggerDown = false;
function isAction(entry: ActionBarEntry): entry is ActionBarAction {
  return !('separator' in entry);
}
function enabled(entry: ActionBarEntry) {
  return isAction(entry) && !entry.disabled;
}
function tooltip(entry: ActionBarAction) {
  return (
    entry.tooltip ||
    (entry.keybinding ? `${entry.label} (${entry.keybinding})` : entry.label)
  );
}
function showLabel(entry: ActionBarAction) {
  return entry.showLabel ?? !entry.icon;
}
function itemFocused(index: number) {
  focused = index;
}
watch(
  () => props.actions,
  () => {
    const first = props.actions.findIndex(
      (entry) =>
        isAction(entry) && (!props.focusOnlyEnabledItems || enabled(entry)),
    );
    tabStops.value = new Set(first < 0 || !focusable ? [] : [first]);
    if (focused !== undefined && focused >= props.actions.length)
      focused = undefined;
  },
  { immediate: true },
);
function updateFocus(force = false) {
  if (previous !== undefined && previous !== focused) {
    tabStops.value.delete(previous);
    if (itemFocus.value === previous) itemFocus.value = undefined;
    const previousLabel =
      list.value?.children[previous]?.querySelector<HTMLElement>(
        '.action-label',
      );
    if (previousLabel) previousLabel.tabIndex = -1;
  }
  const entry = focused === undefined ? undefined : props.actions[focused];
  if (
    !entry ||
    !isAction(entry) ||
    (props.focusOnlyEnabledItems && !enabled(entry))
  ) {
    list.value?.focus();
    previous = undefined;
    return;
  }
  if (force || previous !== focused) {
    tabStops.value.add(focused!);
    const label =
      list.value?.children[focused!]?.querySelector<HTMLElement>(
        '.action-label',
      );
    if (label) {
      label.tabIndex = 0;
      label.focus();
    }
    itemFocus.value = focused;
    previous = focused;
  }
}
function focus(arg: number | boolean = true) {
  if (arg === true && focused === undefined) {
    const first = props.actions.findIndex(enabled);
    focused = first < 0 ? undefined : first;
  } else if (typeof arg === 'number') focused = arg;
  updateFocus(true);
}
function move(direction: number, forceLoop = false) {
  const count = props.actions.length;
  if (!count) return false;
  if (focused === undefined) focused = direction > 0 ? count - 1 : 0;
  else if (count <= 1) return false;
  const start = focused;
  do {
    const next: number = focused! + direction;
    if (
      !forceLoop &&
      props.preventLoopNavigation &&
      (next < 0 || next >= count)
    ) {
      focused = start;
      return false;
    }
    focused = (next + count) % count;
    const entry = props.actions[focused]!;
    if (isAction(entry) && (!props.focusOnlyEnabledItems || enabled(entry)))
      break;
  } while (focused !== start);
  updateFocus();
  return true;
}
function run(entry: ActionBarEntry | undefined, event: Event) {
  if (entry && enabled(entry) && isAction(entry))
    emit('action', entry.id, event);
}
function keydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  let handled = true;
  const vertical = props.orientation === 'vertical';
  if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) handled = move(-1);
  else if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight'))
    handled = move(1);
  else if (event.key === 'Home') {
    focused = props.actions.length - 1;
    handled = move(1, true);
  } else if (event.key === 'End') {
    focused = 0;
    handled = move(-1, true);
  } else if (event.key === 'Escape' && instance?.vnode.props?.onCancel)
    emit('cancel');
  else if (event.key === 'Enter' || event.key === ' ') triggerDown = true;
  else handled = false;
  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
}
function keyup(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (triggerDown) {
    triggerDown = false;
    run(focused === undefined ? undefined : props.actions[focused], event);
  }
  event.preventDefault();
  event.stopPropagation();
}
let blurTimer: ReturnType<typeof setTimeout> | undefined;
function focusin() {
  clearTimeout(blurTimer);
}
function focusout() {
  clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    if (root.value?.contains(document.activeElement)) return;
    previous = focused;
    focused = undefined;
    triggerDown = false;
    emit('blur');
  }, 0);
}
onBeforeUnmount(() => clearTimeout(blurTimer));
function contextmenu(entry: ActionBarEntry, event: MouseEvent) {
  if (/Mac/.test(navigator.platform) && event.button === 0 && event.ctrlKey)
    run(entry, event);
}
defineExpose({ focus, setFocusable });
</script>
<template>
  <div
    ref="root"
    class="monaco-action-bar"
    :class="{ vertical: orientation === 'vertical' }"
    @keydown="keydown"
    @keyup="keyup"
    @focusout="focusout"
    @focusin="focusin"
  >
    <ul
      ref="list"
      class="actions-container"
      :role="actions.length ? ariaRole : 'presentation'"
      :aria-label="ariaLabel || undefined"
    >
      <li
        v-for="(entry, index) in actions"
        :ref="itemRef(entry)"
        :key="isAction(entry) ? entry.id : `separator-${index}`"
        class="action-item"
        role="presentation"
        :class="{ disabled: !enabled(entry), active: active === index }"
        @mousedown.prevent.stop="
          enabled(entry) && $event.button === 0 && (active = index)
        "
        @mouseup.stop="active = undefined"
        @mouseout.stop="active = undefined"
        @click.prevent.stop="run(entry, $event)"
        @dblclick.prevent.stop
        @contextmenu.prevent.stop="contextmenu(entry, $event)"
      >
        <Tooltip
          v-if="!hasCustomItem(entry, index) && isAction(entry)"
          :target="itemElements[entry.id]"
          :text="tooltip(entry)"
          placement="element"
        />
        <slot
          name="item"
          :entry="entry"
          :index="index"
          :tabindex="tabStops.has(index) ? 0 : -1"
          :focused="itemFocus === index"
          :on-focus="() => itemFocused(index)"
        >
          <a
            class="action-label"
            :class="
              isAction(entry)
                ? [
                    entry.icon ? `codicon codicon-${entry.icon}` : '',
                    { disabled: entry.disabled, checked: entry.checked },
                  ]
                : 'separator disabled'
            "
            :role="
              isAction(entry)
                ? ariaRole === 'tablist'
                  ? 'tab'
                  : 'button'
                : 'presentation'
            "
            :aria-label="isAction(entry) ? tooltip(entry) : ''"
            :aria-disabled="!enabled(entry) || undefined"
            :aria-pressed="
              ariaRole !== 'tablist' &&
              isAction(entry) &&
              entry.checked !== undefined
                ? entry.checked
                : undefined
            "
            :aria-selected="
              ariaRole === 'tablist' &&
              isAction(entry) &&
              entry.checked !== undefined
                ? entry.checked
                : undefined
            "
            :tabindex="tabStops.has(index) ? 0 : -1"
            @focus="focused = index"
            >{{ isAction(entry) && showLabel(entry) ? entry.label : '' }}</a
          >
          <span
            v-if="isAction(entry) && showLabel(entry) && entry.keybinding"
            class="keybinding"
            >{{ entry.keybinding }}</span
          >
        </slot>
      </li>
    </ul>
  </div>
</template>
