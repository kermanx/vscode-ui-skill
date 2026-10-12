<!-- Copyright (c) Microsoft Corporation. All rights reserved.
     Licensed under the MIT License. See License.txt in the project root for license information. -->
<script setup lang="ts">
import '../action-bar/actionbar.css';
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { layout as layoutAxis } from '../dropdown/layout';
import { StandardWheelEvent, type IMouseWheelEvent } from '../../internal/standardWheelEvent';
import type { SelectBoxOption } from './types';
const props = withDefaults(defineProps<{
  options: readonly SelectBoxOption[];
  custom?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescription?: string;
  hideDisabled?: boolean;
  placement?: 'above' | 'below';
  maxVisibleOptions?: number;
}>(), { ariaLabel: 'Select Box', placement: 'below' });
const model = defineModel<number>({ default: 0 });
const emit = defineEmits<{ select: [index: number, option: SelectBoxOption]; open: []; close: [] }>();
const isMac = /Mac/.test(navigator.platform);
const custom = computed(() => props.custom || !isMac);
const trigger = ref<HTMLSelectElement>(), panel = ref<HTMLElement>(), list = ref<HTMLElement>(), details = ref<HTMLElement>(), widthControl = ref<HTMLElement>();
const openedOnce = ref(false);
const open = ref(false), selected = ref(model.value), focused = ref(-1), tabIndex = ref(0);
const scrollTop = ref(0), listHeight = ref(0), panelWidth = ref(1), fontSize = ref('13px'), above = ref(false), panelPosition = ref({ left: '0px', top: '0px' });
const dragging = ref(false);
const uid = useId();
const options = computed(() => props.options.map(option => ({ ...option, disabled: !!option.disabled || !!option.separator })));
const entries = computed(() => options.value.map((option, index) => ({ option, index })).filter(({ option }) => !props.hideDisabled || !option.disabled));
const hasDetails = computed(() => options.value.some(option => typeof option.description === 'string'));
const focusedDescription = computed(() => options.value[focused.value]?.description || '');
const current = computed(() => options.value[selected.value]);
const background = 'var(--vscode-dropdown-listBackground, var(--vscode-dropdown-background))';
const selectedStyle = { backgroundColor: 'var(--vscode-dropdown-background)', color: 'var(--vscode-dropdown-foreground)', borderColor: 'var(--vscode-dropdown-border)' };
const panelStyle = computed(() => ({ ...panelPosition.value, width: `${panelWidth.value}px`, fontSize: fontSize.value, backgroundColor: background, height: hasDetails.value ? undefined : `${listHeight.value}px` }));
const totalHeight = computed(() => entries.value.length * 22);
const hasScrollbar = computed(() => totalHeight.value > listHeight.value);
const thumbHeight = computed(() => Math.max(20, Math.floor(listHeight.value * listHeight.value / totalHeight.value)));
const thumbRatio = computed(() => (listHeight.value - thumbHeight.value) / (totalHeight.value - listHeight.value));
const thumbTop = computed(() => Math.round(scrollTop.value * thumbRatio.value));
const visibleEntries = computed(() => entries.value.slice(Math.max(0, Math.floor(scrollTop.value / 22)), Math.ceil((scrollTop.value + listHeight.value) / 22)).map(entry => ({ ...entry, rowIndex: entries.value.indexOf(entry) })));
let initialSelection = model.value;
let maxDetailsHeight: number | undefined;
watch(model, index => { selected.value = clampIndex(index); initialSelection = selected.value; }, { immediate: true });
watch(() => props.options, () => { selected.value = clampIndex(model.value); maxDetailsHeight = undefined; if (open.value) void renderPanel(); });
function clampIndex(index: number) { return Math.max(0, Math.min(options.value.length - 1, index)); }
function setScroll(top: number) { scrollTop.value = Math.max(0, Math.min(totalHeight.value - listHeight.value, Math.floor(top))); }
function reveal(index: number) {
  const row = entries.value.findIndex(entry => entry.index === index);
  const top = row * 22;
  if (top < scrollTop.value) setScroll(top);
  else if (top + 22 > scrollTop.value + listHeight.value) setScroll(top + 22 - listHeight.value);
}
function focusOption(index: number, updateSelection = true) {
  if (!options.value[index]) return;
  if (updateSelection) selected.value = index;
  focused.value = index;
  reveal(index);
  void nextTick(positionPanel);
}
function close(accept: boolean, returnFocus: boolean) {
  if (!open.value) return;
  if (accept && !current.value?.disabled && selected.value !== initialSelection) {
    model.value = selected.value;
    emit('select', selected.value, options.value[selected.value]);
    initialSelection = selected.value;
  } else if (!accept) selected.value = initialSelection;
  open.value = false;
  if (returnFocus) trigger.value?.focus();
  emit('close');
}
function nativeChange(event: Event) {
  selected.value = (event.target as HTMLSelectElement).selectedIndex;
  model.value = selected.value;
  emit('select', selected.value, options.value[selected.value]);
}
function positionPanel() {
  if (!open.value || !trigger.value || !panel.value) return;
  const anchor = trigger.value.getBoundingClientRect(), rect = panel.value.getBoundingClientRect();
  const top = layoutAxis(window.innerHeight, rect.height, { offset: anchor.top, size: anchor.height, before: !above.value });
  const intersects = top < anchor.bottom && anchor.top < top + rect.height;
  const left = layoutAxis(window.innerWidth, rect.width, { offset: anchor.left, size: anchor.width, align: !intersects });
  panelPosition.value = { left: `${left}px`, top: `${top}px` };
}
async function renderPanel() {
  await nextTick();
  if (!trigger.value || !panel.value || !widthControl.value) return;
  const anchor = trigger.value.getBoundingClientRect();
  fontSize.value = getComputedStyle(trigger.value).fontSize;
  await nextTick();
  let longest = options.value[0];
  for (const option of options.value) if (option.text.length + (option.detail?.length || 0) + (option.decoratorRight?.length || 0) > (longest?.text.length || 0) + (longest?.detail?.length || 0) + (longest?.decoratorRight?.length || 0)) longest = option;
  widthControl.value.textContent = longest ? longest.text + (longest.decoratorRight ? `${longest.decoratorRight} ` : '') : '';
  panelWidth.value = Math.max(widthControl.value.offsetWidth, Math.round(trigger.value.offsetWidth));
  await nextTick();
  if (hasDetails.value && maxDetailsHeight === undefined && details.value) {
    maxDetailsHeight = 0;
    for (const option of options.value) {
      details.value.textContent = option.description || '';
      details.value.style.display = option.description ? 'block' : 'none';
      maxDetailsHeight = Math.max(maxDetailsHeight, details.value.offsetHeight);
    }
    details.value.textContent = focusedDescription.value;
    details.value.style.display = focusedDescription.value ? 'block' : 'none';
  }
  const detailsHeight = maxDetailsHeight || 0;
  const availableBelow = window.innerHeight - anchor.top - anchor.height - 32, availableAbove = anchor.top - 2;
  const rowsBelow = Math.floor((availableBelow - detailsHeight) / 22), rowsAbove = Math.floor((availableAbove - detailsHeight) / 22);
  const preferred = props.placement === 'above' ? rowsAbove : rowsBelow, other = props.placement === 'above' ? rowsBelow : rowsAbove;
  const desiredRows = Math.min(entries.value.length, props.maxVisibleOptions ?? Infinity);
  const flip = preferred < 3 && other > preferred && desiredRows > preferred;
  above.value = props.placement === 'above' ? !flip : flip;
  if (anchor.bottom > window.innerHeight - 22 || anchor.top < 2 || (above.value ? rowsAbove : rowsBelow) < 1) { close(false, true); return; }
  listHeight.value = Math.max(0, Math.min(desiredRows, above.value ? rowsAbove : rowsBelow) * 22);
  await nextTick();
  focused.value = selected.value; list.value?.focus(); reveal(selected.value);
  await nextTick(); positionPanel();
}
async function show() {
  if (open.value || props.disabled) return;
  initialSelection = selected.value;
  focused.value = selected.value;
  if (!entries.value.some(entry => entry.index === focused.value) && entries.value.length) selected.value = focused.value = entries.value[0].index;
  openedOnce.value = true; open.value = true;
  await renderPanel();
  if (open.value) emit('open');
}
const visibleOnTouchStart = ref(false);
function touchEnd(event: TouchEvent) {
  if (!custom.value) return;
  event.preventDefault();
  if (visibleOnTouchStart.value) close(false, true); else void show();
}
function click(event: MouseEvent) {
  if (custom.value) { event.preventDefault(); if (open.value) close(false, true); else void show(); }
  else { event.preventDefault(); event.stopPropagation(); }
}
function keydown(event: KeyboardEvent) {
  const expand = isMac ? (custom.value ? ['ArrowDown', 'ArrowUp', ' ', 'Enter'] : ['ArrowDown', 'ArrowUp', ' ']).includes(event.key) : (event.altKey && ['ArrowDown', 'ArrowUp'].includes(event.key)) || [' ', 'Enter'].includes(event.key);
  if (expand) { event.stopPropagation(); if (custom.value) { event.preventDefault(); void show(); } }
}
function choose(index: number, event: PointerEvent) {
  event.preventDefault();
  if (options.value[index].disabled) return;
  selected.value = index; focused.value = index; close(true, true);
}
function hover(index: number) { if (!options.value[index].disabled) { focused.value = index; void nextTick(positionPanel); } }
function navigate(step: number) {
  let candidate = selected.value + step;
  while (candidate >= 0 && candidate < options.value.length && options.value[candidate].disabled) candidate += step;
  if (candidate >= 0 && candidate < options.value.length) focusOption(candidate);
}
function pageNavigation(down: boolean) {
  let row = entries.value.findIndex(entry => entry.index === focused.value);
  let candidate = down ? Math.max(0, Math.floor((scrollTop.value + listHeight.value) / 22) - 1) : Math.ceil(scrollTop.value / 22);
  if (row === candidate || (down ? row > candidate : row < candidate)) {
    setScroll(scrollTop.value + (down ? 1 : -1) * listHeight.value);
    candidate = down ? Math.max(0, Math.floor((scrollTop.value + listHeight.value) / 22) - 1) : Math.ceil(scrollTop.value / 22);
  }
  candidate = Math.min(entries.value.length - 1, candidate);
  while (candidate >= 0 && candidate < entries.value.length && entries.value[candidate].option.disabled) candidate += down ? 1 : -1;
  if (entries.value[candidate]) focusOption(entries.value[candidate].index);
}
function listKeydown(event: KeyboardEvent) {
  if (!options.value.length) return;
  switch (event.key) {
    case 'Enter': case 'Tab': close(true, true); break;
    case 'Escape': close(false, true); break;
    case 'ArrowDown': if (selected.value >= options.value.length - 1) return; navigate(1); event.stopPropagation(); break;
    case 'ArrowUp': if (selected.value <= 0) return; navigate(-1); event.stopPropagation(); break;
    case 'Home': { const index = options.value.findIndex(option => !option.disabled); if (index >= 0) focusOption(index); break; }
    case 'End': { let index = options.value.length - 1; while (index >= 0 && options.value[index].disabled) index--; if (index >= 0) focusOption(index); break; }
    case 'PageDown': pageNavigation(true); break;
    case 'PageUp': pageNavigation(false); break;
    default: {
      if (event.key.length !== 1 || event.key === ' ') return;
      let matched = false;
      for (let offset = 1; offset < options.value.length; offset++) {
        const index = (selected.value + offset) % options.value.length;
        if (options.value[index].text[0]?.toUpperCase() === event.key.toUpperCase() && !options.value[index].disabled) { focusOption(index); matched = true; break; }
      }
      if (!matched) return;
    }
  }
  event.preventDefault();
}
function wheel(event: WheelEvent) {
  const normalized = new StandardWheelEvent(event as unknown as IMouseWheelEvent);
  let delta = Math.abs(normalized.deltaX) > Math.abs(normalized.deltaY) ? 0 : normalized.deltaY;
  if (!isMac && event.shiftKey) delta = 0;
  if (event.altKey) delta *= 5;
  delta *= 50;
  setScroll(scrollTop.value - (delta < 0 ? Math.floor(delta) : Math.ceil(delta)));
  event.preventDefault(); event.stopPropagation();
}
function scrollbarDown(event: PointerEvent) {
  event.preventDefault(); event.stopPropagation();
  const track = event.currentTarget as HTMLElement;
  if (!(event.target as HTMLElement).classList.contains('slider')) setScroll((event.clientY - track.getBoundingClientRect().top - thumbHeight.value / 2) / thumbRatio.value);
  const start = event.clientY, sliderPosition = thumbTop.value;
  dragging.value = true; track.setPointerCapture(event.pointerId);
  const move = (e: PointerEvent) => setScroll(Math.round((sliderPosition + e.clientY - start) / thumbRatio.value));
  const up = () => { dragging.value = false; track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); track.removeEventListener('lostpointercapture', up); };
  track.addEventListener('pointermove', move); track.addEventListener('pointerup', up); track.addEventListener('lostpointercapture', up);
}
function focusout(event: FocusEvent) { if (open.value && !panel.value?.contains(event.relatedTarget as Node)) close(false, false); }
function relayout() { if (open.value) void renderPanel(); }
window.addEventListener('resize', relayout);
window.addEventListener('scroll', relayout, true);
onBeforeUnmount(() => { window.removeEventListener('resize', relayout); window.removeEventListener('scroll', relayout, true); });
defineExpose({ focus: () => { tabIndex.value = 0; trigger.value?.focus(); }, blur: () => { tabIndex.value = -1; trigger.value?.blur(); } });
</script>
<template>
  <div class="select-container" :class="{ mac: isMac }">
    <select ref="trigger" class="monaco-select-box" :style="selectedStyle" :disabled="disabled" :tabindex="tabIndex"
      :title="!custom ? current?.text : undefined" :aria-label="ariaLabel" :aria-description="ariaDescription" :aria-expanded="custom && openedOnce ? open : undefined"
      @change="nativeChange" @touchstart="visibleOnTouchStart = open" @touchend="touchEnd" @click="click" @mousedown="custom && $event.preventDefault()" @keydown="keydown">
      <option v-for="(option, index) in options" :key="index" :value="option.text" :selected="index === selected" :disabled="option.disabled" :role="option.separator && !custom ? 'separator' : undefined">{{ option.text }}</option>
    </select>
  <div v-if="open" class="vc-select-context" :style="panelPosition">
    <div ref="panel" class="monaco-select-box-dropdown-container visible vc-select-panel" :style="panelStyle" draggable="true" @dragstart.prevent @focusout="focusout">
      <div class="select-box-dropdown-container-width-control"><div class="width-control-div"><span ref="widthControl" class="option-text-width-control" /></div></div>
      <div ref="details" class="select-box-details-pane" :class="above ? 'border-bottom' : 'border-top'" :style="{ display: focusedDescription ? 'block' : 'none', backgroundColor: background, order: above ? 0 : 2 }">{{ focusedDescription }}</div>
      <div class="select-box-dropdown-list-container" tabindex="0" :style="{ backgroundColor: background, order: 1 }" @keydown="listKeydown">
        <div ref="list" class="monaco-list element-focused" tabindex="0" role="listbox" :aria-label="ariaLabel" aria-expanded="true" :aria-activedescendant="`${uid}-${focused}`" :style="{ height: `${listHeight}px` }" @wheel="wheel">
          <div class="monaco-scrollable-element vc-select-scrollable">
            <div class="monaco-list-rows" :style="{ height: `${totalHeight}px`, top: `${-scrollTop}px`, transform: 'translate3d(0px, 0px, 0px)', overflow: 'hidden', contain: 'strict' }">
              <div v-for="entry in visibleEntries" :id="`${uid}-${entry.index}`" :key="entry.index" class="monaco-list-row" :class="{ focused: focused === entry.index, 'option-disabled': entry.option.disabled, 'option-separator': entry.option.separator }"
                :data-index="entry.rowIndex" :data-option-index="entry.index" :role="isMac ? undefined : 'option'" :aria-label="entry.option.separator ? 'separator' : [entry.option.text, entry.option.detail, entry.option.decoratorRight, entry.option.description].filter(Boolean).join('. ')"
                :aria-selected="false" :style="{ top: `${entry.rowIndex * 22}px`, height: '22px', lineHeight: '22px' }" @mouseover="hover(entry.index)" @pointerup="choose(entry.index, $event)">
                <span class="option-text">{{ entry.option.text }}</span><span class="option-detail">{{ entry.option.detail }}</span><span class="option-decorator-right">{{ entry.option.decoratorRight }}</span>
              </div>
            </div>
            <div v-if="hasScrollbar" class="scrollbar vertical visible" style="position:absolute;right:0;top:0;width:10px;height:100%" @pointerdown="scrollbarDown">
              <div class="slider" :class="{ active: dragging }" :style="{ position: 'absolute', width: '10px', top: `${thumbTop}px`, height: `${thumbHeight}px` }" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
<style src="./selectBox.css" />
<style src="./selectBoxCustom.css" />
<style src="./list.css" />
<style src="./selectBoxTheme.css" />
