import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onMounted, ref, watch } from 'vue';
import KeybindingLabel from '../src/components/keybinding-label/KeybindingLabel.vue';
import KeybindingLabelSpecimen from './KeybindingLabelSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Keybinding Label', component: KeybindingLabel,
  args: { chords: [{ metaKey: true, key: 'K', keyAriaLabel: 'K' }, { metaKey: true, key: 'S', keyAriaLabel: 'S' }], os: 'macintosh', unbound: false, disableTitle: false },
} satisfies Meta<typeof KeybindingLabel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="keybinding-label" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { KeybindingLabel }, setup: () => {
    // Read the rendered attribute back, so the readout shows what assistive technology sees.
    const element = ref<{ $el?: HTMLElement }>(), ariaLabel = ref('');
    const read = () => { ariaLabel.value = (element.value?.$el as HTMLElement | undefined)?.getAttribute('aria-label') ?? '(none)'; };
    watch(() => [args.chords, args.matches, args.os, args.unbound, args.disableTitle], read, { deep: true });
    onMounted(read);
    return { args, element, ariaLabel };
  },
    template: `<div class="playground"><div style="display:flex;align-items:center;height:22px"><KeybindingLabel ref="element" v-bind="args" /></div><p class="state-readout">aria-label: {{ ariaLabel }}<br />os: {{ args.os }} · unbound: {{ args.unbound }} · chords: {{ (args.chords ?? []).length }}</p></div>` }),
  parameters: { docs: { description: { story: 'KeybindingLabel 用当前操作系统的修饰键标签渲染快捷键；多 chord 之间插入空格分隔，命中部分加 .highlight，未绑定显示 Unbound。disableTitle 与原版一致地清空 aria-label。原版用 hover 服务显示 tooltip，复刻暂未接入全局 hover 服务，因此只有 aria-label 与 tooltip 内容一致、没有悬停浮层。' }, source: { code: `<KeybindingLabel
  :chords="[{ metaKey: true, key: 'K', keyAriaLabel: 'K' }, { metaKey: true, key: 'S', keyAriaLabel: 'S' }]"
  :matches="{ firstPart: { metaKey: true, keyCode: true }, chordPart: { metaKey: true } }"
  os="macintosh" />` } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { KeybindingLabelSpecimen }, setup: () => ({ globals: context.globals }), template: '<KeybindingLabelSpecimen :theme="globals.theme" />' }),
};
