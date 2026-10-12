import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import Codicon from '../src/components/codicon/Codicon.vue';
import { codiconClassNames, getCodiconAriaLabel } from '../src/components/codicon/icons';
import CodiconSpecimen from './CodiconSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Codicon', component: Codicon,
  args: { name: 'sync', spin: true, disabled: false, label: 'Synchronizing', title: 'Synchronizing changes' },
} satisfies Meta<typeof Codicon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="codicon" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { Codicon },
    setup: () => ({ args, className: computed(() => codiconClassNames(args.name, args).join(' ')), ariaLabel: computed(() => getCodiconAriaLabel(args.label)) }),
    template: `<div class="playground"><div style="display:flex;align-items:center;gap:12px;height:22px"><Codicon v-bind="args" /><span>{{ args.label || args.title || 'decorative icon' }}</span></div>
      <p class="state-readout">class: {{ className }}<br>role: {{ args.label ? 'img' : '(none)' }} · aria-label: {{ args.label ? ariaLabel : '(aria-hidden="true")' }} · title: {{ args.title || '(none)' }}<br>loading / sync / gear spin without a modifier; the other icons need spin.</p></div>` }),
  parameters: { docs: { description: { story: 'Codicon id、spin、disabled 与无障碍名。图标本身不可交互，disabled 只加 codicon-modifier-disabled；旋转由 CSS 动画驱动，截图对照时统一关闭动画、改看计算样式。`$(iconId)` 文本用 splitLabelWithIcons 渲染，无障碍名用 getCodiconAriaLabel。' },
    source: { code: '<Codicon name="sync" spin label="Synchronizing" title="Synchronizing changes" />\n<Codicon name="loading" />\n<Codicon name="check" disabled />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { CodiconSpecimen }, setup: () => ({ globals: context.globals }), template: '<CodiconSpecimen :theme="globals.theme" />' }),
};
