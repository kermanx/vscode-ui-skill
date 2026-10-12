<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  provide,
  ref,
  useSlots,
  watch,
} from 'vue';
import ButtonBar from '../button-bar/ButtonBar.vue';
import Checkbox from '../checkbox/Checkbox.vue';
import InputBox from '../input-box/InputBox.vue';
import ActionBar from '../action-bar/ActionBar.vue';
import { codiconClassNames } from '../codicon/icons';
import { dropdownPopupHost } from '../dropdown/popupHost';
import type { DropdownAction } from '../button/dropdownTypes';
import type { ButtonBarItem } from '../button-bar/types';
import type { DialogButton, DialogInput, DialogResult } from './types';
import { arrangeDialogButtons, dialogButtonLabel } from './dialog';
const props = withDefaults(
  defineProps<{
    message: string;
    detail?: string;
    type?: 'none' | 'info' | 'error' | 'question' | 'warning' | 'pending';
    buttons?: readonly (string | DialogButton)[];
    cancelId?: number;
    alignment?: 'horizontal' | 'vertical';
    checkboxLabel?: string;
    checkboxChecked?: boolean;
    inputs?: readonly DialogInput[];
    primaryActions?: readonly DropdownAction[];
    disableCloseAction?: boolean;
    disableCloseButton?: boolean;
    disableDefaultAction?: boolean;
  }>(),
  {
    type: 'info',
    alignment: 'horizontal',
    buttons: () => [],
    inputs: () => [],
  },
);
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{
  /** Emitted after open becomes false; input values are omitted on cancellation. */
  result: [result: DialogResult];
  action: [id: string];
}>();
const slots = useSlots();
const box = ref<HTMLElement>(),
  messageContainer = ref<HTMLElement>(),
  footer = ref<HTMLElement>(),
  popupHost = ref<HTMLElement>();
const inputControls = ref<InstanceType<typeof InputBox>[]>([]);
const bar = ref<InstanceType<typeof ButtonBar>>();
const values = ref<string[]>([]),
  checked = ref(false),
  detailOverride = ref<string>();
const openingMessage = ref(props.message);
let active = false,
  sawEscape = false,
  returnFocus: HTMLElement | undefined;
let lifecycle = 0,
  disposed = false;
