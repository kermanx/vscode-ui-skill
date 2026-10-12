import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ButtonBar from '../src/components/button-bar/ButtonBar.vue';
import ButtonBarSpecimen from './ButtonBarSpecimen.vue';
import Compare from './Compare.vue';
import { buttonBarExamples } from './ButtonBarData';
const meta = { title: 'Components/Button Bar', component: ButtonBar,
  args: { items: buttonBarExamples[0].items, alignment: 'horizontal' },
  argTypes: { alignment: { control: 'select', options: ['horizontal', 'vertical'] } },
} satisfies Meta<typeof ButtonBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="button-bar" :theme="globals.theme" />' }),
};
export const Playground: Story = { render: args => ({ components: { ButtonBar }, setup: () => ({ args }),
  template: '<div class="playground"><ButtonBar v-bind="args" :style="{display:\'flex\',gap:\'8px\',flexDirection:args.alignment===\'vertical\'?\'column\':\'row\'}" /></div>' }),
  parameters: { docs: { description: { story: 'ButtonBar 组合现有 Button / DropdownButton，可在普通按钮下方显示 description（支持 $(icon)）。alignment 控制方向键：水平用 ← →，垂直用 ↑ ↓，首尾循环且不会跳过禁用按钮。布局由调用方 CSS 提供。click 返回 item id；action 返回 item id 和菜单 action id。' }, source: { code: '<ButtonBar :items="[{ id: \'save\', label: \'Save\' }, { id: \'cancel\', label: \'Cancel\', secondary: true }]" style="display:flex;gap:8px" @click="runAction" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { ButtonBarSpecimen }, setup: () => ({ globals: context.globals }), template: '<ButtonBarSpecimen :theme="globals.theme" />' }),
};
