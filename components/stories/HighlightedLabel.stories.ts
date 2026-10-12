import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, ref, watch } from 'vue';
import HighlightedLabel from '../src/components/highlighted-label/HighlightedLabel.vue';
import HighlightedLabelSpecimen from './HighlightedLabelSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Highlighted Label', component: HighlightedLabel,
  args: { text: 'Highlighted label', highlights: [{ start: 0, end: 11 }], title: '', escapeNewLines: false, supportIcons: false },
} satisfies Meta<typeof HighlightedLabel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="highlighted-label" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { HighlightedLabel },
    setup() {
      const text = ref(args.text);
      const highlights = ref(args.highlights?.map(highlight => ({ ...highlight })) ?? []);
      watch(() => args.text, value => { text.value = value; });
      watch(() => args.highlights, value => { highlights.value = value?.map(highlight => ({ ...highlight })) ?? []; }, { deep: true });
      // `escapeNewLines` rewrites the ranges; this replica works on a copy, so the props stay as typed.
      const rendered = computed(() => highlights.value.map(highlight => `${highlight.start}-${highlight.end}`).join(', '));
      const note = computed(() => `text: ${JSON.stringify(text.value)}`);
      return { args, text, highlights, rendered, note };
    },
    template: `<div class="playground">
      <div class="monaco-list" style="position:relative;width:100%;height:22px;white-space:nowrap;overflow:hidden">
        <div class="monaco-list-row" style="position:relative;height:22px;line-height:22px;white-space:nowrap;overflow:hidden">
          <HighlightedLabel v-bind="args" :highlights="highlights" />
        </div>
      </div>
      <p class="state-readout">{{ note }}<br>highlights: {{ rendered || '(none)' }}<br>host: .monaco-list .monaco-list-row → --vscode-list-highlightForeground</p>
    </div>` }),
  parameters: { docs: { description: { story: '`text` + `highlights` 的区间拼接、`end === start` 跳过、`extraClasses`、`escapeNewLines`（回车换行 → ⏎ 并位移区间）与 `supportIcons` 的 `$(iconId)`。组件本身没有 CSS：`.highlight` 的配色来自宿主上下文，列表行用 `--vscode-list-highlightForeground` / `--vscode-list-focusHighlightForeground`，`views.css` 的过滤匹配上下文用 `--vscode-list-filterMatchBackground` + `--vscode-list-filterMatchBorder`。hover 未接入 managed hover，因此不会出现原版的悬浮提示。' },
    source: { code: '<div class="monaco-list"><div class="monaco-list-row">\n  <HighlightedLabel text="Highlighted label" :highlights="[{ start: 0, end: 11 }]" />\n</div></div>' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { HighlightedLabelSpecimen }, setup: () => ({ globals: context.globals }), template: '<HighlightedLabelSpecimen :theme="globals.theme" />' }),
};
