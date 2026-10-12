import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onMounted, ref, watch } from 'vue';
import CountBadge from '../src/components/count-badge/CountBadge.vue';
import CountBadgeSpecimen from './CountBadgeSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Count Badge', component: CountBadge,
  args: { count: 12, countFormat: '{0}', titleFormat: '', variant: 'count' },
} satisfies Meta<typeof CountBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="count-badge" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { CountBadge }, setup() {
    // Read the exposed hover content back, so the readout shows what a hover service would get.
    const element = ref<{ hoverContent?: string | null }>(), hover = ref<string | null>(null);
    const read = () => { hover.value = element.value?.hoverContent ?? null; };
    watch(() => [args.count, args.countFormat, args.titleFormat, args.variant], read, { flush: 'post' });
    onMounted(read);
    return { args, element, hover };
  },
    template: `<div class="playground"><div style="display:flex;align-items:center;min-height:22px"><CountBadge ref="element" v-bind="args" /></div><p class="state-readout">hover: {{ hover ?? '(no hover)' }}<br />count: {{ args.count }} · countFormat: {{ args.countFormat }} · titleFormat: {{ args.titleFormat || '(none)' }} · variant: {{ args.variant }}</p></div>` }),
  parameters: { docs: { description: { story: 'CountBadge 显示数量或短文本：`countFormat` 与 `count` 决定文本（`{0}` 替换为数量，缺少对应参数的占位符保留原样），`variant="text"` 使用原版由调用方添加的 `.long` 形态（方角、更小内边距、无最小高度）。空 `titleFormat` 表示没有悬停；原版通过 base layer 的延迟 hover 服务显示 `format(titleFormat, count)`，复刻未接入该服务，因此组件不写原生 `title` 属性，只把同一段内容暴露给宿主 hover 服务（readout 中的 hover 值）。' }, source: { code: '<CountBadge :count="12" count-format="{0} Results" title-format="{0} results" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true },
  docs: { description: { story: '确定性验收画布：计数 0/1/5/12/99/999/9999、带文本与越界占位符的 countFormat、非空 titleFormat、`.long` 文本徽标、节标题与行内标签组合，以及两行由测试驱动的行。测试通过两页同名的 `window.countBadgeFixture.apply(step)` / `.dispose()` 触发更新与卸载（原版调用真实的 setCount / setCountFormat / setTitleFormat / dispose），并比较 `window.fixtureState`、DOM、计算样式与截图。复刻未接入 hover 服务，因此悬停不显示浮层，原版页在对照 harness 中同样没有 hover 服务。' } } },
  render: (_, context) => ({ components: { CountBadgeSpecimen }, setup: () => ({ globals: context.globals }), template: '<CountBadgeSpecimen :theme="globals.theme" />' }),
};
