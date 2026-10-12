import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';
import Toggle from '../src/components/toggle/Toggle.vue';
import ToggleSpecimen from './ToggleSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Toggle', component: Toggle,
  args: { title: 'Match Case', icon: 'case-sensitive', checked: false, disabled: false, focusable: true },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="toggle" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { Toggle }, setup() { const checked = ref(args.checked); watch(() => args.checked, value => { checked.value = value; }); return { args, checked }; },
    template: '<div class="playground"><div style="display:flex"><Toggle v-bind="args" v-model:checked="checked" /></div><p class="state-readout">checked: {{ checked }}</p></div>' }),
  parameters: { docs: { description: { story: '20px 图标切换项，支持 v-model:checked、禁用与 focusable。Space / Enter 在 keydown 切换，未消费按键发出 keydown。title 生成无障碍名称；全局 hover 服务暂未接入。组合示例只展示多个 Toggle，不包含 FindInput。' }, source: { code: '<Toggle v-model:checked="matchCase" title="Match Case" icon="case-sensitive" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { ToggleSpecimen }, setup: () => ({ globals: context.globals }), template: '<ToggleSpecimen :theme="globals.theme" />' }),
};
