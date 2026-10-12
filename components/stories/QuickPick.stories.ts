import type { Meta, StoryObj } from '@storybook/vue3-vite';
import QuickPick from '../src/components/quick-input/QuickPick.vue';
import { basicPicks } from './QuickPickData';
import QuickPickSpecimen from './QuickPickSpecimen.vue';
import Compare from './Compare.vue';
const meta = {
  title: 'Components/Quick Pick',
  component: QuickPick,
  args: {
    open: true,
    value: '',
    title: 'Select a command',
    items: basicPicks,
    enabled: true,
    canSelectMany: false,
    matchOnLabel: true,
    sortByLabel: true,
  },
  argTypes: {
    severity: {
      control: 'select',
      options: ['ignore', 'info', 'warning', 'error'],
    },
  },
} satisfies Meta<typeof QuickPick>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="quick-pick" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  tags: ['autodocs'],
  render: (args) => ({
    components: { QuickPick },
    setup: () => ({ args }),
    template:
      '<div style="position:relative;min-height:400px"><button class="outside" @click="args.open=true">Open quick pick</button><QuickPick v-bind="args" @update:open="args.open=$event" @update:value="args.value=$event" @accept="args.open=false" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          'QuickPick 单选与多选，原版模糊和连续匹配、分组、详情、条目操作、键盘导航及变高列表滚动。accept 通知调用者，调用者控制是否关闭。activeIds 与 selectedIds 分别保存焦点条目和选择。支持文本提示、主题图片、快捷键标签、动态数据和保留滚动位置；不包含 quickNavigate 按键释放接受、自定义确认按钮、光标锚点或拖动定位。',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { QuickPickSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<QuickPickSpecimen :theme="globals.theme" />',
  }),
};
