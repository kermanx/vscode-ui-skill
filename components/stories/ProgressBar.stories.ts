import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { nextTick, onMounted, ref, watch } from 'vue';
import ProgressBar from '../src/components/progress-bar/ProgressBar.vue';
import ProgressBarSpecimen from './ProgressBarSpecimen.vue';
import Compare from './Compare.vue';

const meta = {
  title: 'Components/Progress Bar',
  component: ProgressBar,
  args: { total: 100, worked: 30, infinite: false, visible: true, showDelay: undefined, ariaLabel: 'Loading workspace' },
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="progress-bar" :theme="globals.theme" />' }),
};

export const Playground: Story = {
  render: args => ({ components: { ProgressBar }, setup() {
    const bar = ref<InstanceType<typeof ProgressBar>>();
    const total = ref(args.total), worked = ref(args.worked), infinite = ref(args.infinite), visible = ref(args.visible), showDelay = ref(args.showDelay);
    watch(() => args.total, value => { total.value = value; });
    watch(() => args.worked, value => { worked.value = value; });
    watch(() => args.infinite, value => { infinite.value = value; });
    watch(() => args.visible, value => { visible.value = value; });
    watch(() => args.showDelay, value => { showDelay.value = value; });
    const readout = ref('');
    async function read() {
      await nextTick();
      const element = bar.value?.getContainer();
      const bit = element?.querySelector<HTMLElement>('.progress-bit');
      if (!element || !bit) { readout.value = ''; return; }
      readout.value = [
        `class="${element.className}"`,
        `aria: min=${element.getAttribute('aria-valuemin')} max=${element.getAttribute('aria-valuemax') ?? '—'} now=${element.getAttribute('aria-valuenow') ?? '—'} label="${element.getAttribute('aria-label')}"`,
        `display=${element.style.display || '(visible)'} aria-hidden=${element.getAttribute('aria-hidden') ?? '—'}`,
        `bit: width=${bit.style.width} opacity=${bit.style.opacity || '1'} animation=${getComputedStyle(bit).animationName}`,
        `hasTotal=${bar.value?.hasTotal()}`,
      ].join('\n');
    }
    onMounted(read);
    const action = async (run: () => void) => { run(); await read(); };
    return { args, bar, total, worked, infinite, visible, showDelay, readout, read,
      advance: () => action(() => { worked.value = Math.min(total.value ?? 100, (worked.value ?? 0) + 10); }),
      grow: () => action(() => { total.value = (total.value ?? 0) + 100; }),
      toggleInfinite: () => action(() => { infinite.value = !infinite.value; }),
      hide: () => action(() => { visible.value = false; }),
      show: () => action(() => { visible.value = true; showDelay.value = 500; }),
      done: () => action(() => { bar.value?.done(); }),
      stop: () => action(() => { bar.value?.stop(); }),
      reset: () => action(() => { total.value = 100; worked.value = 0; infinite.value = false; visible.value = true; showDelay.value = undefined;
        bar.value?.total(100); bar.value?.setWorked(0); bar.value?.hide(); bar.value?.show(); }),
    };
  },
    template: `<div class="playground">
      <div style="width:320px"><ProgressBar ref="bar" v-bind="args" :total="total" :worked="worked" :infinite="infinite" :visible="visible" :show-delay="showDelay" /></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:24px">
        <button class="gallery-action" @click="advance">worked +10</button>
        <button class="gallery-action" @click="grow">total +100</button>
        <button class="gallery-action" @click="toggleInfinite">toggle infinite</button>
        <button class="gallery-action" @click="hide">hide()</button>
        <button class="gallery-action" @click="show">show(500)</button>
        <button class="gallery-action" @click="done">done()</button>
        <button class="gallery-action" @click="stop">stop()</button>
        <button class="gallery-action" @click="reset">reset</button>
      </div>
      <pre class="state-readout">{{ readout }}</pre>
    </div>`,
  }),
  parameters: { docs: { description: { story: [
    'ProgressBar：2px 高的离散 / 无限进度条，`total`、`worked`、`infinite`、`visible`、`showDelay`、`ariaLabel` 为声明式参数，',
    '`show/hide/infinite/total/worked/setWorked/done/stop/hasTotal/getContainer` 通过组件 ref 暴露，与原版方法同义。',
    '`worked` 属性是绝对值（等价 `setWorked`），累加请调用暴露的 `worked()`；`done()` 延迟 200ms 清理，`stop()` 立即清理。',
    '原版 `show()` 中的无障碍进度信号（accessibilitySignalService）未接入：没有该服务时上游工厂本身就是空对象，因此这里不播放任何信号。',
    '配色使用 `progressBar.background` 主题变量。',
  ].join('') } },
    source: { code: [
      '<ProgressBar :total="total" :worked="worked" :aria-label="\'Loading workspace\'" />',
      '',
      '// 命令式：ref 暴露与原版一致的方法',
      'const bar = ref<InstanceType<typeof ProgressBar>>();',
      'bar.value?.show(500);   // 500ms 后显示，期间 hide() 会取消',
      'bar.value?.worked(10);  // 累加，内部 Math.max(1, Number(value))',
      'bar.value?.done();      // 离散：宽度补满后 200ms 清理；无限：淡出后 200ms 清理',
    ].join('\n') } },
};

export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { ProgressBarSpecimen }, setup: () => ({ globals: context.globals }), template: '<ProgressBarSpecimen :theme="globals.theme" />' }),
};
