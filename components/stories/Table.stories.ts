import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Table from "../src/components/table/Table.vue";
import TableSpecimen from "./TableSpecimen.vue";
import Compare from "./Compare.vue";
import { tableColumns, tableRows } from "./TableData";
const meta = {
  title: "Components/Table",
  component: Table,
  args: {
    columns: tableColumns,
    rows: tableRows,
    height: 264,
    multiple: true,
    ariaLabel: "Diagnostics",
  },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="table" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { Table },
    setup: () => ({ args }),
    template: '<div class="playground"><Table v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          "按 Problems 表格的24px表头/行高和10px单元格起始间距呈现。列使用weight分配初始宽度并受minimumWidth/maximumWidth约束；拖动任意高度的分隔线调整列，双击按该列weight重置。rows使用稳定id保持选择与焦点；cells支持文本、图标、高亮范围和快捷键，按列id的命名插槽可替换单元格。焦点和选择分离，支持多选、键盘导航和上下文菜单。",
      },
      source: {
        code: '<Table :columns="columns" :rows="rows" v-model:selected-ids="selected"><template #message="{row,cell}">{{cell}}</template></Table>',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { TableSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<TableSpecimen :theme="globals.theme" />',
  }),
};
