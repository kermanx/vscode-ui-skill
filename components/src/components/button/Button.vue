<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Tooltip from '../tooltip/Tooltip.vue';

const props = withDefaults(defineProps<{
  label: string;
  icon?: string;
  secondary?: boolean;
  small?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  /** A string supplies the hover; true uses the visible label. */
  title?: boolean | string;
}>(), { secondary: false, small: false, disabled: false });
const emit = defineEmits<{ click: [event: MouseEvent | KeyboardEvent]; escape: [event: KeyboardEvent] }>();
const element = ref<HTMLAnchorElement>();
const highlighted = ref(false);
const hoverText = computed(() => typeof props.title === 'string' ? props.title : props.title ? props.label : '');
// Undefined theme variables intentionally retain the CSS initial value.
const style = computed(() => props.secondary ? {
  backgroundColor: `var(--vscode-button-${highlighted.value ? 'secondaryHoverBackground' : 'secondaryBackground'})`,
  color: 'var(--vscode-button-secondaryForeground)',
  border: '1px solid var(--vscode-button-secondaryBorder)',
} : {
  backgroundColor: `var(--vscode-button-${highlighted.value ? 'hoverBackground' : 'background'})`,
  color: 'var(--vscode-button-foreground)',
  border: '1px solid var(--vscode-button-border)',
});
watch(() => props.secondary, () => { highlighted.value = false; });

function click(event: MouseEvent) {
  if (props.disabled) { event.preventDefault(); event.stopPropagation(); return; }
  emit('click', event);
}
function keydown(event: KeyboardEvent) {
  // Only unmodified Enter / Space activate, and activation happens on keydown.
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (!props.disabled && (event.key === 'Enter' || event.key === ' ')) emit('click', event);
  else if (event.key === 'Escape') { emit('escape', event); element.value?.blur(); }
  else return;
  event.preventDefault(); event.stopPropagation();
}
defineExpose({ focus: () => element.value?.focus() });
</script>

<template>
  <a ref="element" class="monaco-button monaco-text-button vc-button-layout" :class="{ secondary, small, disabled }"
    role="button" tabindex="0" :aria-label="ariaLabel ?? (typeof title === 'string' ? title : undefined)" :aria-disabled="disabled"
    :style="style" @click="click" @keydown="keydown"
    @mouseover="!disabled && (highlighted = true)" @mouseout="highlighted = false"
    @focus="!disabled && (highlighted = true)" @blur="!disabled && (highlighted = false)">
    <Tooltip v-if="hoverText" :target="element" :text="hoverText" placement="element" />
    <span v-if="icon" class="codicon" :class="`codicon-${icon}`" aria-hidden="true" /><span>{{ label }}</span>
  </a>
</template>

<style src="./button.css" />
