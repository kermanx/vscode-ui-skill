<script setup lang="ts">
import { computed, ref } from 'vue';
import ActionBar from '../action-bar/ActionBar.vue';
const props = withDefaults(
  defineProps<{
    icon: string;
    label: string;
    tooltip?: string;
    disabled?: boolean;
    /** Visual pressed state; activation does not change it automatically. */
    checked?: boolean;
  }>(),
  { disabled: false, checked: undefined },
);
const emit = defineEmits<{ click: [event: Event] }>();
const bar = ref<InstanceType<typeof ActionBar>>();
const actions = computed(() => [
  {
    id: 'icon-button',
    icon: props.icon,
    label: props.label,
    tooltip: props.tooltip,
    disabled: props.disabled,
    checked: props.checked,
    showLabel: false,
  },
]);
defineExpose({ focus: () => bar.value?.focus(0) });
</script>
<template>
  <ActionBar
    ref="bar"
    :actions="actions"
    @action="(_id, event) => emit('click', event)"
  />
</template>
