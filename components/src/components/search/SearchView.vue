<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import SidebarTitle from '../sidebar-title/SidebarTitle.vue';
import ContextMenu from '../context-menu/ContextMenu.vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import SearchWidget from './SearchWidget.vue';
import SearchPatternInput from './SearchPatternInput.vue';
import SearchTree from './SearchTree.vue';
import { countMessage, emptyMessage, resultNodes } from './searchModel';
import type { SearchTreeNode } from './searchModel';
import type { SearchViewProps, SearchSubmitEvent } from './types';
import type { ContextMenuAnchor } from '../context-menu/types';
const props = withDefaults(defineProps<SearchViewProps>(), {
  height: 500,
  searched: false,
  searching: false,
  showLineNumbers: false,
  searchOnType: true,
  searchDelay: 300,
  changedFilesAvailable: false,
  contextActions: () => [],
});
const query = defineModel<string>('query', { default: '' });
const replacement = defineModel<string>('replacement', { default: '' });
const matchCase = defineModel<boolean>('matchCase', { default: false });
const wholeWord = defineModel<boolean>('wholeWord', { default: false });
const regex = defineModel<boolean>('regex', { default: false });
const preserveCase = defineModel<boolean>('preserveCase', { default: false });
const replaceShown = defineModel<boolean>('replaceShown', { default: true });
const detailsShown = defineModel<boolean>('detailsShown', { default: false });
const include = defineModel<string>('include', { default: '' });
const exclude = defineModel<string>('exclude', { default: '' });
const onlyOpenEditors = defineModel<boolean>('onlyOpenEditors', {
  default: false,
});
const onlyChangedFiles = defineModel<boolean>('onlyChangedFiles', {
  default: false,
});
const useIgnoreFiles = defineModel<boolean>('useIgnoreFiles', {
  default: true,
});
const expanded = defineModel<string[]>('expandedIds', { default: () => [] });
const selected = defineModel<string[]>('selectedIds', { default: () => [] });
const emit = defineEmits<{
  /** The host runs the search and supplies results/searched/searching afterward. */
  submit: [event: SearchSubmitEvent];
  cancel: [focus: boolean];
  open: [
    event: {
      id: string;
      fileId: string;
      pinned: boolean;
      preserveFocus: boolean;
      sideBySide: boolean;
    },
  ];
  /** Request only: the host performs replacements and refreshes results. */
  replace: [event: { scope: 'all' | 'file' | 'match'; id?: string }];
  dismiss: [id: string];
  action: [id: string];
  focusChange: [id: string | undefined];
  contextmenu: [id: string | undefined];
}>();
const body = ref<HTMLElement>(),
  widgets = ref<HTMLElement>(),
  messages = ref<HTMLElement>(),
  more = ref<HTMLElement>(),
  openEditorLink = ref<HTMLElement>();
const widget = ref<InstanceType<typeof SearchWidget>>(),
  includes = ref<InstanceType<typeof SearchPatternInput>>(),
  excludes = ref<InstanceType<typeof SearchPatternInput>>(),
  tree = ref<InstanceType<typeof SearchTree>>(),
  menu = ref<InstanceType<typeof ContextMenu>>();
const width = ref(320),
  treeHeight = ref(0);
