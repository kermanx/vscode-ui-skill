<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import IconLabel from '../icon-label/IconLabel.vue';
import CountBadge from '../count-badge/CountBadge.vue';
import ActionBar from '../action-bar/ActionBar.vue';
import DelayedTooltip from '../tooltip/DelayedTooltip.vue';
import { fileIconClasses } from '../explorer/explorerModel';
import type { SearchTreeNode } from './searchModel';
const props = defineProps<{
  node: SearchTreeNode;
  replacing: boolean;
  replacement: string;
  showLineNumbers: boolean;
}>();
const emit = defineEmits<{
  replace: [id: string, scope: 'match' | 'file'];
  dismiss: [id: string];
}>();
const label = ref<{ element?: HTMLElement }>(),
  matchElement = ref<HTMLElement>(),
  lineElement = ref<HTMLElement>();
const replace = computed(
  () => props.replacing && !!props.replacement && !props.node.match?.readonly,
);
const replacement = computed(
  () => props.node.match?.replacement ?? props.replacement,
);
const editable = computed(() =>
  props.node.match
    ? !props.node.match.readonly
    : props.node.file.matches.some((match) => !match.readonly),
);
const actions = computed(() => [
  ...(props.replacing && editable.value
    ? [
        {
          id: 'replace',
          label: props.node.match ? 'Replace' : 'Replace All',
          icon: 'replace',
        },
      ]
    : []),
  { id: 'dismiss', label: 'Dismiss', icon: 'close' },
]);
const extraLines = computed(
  () =>
    (props.node.match?.endLine ?? props.node.match?.line ?? 0) -
    (props.node.match?.line ?? 0),
);
const lineTitle = computed(
  () =>
    `${props.showLineNumbers ? `From line ${props.node.match?.line} ` : ''}${extraLines.value ? `+ ${extraLines.value} more lines` : ''}`,
);
const title = computed(() =>
  props.node.match
    ? (
        props.node.match.before +
        (replace.value ? replacement.value : props.node.match.text) +
        props.node.match.after
      )
        .trim()
        .slice(0, 999)
    : props.node.file.path,
);
function action(id: string) {
  if (id === 'replace')
    emit('replace', props.node.id, props.node.match ? 'match' : 'file');
  else emit('dismiss', props.node.id);
}
</script>
<template>
  <template v-if="node.match"
    ><span
      ref="lineElement"
      class="matchLineNum"
      :class="{ show: showLineNumbers || extraLines > 0 }"
      >{{ showLineNumbers ? `${node.match.line}:` : ''
      }}{{ extraLines ? `+${extraLines}` : '' }}</span
    ><a ref="matchElement" class="plain match"
      ><span>{{ node.match.before }}</span
      ><span class="findInFileMatch" :class="{ replace }">{{
        node.match.text
      }}</span
      ><span class="replaceMatch">{{ replace ? replacement : '' }}</span
      ><span>{{ node.match.after }}</span></a
    ><span class="actionBarContainer"
      ><ActionBar :actions="actions" @action="action" /></span
    ><DelayedTooltip
      :target="matchElement"
      :text="title"
      placement="mouse" /><DelayedTooltip
      :target="lineElement"
      :text="lineTitle"
      placement="mouse"
  /></template>
  <div v-else class="filematch" :data-resource="`file://${node.file.path}`">
    <IconLabel
      ref="label"
      :label="node.file.name"
      :description="node.file.description"
      :title="node.file.path"
      :extra-classes="
        fileIconClasses(node.file.path, 'file', node.file.language)
      "
    />
    <div class="badge">
      <CountBadge
        :count="node.file.matches.length"
        :title-format="
          node.file.matches.length === 1
            ? '{0} match found'
            : '{0} matches found'
        "
      />
    </div>
    <div class="actionBarContainer">
      <ActionBar :actions="actions" @action="action" />
    </div>
    <DelayedTooltip :target="label?.element" :text="title" placement="mouse" />
  </div>
</template>
