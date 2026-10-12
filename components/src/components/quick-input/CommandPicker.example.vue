<!-- Reading example: host-side command execution; not a public library export. -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import Button from '../button/Button.vue';
import QuickPick from './QuickPick.vue';
import type { QuickPickAcceptEvent } from './quickPickTypes';

interface Command {
  id: string;
  label: string;
  run(): void;
}

const props = defineProps<{ commands: readonly Command[] }>();
const open = ref(false);
const query = ref('');
const items = computed(() =>
  props.commands.map(({ id, label }) => ({ id, label })),
);

function show() {
  query.value = '';
  open.value = true;
}

async function accept({ selectedIds }: QuickPickAcceptEvent) {
  const command = props.commands.find(({ id }) => id === selectedIds[0]);
  if (!command) return;

  // QuickPick reports acceptance but leaves closing to its caller.
  open.value = false;
  // First apply the controlled prop; then let the shell restore opener focus.
  // A command that opens another surface can now choose its own focus target.
  await nextTick();
  await nextTick();
  command.run();
}
</script>

<template>
  <!-- The enclosing application supplies .vc-theme and its shared styles. -->
  <div style="position: relative; min-height: 240px">
    <Button label="Run command" @click="show" />
    <QuickPick
      v-model:open="open"
      v-model:value="query"
      :items="items"
      placeholder="Select a command"
      @accept="accept"
    />
  </div>
</template>
