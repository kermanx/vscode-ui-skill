<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  Comment,
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  ref,
  useSlots,
  watch,
} from 'vue';
import { dropdownPopupHost } from '../dropdown/popupHost';
import ScrollableElement from '../scrollable-element/ScrollableElement.vue';
import { layoutHover } from './layout';
import { instantHoverKey } from '../tooltip/delegate';
import { claimHover, type HoverRegistration } from './coordinator';
import type { HoverAction, HoverPosition, HoverTarget } from './types';
const props = withDefaults(
  defineProps<{
    target: HTMLElement | HoverTarget | null;
    content?: string;
    position?: HoverPosition;
    alignment?: 'left' | 'right';
    showPointer?: boolean;
    compact?: boolean;
    actions?: readonly HoverAction[];
    hideOnHover?: boolean;
    hideOnKeyDown?: boolean;
    sticky?: boolean;
    trapFocus?: boolean;
    forcePosition?: boolean;
    maxHeightRatio?: number;
  }>(),
  {
    position: 'above',
    alignment: 'left',
    showPointer: false,
    compact: false,
    actions: () => [],
    hideOnHover: undefined,
    hideOnKeyDown: false,
    sticky: false,
    trapFocus: false,
    forcePosition: false,
    maxHeightRatio: 0.5,
  },
);
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ action: [id: string]; show: []; hide: [] }>();
const popupHost = inject(dropdownPopupHost, undefined);
const instant = inject(instantHoverKey, undefined);
const slots = useSlots();
const htmlContent = computed(
  () => !!slots.default?.().some((node) => node.type !== Comment),
);
const nestingDepth = ref(0);
const portal = ref<HTMLElement>(),
  host = ref<HTMLElement>(),
  root = ref<HTMLElement>(),
  pointer = ref<HTMLElement>();
const scroller = ref<InstanceType<typeof ScrollableElement>>(),
  locked = ref(false),
  focusTrap = ref(false),
  activeTrap = ref(false),
  ready = ref(false),
  overflowing = ref(false);
const at = computed<HoverTarget | undefined>(() =>
  !props.target
    ? undefined
    : 'targetElements' in props.target
      ? props.target
      : { targetElements: [props.target] },
);
const hideOnHover = computed(() =>
  props.actions.length ? false : (props.hideOnHover ?? !htmlContent.value),
);
let generation = 0,
  releaseHover: HoverRegistration | undefined;
const nestedInside = new Set<object>();
let cleanup = () => {},
  previousFocus: HTMLElement | undefined,
  focusRequested = false,
  targetInside = true,
  hoverInside = false;
let timer: ReturnType<typeof setTimeout> | undefined,
  suppressed = false,
  resize: ResizeObserver | undefined,
  intersection: IntersectionObserver | undefined;
