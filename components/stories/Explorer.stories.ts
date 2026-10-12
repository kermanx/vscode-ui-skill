import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Explorer from '../src/components/explorer/Explorer.vue';
import ExplorerSpecimen from './ExplorerSpecimen.vue';
import { workspaceFiles, openedEditors } from './ExplorerData';
import Compare from './Compare.vue';
const meta = {
  title: 'Compositions/Explorer',
  component: Explorer,
  args: {
    roots: workspaceFiles,
    editorGroups: openedEditors,
    height: 500,
    showOpenEditors: true,
  },
} satisfies Meta<typeof Explorer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template:
      '<Compare section="compositions" kind="explorer" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  tags: ['autodocs'],
  render: (args) => ({
    components: { Explorer },
    setup: () => ({ args }),
    template: '<div style="width:320px"><Explorer v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Classic Explorer 组合：标题、Open Editors、工作区文件树，使用默认 Seti 文件图标。结构化数据控制文件与编辑器；open/close/unpin/action 事件交给应用处理。暂不包含内联重命名、compact folders、文件嵌套、拖放搬运或后台文件发现。',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { ExplorerSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<ExplorerSpecimen :theme="globals.theme" />',
  }),
};
