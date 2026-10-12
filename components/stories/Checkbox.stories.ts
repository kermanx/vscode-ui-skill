import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';
import Checkbox from '../src/components/checkbox/Checkbox.vue';
import CheckboxSpecimen from './CheckboxSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Checkbox', component: Checkbox,
  args: { checked: false, label: 'Enable auto save', disabled: false, ariaLabel: '' },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="checkbox" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { Checkbox }, setup() { const checked = ref(args.checked); watch(() => args.checked, value => { checked.value = value; }); return { args, checked }; },
    template: '<div class="playground"><Checkbox v-bind="args" v-model:checked="checked" /><p class="state-readout">checked: {{ checked }}</p></div>' }),
  parameters: { docs: { description: { story: '18px 复选框，可选操作栏文字标签；点击标签聚焦并切换。Space / Enter 在 keydown 切换；禁用状态跳过 Tab。checked 使用 v-model:checked；change 的第二个参数表示是否由键盘触发。' }, source: { code: '<Checkbox v-model:checked="autoSave" label="Enable auto save" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { CheckboxSpecimen }, setup: () => ({ globals: context.globals }), template: '<CheckboxSpecimen :theme="globals.theme" />' }),
};
