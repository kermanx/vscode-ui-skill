import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { nextTick, onMounted, ref, watch } from 'vue';
import LoadingIndicator from '../src/components/loading-indicator/LoadingIndicator.vue';
import LoadingIndicatorSpecimen from './LoadingIndicatorSpecimen.vue';
import Compare from './Compare.vue';

const meta = {
  title: 'Components/Loading Indicator',
  component: LoadingIndicator,
  args: { variant: 'grid', ariaLabel: 'Loading extensions' },
} satisfies Meta<typeof LoadingIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="loading-indicator" :theme="globals.theme" />' }),
};

export const Playground: Story = {
  render: args => ({ components: { LoadingIndicator }, setup() {
    const spinner = ref<InstanceType<typeof LoadingIndicator>>();
    const variant = ref(args.variant), ariaLabel = ref(args.ariaLabel);
    watch(() => args.variant, value => { variant.value = value; });
    watch(() => args.ariaLabel, value => { ariaLabel.value = value; });
    const readout = ref('');
    async function read() {
      await nextTick();
      const element = spinner.value?.element;
      if (!element) { readout.value = ''; return; }
      const style = getComputedStyle(element);
      const dots = [...element.querySelectorAll<HTMLElement>('.monaco-pixel-spinner-dot')];
      readout.value = [
        `class="${element.className}"`,
        `aria: role=${element.getAttribute('role') ?? '—'} label=${element.getAttribute('aria-label') ?? '—'} hidden=${element.getAttribute('aria-hidden') ?? '—'}`,
        `box: ${style.width}×${style.height} · grid ${style.gridTemplateColumns} / ${style.gridTemplateRows} · gap ${style.columnGap}`,
        `dots: ${dots.length} · first opacity=${dots[0] ? getComputedStyle(dots[0]).opacity : '—'} animation=${dots[0] ? getComputedStyle(dots[0]).animationName : '—'}`,
      ].join('\n');
    }
    onMounted(read);
    const action = async (run: () => void) => { run(); await read(); };
    return { args, spinner, variant, ariaLabel, readout, read,
      setGrid: () => action(() => { variant.value = 'grid'; }),
      setRing: () => action(() => { variant.value = 'ring'; }),
      name: () => action(() => { ariaLabel.value = 'Loading extensions'; }),
      clearName: () => action(() => { ariaLabel.value = ''; }),
    };
  },
    template: `<div class="playground">
      <div style="display:flex;gap:32px;align-items:center;color:#cccccc">
        <LoadingIndicator ref="spinner" :variant="variant" :aria-label="ariaLabel" />
        <span style="color:#3794ff"><LoadingIndicator :variant="variant" :aria-label="ariaLabel" /></span>
        <span style="color:#f48771"><LoadingIndicator :variant="variant" :aria-label="ariaLabel" /></span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:24px">
        <button class="gallery-action" @click="setGrid">variant: grid</button>
        <button class="gallery-action" @click="setRing">variant: ring</button>
        <button class="gallery-action" @click="name">aria-label set</button>
        <button class="gallery-action" @click="clearName">aria-label blank</button>
      </div>
      <pre class="state-readout">{{ readout }}</pre>
    </div>`,
  }),
  parameters: { docs: { description: { story: [
    'LoadingIndicator：16×16 的像素点 spinner，`variant` 选择 `grid`（2×3 级联，1820ms）或 `ring`（环形高亮，1200ms）；',
    '`ariaLabel` 非空时输出 `role="status"` + `aria-label`，为空（含纯空白）时改为 `aria-hidden="true"` 的纯装饰。',
    '颜色由 `currentColor` 驱动：外层 `color` 或按钮前景色都会直接决定点的颜色，组件不读取任何主题变量。',
    '点滚出视口或页面被隐藏时，`IntersectionObserver` 会加 `monaco-pixel-spinner-paused` 暂停动画，回到视口时把动画 `startTime` 归零重新同步相位。',
    '`codicon-loading` 图标旋转属于 Codicon 组件，这里不重复实现。',
  ].join('') } },
    source: { code: [
      '<LoadingIndicator variant="grid" aria-label="Loading extensions" />',
      '<LoadingIndicator variant="ring" />   <!-- 装饰性：aria-hidden="true" -->',
      '',
      '<!-- 颜色跟随上下文：按钮里的前导槽位（buttonbar.ts 的 showSpinner） -->',
      '<button class="monaco-button monaco-text-button">',
      '  <LoadingIndicator /> <span class="monaco-button-label">Installing</span>',
      '</button>',
    ].join('\n') } },
};

export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { LoadingIndicatorSpecimen }, setup: () => ({ globals: context.globals }), template: '<LoadingIndicatorSpecimen :theme="globals.theme" />' }),
};
