import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SidebarTitle from '../src/components/sidebar-title/SidebarTitle.vue';
import SidebarTitleSpecimen from './SidebarTitleSpecimen.vue';
import { sidebarTitlePrimary, sidebarTitleSecondary } from './SidebarTitleData';
import Compare from './Compare.vue';

const meta = {
  title: 'Components/Sidebar Title',
  component: SidebarTitle,
  args: { title: 'Explorer', keybinding: '⇧⌘E', primary: sidebarTitlePrimary, secondary: sidebarTitleSecondary },
} satisfies Meta<typeof SidebarTitle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {
  tags: ['autodocs'],
  render: args => ({ components: { SidebarTitle }, setup: () => ({ args }), template: '<SidebarTitle v-bind="args" />' }),
  parameters: { docs: { description: { story: '侧栏标题与操作区：标题和快捷键提示、主操作、Views and More Actions 菜单。容器决定宽度；固定标题栏尺寸，长标题自动省略。focus() 将焦点移至工具栏，action 返回操作 ID。' } } },
};
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="sidebar-title" :theme="globals.theme" />' }),
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { SidebarTitleSpecimen }, setup: () => ({ globals: context.globals }), template: '<SidebarTitleSpecimen :theme="globals.theme" />' }),
};
