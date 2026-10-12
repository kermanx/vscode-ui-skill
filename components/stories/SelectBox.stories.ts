import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SelectBox from '../src/components/select-box/SelectBox.vue';
import SelectBoxSpecimen from './SelectBoxSpecimen.vue';
import Compare from './Compare.vue';
import { selectOptions } from './SelectBoxData';
const meta = {
  title: 'Components/Select Box', component: SelectBox,
  args: { options: selectOptions, modelValue: 0, custom: false, disabled: false, hideDisabled: false, placement: 'below', ariaLabel: 'Language' },
  argTypes: { placement: { control: 'select', options: ['below', 'above'] } },
} satisfies Meta<typeof SelectBox>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="select-box" :theme="globals.theme" />' }) };
export const Playground: Story = {
  tags: ['autodocs'],
  render: args => ({ components: { SelectBox }, setup: () => ({ args }), template: '<div class="playground"><div style="width:184px"><SelectBox v-bind="args" @update:modelValue="args.modelValue = $event" /></div></div>' }),
  parameters: { docs: { description: { story: 'macOS 默认使用原生选择器，custom 启用自绘列表。支持禁用项、分隔线、detail、右侧标记和描述面板。方向键跳过禁用项，Enter / Tab 确认，Escape / 失焦取消；字符键循环匹配首字母。暂不支持 Markdown 描述或描述悬浮框。' }, source: { code: '<SelectBox v-model="language" :options="languages" aria-label="Language" custom />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { SelectBoxSpecimen }, setup: () => ({ globals: context.globals }), template: '<SelectBoxSpecimen :theme="globals.theme" />' }) };
