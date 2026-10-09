import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import TreeView from '../src/components/tree/TreeView.vue';
import SpecimenView from './Specimen.vue';
import Compare from './Compare.vue';
import { treeNodes, expandedNodes } from './data';

const meta = {
  title: 'Components/Tree View', component: TreeView,
  args: { nodes: treeNodes, ariaLabel: 'Project files', multiple: true, expandOnLabel: false, height: 264 },
  argTypes: { nodes: { control: false } },
} satisfies Meta<typeof TreeView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="tree" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  tags: ['autodocs'],
  render: args => ({
    components: { TreeView },
    setup: () => ({ args, expanded: ref([...expandedNodes]), selected: ref<string[]>([]), focused: ref<string>(), action: ref('—') }),
    template: '<div class="playground"><div style="max-width:420px"><TreeView v-bind="args" v-model:expanded-ids="expanded" v-model:selected-ids="selected" @focus-change="focused = $event" @action="(item, node) => action = `${node.label}: ${item.label}`" /><div class="state-readout">Focus: {{ focused || "—" }}<br />Selection: {{ selected.join(", ") || "—" }}<br />Action: {{ action }}</div></div></div>',
  }),
  parameters: { docs: { description: { story: '同步、固定行高树。焦点和选择独立；节点支持 actions 操作栏和 decoration 状态标记，操作事件在下方显示。容器可调整宽度，滚动自动虚拟化。' }, source: { code: '<TreeView\n  :nodes="nodes"\n  v-model:expanded-ids="expanded"\n  v-model:selected-ids="selected"\n  @action="(action, node) => runAction(action.id, node.id)"\n  aria-label="Project files"\n/>' } } },
};
export const Specimen: StoryObj<typeof SpecimenView> = {
  args: { large: false },
  parameters: { controls: { disable: true } },
  render: (args, context) => ({ components: { SpecimenView }, setup: () => ({ args, globals: context.globals }), template: '<SpecimenView kind="tree" v-bind="args" :theme="globals.theme" />' }),
};
