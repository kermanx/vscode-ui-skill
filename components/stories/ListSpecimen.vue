<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import List from '../src/components/list/List.vue';
import { listItems, manyListItems, changedListItems } from './ListData';
defineProps<{ theme?: string }>();
const params = new URLSearchParams(location.search);
const items = ref(params.get('large') === 'true' ? manyListItems : listItems);
const selected = ref<string[]>([]), focus = ref<string[]>([]), actions = ref<string[]>([]), contexts = ref<string[]>([]);
const multiple = params.get('multiple') !== 'false';
watch([selected, focus, actions, contexts], () => { (window as any).fixtureState = { selection: selected.value, focus: focus.value, actions: actions.value, contexts: contexts.value }; }, { deep: true, immediate: true });
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen tree-specimen" data-testid="specimen">
      <List :items="items" v-model:selected-ids="selected" aria-label="Open files" :multiple="multiple" @focus-change="focus = $event === undefined ? [] : [$event]" @action="(id, item) => actions.push(`${item.id}:${id}`)" @contextmenu="(item, event) => { if (item) contexts.push(item.id); event.preventDefault(); }" />
    </div>
    <button class="outside">Move focus outside</button>
    <button class="fixture-update" @click="items = changedListItems(items)">Update items</button>
    <button class="fixture-clear" @click="items = []">Clear items</button>
  </div>
</template>