const replacing = ref(
  replaceShown.value &&
    props.searched &&
    props.results.some((file) => file.matches.length),
);
const nodes = computed(() => resultNodes(props.results));
const message = computed(() => countMessage(props.results));
function completedFilters() {
  return {
    include: include.value,
    exclude: exclude.value,
    onlyOpen: onlyOpenEditors.value,
    useIgnore: useIgnoreFiles.value,
  };
}
const resultFilters = ref(completedFilters());
watch([() => props.results, () => props.searched], () => {
  resultFilters.value = completedFilters();
});
function summaryFilter(kind: 'ignore' | 'open') {
  detailsShown.value = true;
  if (kind === 'ignore') useIgnoreFiles.value = true;
  else onlyOpenEditors.value = false;
  submit(false, 0);
}
const primary = computed(() => [
  {
    id: props.searching ? 'cancel' : 'refresh',
    label: props.searching ? 'Cancel Search' : 'Refresh',
    icon: props.searching ? 'search-stop' : 'refresh',
    disabled: !props.searching && !query.value,
  },
  {
    id: 'clear',
    label: 'Clear Search Results',
    icon: 'clear-all',
    disabled: !(
      props.results.length ||
      query.value ||
      replacement.value ||
      include.value ||
      exclude.value
    ),
  },
  {
    id:
      props.results.length && !expanded.value.length
        ? 'expandAll'
        : 'collapseAll',
    label:
      props.results.length && !expanded.value.length
        ? 'Expand All'
        : 'Collapse All',
    icon:
      props.results.length && !expanded.value.length
        ? 'expand-all'
        : 'collapse-all',
    disabled: !props.results.length,
  },
]);
function layout() {
  width.value = body.value?.clientWidth || 320;
  treeHeight.value = Math.max(
    0,
    props.height -
      35 -
      (widgets.value?.getBoundingClientRect().height || 0) -
      (props.searched
        ? (messages.value?.getBoundingClientRect().height || 0) - 5
        : 0),
  );
}
let observer: ResizeObserver | undefined;
onMounted(() => {
  observer = new ResizeObserver(layout);
  for (const element of [body.value, widgets.value, messages.value])
    if (element) observer.observe(element);
  layout();
});
onBeforeUnmount(() => observer?.disconnect());
watch(
  () => props.height,
  () => nextTick(layout),
);
async function submit(triggeredOnType = false, delay = 0) {
  await nextTick();
  emit('submit', {
    query: query.value,
    replacement: replacement.value,
    matchCase: matchCase.value,
    wholeWord: wholeWord.value,
    regex: regex.value,
    preserveCase: preserveCase.value,
    include: include.value,
    exclude: exclude.value,
    onlyOpenEditors: onlyOpenEditors.value,
    onlyChangedFiles: onlyChangedFiles.value,
    useIgnoreFiles: useIgnoreFiles.value,
    triggeredOnType,
    delay,
  });
}
function details(moveFocus: boolean) {
  detailsShown.value = !detailsShown.value;
  if (moveFocus)
    void nextTick(() => {
      if (detailsShown.value) {
        includes.value?.focus();
        includes.value?.select();
      } else {
        widget.value?.focus();
        widget.value?.select();
      }
    });
}
function moreKey(event: KeyboardEvent) {
  if (
    event.key === 'Tab' &&
    event.shiftKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    if (replacing.value) widget.value?.focusReplaceAll();
    else if (replaceShown.value) widget.value?.focusPreserve();
    else widget.value?.focusRegex();
    event.preventDefault();
    event.stopPropagation();
  }
}
function action(id: string) {
  if (id === 'collapseAll') tree.value?.collapseAll();
  else if (id === 'expandAll') tree.value?.expandAll();
  emit('action', id);
}
function open(
  id: string,
  pinned: boolean,
  preserveFocus: boolean,
  sideBySide: boolean,
) {
  const file = props.results.find((file) =>
    file.matches.some((match) => match.id === id),
  );
  if (file)
    emit('open', { id, fileId: file.id, pinned, preserveFocus, sideBySide });
}
function context(
  node: any,
  _event: MouseEvent | KeyboardEvent,
  anchor?: ContextMenuAnchor,
) {
  emit('contextmenu', node?.id);
  if (anchor) menu.value?.show(anchor);
}
function activate(event: KeyboardEvent, id: string) {
  if (
    (event.key === 'Enter' || event.key === ' ') &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  ) {
    event.preventDefault();
    event.stopPropagation();
    action(id);
  }
}
defineExpose({
  focus: () => widget.value?.focus(),
  focusResults: () => tree.value?.focus(),
  submit: () => widget.value?.submit(),
  complete: () => widget.value?.complete(),
});
</script>
<template>
  <div class="vc-search" :style="{ height: `${height}px` }">
    <SidebarTitle title="Search" :primary="primary" @action="action" />
    <div ref="body" class="pane-body" :style="{ height: `${height - 35}px` }">
      <div class="search-view actions-right">
        <div ref="widgets" class="search-widgets-container">
          <SearchWidget
            ref="widget"
            v-model:query="query"
            v-model:replacement="replacement"
            v-model:match-case="matchCase"
            v-model:whole-word="wholeWord"
            v-model:regex="regex"
            v-model:preserve-case="preserveCase"
            v-model:replace-shown="replaceShown"
            :width="width"
            :search-on-type="searchOnType"
            :search-delay="searchDelay"
            :replace-enabled="
              searched && results.some((file) => file.matches.length)
            "
            :search-history="searchHistory"
            :replace-history="replaceHistory"
            @submit="submit"
            @options="submit(false, 0)"
            @cancel="emit('cancel', $event)"
            @replace-all="emit('replace', { scope: 'all' })"
            @replace-state="replacing = $event"
            @blur="more?.focus()"
          />
          <div class="query-details" :class="{ more: detailsShown }">
            <div
              ref="more"
              class="more codicon codicon-ellipsis"
              tabindex="0"
              role="button"
              aria-label="Toggle Search Details"
              :aria-expanded="detailsShown"
              @click.stop.prevent="details(true)"
              @keyup.enter.stop.prevent="details(false)"
              @keyup.space.stop.prevent="details(false)"
              @keydown="moreKey"
            />
            <SearchPatternInput
              ref="includes"
              v-model="include"
              v-model:only-open-editors="onlyOpenEditors"
              v-model:only-changed-files="onlyChangedFiles"
              kind="include"
              :width="width"
              :history="includeHistory"
              :changed-files-available="changedFilesAvailable"
              @submit="submit($event, searchDelay)"
              @cancel="emit('cancel', false)"
              @options="submit(false, 0)"
            />
            <SearchPatternInput
              ref="excludes"
              v-model="exclude"
              v-model:use-ignore-files="useIgnoreFiles"
              kind="exclude"
              :width="width"
              :history="excludeHistory"
              @submit="submit($event, searchDelay)"
              @cancel="emit('cancel', false)"
              @options="submit(false, 0)"
            />
          </div>
        </div>
        <div
          ref="messages"
          class="messages text-search-provider-messages"
          :style="{ display: searched ? undefined : 'none' }"
        >
          <div class="message">
            <template v-if="results.length"
              >{{ message
              }}<span v-if="!resultFilters.useIgnore">
                - exclude settings and ignore files are disabled (<a
                  class="pointer"
                  tabindex="0"
                  @click="summaryFilter('ignore')"
                  @keydown.enter.prevent="summaryFilter('ignore')"
                  @keydown.space.prevent="summaryFilter('ignore')"
                  >enable</a
                >)</span
              ><span v-if="resultFilters.onlyOpen">
                - searching only in open files (<a
                  class="pointer"
                  tabindex="0"
                  @click="summaryFilter('open')"
                  @keydown.enter.prevent="summaryFilter('open')"
                  @keydown.space.prevent="summaryFilter('open')"
                  >disable</a
                >)</span
              >
              -
              <a
                ref="openEditorLink"
                class="pointer"
                tabindex="0"
                @click.stop="action('openInEditor')"
                @keydown="activate($event, 'openInEditor')"
                >Open in editor</a
              ></template
            ><template v-else
              >{{
                emptyMessage(
                  resultFilters.include,
                  resultFilters.exclude,
                  resultFilters.onlyOpen,
                )
              }}<a
                class="pointer"
                tabindex="0"
                @click.stop="
                  action(include || exclude ? 'searchAll' : 'openSettings')
                "
                @keydown="
                  activate(
                    $event,
                    include || exclude ? 'searchAll' : 'openSettings',
                  )
                "
                >{{
                  include || exclude
                    ? 'Search again in all files'
                    : 'Open Settings'
                }}</a
              ></template
            >
          </div>
        </div>
        <SearchTree
          ref="tree"
          v-model:expanded-ids="expanded"
          v-model:selected-ids="selected"
          :nodes="nodes"
          :height="treeHeight"
          :replacing="replacing"
          :replacement="replacement"
          :show-line-numbers="showLineNumbers"
          :aria-label="`${message} - Search: ${query}`"
          @focus-change="emit('focusChange', $event)"
          @open="open"
          @replace="(id, scope) => emit('replace', { id, scope })"
          @dismiss="emit('dismiss', $event)"
          @contextmenu="context"
        />
      </div>
    </div>
    <DelayedTooltip :target="more" text="Toggle Search Details" />
    <DelayedTooltip
      :target="openEditorLink"
      text="Copy current search results to an editor"
      placement="mouse"
    />
    <ContextMenu ref="menu" :actions="contextActions" @action="action" />
  </div>
</template>
<style src="../explorer/seti.css" />
<style src="./searchview.css" />
<style>
.vc-search {
  background: var(--vscode-sideBar-background);
  color: var(--vscode-sideBar-foreground, var(--vscode-foreground));
}
.vc-search .monaco-list .indent-guide {
  border-color: var(--vscode-tree-inactiveIndentGuidesStroke);
}
.vc-search .monaco-list .indent-guide.active {
  border-color: var(--vscode-tree-indentGuidesStroke);
}
</style>
