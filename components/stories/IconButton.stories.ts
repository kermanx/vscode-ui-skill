import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconButton from '../src/components/icon-button/IconButton.vue';
import IconButtonSpecimen from './IconButtonSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Icon Button', component: IconButton,
  args: { icon: 'pin', label: 'Pin', disabled: false, checked: false },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="icon-button" :theme="globals.theme" />' }),
};
export const Playground: Story = { render: args => ({ components: { IconButton }, setup: () => ({ args }), template: '<div class="playground"><div style="display:flex;height:22px"><IconButton v-bind="args" /></div></div>' }),
  parameters: { docs: { description: { story: '由单个 icon-only ActionBar action 组合的独立图标按钮，保持原版 ActionViewItem DOM 和事件。Enter / Space 在 keyup 激活，鼠标按下保持已有焦点；禁用项仍可 Tab 聚焦。checked 是受控的 pressed 外观，不会自动切换；tooltip 默认使用 label，可视 hover 服务尚未接入。' }, source: { code: '<IconButton icon="pin" label="Pin" :checked="pinned" @click="pinned = !pinned" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { IconButtonSpecimen }, setup: () => ({ globals: context.globals }), template: '<IconButtonSpecimen :theme="globals.theme" />' }),
};
