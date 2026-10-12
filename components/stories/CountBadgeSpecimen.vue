<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import CountBadge from '../src/components/count-badge/CountBadge.vue';
import { disposeRow, dynamicRow, groups, layoutCss, observeSurface, type CountBadgeState } from './countBadgeData';
defineProps<{ theme?: string }>();

/** Read the formatted hover content for the independent fixture state comparison. */
type CountBadgeInstance = { hoverContent: string | null };
const instances = new Map<string, CountBadgeInstance>();
// Kept across re-renders: a changed inline ref is cleared with `null` as well, and the newest
// instance of a row is the one whose hover content the state has to report.
function register(id: string, instance: unknown) {
  if (instance) instances.set(id, instance as CountBadgeInstance);
}
/** Inline `:ref` callbacks per row; the id is bound here so the template stays declarative. */
function track(id: string) {
  return (instance: unknown) => register(id, instance);
}
/** Same observable state the original fixture publishes, read back from the rendered canvas. */
function publish() {
  if (!surface.value) return;
  (window as any).fixtureState = observeSurface(surface.value, id => instances.get(id)?.hoverContent ?? null);
}

const dynamic = reactive<CountBadgeState>({
  count: dynamicRow.count ?? 0,
  countFormat: dynamicRow.countFormat ?? '{0}',
  titleFormat: dynamicRow.titleFormat ?? '',
});
const dynamicId = dynamicRow.id;
const disposed = ref(false);
// `v-for` instead of `v-if`: removing the last item leaves the container empty, while `v-if`
// would leave Vue's `<!--v-if-->` placeholder next to nothing in the original.
const disposeBadges = computed(() => disposed.value ? [] : [disposeRow]);
const surface = ref<HTMLElement>();
watch([dynamic, disposed], publish, { deep: true, flush: 'post' });
onMounted(() => { publish(); (window as any).fixtureReady = true; });

/** Test seam: the parity test drives this page and the original page with the same calls. */
(window as any).countBadgeFixture = {
  async apply(step: CountBadgeState) {
    dynamic.count = step.count; dynamic.countFormat = step.countFormat; dynamic.titleFormat = step.titleFormat;
    await nextTick(); publish();
  },
  async dispose() {
    disposed.value = true; await nextTick(); publish();
  },
};
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <!-- The SFC <style> block only takes CSS text at build time, so the shared canvas geometry is rendered as a style element. -->
    <component :is="'style'">{{ layoutCss }}</component>
    <div ref="surface" class="specimen button-specimen" data-testid="specimen">
      <div v-for="group in groups" :key="group.id" class="count-badge-group" :data-group="group.id">
        <div v-for="row in group.rows" :key="row.id" class="count-badge-row"
          :class="{ 'count-badge-header-row': group.layout === 'header' }" :data-row="row.id">
          <span class="count-badge-label">{{ row.label }}</span>
          <CountBadge :ref="track(row.id)" :count="row.count" :count-format="row.countFormat"
            :title-format="row.titleFormat" :variant="row.variant" />
        </div>
      </div>
      <div class="count-badge-group" data-group="dynamic">
        <div class="count-badge-row" :data-row="dynamicRow.id">
          <span class="count-badge-label">{{ dynamicRow.label }}</span>
          <CountBadge :ref="track(dynamicId)" v-bind="dynamic" />
        </div>
      </div>
      <div class="count-badge-group" data-group="dispose">
        <div class="count-badge-row" :data-row="disposeRow.id">
          <span class="count-badge-label">{{ disposeRow.label }}</span>
          <div class="count-badge-host" data-testid="dispose-host">
            <CountBadge v-for="row in disposeBadges" :key="row.id" :ref="track(row.id)" :count="row.count" />
          </div>
        </div>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
