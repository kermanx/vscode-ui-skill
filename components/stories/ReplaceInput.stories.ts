import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ReplaceInput from '../src/components/replace-input/ReplaceInput.vue';
import ReplaceInputSpecimen from './ReplaceInputSpecimen.vue';
import ReplaceInputComposition from './ReplaceInputComposition.vue';
import Compare from './Compare.vue';
const meta = {
  title: 'Components/Replace Input', component: ReplaceInput,
  args: { modelValue: '', preserveCase: false, placeholder: 'Replace', ariaLabel: 'Replace', disabled: false, showOptions: true, focusInputOnOptionClick: true, multiline: false, wrap: false },
  argTypes: { validate: { control: false }, message: { control: 'object' }, history: { control: 'object' } },
} satisfies Meta<typeof ReplaceInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="replace-input" :theme="globals.theme" />' }) };
export const Playground: Story = {
  tags: ['autodocs'],
  render: args => ({ components: { ReplaceInput }, setup: () => ({ args }), template: '<div class="playground"><div style="width:300px"><ReplaceInput v-bind="args" @update:modelValue="args.modelValue = $event" @update:preserveCase="args.preserveCase = $event" /></div></div>' }),
  parameters: { docs: { description: { story: '替换输入与保留大小写选项。鼠标切换默认返回输入，Space/Enter 切换保持焦点，Escape 返回输入。支持历史、校验消息、多行和软换行；maxHeight 对应内容高度上限，原编辑器使用118，搜索视图使用134。保留大小写只提供选项状态，实际匹配和替换由调用方处理。' }, source: { code: '<ReplaceInput v-model="replacement" v-model:preserveCase="preserveCase" multiline :max-height="118" />' } } },
};
export const SearchAndReplace: Story = { tags: ['autodocs'], parameters: { controls: { disable: true }, docs: { description: { story: '组合演示：FindInput、ReplaceInput 和替换操作。Tab 从查找进入替换，再进入查找选项；正则选项继续到保留大小写。示例只覆盖基本文本替换与保留大小写；查找支持正则，替换值按字面文本使用，不解析 $1 等捕获组引用。保留大小写算法与原版相同。' } } }, render: () => ({ components: { ReplaceInputComposition }, template: '<div class="playground"><ReplaceInputComposition /></div>' }) };
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { ReplaceInputSpecimen }, setup: () => ({ globals: context.globals }), template: '<ReplaceInputSpecimen :theme="globals.theme" />' }) };
