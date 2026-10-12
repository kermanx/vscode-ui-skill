import type { Meta, StoryObj } from '@storybook/vue3-vite';
import QuickInput from '../src/components/quick-input/QuickInput.vue';
import QuickInputSpecimen from './QuickInputSpecimen.vue';
import Compare from './Compare.vue';
const meta = {
  title: 'Components/Quick Input',
  component: QuickInput,
  args: {
    open: true,
    value: 'workspace',
    title: 'Create a project',
    step: 1,
    totalSteps: 3,
    placeholder: 'Project name',
    prompt: 'Enter a project name.',
    enabled: true,
    busy: false,
    password: false,
    ignoreFocusOut: false,
    backButton: true,
    severity: 'ignore',
  },
  argTypes: {
    severity: {
      control: 'select',
      options: ['ignore', 'info', 'warning', 'error'],
    },
  },
} satisfies Meta<typeof QuickInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="quick-input" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  tags: ['autodocs'],
  render: (args) => ({
    components: { QuickInput },
    setup: () => ({ args }),
    template:
      '<div style="position:relative;min-height:400px"><button class="outside" @click="args.open=true">Open quick input</button><QuickInput v-bind="args" @update:open="args.open=$event" @update:value="args.value=$event" @accept="args.open=false" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          '文本输入型Quick Input：标题、步骤、返回和标题按钮，提示/验证信息，密码与选区，800ms延迟busy进度。accept只通知调用者；例子在accept后关闭。enabled=false把输入设为只读，验证严重性不替调用方阻止accept。Escape关闭，移出焦点时默认关闭并保留外部焦点；ignoreFocusOut可保持打开。所在布局容器应有position:relative；宽度随容器测量，不暴露外观数值。第一阶段不含QuickPick列表、锚点和拖动。',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { QuickInputSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<QuickInputSpecimen :theme="globals.theme" />',
  }),
};
