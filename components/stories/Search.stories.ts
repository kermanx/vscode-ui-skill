import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SearchView from '../src/components/search/SearchView.vue';
import SearchSpecimen from './SearchSpecimen.vue';
import { searchFiles } from './SearchData';
import Compare from './Compare.vue';
const meta = {
  title: 'Compositions/Search',
  component: SearchView,
  args: {
    results: searchFiles,
    query: 'Button',
    searched: true,
    height: 500,
    expandedIds: ['app', 'button', 'readme'],
  },
} satisfies Meta<typeof SearchView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template:
      '<Compare section="compositions" kind="search" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  tags: ['autodocs'],
  render: (args) => ({
    components: { SearchView },
    setup: () => ({ args }),
    template: '<div style="width:320px"><SearchView v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Classic Search 组合：搜索/替换、include/exclude、文件与命中结果树。结果由应用提供，submit/open/replace/dismiss/action 发出请求；不执行后端搜索或磁盘替换。暂不包含 AI、Notebook、Search Editor 和 compact folder 结果树。',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { SearchSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<SearchSpecimen :theme="globals.theme" />',
  }),
};
