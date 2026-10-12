<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<!--
  The root element's children are built as plain vnodes instead of a template `v-for`: the template
  compiler wraps a `v-for` plus interpolation in fragments, and a fragment inserts its own anchor
  text nodes into the element. `HighlightedLabel` replaces the child nodes of
  `span.monaco-highlighted-label` (`dom.reset`), so its node list must contain nothing else.
-->
<script lang="ts">
import {
  defineComponent,
  h,
  ref,
  shallowRef,
  watch,
  type PropType,
  type VNode,
} from 'vue';
import { asClassNameArray, splitLabelWithIcons } from '../codicon/icons';
import { equalsHighlights } from './highlightedLabel';

/** One range to highlight, using the original `IHighlight` field names. */
export interface Highlight {
  start: number;
  end: number;
  extraClasses?: readonly string[];
}

/** `HighlightedLabel.escapeNewLines`: `\r\n|\r|\n` becomes `⏎`, highlights shift with the text. */
function escapeNewLines(
  text: string,
  highlights: readonly Highlight[],
): { text: string; highlights: Highlight[] } {
  const result = highlights.map((highlight) => ({ ...highlight }));
  let total = 0;
  let extra = 0;
  const escaped = text.replace(/\r\n|\r|\n/g, (match, offset: number) => {
    extra = match === '\r\n' ? -1 : 0;
    offset += total;
    for (const highlight of result) {
      if (highlight.end <= offset) {
        continue;
      }
      if (highlight.start >= offset) {
        highlight.start += extra;
      }
      if (highlight.end >= offset) {
        highlight.end += extra;
      }
    }
    total += extra;
    return '\u23CE';
  });
  return { text: escaped, highlights: result };
}

/** One rendered child, in original DOM order: a text node, a codicon, or a `span.highlight`. */
export interface HighlightedLabelPart {
  render(): VNode | string;
}

/**
 * Children of one substring, the way `renderLabelWithIcons(text, true)` builds them:
 * `ThemeIcon.asClassNameArray` splits a `~modifier` into `codicon-modifier-<modifier>`, and the
 * label always asks for `renderIconsInDefaultColor`, so every icon carries `codicon-colored`.
 */
function asParts(text: string, supportIcons: boolean): HighlightedLabelPart[] {
  if (!supportIcons) {
    return [{ render: () => text }];
  }
  return splitLabelWithIcons(text).map((part) =>
    'icon' in part
      ? {
          render: () =>
            h('span', {
              class: [
                ...asClassNameArray({ id: part.icon }),
                'codicon-colored',
              ].join(' '),
            }),
        }
      : { render: () => part.text },
  );
}

export default defineComponent({
  name: 'HighlightedLabel',
  props: {
    /** Label to display. `undefined` renders an empty label, like the original `set()`. */
    text: { type: String, default: '' },
    /** Ranges of `text` to wrap in `span.highlight`. `end === start` ranges are skipped. */
    highlights: {
      type: Array as PropType<readonly Highlight[]>,
      default: () => [],
    },
    /** Hover text. The original hands this to a managed hover; see the story notes. */
    title: { type: String, default: '' },
    /** Replaces CR/LF with `⏎` and shifts the highlights, the way callers of `set()` request it. */
    escapeNewLines: { type: Boolean, default: false },
    /** Renders `$(iconId)` markers as codicons. */
    supportIcons: { type: Boolean, default: false },
  },
  setup(props, { expose }) {
    const renderedText = ref('');
    /** Mirrors what the original stored in `this.highlights`, including the escaped ranges. */
    const renderedHighlights = ref<readonly Highlight[]>([]);
    const renderedTitle = ref('');
    const parts = shallowRef<readonly HighlightedLabelPart[]>([]);
    /** Bumped only by `render()`, so Vue never patches DOM the original would have short-circuited. */
    const revision = ref(0);
    const root = ref<HTMLElement>();

    /**
     * `HighlightedLabel.render()`: plain/marked substrings interleaved with `span.highlight` runs.
     * Every child is a plain vnode or string, exactly the node sequence `dom.reset()` creates.
     */
    function render(): void {
      const children: HighlightedLabelPart[] = [];
      const text = renderedText.value;
      let pos = 0;
      for (const highlight of renderedHighlights.value) {
        if (highlight.end === highlight.start) {
          continue;
        }
        if (pos < highlight.start) {
          children.push(
            ...asParts(
              text.substring(pos, highlight.start),
              props.supportIcons,
            ),
          );
          pos = highlight.start;
        }
        const substring = text.substring(pos, highlight.end);
        // `dom.$('span.highlight', undefined, ...renderLabelWithIcons(substring, true))`.
        children.push({
          render: () =>
            h(
              'span',
              { class: ['highlight', highlight.extraClasses] },
              props.supportIcons
                ? asParts(substring, true).map((part) => part.render())
                : substring,
            ),
        });
        pos = highlight.end;
      }
      if (pos < text.length) {
        children.push(...asParts(text.substring(pos), props.supportIcons));
      }
      parts.value = children;
      revision.value++;
    }

    /**
     * `HighlightedLabel.set()`: escape new lines, then skip the render when nothing changed.
     * The original compares `objects.equals(this.highlights, highlights)`; the props reference is
     * compared as well because callers may reuse or mutate the array instead of passing a new one.
     */
    function set(highlights: readonly Highlight[], escape: boolean): void {
      let text = props.text || '';
      let working: readonly Highlight[] = highlights;
      if (escape) {
        const escaped = escapeNewLines(text, highlights);
        text = escaped.text;
        working = escaped.highlights;
      }
      if (
        revision.value > 0 &&
        renderedText.value === text &&
        renderedTitle.value === props.title &&
        equalsHighlights(renderedHighlights.value, working) &&
        equalsHighlights(renderedHighlights.value, highlights)
      ) {
        return;
      }
      renderedText.value = text;
      renderedHighlights.value = working;
      renderedTitle.value = props.title;
      render();
    }

    watch(
      [
        () => props.text,
        () => props.highlights,
        () => props.title,
        () => props.escapeNewLines,
        () => props.supportIcons,
      ],
      () => set(props.highlights ?? [], props.escapeNewLines),
      { immediate: true },
    );

    /** Original `get element()`, the ranges it last rendered, and the render count the fixture records. */
    expose({
      element: root,
      highlights: renderedHighlights,
      renderCount: revision,
    });

    return () =>
      h(
        'span',
        {
          ref: root,
          class: 'monaco-highlighted-label',
          // `title` is applied only when the caller sets one; the original installs a managed hover.
          title: renderedTitle.value || undefined,
        },
        parts.value.map((part) => part.render()),
      );
  },
});
</script>
<style src="./highlightedLabel.css" />
<!-- `$(iconId)` markers render as `codicon-colored` icons; the workbench colours those globally
     from symbolIcons.css, so this component loads the same file instead of copying the rules. -->
<style src="../codicon/symbolIcons.css" />
