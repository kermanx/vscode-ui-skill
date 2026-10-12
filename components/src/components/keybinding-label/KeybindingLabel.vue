<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import { computed, watch } from 'vue';
import { ariaModifierLabels, modifierLabels } from './labels';
import type { Chord, ChordMatches, Matches, OperatingSystem } from './types';
export type { Chord, ChordMatches, Matches, OperatingSystem } from './types';

/** One rendered piece of the label, in original DOM order. */
type KeybindingPart =
  | { kind: 'key' | 'separator'; text: string; highlight?: boolean }
  | { kind: 'chordSeparator' };

const props = withDefaults(defineProps<{
  /** Chords of the keybinding. A single entry renders a simple shortcut. */
  chords?: readonly Chord[];
  /** Pressed modifiers/key, highlighted like the original's `Matches`. */
  matches?: Matches;
  /** Renders the "Unbound" placeholder instead of a keybinding. */
  unbound?: boolean;
  /** Placeholder text of `unbound`. */
  unboundLabel?: string;
  /** Operating system whose modifier labels and separator are used. */
  os?: OperatingSystem;
  /** Suppresses the accessible name, like the original's `disableTitle`. */
  disableTitle?: boolean;
}>(), { chords: () => [], unbound: false, unboundLabel: 'Unbound', os: 'macintosh', disableTitle: false });
const emit = defineEmits<{ change: [] }>();

const chords = computed<readonly Chord[]>(() => props.chords ?? []);
function asString(label: string | null | undefined) { return label ?? ''; }
/** Copy of `keybindingLabels.ts`'s `_simpleAsString` for the accessible name. */
function ariaChord(chord: Chord, labels: typeof ariaModifierLabels[OperatingSystem]) {
  const result: string[] = [];
  if (chord.ctrlKey) result.push(labels.ctrlKey);
  if (chord.shiftKey) result.push(labels.shiftKey);
  if (chord.altKey) result.push(labels.altKey);
  if (chord.metaKey) result.push(labels.metaKey);
  const key = asString(chord.keyAriaLabel ?? chord.key);
  if (key !== '') result.push(key);
  return result.join(labels.separator);
}
/** Copy of `KeybindingLabel.renderChord`: modifiers in source order, then the key. */
function chordParts(chord: Chord, match: ChordMatches | undefined): KeybindingPart[] {
  const labels = modifierLabels[props.os];
  const parts: KeybindingPart[] = [];
  const append = (label: string, highlighted: boolean, separator: string) => {
    parts.push({ kind: 'key', text: label, highlight: highlighted });
    if (separator) parts.push({ kind: 'separator', text: separator });
  };
  if (chord.ctrlKey) append(labels.ctrlKey, Boolean(match?.ctrlKey), labels.separator);
  if (chord.shiftKey) append(labels.shiftKey, Boolean(match?.shiftKey), labels.separator);
  if (chord.altKey) append(labels.altKey, Boolean(match?.altKey), labels.separator);
  if (chord.metaKey) append(labels.metaKey, Boolean(match?.metaKey), labels.separator);
  const key = asString(chord.key);
  if (key) parts.push({ kind: 'key', text: key, highlight: Boolean(match?.keyCode) });
  return parts;
}
/** `KeybindingLabel.render`: chord separators go between chords, not around them. */
const parts = computed(() => {
  const all = chords.value;
  if (!all.length) return [];
  const result = chordParts(all[0], props.matches?.firstPart);
  for (let index = 1; index < all.length; index++) {
    result.push({ kind: 'chordSeparator' }, ...chordParts(all[index], props.matches?.chordPart));
  }
  return result;
});
/** `this.keybinding.getAriaLabel() || undefined`, suppressed by `disableTitle`. */
const ariaLabel = computed(() => {
  if (!chords.value.length) return undefined;
  if (props.disableTitle) return '';
  const labels = ariaModifierLabels[props.os];
  return chords.value.map(chord => ariaChord(chord, labels)).join(' ') || '';
});
// `KeybindingLabel.set` re-renders whenever the keybinding or its match state changes.
watch([() => props.chords, () => props.matches, () => props.unbound, () => props.os, () => props.disableTitle], () => emit('change'), { deep: true });
</script>
<template>
  <span class="monaco-keybinding" :aria-label="ariaLabel">
    <template v-if="chords.length">
      <template v-for="(part, index) in parts" :key="index">
        <!-- Upstream appends a plain " " text node between chords. The interpolation keeps the
             exact U+0020 node; a whitespace-only static child would be dropped by the compiler. -->
        <span v-if="part.kind === 'chordSeparator'" class="monaco-keybinding-key-chord-separator">{{ ' ' }}</span>
        <span v-else-if="part.kind === 'separator'" class="monaco-keybinding-key-separator">{{ part.text }}</span>
        <span v-else class="monaco-keybinding-key" :class="{ highlight: part.highlight }">{{ part.text }}</span>
      </template>
    </template>
    <span v-else-if="unbound" class="monaco-keybinding-key">{{ unboundLabel }}</span>
  </span>
</template>
<style src="./keybindingLabel.css" />
