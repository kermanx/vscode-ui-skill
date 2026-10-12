<script setup lang="ts">
import { onMounted } from 'vue';
import Codicon from '../src/components/codicon/Codicon.vue';
import { getCodiconAriaLabel, splitLabelWithIcons } from '../src/components/codicon/icons';
import { plainIcons, modifierIcons, disabledIcons, coloredIcons, labelTexts, sizeContexts, inlineSizeIcon, demoKey, demoStateId, splitDemoId, type CodiconDemo } from './CodiconData';
defineProps<{ theme?: string }>();
const iconStyle = 'display:flex;align-items:center;justify-content:center;width:22px;height:22px';
const sizeStyle = 'display:flex;align-items:center;justify-content:center;width:38px;height:26px';
let nextIndex = 0;
function demoCell(key: string, demo: CodiconDemo) {
  const { name, spin } = splitDemoId(demo.id);
  return { key, index: String(nextIndex++), name, spin, disabled: demo.disabled, style: demo.style };
}
const iconRows = [{ name: 'plain', demos: plainIcons }, { name: 'modifiers', demos: modifierIcons },
  { name: 'disabled', demos: disabledIcons }, { name: 'colored', demos: coloredIcons }]
  .map(({ name, demos }) => ({ name, colored: name === 'colored', cells: demos.map(demo => demoCell(demoKey(name, demo), demo)) }));
const labelRows = labelTexts.map((text, i) => ({ key: `labels/${i}`, index: String(nextIndex++), parts: splitLabelWithIcons(text), ariaLabel: getCodiconAriaLabel(text) }));
const sizeCells = sizeContexts.map(({ id, fontSize }) => ({ ...demoCell(`sizes/${id}`, { id }), fontSize }));
sizeCells.push({ ...demoCell('sizes/inline', inlineSizeIcon), fontSize: '' });
// Same render order as the pinned fixture, so both pages can compare state directly.
const icons = [...plainIcons, ...modifierIcons, ...disabledIcons, ...coloredIcons, ...sizeContexts.map(({ id }) => ({ id })), inlineSizeIcon].map(demoStateId);
const ariaLabels = labelTexts.map(getCodiconAriaLabel);
(window as any).fixtureState = { icons, ariaLabels, focus: [], selection: [], expanded: [], clicks: 0, escapes: 0, actions: [] };
onMounted(() => { (window as any).fixtureReady = true; });
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen button-specimen" data-testid="specimen">
      <div v-for="row in iconRows" :key="row.name" :data-row="row.name" style="display:flex;flex-wrap:wrap;gap:2px">
        <span v-for="cell in row.cells" :key="cell.key" :data-key="cell.key" :data-index="cell.index" :style="iconStyle">
          <Codicon :name="cell.name" :spin="cell.spin" :disabled="cell.disabled" :style="cell.style" :class="{ 'codicon-colored': row.colored }" />
        </span>
      </div>
      <div data-row="labels" style="display:flex;flex-direction:column;gap:2px">
        <span v-for="line in labelRows" :key="line.key" :data-key="line.key" :data-index="line.index" :aria-label="line.ariaLabel"
          style="display:flex;align-items:center;height:22px;line-height:22px;white-space:nowrap;overflow:hidden;width:100%"><template
            v-for="(part, i) in line.parts" :key="i"><Codicon v-if="'icon' in part" :name="part.icon" /><template v-else>{{ part.text }}</template></template></span>
      </div>
      <div data-row="sizes" style="display:flex;flex-wrap:wrap;gap:2px">
        <span v-for="cell in sizeCells" :key="cell.key" :data-key="cell.key" :data-index="cell.index" :style="sizeStyle">
          <span :data-font-size="cell.fontSize || undefined" :style="`display:flex;align-items:center;justify-content:center;width:36px;height:26px;font-size:${cell.fontSize || 'inherit'}`">
            <Codicon :name="cell.name" :spin="cell.spin" :disabled="cell.disabled" :style="cell.style" />
          </span>
        </span>
      </div>
    </div>
    <button class="outside">Move focus outside</button>
  </div>
</template>