provide(dropdownPopupHost, { container: popupHost, layer: 5175 });
const mapped = computed(() =>
  arrangeDialogButtons(
    props.buttons.length
      ? props.buttons
      : props.disableDefaultAction
        ? []
        : ['OK'],
    props.cancelId,
    props.alignment === 'vertical',
  ),
);
const buttonItems = computed<ButtonBarItem[]>(() =>
  mapped.value.map((button) => {
    const base = {
      id: String(button.index),
      label: dialogButtonLabel(button.label),
      secondary: button.index !== 0,
    };
    if (button.index === 0 && props.primaryActions)
      return { ...base, actions: props.primaryActions };
    // Dialog sublabels are plain text; ButtonBar also supports icon-marked descriptions.
    return {
      ...base,
      ...(button.sublabel
        ? {
            description: button.sublabel.replace(
              /\$\(([A-Za-z0-9-]+(?:~[A-Za-z]+)?)\)/g,
              '\\$&',
            ),
          }
        : {}),
    };
  }),
);
const iconName = computed(() =>
  props.type === 'pending'
    ? 'loading~spin'
    : props.type === 'error'
      ? 'dialog-error'
      : props.type === 'warning'
        ? 'dialog-warning'
        : 'dialog-info',
);
const iconLabel = computed(() =>
  props.type === 'error'
    ? 'Error'
    : props.type === 'warning'
      ? 'Warning'
      : props.type === 'pending'
        ? 'In Progress'
        : 'Info',
);
const iconColor = computed(() =>
  props.type === 'none'
    ? undefined
    : `var(--vscode-problems${props.type === 'error' ? 'Error' : props.type === 'warning' ? 'Warning' : 'Info'}Icon-foreground)`,
);
const hasDetail = computed(() => !!props.detail || !!slots.detail);
const showMessage = computed(() => hasDetail.value || !!slots.default);
const detailText = computed(
  () => detailOverride.value ?? (props.detail || openingMessage.value),
);
function removeListeners() {
  window.removeEventListener('keydown', keydown, true);
  window.removeEventListener('keyup', keyup, true);
}
function finish(result: DialogResult) {
  if (!active) return;
  const closingReturnFocus = returnFocus;
  const closingLifecycle = ++lifecycle;
  active = false;
  removeListeners();
  // Update the model before notifying consumers, so a result callback can reopen it.
  open.value = false;
  emit('result', result);
  void nextTick(() => {
    if (closingLifecycle !== lifecycle) return;
    // Vue can batch false → true into one unchanged prop. Start that new lifecycle explicitly.
    if (!disposed && open.value) {
      void beginOpen();
      return;
    }
    if (
      !active &&
      closingReturnFocus &&
      document.body.contains(closingReturnFocus)
    )
      closingReturnFocus.focus();
    returnFocus = undefined;
  });
}
function cancel() {
  finish({
    button: props.cancelId || 0,
    checkboxChecked: props.checkboxLabel ? checked.value : undefined,
  });
}
function choose(index: number, event?: MouseEvent | KeyboardEvent) {
  event?.preventDefault();
  finish({
    button: index,
    checkboxChecked: props.checkboxLabel ? checked.value : undefined,
    values: values.value.length ? [...values.value] : undefined,
  });
}
function dropdownAction(_buttonId: string, actionId: string) {
  emit('action', actionId);
  choose(0);
}
function inputElements() {
  return [
    ...(box.value?.querySelectorAll<HTMLInputElement>(
      '.dialog-message-input input',
    ) ?? []),
  ];
}
function focusables(): HTMLElement[] {
  const elements = [
    ...(messageContainer.value?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
    ...inputElements(),
  ];
  const checkbox = box.value?.querySelector<HTMLElement>('.monaco-checkbox');
  if (checkbox) elements.push(checkbox as HTMLInputElement);
  const buttons = box.value?.querySelector<HTMLElement>('.dialog-buttons');
  if (buttons)
    for (const root of buttons.children) {
      if (root.matches('.monaco-button'))
        elements.push(root as HTMLInputElement);
      else if (
        root.matches('.monaco-description-button,.monaco-button-dropdown')
      )
        elements.push(
          ...root.querySelectorAll<HTMLInputElement>('.monaco-button'),
        );
    }
  elements.push(
    ...(footer.value?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
  );
  return elements;
}
function keydown(event: KeyboardEvent) {
  const plain =
    !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
  if (plain && event.key === 'Escape') sawEscape = true;
  if (
    event.key === 'Alt' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  )
    event.preventDefault();
  if (plain && event.key === 'Enter') {
    if (inputElements().includes(document.activeElement as HTMLInputElement)) {
      event.preventDefault();
      choose(
        mapped.value.find((button) => button.index !== props.cancelId)?.index ??
          0,
      );
    }
    return;
  }
  if (
    navigator.userAgent.includes('Macintosh') &&
    event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === 'd'
  ) {
    event.preventDefault();
    const button = mapped.value.find(
      (button) => button.index === 1 && button.index !== props.cancelId,
    );
    if (button) choose(button.index);
    return;
  }
  if (plain && event.key === ' ') return;
  const tab =
    event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey;
  const editable =
    event.target instanceof HTMLElement &&
    (['INPUT', 'TEXTAREA'].includes(event.target.tagName) ||
      event.target.isContentEditable);
  const arrow =
    plain && ['ArrowLeft', 'ArrowRight'].includes(event.key) && !editable;
  if (!tab && !arrow) return;
  const elements = focusables();
  let index = elements.indexOf(document.activeElement as HTMLElement);
  if (elements.length) {
    if (event.key === 'ArrowRight' || (event.key === 'Tab' && !event.shiftKey))
      index = (index + 1) % elements.length;
    else
      index =
        ((index < 0 ? elements.length : index) + elements.length - 1) %
        elements.length;
    elements[index].focus();
  } else box.value?.focus();
  event.preventDefault();
  event.stopPropagation();
}
function keyup(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (
    !props.disableCloseAction &&
    event.key === 'Escape' &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    sawEscape
  )
    cancel();
}
function focusout(event: FocusEvent) {
  if (!active) return;
  if (
    !(event.relatedTarget instanceof HTMLElement) ||
    box.value?.contains(event.relatedTarget)
  )
    return;
  // Only this dialog's own menu host is exempt from the source's focus trap.
  if (popupHost.value?.contains(event.relatedTarget)) return;
  returnFocus = event.relatedTarget;
  (event.target as HTMLElement | null)?.focus();
  event.preventDefault();
  event.stopPropagation();
}
function prepareContent() {
  for (const element of [
    ...(messageContainer.value?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
    ...(footer.value?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
  ]) {
    element.tabIndex = 0;
    if (!element.classList.contains('monaco-button')) {
      element.style.color = 'var(--vscode-textLink-foreground)';
      element.style.textDecoration = 'underline';
    }
  }
  for (const input of inputElements()) input.removeAttribute('aria-label');
}
async function beginOpen() {
  if (disposed) return;
  const openingLifecycle = ++lifecycle;
  const focused = document.activeElement as HTMLElement;
  // A same-tick reopen can retain the old dialog's focused element or the document body.
  if (
    !returnFocus ||
    (focused !== document.body && !box.value?.contains(focused))
  )
    returnFocus = focused;
  active = true;
  sawEscape = false;
  values.value = props.inputs.map((input) => input.value || '');
  checked.value = !!props.checkboxChecked;
  openingMessage.value = props.message;
  detailOverride.value = undefined;
  await nextTick();
  if (!active || openingLifecycle !== lifecycle) return;
  prepareContent();
  window.addEventListener('keydown', keydown, true);
  window.addEventListener('keyup', keyup, true);
  if (inputControls.value.length) {
    inputControls.value[0].focus();
    inputControls.value[0].select();
  } else {
    const primary = mapped.value.findIndex((button) => button.index === 0);
    if (primary >= 0) bar.value?.focus(primary);
    else
      (
        footer.value?.querySelector<HTMLAnchorElement>('a') ?? box.value
      )?.focus();
  }
}
watch(
  open,
  (value) => {
    if (value) void beginOpen();
    else if (active) cancel();
  },
  { immediate: true },
);
watch(
  () => props.message,
  (value) => {
    if (active) detailOverride.value = value;
  },
);
onBeforeUnmount(() => {
  disposed = true;
  if (active) cancel();
  removeListeners();
});
defineExpose({
  close: cancel,
  updateMessage: (message: string) => {
    detailOverride.value = message;
  },
  focus: () => box.value?.focus(),
});
</script>
<template>
  <template v-if="open">
    <div
      class="monaco-dialog-modal-block dimmed"
      @click="$event.target === $event.currentTarget && box?.focus()"
    >
      <div
        class="dialog-shadow"
        style="box-shadow: 0 0px 8px var(--vscode-widget-shadow)"
      >
        <div
          ref="box"
          class="monaco-dialog-box"
          :class="{ 'align-vertical': alignment === 'vertical' }"
          role="dialog"
          tabindex="-1"
          aria-modal="true"
          aria-labelledby="monaco-dialog-icon monaco-dialog-message-text"
          aria-describedby="monaco-dialog-icon monaco-dialog-message-text monaco-dialog-message-detail monaco-dialog-message-body monaco-dialog-footer"
          style="
            color: var(--vscode-editorWidget-foreground);
            background-color: var(--vscode-editorWidget-background);
            border: 1px solid var(--vscode-widget-border);
          "
          @focusout="focusout"
        >
          <div v-if="$slots.footer" ref="footer" class="dialog-footer-row"
            ><div id="monaco-dialog-footer" class="dialog-footer"
              ><slot name="footer" /></div
          ></div>
          <div class="dialog-buttons-row"
            ><ButtonBar
              ref="bar"
              class="dialog-buttons"
              :items="buttonItems"
              :alignment="alignment"
              @click="(id, event) => choose(Number(id), event)"
              @action="dropdownAction"
          /></div>
          <div class="dialog-message-row">
            <div
              v-if="type === 'none'"
              id="monaco-dialog-icon"
              class="dialog-icon no-codicon"
              :aria-label="iconLabel"
            />
            <div
              v-else
              id="monaco-dialog-icon"
              class="dialog-icon"
              :class="codiconClassNames(iconName)"
              :aria-label="iconLabel"
              :style="{ color: iconColor }"
            />
            <div ref="messageContainer" class="dialog-message-container">
              <div v-if="showMessage" class="dialog-message"
                ><div
                  id="monaco-dialog-message-text"
                  class="dialog-message-text"
                  >{{ openingMessage }}</div
                ></div
              >
              <div
                id="monaco-dialog-message-detail"
                class="dialog-message-detail"
                :style="{
                  display: !hasDetail && $slots.default ? 'none' : undefined,
                }"
                ><slot
                  v-if="$slots.detail && detailOverride === undefined"
                  name="detail"
                /><template v-else>{{ detailText }}</template></div
              >
              <div
                v-if="$slots.default"
                id="monaco-dialog-message-body"
                class="dialog-message-body"
                ><slot
              /></div>
              <div
                v-for="(input, index) in inputs"
                :key="index"
                class="dialog-message-input"
                ><InputBox
                  ref="inputControls"
                  v-model="values[index]"
                  aria-label=""
                  :placeholder="input.placeholder"
                  :password="input.type === 'password'"
              /></div>
              <div v-if="checkboxLabel" class="dialog-checkbox-row"
                ><Checkbox
                  v-model:checked="checked"
                  :aria-label="checkboxLabel"
                /><div
                  class="dialog-checkbox-message"
                  @click="checked = !checked"
                  >{{ checkboxLabel }}</div
                ></div
              >
            </div>
          </div>
          <div class="dialog-toolbar-row"
            ><div class="dialog-toolbar"
              ><ActionBar
                v-if="!disableCloseAction && !disableCloseButton"
                :actions="[
                  {
                    id: 'dialog.close',
                    label: 'Close Dialog',
                    icon: 'dialog-close',
                  },
                ]"
                @action="cancel" /></div
          ></div>
        </div>
      </div>
    </div>
    <div
      ref="popupHost"
      class="vc-dialog-popup-host"
      style="position: fixed; left: 0; top: 0; z-index: 5175"
    />
  </template>
</template>
<style src="./dialog.css" />
