import type { Meta, StoryObj } from '@storybook/vue3-vite';
import InputBox from '../src/components/input-box/InputBox.vue';
import InputBoxSpecimen from './InputBoxSpecimen.vue';
import Compare from './Compare.vue';
const meta = {
  title: 'Components/Input Box', component: InputBox,
  args: { modelValue: '', placeholder: 'Search files', ariaLabel: 'Search files', password: false, readonly: false, disabled: false, showPlaceholderOnFocus: false },
  argTypes: { validate: { control: false }, message: { control: 'object' }, history: { control: 'object' }, actions: { control: 'object' } },
} satisfies Meta<typeof InputBox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="input-box" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  tags: ['autodocs'],
  render: args => ({ components: { InputBox }, setup: () => ({ args }), template: '<div class="playground"><div style="width:280px"><InputBox v-bind="args" @update:modelValue="args.modelValue = $event" /></div></div>' }),
  parameters: { docs: { description: { story: '标准单行输入框：v-model、密码、只读/禁用、占位文字、三种验证消息、行内操作和上下键历史。select({ start, end }) 支持范围选择，验证信息在聚焦时显示并随宽度变化。暂不包含多行 textarea、富文本消息与延迟提示浮层。' }, source: { code: '<InputBox v-model="query" placeholder="Search files" aria-label="Search files" />' } } },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { InputBoxSpecimen }, setup: () => ({ globals: context.globals }), template: '<InputBoxSpecimen :theme="globals.theme" />' }),
};
