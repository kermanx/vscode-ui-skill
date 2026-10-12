<script setup lang="ts">
/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import Sash from '../sash/Sash.vue';
import ScrollableElement from '../scrollable-element/ScrollableElement.vue';
import type { SashEvent, SashHandle } from '../sash/types';
import type {
  ScrollbarVisibility,
  ScrollPosition,
  ScrollableEvent,
} from '../scrollable-element/types';
import type {
  SplitViewItem,
  SplitViewLayout,
  SplitViewOrientation,
} from './types';
import { SplitLayout } from './splitLayout';

// SplitLayout owns allocation and snapping. This component connects that model
// to measured DOM sizes, Sash pointer events, and caller-controlled size arrays.
const props = withDefaults(
  defineProps<{
    views: readonly SplitViewItem[];
    /** Match PaneView's sequential addPane initialization before its first layout. */
    sequentialInitialization?: boolean;
    orientation?: SplitViewOrientation;
    proportionalLayout?: boolean;
    inverseAltBehavior?: boolean;
    scrollbarVisibility?: ScrollbarVisibility;
    startSnappingEnabled?: boolean;
    endSnappingEnabled?: boolean;
    orthogonalStartSash?: SashHandle;
    orthogonalEndSash?: SashHandle;
    /** Internal layout extent used by table column dividers. */
    sashOrthogonalSize?: number;
    linkedSashes?: readonly (SashHandle | undefined)[];
  }>(),
  {
    orientation: 'vertical',
    proportionalLayout: true,
    inverseAltBehavior: false,
    scrollbarVisibility: 'auto',
    startSnappingEnabled: true,
    endSnappingEnabled: true,
  },
);
const sizes = defineModel<number[]>('sizes', { default: () => [] });
const emit = defineEmits<{
  layout: [layout: SplitViewLayout];
  sashChange: [index: number];
  /** Double-click intent only: the host supplies the preferred reset sizes. */
  sashReset: [index: number];
  scroll: [event: ScrollableEvent];
}>();
const host = ref<HTMLElement>();
const scrollable = ref<InstanceType<typeof ScrollableElement>>();
const sashRefs = ref<SashHandle[]>([]);
// The layout engine is not reactive; its change callback invalidates derived DOM data.
const revision = ref(0),
  dragging = ref(false);
let initialized = false,
  applyingSizes = false;
