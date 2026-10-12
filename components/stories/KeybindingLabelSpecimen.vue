<script setup lang="ts">
import { onMounted, watch } from 'vue';
import KeybindingLabel from '../src/components/keybinding-label/KeybindingLabel.vue';
import { items } from './keybindingLabelData';
import layoutCss from './keybindingLabelLayout.css?inline';
defineProps<{ theme?: string }>();
// Same observable state the original fixture records, read back from the rendered DOM.
function publish() {
  const list = document.querySelector('[data-testid="keybinding-list"]');
  if (!list) return;
  const labels: (string | null)[] = [], text: (string | null)[] = [], classes: string[][] = [], highlights: number[] = [], unbound: boolean[] = [];
  for (const row of list.children) {
    const element = row.querySelector('.monaco-keybinding')!;
    labels.push(element.getAttribute('aria-label'));
    text.push(element.textContent);
    classes.push([...element.children].map(child => child.className));
    highlights.push(element.querySelectorAll('.highlight').length);
    unbound.push(element.children.length === 1 && element.children[0].classList.contains('monaco-keybinding-key'));
  }
  (window as any).fixtureState = { labels, text, classes, highlights, unbound };
}
watch(() => items, publish, { deep: true });
onMounted(() => { publish(); (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <!-- The SFC <style> block only takes CSS text at build time, so the shared row geometry is rendered as a style element. -->
    <component :is="'style'">{{ layoutCss }}</component>
    <div class="specimen button-specimen" data-testid="specimen">
      <div class="keybinding-list" data-testid="keybinding-list">
        <div v-for="(item, index) in items" :key="item.id" class="keybinding-row" :data-index="index">
          <span class="keybinding-label">{{ item.label }}</span>
          <KeybindingLabel :chords="item.chords" :matches="item.matches" :unbound="!item.chords" :os="item.os" :disable-title="item.disableTitle" />
        </div>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
