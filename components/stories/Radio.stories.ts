import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';
import Radio from '../src/components/radio/Radio.vue';
import RadioSpecimen from './RadioSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Radio', component: Radio,
  args: { options: [{ text: 'Off' }, { text: 'Auto' }, { text: 'Always' }], modelValue: 1, ariaLabel: 'Word wrap', segmented: false, arrowKeyBehavior: 'select' },
  argTypes: { arrowKeyBehavior: { control: 'select', options: ['select', 'focus'] } },
} satisfies Meta<typeof Radio>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="radio" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { Radio }, setup() { const selected = ref(args.modelValue); watch(() => args.modelValue, value => { selected.value = value; }); return { args, selected }; },
    template: '<div class="playground"><div style="max-width:360px"><Radio v-bind="args" v-model="selected" /></div><p class="state-readout">selected: {{ selected }}</p></div>' }),
  parameters: { docs: { description: { story: '原版横向 Radio 选项组，包含经典相连按钮和 segmented 外观。方向键跳过禁用选项并循环；focus 模式只移动焦点，Enter / Space 才选择。select 仅在值变化时触发，activate 在重复激活时也触发。text 支持 $(icon)，tooltip 作为默认无障碍名称；可视 hover 服务尚未接入。' }, source: { code: '<Radio v-model="selected" :options="[{ text: \'Off\' }, { text: \'Auto\' }, { text: \'Always\', disabled: true }]" aria-label="Word wrap" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { RadioSpecimen }, setup: () => ({ globals: context.globals }), template: '<RadioSpecimen :theme="globals.theme" />' }),
};
