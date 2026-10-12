import type { Meta, StoryObj } from "@storybook/vue3-vite";
import StatusBar from "../src/components/status-bar/StatusBar.vue";
import StatusBarSpecimen from "./StatusBarSpecimen.vue";
import Compare from "./Compare.vue";
import { statusBarEntries } from "./StatusBarData";
const meta = {
  title: "Components/Status Bar",
  component: StatusBar,
  args: {
    entries: statusBarEntries,
    hasFolder: true,
    inactive: false,
    ariaLabel: "Status Bar",
  },
} satisfies Meta<typeof StatusBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="status-bar" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { StatusBar },
    setup: () => ({ args }),
    template:
      '<div class="playground" style="height:260px;display:flex;align-items:flex-end"><StatusBar v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          "entries 对应原版状态栏条目。alignment 分左右，priority 越大越靠左，location 支持相对位置和 compact。没有 command 的条目仍可被方向键聚焦；不显示额外的溢出菜单。方向键、Home/End 循环导航，Enter/Space 执行命令，Escape 先回状态栏。右键菜单可隐藏单个条目。",
      },
      source: {
        code: "<StatusBar :entries=\"[{ id: 'branch', name: 'Git branch', text: '$(git-branch) main', ariaLabel: 'Git branch main', command: 'git.checkout', priority: 100 }]\" @command=\"executeCommand\" />",
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { StatusBarSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<StatusBarSpecimen :theme="globals.theme" />',
  }),
};