const engine = new SplitLayout(
  props.proportionalLayout,
  props.inverseAltBehavior,
  changed,
  (index) => emit('sashChange', index),
);
function getLayout(): SplitViewLayout {
  return {
    sizes: engine.viewItems.map((item) => item.size),
    visible: engine.viewItems.map((item) => item.visible),
    cachedVisibleSizes: engine.viewItems.map((item) => item.cachedVisibleSize),
    contentSize: engine.contentSize,
  };
}
function changed() {
  revision.value++;
  const layout = getLayout();
  if (
    !applyingSizes &&
    (layout.sizes.some((size, i) => size !== sizes.value[i]) ||
      layout.sizes.length !== sizes.value.length)
  )
    sizes.value = layout.sizes;
  emit('layout', layout);
  nextTick(() => scrollable.value?.scanDomNode());
}
const items = computed(() => {
  void revision.value;
  let offset = 0;
  return engine.viewItems.map((item) => {
    const entry = {
      id: item.view.id,
      size: item.size,
      visible: item.visible,
      offset,
    };
    offset += item.size;
    return entry;
  });
});
const sashes = computed(() => {
  void revision.value;
  let position = 0;
  return engine.sashItems.map((item, index) => {
    position += engine.viewItems[index].size;
    return { position, state: item.sash.state };
  });
});
const contentSize = computed(() => {
  void revision.value;
  return engine.contentSize;
});
function dimension() {
  return props.orientation === 'vertical'
    ? host.value!.clientHeight
    : host.value!.clientWidth;
}
function measure() {
  if (initialized && dimension() !== engine.size) engine.layout(dimension());
}
function start(index: number, event: SashEvent) {
  dragging.value = true;
  engine.onSashStart(
    index,
    props.orientation === 'vertical' ? event.startY : event.startX,
    !!event.altKey,
  );
}
function change(event: SashEvent) {
  engine.onSashChange(
    props.orientation === 'vertical' ? event.currentY : event.currentX,
  );
}
function end(index: number) {
  engine.onSashEnd(index);
  dragging.value = false;
}
function reset(index: number) {
  if (engine.resetAllowed(index)) emit('sashReset', index);
}
function resizeView(index: number, size: number) {
  engine.resizeView(index, size);
}
function updateView(
  index: number,
  view: Partial<SplitViewItem>,
  size?: number,
) {
  const item = engine.viewItems[index];
  if (!item) return;
  item.view = { ...item.view, ...view };
  engine.onViewChange(item, size);
}
function distributeViewSizes() {
  engine.distributeViewSizes();
}
function setViewVisible(index: number, visible: boolean) {
  engine.setViewVisible(index, visible);
}
watch(
  () => props.views,
  (views) => {
    if (!initialized) return;
    // Preserve the original single moveView operation for a single array reorder.
    const previousIds = engine.viewItems.map((item) => item.view.id),
      nextIds = views.map((view) => view.id);
    const first = previousIds.findIndex((id, index) => id !== nextIds[index]);
    if (first >= 0 && previousIds.length === nextIds.length) {
      const candidates = [
        [first, nextIds.indexOf(previousIds[first])],
        [previousIds.indexOf(nextIds[first]), first],
      ];
      for (const [from, to] of candidates) {
        if (from < 0 || to < 0) continue;
        const reordered = [...previousIds];
        reordered.splice(to, 0, reordered.splice(from, 1)[0]);
        if (reordered.every((id, index) => id === nextIds[index])) {
          engine.moveView(from, to);
          break;
        }
      }
    }
    for (let i = engine.viewItems.length - 1; i >= 0; i--)
      if (!views.some((view) => view.id === engine.viewItems[i].view.id))
        engine.removeView(i);
    views.forEach((view, index) => {
      const current = engine.viewItems.findIndex(
        (item) => item.view.id === view.id,
      );
      if (current < 0)
        engine.addView({ ...view }, view.size ?? view.minimumSize ?? 0, index);
      else if (current !== index) engine.moveView(current, index);
      const item = engine.viewItems[index];
      const old = item.view;
      item.view = { ...view };
      if (view.visible !== old.visible)
        engine.setViewVisible(index, view.visible !== false);
      if (
        view.minimumSize !== old.minimumSize ||
        view.maximumSize !== old.maximumSize ||
        view.priority !== old.priority ||
        view.snap !== old.snap ||
        view.proportionalLayout !== old.proportionalLayout
      )
        engine.onViewChange(item, undefined);
    });
    changed();
  },
  { deep: true },
);
watch(
  sizes,
  (value) => {
    if (
      !initialized ||
      value.every((size, index) => size === engine.getViewSize(index))
    )
      return;
    // Resizing one view redistributes its neighbors. Hold the incoming request
    // stable and publish once after the batch, rather than echoing partial sizes.
    const requested = [...value];
    applyingSizes = true;
    try {
      requested.forEach((size, index) => {
        if (size !== engine.getViewSize(index)) engine.resizeView(index, size);
      });
    } finally {
      applyingSizes = false;
      changed();
    }
  },
  { deep: true },
);
watch(
  () => [props.proportionalLayout, props.inverseAltBehavior],
  () => {
    engine.proportionalLayout = props.proportionalLayout;
    engine.proportions =
      props.proportionalLayout && engine.contentSize > 0
        ? engine.viewItems.map((item) =>
            item.proportionalLayout && item.visible
              ? item.size / engine.contentSize
              : undefined,
          )
        : undefined;
    engine.inverseAltBehavior = props.inverseAltBehavior;
  },
);
watch(
  () => [props.startSnappingEnabled, props.endSnappingEnabled],
  () => {
    engine.startSnappingEnabled = props.startSnappingEnabled;
    engine.endSnappingEnabled = props.endSnappingEnabled;
    engine.updateSashEnablement();
    revision.value++;
  },
);
watch(
  () => props.orientation,
  () => {
    if (initialized) engine.layout(dimension());
  },
);
let observer: ResizeObserver;
onMounted(() => {
  engine.startSnappingEnabled = props.startSnappingEnabled;
  engine.endSnappingEnabled = props.endSnappingEnabled;
  if (props.sequentialInitialization) {
    const initialSizes = [...sizes.value];
    props.views.forEach((view, index) =>
      engine.addView(
        { ...view },
        initialSizes[index] ?? view.size ?? view.minimumSize ?? 0,
        index,
      ),
    );
    engine.layout(dimension());
  } else
    engine.initialize(
      props.views.map((view) => ({ ...view })),
      sizes.value,
      dimension(),
    );
  initialized = true;
  observer = new ResizeObserver(measure);
  observer.observe(host.value!);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  engine.dispose();
});
defineExpose({
  updateView,
  resizeView,
  distributeViewSizes,
  setViewVisible,
  getViewSize: (index: number) => engine.getViewSize(index),
  getViewCachedVisibleSize: (index: number) =>
    engine.getViewCachedVisibleSize(index),
  getSash: (index: number) =>
    index < engine.sashItems.length ? sashRefs.value[index] : undefined,
  getLayout,
  setScrollPosition: (position: Partial<ScrollPosition>) =>
    scrollable.value?.setScrollPosition(position),
});
</script>
<template>
  <div ref="host" class="monaco-split-view2" :class="orientation">
    <div class="sash-container"
      ><Sash
        v-for="(sash, index) in sashes"
        :key="index"
        :ref="
          (el) => {
            if (el) sashRefs[index] = el as unknown as SashHandle;
          }
        "
        :orientation="orientation === 'vertical' ? 'horizontal' : 'vertical'"
        :position="sash.position"
        :length="sashOrthogonalSize"
        :state="sash.state"
        :linked-sash="linkedSashes?.[index]"
        :orthogonal-start-sash="orthogonalStartSash"
        :orthogonal-end-sash="orthogonalEndSash"
        @drag-start="start(index, $event)"
        @change="change"
        @end="end(index)"
        @reset="reset(index)"
    /></div>
    <ScrollableElement
      ref="scrollable"
      smooth-wheel
      direct-content
      viewport-class="split-view-container"
      :vertical="orientation === 'vertical' ? scrollbarVisibility : 'hidden'"
      :horizontal="
        orientation === 'horizontal' ? scrollbarVisibility : 'hidden'
      "
      @scroll="emit('scroll', $event)"
    >
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="split-view-view"
        :class="{ visible: item.visible }"
        :data-view-id="item.id"
        :style="{
          ...(orientation === 'vertical'
            ? { top: `${item.offset}px`, height: `${item.size}px` }
            : { left: `${item.offset}px`, width: `${item.size}px` }),
          pointerEvents: dragging ? 'none' : undefined,
        }"
        ><slot
          :name="item.id"
          :size="item.size"
          :index="index"
          :visible="item.visible"
          ><slot
            :item="views[index]"
            :size="item.size"
            :index="index"
            :visible="item.visible" /></slot
      ></div>
    </ScrollableElement>
  </div>
</template>
<style src="./splitview.css" />
