<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TreeAction } from './types';
const props = defineProps<{ actions: readonly TreeAction[]; label: string }>();
const emit = defineEmits<{ action: [action: TreeAction] }>();
const root = ref<HTMLElement>(), focused = ref(0), active = ref<number>();
let triggerDown = false;
watch(() => props.actions, () => { focused.value = Math.min(focused.value, Math.max(0, props.actions.length - 1)); });
function run(action: TreeAction) { if (!action.disabled) emit('action', action); }
function keydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  let index = focused.value;
  if (event.key === 'ArrowRight' && props.actions.length > 1) index = (index + 1) % props.actions.length;
  else if (event.key === 'ArrowLeft' && props.actions.length > 1) index = (index + props.actions.length - 1) % props.actions.length;
  else if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = props.actions.length - 1;
  else if (event.key === 'Enter' || event.key === ' ') triggerDown = true;
  else return;
  event.preventDefault(); event.stopPropagation();
  if (index !== focused.value) root.value?.querySelectorAll<HTMLElement>('.action-label')[index]?.focus();
}
function keyup(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault(); event.stopPropagation();
  if (triggerDown) { triggerDown = false; const action = props.actions[focused.value]; if (action) run(action); }
}
</script>

<template>
  <div class="actions">
    <div ref="root" class="monaco-action-bar" @keydown="keydown" @keyup="keyup" @focusout="triggerDown = false">
      <ul class="actions-container" role="toolbar" :aria-label="`Actions for ${label}`">
        <li v-for="(action, index) in actions" :key="action.id" class="action-item" role="presentation"
          :class="{ disabled: action.disabled, active: active === index }"
          @mousedown.prevent.stop="!action.disabled && $event.button === 0 && (active = index)"
          @mouseup.stop="active = undefined" @mouseout.stop="active = undefined" @dblclick.prevent.stop
          @click.prevent.stop="run(action)">
          <a class="action-label codicon" :class="[`codicon-${action.icon}`, { disabled: action.disabled }]"
            role="button" :aria-label="action.label" :title="action.label" :aria-disabled="action.disabled || undefined"
            :tabindex="focused === index ? 0 : -1" @focus="focused = index" />
        </li>
      </ul>
    </div>
  </div>
</template>
