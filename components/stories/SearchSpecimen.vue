<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import SearchView from '../src/components/search/SearchView.vue';
import { searchExamples } from './SearchData';
const props = defineProps<{ theme: string }>();
const current = ref(
  structuredClone(
    searchExamples[
      Number(new URLSearchParams(location.search).get('case') || 0)
    ],
  ),
);
const key = ref(0);
const width = ref(320);
const search = ref<InstanceType<typeof SearchView>>();
const models = reactive<any>({});
const state: any = { focus: [], selection: [], clicks: 0, escapes: 0 };
function reset() {
  const value = current.value;
  Object.assign(models, {
    query: value.query || '',
    replacement: value.replacement || '',
    matchCase: !!value.matchCase,
    wholeWord: !!value.wholeWord,
    regex: !!value.regex,
    preserveCase: !!value.preserveCase,
    replaceShown: value.replaceShown !== false,
    detailsShown: !!value.detailsShown,
    include: value.include || '',
    exclude: value.exclude || '',
    onlyOpenEditors: !!value.onlyOpenEditors,
    onlyChangedFiles: !!value.onlyChangedFiles,
    useIgnoreFiles: value.useIgnoreFiles !== false,
    expanded: value.expandedIds || [],
    resultSelection: value.selectedIds || [],
  });
  Object.assign(state, {
    actions: [],
    submits: [],
    cancels: [],
    replaces: [],
    dismisses: [],
    opens: [],
    contexts: [],
    resultFocus: [],
  });
}
reset();
for (const name of Object.keys(models))
  Object.defineProperty(state, name, {
    enumerable: true,
    get: () => models[name],
  });
onMounted(() => {
  (window as any).fixtureState = state;
  (window as any).fixtureReady = true;
  (window as any).fixtureSearch = {
    resize: async (nextWidth: number, height: number) => {
      width.value = nextWidth;
      current.value.height = height;
      await nextTick();
    },
    focus: () => search.value?.focus(),
    focusResults: () => search.value?.focusResults(),
    submit: () => search.value?.submit(),
    complete: () => search.value?.complete(),
    snapshot: () => JSON.parse(JSON.stringify(state)),
  };
  (window as any).fixtureShowSearch = async (index: number) => {
    current.value = structuredClone(searchExamples[index]);
    key.value++;
    reset();
    await nextTick();
  };
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="props.theme || 'dark'">
    <div
      class="specimen"
      data-testid="specimen"
      :style="{ width: `${width}px` }"
    >
      <SearchView
        :key="key"
        ref="search"
        v-bind="current"
        v-model:query="models.query"
        v-model:replacement="models.replacement"
        v-model:match-case="models.matchCase"
        v-model:whole-word="models.wholeWord"
        v-model:regex="models.regex"
        v-model:preserve-case="models.preserveCase"
        v-model:replace-shown="models.replaceShown"
        v-model:details-shown="models.detailsShown"
        v-model:include="models.include"
        v-model:exclude="models.exclude"
        v-model:only-open-editors="models.onlyOpenEditors"
        v-model:only-changed-files="models.onlyChangedFiles"
        v-model:use-ignore-files="models.useIgnoreFiles"
        v-model:expanded-ids="models.expanded"
        v-model:selected-ids="models.resultSelection"
        @action="state.actions.push($event)"
        @submit="state.submits.push($event)"
        @cancel="state.cancels.push($event)"
        @replace="state.replaces.push($event)"
        @dismiss="state.dismisses.push($event)"
        @open="state.opens.push($event)"
        @focus-change="state.resultFocus = $event ? [$event] : []"
        @contextmenu="state.contexts.push($event)"
      />
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