function lastFocusable(node: Element): HTMLElement | undefined {
  for (const child of [...node.children].reverse()) {
    if ((child as HTMLElement).tabIndex >= 0) return child as HTMLElement;
    const found = lastFocusable(child);
    if (found) return found;
  }
}
function focus() {
  root.value?.focus();
}
function hide() {
  if (!open.value) return;
  if (
    host.value?.contains(document.activeElement) &&
    previousFocus?.isConnected
  )
    previousFocus.focus();
  open.value = false;
}
async function show(takeFocus = false) {
  focusRequested = takeFocus;
  open.value = true;
  await nextTick();
  if (takeFocus && ready.value) focus();
}
function action(id: string, event: Event) {
  event.preventDefault();
  event.stopPropagation();
  emit('action', id);
  hide();
}
function actionKey(id: string, event: KeyboardEvent) {
  if (
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    (event.key === 'Enter' || event.key === ' ')
  )
    action(id, event);
}
function mouseOver(kind: 'target' | 'hover') {
  if (kind === 'target') targetInside = true;
  else hoverInside = true;
  suppressed = false;
  if (targetInside || nestedInside.size || (!hideOnHover.value && hoverInside))
    clearTimeout(timer);
}
function mouseLeave(kind: 'target' | 'hover') {
  if (kind === 'target') targetInside = false;
  else hoverInside = false;
  if (targetInside || nestedInside.size || (!hideOnHover.value && hoverInside))
    return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (
      !locked.value &&
      !suppressed &&
      !targetInside &&
      !nestedInside.size &&
      (hideOnHover.value || !hoverInside)
    )
      hide();
  }, 200);
}
function keyDown(event: KeyboardEvent) {
  if (props.sticky) return;
  if (event.key === 'Alt') {
    locked.value = true;
    return;
  }
  if (
    releaseHover?.isTop() &&
    props.hideOnKeyDown &&
    !['Shift', 'Control', 'Meta'].includes(event.key) &&
    (!activeTrap.value || event.key !== 'Tab')
  )
    hide();
}
function keyUp(event: KeyboardEvent) {
  if (props.sticky) return;
  if (event.key === 'Alt') {
    locked.value = false;
    if (!targetInside && !hoverInside) hide();
  }
}
function layout() {
  if (!root.value || !host.value || !at.value) return;
  const contents = root.value.querySelector<HTMLElement>(
    '.vc-scrollable-viewport',
  )!;
  contents.classList.add('monaco-hover-content');
  if (!targetInside && (hideOnHover.value || !hoverInside)) suppressed = true;
  const coordinates = layoutHover(
    root.value,
    contents,
    host.value,
    pointer.value,
    at.value,
    {
      ...props,
      maxHeightRatio:
        props.maxHeightRatio > 0 && props.maxHeightRatio <= 1
          ? props.maxHeightRatio
          : 0.5,
    },
  );
  const context = host.value.parentElement!;
  context.style.left = '0px';
  context.style.top = '0px';
  const origin = context.getBoundingClientRect();
  context.style.left = `${coordinates.left - origin.left}px`;
  context.style.top = `${coordinates.top - origin.top}px`;
  scroller.value?.scanDomNode();
  overflowing.value =
    contents.scrollHeight > contents.clientHeight ||
    contents.scrollWidth > contents.clientWidth;
}
watch(
  open,
  async (value) => {
    const current = ++generation;
    cleanup();
    resize?.disconnect();
    intersection?.disconnect();
    clearTimeout(timer);
    if (!value) {
      releaseHover?.release();
      releaseHover = undefined;
      if (
        host.value?.contains(document.activeElement) &&
        previousFocus?.isConnected
      )
        previousFocus.focus();
      const wasReady = ready.value;
      ready.value = false;
      locked.value = false;
      if (wasReady) emit('hide');
      return;
    }
    await nextTick();
    if (current !== generation) return;
    if (!at.value || (!props.content && !htmlContent.value)) {
      open.value = false;
      return;
    }
    const target = at.value.targetElements[0];
    previousFocus =
      props.trapFocus || focusRequested
        ? (document.activeElement as HTMLElement)
        : undefined;
    portal.value =
      popupHost?.container.value ||
      target.closest<HTMLElement>('.vc-theme') ||
      document.body;
    await nextTick();
    if (!open.value || current !== generation) return;
    releaseHover = claimHover(target.ownerDocument, target, {
      host: () => host.value,
      locked: () => locked.value,
      hide,
      track: (inside, child) => {
        if (inside) {
          nestedInside.add(child);
          clearTimeout(timer);
        } else {
          nestedInside.delete(child);
          if (!nestedInside.size && !targetInside && !hoverInside)
            mouseLeave('hover');
        }
      },
    });
    if (!releaseHover) {
      open.value = false;
      return;
    }
    locked.value = props.sticky;
    nestingDepth.value = releaseHover.depth;
    targetInside = at.value.targetElements.some((element) =>
      element.matches(':hover'),
    );
    hoverInside = false;
    suppressed = false;
    layout();
    activeTrap.value = props.trapFocus || focusRequested;
    focusTrap.value = activeTrap.value && !!lastFocusable(root.value!);
    const listeners: (() => void)[] = [];
    function listen(
      element: EventTarget,
      event: string,
      handler: EventListener,
    ) {
      element.addEventListener(event, handler);
      listeners.push(() => element.removeEventListener(event, handler));
    }
    for (const element of at.value.targetElements) {
      listen(element, 'mouseover', () => mouseOver('target'));
      listen(element, 'mouseleave', () => mouseLeave('target'));
      if (!props.sticky) listen(element, 'click', hide);
    }
    listen(document, 'mousedown', (event) => {
      if (!releaseHover?.contains(event.target as Node)) hide();
    });
    listen(document, 'keydown', keyDown as EventListener);
    listen(document, 'keyup', keyUp as EventListener);
    listen(window, 'blur', hide);
    listen(window, 'resize', layout);
    cleanup = () => listeners.forEach((remove) => remove());
    if (htmlContent.value) {
      resize = new ResizeObserver(layout);
      resize.observe(root.value!.querySelector('.hover-contents')!);
    }
    intersection = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) hide();
    });
    intersection.observe(target);
    ready.value = true;
    if (focusRequested) focus();
    focusRequested = false;
    emit('show');
  },
  { immediate: true },
);
watch(
  () => [
    props.content,
    props.position,
    props.alignment,
    props.showPointer,
    props.compact,
    props.actions,
    props.forcePosition,
    props.maxHeightRatio,
  ],
  async () => {
    await nextTick();
    if (open.value) layout();
  },
  { deep: true },
);
onBeforeUnmount(() => {
  generation++;
  releaseHover?.release();
  if (
    host.value?.contains(document.activeElement) &&
    previousFocus?.isConnected
  )
    previousFocus.focus();
  cleanup();
  resize?.disconnect();
  intersection?.disconnect();
  clearTimeout(timer);
});
defineExpose({ show, hide, focus, layout });
</script>
<template>
  <Teleport v-if="open && portal" :to="portal">
    <div
      :style="
        popupHost
          ? { position: 'absolute', left: 0, top: 0, width: '100vw', height: 0 }
          : { display: 'contents' }
      "
    >
      <div
        class="context-view vc-hover-context"
        :style="{ zIndex: (popupHost?.layer ?? 2575) + 1 + nestingDepth }"
      >
        <div
          ref="host"
          class="workbench-hover-container"
          :class="{ locked }"
          @mouseover="mouseOver('hover')"
          @mouseleave="mouseLeave('hover')"
        >
          <div
            v-if="focusTrap"
            tabindex="0"
            @focus="root && lastFocusable(root)?.focus()"
          />
          <div
            v-if="showPointer"
            ref="pointer"
            class="workbench-hover-pointer"
          />
          <div
            ref="root"
            class="monaco-hover workbench-hover"
            :class="{
              'fade-in': !instant,
              compact,
              'with-pointer': showPointer,
            }"
            tabindex="0"
            role="tooltip"
            @mousedown.stop
            @keydown.esc="hide"
          >
            <ScrollableElement ref="scroller" :contain-wheel="overflowing">
              <div class="hover-row markdown-hover"
                ><div
                  class="hover-contents"
                  :class="{ 'html-hover-contents': htmlContent }"
                  :style="{ whiteSpace: htmlContent ? undefined : 'pre-wrap' }"
                  ><slot>{{ content }}</slot></div
                ></div
              >
            </ScrollableElement>
            <div v-if="actions.length" class="hover-row status-bar"
              ><div class="actions"
                ><div
                  v-for="entry in actions"
                  :key="entry.id"
                  class="action-container"
                  tabindex="0"
                  @click="action(entry.id, $event)"
                  @keydown="actionKey(entry.id, $event)"
                  ><a class="action" role="button"
                    ><span
                      v-if="entry.icon"
                      class="icon codicon"
                      :class="`codicon-${entry.icon}`"
                    /><span
                      >{{ entry.label
                      }}{{
                        entry.keybinding ? ` (${entry.keybinding})` : ''
                      }}</span
                    ></a
                  ></div
                ></div
              ></div
            >
          </div>
          <div v-if="focusTrap" tabindex="0" @focus="focus" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
<style src="./hover.css" />
