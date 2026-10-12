<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Codicon from '../codicon/Codicon.vue';
import Toolbar from '../toolbar/Toolbar.vue';
import CountBadge from '../count-badge/CountBadge.vue';
import type { ActionBarEntry } from '../action-bar/types';
import type { MenuEntry } from '../menu/types';
const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  icon?: string;
  collapsible?: boolean;
  headerVisible?: boolean;
  location?: 'sidebar' | 'panel';
  actions?: readonly ActionBarEntry[];
  secondaryActions?: readonly MenuEntry[];
  actionsVisibility?: 'hover' | 'expanded' | 'always';
  /** Count badge uses the Extensions view header composition. */
  count?: number;
}>(), { collapsible: true, headerVisible: true, location: 'sidebar', actions: () => [], secondaryActions: () => [], actionsVisibility: 'hover', icon: 'window' });
const expanded = defineModel<boolean>('expanded', { default: true });
const emit = defineEmits<{ changeExpansion: [expanded: boolean]; action: [id: string]; menuVisibility: [visible: boolean] }>();
defineSlots<{ default?: () => unknown; title?: () => unknown; headerActions?: () => unknown }>();
const header = ref<HTMLElement>();
const actualExpanded = ref(expanded.value), bodyRendered = ref(expanded.value), bodyAttached = ref(expanded.value);
const headerFocused = ref(false), hasDescription = ref(!!props.description);
const ariaLabel = ref(`${props.title} Section`);
// Detaching the body must preserve its DOM and Vue subtree. A hidden destination
// models the original body.remove(), while Teleport retains the component instances.
const detachedBody = document.createDocumentFragment();
let animationTimer: ReturnType<typeof setTimeout> | undefined, blurTimer: ReturnType<typeof setTimeout> | undefined;
const headerExpanded = computed(() => !props.headerVisible || actualExpanded.value);
const section = computed(() => props.location === 'panel' ? 'panelSectionHeader' : 'sideBarSectionHeader');
function setExpanded(next: boolean): boolean {
  if (!next && !props.collapsible || actualExpanded.value === !!next) return false;
  actualExpanded.value = !!next;
  if (next) {
    bodyRendered.value = true; clearTimeout(animationTimer); bodyAttached.value = true;
  } else {
    animationTimer = setTimeout(() => { bodyAttached.value = false; }, 200);
  }
  expanded.value = actualExpanded.value;
  emit('changeExpansion', actualExpanded.value);
  return true;
}
watch(expanded, value => { if (!setExpanded(value) && value !== actualExpanded.value) expanded.value = actualExpanded.value; });
watch([() => props.title, () => props.description], () => {
  if (props.description) hasDescription.value = true;
  ariaLabel.value = `${props.title}${props.description ? ` - ${props.description}` : ''} Section`;
});
function keydown(event: KeyboardEvent) {
  // Pane matches key codes, including modified keys, and intentionally leaves the
  // default behavior and bubbling untouched. Toolbar handles its own keys first.
  if (event.key === 'Enter' || event.key === ' ') setExpanded(!actualExpanded.value);
  else if (event.key === 'ArrowLeft') setExpanded(false);
  else if (event.key === 'ArrowRight') setExpanded(true);
}
function click(event: MouseEvent) { if (!event.defaultPrevented) setExpanded(!actualExpanded.value); }
function focusin() { clearTimeout(blurTimer); headerFocused.value = true; }
function focusout() { blurTimer = setTimeout(() => { if (!header.value?.contains(document.activeElement)) headerFocused.value = false; }, 0); }
onBeforeUnmount(() => { clearTimeout(animationTimer); clearTimeout(blurTimer); });
defineExpose({ focus: () => header.value?.focus(), isExpanded: () => actualExpanded.value, setExpanded });
</script>
<template>
  <div class="monaco-pane-view vc-pane" :class="`vc-pane-${location}`">
    <div class="pane vertical" :class="{ expanded: actualExpanded, 'merged-header': !headerVisible }">
      <div ref="header" class="pane-header" :class="{ expanded: headerExpanded, hidden: !headerVisible, 'not-collapsible': !collapsible, focused: headerFocused, 'extension-view-header': count !== undefined }"
        :tabindex="collapsible ? 0 : undefined" :role="collapsible ? 'button' : undefined" :aria-label="ariaLabel" :aria-expanded="headerExpanded"
        :style="{ color: collapsible ? `var(--vscode-${section}-foreground)` : undefined, backgroundColor: collapsible ? `var(--vscode-${section}-background)` : 'transparent', borderTop: `1px solid var(--vscode-${section}-border)` }"
        @keydown="keydown" @click="click" @focusin="focusin" @focusout="focusout">
        <Codicon class="twisty-container" :name="actualExpanded ? 'chevron-down' : 'chevron-right'" />
        <Codicon class="icon" :name="icon" :aria-label="`${title}${description ? ` - ${description}` : ''}`" :style="{ color:`var(--vscode-${section}-foreground, var(--vscode-foreground))` }" />
        <slot name="title"><h3 class="title">{{ title }}</h3></slot>
        <span v-if="hasDescription" class="description">{{ description }}</span>
        <div class="actions" :class="{ 'show-always': actionsVisibility === 'always', 'show-expanded': actionsVisibility === 'expanded' }" @click.prevent>
          <slot name="headerActions"><Toolbar :primary="actions" :secondary="secondaryActions" :aria-label="`${title} actions`" @action="emit('action', $event)" @visibility="emit('menuVisibility', $event)" /></slot>
        </div>
        <div v-if="count !== undefined" class="count-badge-wrapper"><CountBadge :count="count" /></div>
      </div>
      <Teleport v-if="bodyRendered" :to="detachedBody" :disabled="bodyAttached"><div class="pane-body"><slot /></div></Teleport>
    </div>
  </div>
</template>
<style src="./paneview.css" />
<style src="./paneviewlet.css" />
<style>
/* Surface colors are supplied by the corresponding workbench part. */
.vc-pane-sidebar { background: var(--vscode-sideBar-background); color: var(--vscode-sideBar-foreground, var(--vscode-foreground)); }
.vc-pane-panel { background: var(--vscode-panel-background); color: var(--vscode-foreground); }
/* ExtensionsView's CountBadge/header combination. */
.vc-pane .extension-view-header .monaco-action-bar { margin-right: 4px; }
.vc-pane .extension-view-header .count-badge-wrapper { margin-right: 12px; }
.vc-pane .extension-view-header .monaco-action-bar .action-item > .action-label.icon.codicon { vertical-align: middle; line-height: 22px; }
.vc-pane .extension-view-header .monaco-action-bar .action-item.disabled { display: none; }
</style>
