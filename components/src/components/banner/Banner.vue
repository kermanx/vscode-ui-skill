<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
} from 'vue';
import ActionBar from '../action-bar/ActionBar.vue';
import Tooltip from '../tooltip/Tooltip.vue';
import type { BannerAction, BannerItem } from './types';
import './bannerpart.css';

const items = defineModel<readonly BannerItem[]>('items', {
  default: () => [],
});
const emit = defineEmits<{
  close: [id: string];
  action: [id: string, href: string];
}>();
defineSlots<{ message?: (props: { item: BannerItem }) => unknown }>();
const element = ref<HTMLElement>();
const actionBar = ref<InstanceType<typeof ActionBar>>();
const messageActions = ref<HTMLElement>();
const links = ref<HTMLElement[]>([]);
const generation = ref(0);
let focusedActionIndex = -1;
function linkRef(value: unknown, index: number) {
  if (value instanceof HTMLElement) links.value[index] = value;
}

const item = computed(() => {
  let active: BannerItem | undefined;
  for (const candidate of items.value) {
    if (!active || (candidate.priority ?? 0) >= (active.priority ?? 0))
      active = candidate;
  }
  return active;
});
const closeActions = computed(() => [
  {
    id: 'banner.close',
    label: item.value?.closeLabel ?? 'Close Banner',
    icon: 'widget-close',
  },
]);

watch(
  item,
  async () => {
    const hadFocus = !!element.value?.contains(document.activeElement);
    focusedActionIndex = -1;
    generation.value++;
    await nextTick();
    actionBar.value?.setFocusable(false);
    if (item.value && hadFocus) focus();
  },
  { immediate: true },
);

function show(value: BannerItem) {
  items.value = [...items.value.filter((item) => item.id !== value.id), value];
}
function hide(id: string) {
  items.value = items.value.filter((item) => item.id !== id);
}
function close() {
  const current = item.value;
  if (!current) return;
  hide(current.id);
  emit('close', current.id);
}
function focus() {
  focusedActionIndex = -1;
  element.value?.focus();
}
function focusActionLink() {
  const length = item.value?.actions?.length ?? 0;
  if (focusedActionIndex < length) {
    const actionLink = messageActions.value?.children[focusedActionIndex];
    if (actionLink instanceof HTMLElement) {
      actionBar.value?.setFocusable(false);
      actionLink.focus();
    }
  } else actionBar.value?.focus(0);
}
function focusNextAction() {
  const length = item.value?.actions?.length ?? 0;
  focusedActionIndex = focusedActionIndex < length ? focusedActionIndex + 1 : 0;
  focusActionLink();
}
function focusPreviousAction() {
  const length = item.value?.actions?.length ?? 0;
  focusedActionIndex = focusedActionIndex > 0 ? focusedActionIndex - 1 : length;
  focusActionLink();
}
function keydown(event: KeyboardEvent) {
  if (!(event.target instanceof Node) || !element.value?.contains(event.target))
    return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Escape') focus();
  else if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
    focusNextAction();
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
    focusPreviousAction();
  else return;
  event.preventDefault();
}
onMounted(() => window.addEventListener('keydown', keydown));
onBeforeUnmount(() => window.removeEventListener('keydown', keydown));
function open(action: BannerAction, event: Event) {
  event.preventDefault();
  event.stopPropagation();
  if (item.value) emit('action', item.value.id, action.href);
}
function linkKeydown(action: BannerAction, event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') open(action, event);
}
defineExpose({
  show,
  hide,
  focus,
  focusNextAction,
  focusPreviousAction,
  getActiveItem: () => item.value,
});
</script>

<template>
  <div class="monaco-workbench">
    <div
      ref="element"
      v-show="item"
      class="part banner"
      :class="{ neutral: item?.neutral }"
      style="height: 26px"
      tabindex="0"
      :aria-label="
        item?.ariaLabel || (!$slots.message && item?.message) || undefined
      "
      @focus="focusedActionIndex !== -1 && focusActionLink()"
    >
      <template v-if="item" :key="generation">
        <div
          class="icon-container"
          :class="{ 'custom-icon': typeof item.icon !== 'string' }"
          aria-hidden="true"
          :style="
            typeof item.icon === 'object'
              ? { backgroundImage: `url(${JSON.stringify(item.icon.url)})` }
              : undefined
          "
        >
          <div
            v-if="typeof item.icon === 'string'"
            class="codicon"
            :class="`codicon-${item.icon}`"
          />
        </div>
        <div class="message-container" aria-hidden="true">
          <slot name="message" :item="item"
            ><span>{{ item.message }}</span></slot
          >
        </div>
        <div ref="messageActions" class="message-actions-container">
          <a
            v-for="(action, index) in item.actions"
            :key="index"
            :ref="(el) => linkRef(el, index)"
            class="monaco-link"
            :href="action.href"
            tabindex="0"
            role="button"
            aria-disabled="false"
            style="pointer-events: auto; opacity: 1; cursor: pointer"
            @click="open(action, $event)"
            @keydown="linkKeydown(action, $event)"
            >{{ action.label }}</a
          >
        </div>
        <div class="action-container">
          <ActionBar ref="actionBar" :actions="closeActions" @action="close" />
        </div>
        <template
          v-for="(action, index) in item.actions"
          :key="`tooltip-${index}`"
        >
          <Tooltip
            v-if="action.title"
            :target="links[index]"
            :text="action.title"
          />
        </template>
      </template>
    </div>
  </div>
</template>
