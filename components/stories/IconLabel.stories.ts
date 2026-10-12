import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { nextTick, onMounted, ref, watch } from 'vue';
import IconLabel from '../src/components/icon-label/IconLabel.vue';
import IconLabelSpecimen from './IconLabelSpecimen.vue';
import Compare from './Compare.vue';

const meta = {
  title: 'Components/Icon Label',
  component: IconLabel,
  args: {
    label: 'index.ts',
    description: 'src/base/browser',
    suffix: 'modified',
    matches: [{ start: 0, end: 5 }],
    descriptionMatches: [],
    labelEscapeNewLines: false,
    bold: false,
    italic: false,
    strikethrough: false,
    disabledCommand: false,
    extraClasses: [],
    iconPath: { id: 'file-code' },
    hideIcon: false,
    title: 'Show in Explorer',
    supportHighlights: true,
    supportIcons: true,
    supportDescriptionHighlights: false,
  },
} satisfies Meta<typeof IconLabel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="icon-label" :theme="globals.theme" />' }),
};

export const Playground: Story = {
  render: args => ({ components: { IconLabel }, setup() {
    // `element` is what the component exposes; the instance type does not carry it.
    const label = ref<{ element?: HTMLElement }>();
    const readout = ref('');
    async function read() {
      await nextTick();
      const element = label.value?.element;
      if (!element) { readout.value = ''; return; }
      const description = element.querySelector<HTMLElement>('.label-description');
      const icon = element.querySelector<HTMLElement>('.monaco-icon-label-iconpath');
      const name = element.querySelector<HTMLElement>('.monaco-icon-name-container');
      readout.value = [
        `root: class="${element.className}" aria-label="${element.getAttribute('aria-label') ?? ''}"`,
        `containers: ${[...element.querySelector('.monaco-icon-label-container')!.children].map(child => child.className).join(' | ')}`,
        `name: ${name?.innerHTML.replaceAll('"', "'") ?? ''}`,
        `description: ${description ? `"${description.textContent}" opacity=${getComputedStyle(description).opacity} style="${description.getAttribute('style') ?? ''}"` : '(none)'}`,
        `icon: ${icon ? `${icon.className} · background-image=${getComputedStyle(icon).backgroundImage}` : '(none)'}`,
      ].join('\n');
    }
    watch(() => args, read, { deep: true, flush: 'post' });
    onMounted(read);
    return { args, label, readout };
  },
    template: `<div class="playground">
      <div class="customview-tree">
        <div class="monaco-list" style="position:relative;width:100%;height:22px;white-space:nowrap;overflow:hidden">
          <div class="monaco-list-row" style="position:relative;height:22px;line-height:22px;white-space:nowrap;overflow:hidden">
            <div class="custom-view-tree-node-item">
              <IconLabel ref="label" v-bind="args"
                :extra-classes="[...args.extraClasses, 'custom-view-tree-node-item-resourceLabel']" />
            </div>
          </div>
        </div>
      </div>
      <pre class="state-readout">{{ readout }}</pre>
      <p class="state-readout">hover：原版通过 managed hover 显示 title，DOM 上没有 title 属性；复刻同样不写 title，只保留 string title 对 aria-label 的影响。</p>
    </div>` }),
  parameters: { docs: { description: { story: [
    'IconLabel：一行资源标签的完整组合。`label` 是字符串（单个 `a.label-name`）或字符串数组（每段一个 `a.label-name`，段间 `span.label-separator`，默认 `/`，`separator` 可覆盖）。',
    '`supportHighlights` / `supportIcons` 决定名字走 `LabelWithHighlights`（`span.monaco-highlighted-label` + `span.highlight`，`$(iconId)` 渲染为 codicon），否则走 `Label`（纯文本，不做高亮也不解析图标）。`supportDescriptionHighlights` 同理作用于描述。',
    '`matches` 按“label 用 separator 拼接后的整串”给出，多段标签会自动切分到各段；`descriptionMatches` 作用于描述文本。`labelEscapeNewLines` 把 CR/LF 换成 `⏎` 并同步移动区间——只有高亮构建器和描述会转义，纯文本名字保持原样。',
    '`iconPath` 为 `{ id }` 时写入 `monaco-icon-label-iconpath` + codicon 类名，为 `{ uri }` 时写 `background-image`（不复位类名，与「先 ThemeIcon 后 URI」的原版行为一致）；不传则移除图标槽。',
    '`bold` / `italic` / `strikethrough` / `disabledCommand` / `extraClasses` 直接对应原版根节点与容器的类名；`hideIcon` 原版从未读取，因此不改变 DOM。',
  ].join('') } },
    source: { code: [
      '<IconLabel label="index.ts" description="src/base/browser" suffix="modified"',
      '  :matches="[{ start: 0, end: 5 }]" :icon-path="{ id: \'file-code\' }"',
      '  support-highlights support-icons title="Show in Explorer" />',
      '',
      '<!-- 多段标签：分隔符默认 `/`，domId 生成 `<id>_<index>` -->',
      '<IconLabel :label="[\'src\', \'components\', \'button.ts\']" separator="›" dom-id="explorer-item" />',
    ].join('\n') } },
};

export const Specimen: Story = { parameters: { controls: { disable: true },
  docs: { description: { story: '确定性验收画布：三种宿主上下文（列表行、`.customview-tree` 树行、`.pane-body .monaco-tl-contents` 过滤高亮上下文）、三种创建选项的全部组合、单段与多段标签（分隔符覆盖、`domId`、跨段 matches）、描述与描述高亮、换行转义、后缀、粗体/斜体/删除线、禁用命令、ThemeIcon 与 URI 两种图标槽、`extraClasses`，以及一行由测试驱动的时间线与一行已 `dispose()` 的标签。测试通过两页同名的 `window.iconLabelFixture` 触发更新与卸载并比较 `window.fixtureState`、DOM、计算样式与截图。' } } },
  render: (_, context) => ({ components: { IconLabelSpecimen }, setup: () => ({ globals: context.globals }), template: '<IconLabelSpecimen :theme="globals.theme" />' }),
};
