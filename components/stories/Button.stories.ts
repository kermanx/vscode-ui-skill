import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../src/components/button/Button.vue';
import SpecimenView from './Specimen.vue';
import Compare from './Compare.vue';

const meta = {
  title: 'Components/Button', component: Button,
  args: { label: 'Create File', secondary: false, small: false, disabled: false },
  argTypes: { icon: { control: 'text' } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="button" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  tags: ['autodocs'],
  render: args => ({ components: { Button }, setup: () => ({ args }), template: '<div class="playground"><div style="width:184px"><Button v-bind="args" /></div></div>' }),
  parameters: { docs: { description: { story: '原版 Button 的 Vue 范例。主次样式、原版 small 尺寸、禁用、Codicon 和 ariaLabel。Enter / Space 在 keydown 触发；Esc 发出 escape 并移出焦点。' }, source: { code: '<Button label="Create File" icon="add" @click="createFile" />' } } },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { SpecimenView }, setup: () => ({ globals: context.globals }), template: '<SpecimenView kind="button" :theme="globals.theme" />' }),
};
