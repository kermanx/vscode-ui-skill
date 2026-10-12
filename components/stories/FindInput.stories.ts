import type { Meta, StoryObj } from '@storybook/vue3-vite';
import FindInput from '../src/components/find-input/FindInput.vue';
import FindInputSpecimen from './FindInputSpecimen.vue';
import Compare from './Compare.vue';
import { validateFind } from './FindInputData';
const meta = {
  title: 'Components/Find Input', component: FindInput,
  args: { modelValue: '', placeholder: 'Find', ariaLabel: 'Find', matchCase: false, wholeWord: false, regex: false, showOptions: true, collapsed: false, disabled: false, multiline: false, wrap: false, focusInputOnOptionClick: true, validate: validateFind },
  argTypes: { validate: { control: false }, additionalToggles: { control: 'object' }, history: { control: 'object' } },
} satisfies Meta<typeof FindInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="find-input" :theme="globals.theme" />' }) };
export const Playground: Story = {
  tags: ['autodocs'],
  render: args => ({ components: { FindInput }, setup: () => ({ args }), template: '<div class="playground"><div style="width:300px"><FindInput v-bind="args" @update:modelValue="args.modelValue = $event" @update:matchCase="args.matchCase = $event" @update:wholeWord="args.wholeWord = $event" @update:regex="args.regex = $event" /></div></div>' }),
  parameters: { docs: { description: { story: '查找输入组合：大小写、全词和正则选项，附加开关、历史和验证。鼠标切换选项默认返回输入，键盘切换保留开关焦点，左右循环、Escape 返回输入。multiline 自动随内容增高，wrap 控制软换行；当前不提供限制高度后的内部滚动。输入事件区分 compositionend，外部设置值仅触发 change。' }, source: { code: '<FindInput v-model="query" v-model:regex="useRegex" :validate="validateFind" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { FindInputSpecimen }, setup: () => ({ globals: context.globals }), template: '<FindInputSpecimen :theme="globals.theme" />' }) };
