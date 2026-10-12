<!-- Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. -->
<!--
  The children of `.monaco-icon-label` are built as plain vnodes in a render function instead of a
  template: the template compiler wraps `v-if`/`v-for` in fragments, and a fragment inserts its own
  anchor nodes. The original assembles this DOM with `dom.$`/`dom.append` calls, so the node list
  has to be exactly the same — a `null` inside a children array is turned into a comment node by
  Vue, so every optional node below is conditionally pushed instead.
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
import HighlightedLabel from '../highlighted-label/HighlightedLabel.vue';
import { asClassNameArray } from '../codicon/icons';
import {
  asCssUrl,
  equals,
  escapeNewLines,
  isThemeIcon,
  splitMatches,
  type IconPath,
  type Match,
} from './iconLabel';
export type { IconPath, Match, UriIconPath } from './iconLabel';

/**
 * A rich (markdown) tooltip, shaped like the original `IManagedHoverTooltipMarkdownString`. It is
 * accepted because callers pass decorations' markdown tooltips here; its only ported effect is on
 * the accessible name, see `title` below.
 */
export interface MarkdownTitle {
  readonly value: string;
}

/** The name node as `Label`/`LabelWithHighlights` last built it. */
interface NameEntry {
  readonly text: string;
  readonly matches: readonly Match[];
  readonly id: string | undefined;
}

interface NameState {
  readonly multiple: boolean;
  /** Bumped whenever the builder ran; the anchors of a multi-part label are keyed with it. */
  readonly revision: number;
  readonly entries: readonly NameEntry[];
}

interface DescriptionState {
  readonly text: string;
  readonly matches: readonly Match[];
  readonly escapeNewLines: boolean;
  readonly supportIcons: boolean;
  /** `FastLabelNode.empty`: a plain description node with no text gets `margin-left: 0`. */
  readonly empty: boolean;
}

interface SuffixState {
  readonly text: string;
}

interface IconState {
  /** The class list of the leading slot; a URI keeps the classes of the ThemeIcon before it. */
  readonly classNames: readonly string[];
  readonly url: string;
}

interface Model {
  readonly rootClasses: readonly string[];
  readonly containerClasses: readonly string[];
  readonly ariaLabel: string;
  readonly icon: IconState | undefined;
  readonly name: NameState;
  readonly description: DescriptionState | undefined;
  readonly suffix: SuffixState | undefined;
}

export default defineComponent({
  name: 'IconLabel',
  props: {
    /** Plain label, or the parts of a multi-part label (`a.label-name` per part). */
    label: {
      type: [String, Array] as PropType<string | readonly string[]>,
      required: true,
    },
    /** Secondary text after the label, rendered at 0.9em and 0.7 opacity. */
    description: { type: String, default: undefined },
    /** Muted text between the name and the description containers. */
    suffix: { type: String, default: undefined },
    /** Ranges of `label` to wrap in `span.highlight`; needs `supportHighlights` or `supportIcons`. */
    matches: { type: Array as PropType<readonly Match[]>, default: undefined },
    /** Ranges of `description` to wrap in `span.highlight`; needs `supportDescriptionHighlights`. */
    descriptionMatches: {
      type: Array as PropType<readonly Match[]>,
      default: undefined,
    },
    /** Replaces CR/LF with `⏎`. Only the highlighted builders and the description escape. */
    labelEscapeNewLines: { type: Boolean, default: false },
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    strikethrough: { type: Boolean, default: false },
    /** Adds `disabled` to the label container, which then uses `--vscode-disabledForeground`. */
    disabledCommand: { type: Boolean, default: false },
    /** Extra classes of the root, e.g. the tree row's `custom-view-tree-node-item-resourceLabel`. */
    extraClasses: {
      type: Array as PropType<readonly string[]>,
      default: undefined,
    },
    /**
     * Leading icon: `{ id }` renders a codicon in the `monaco-icon-label-iconpath` slot, `{ uri }`
     * sets that slot's `background-image`. Unset removes the slot again.
     */
    iconPath: { type: Object as PropType<IconPath>, default: undefined },
    /**
     * Accepted for call-site compatibility. The pinned `IconLabel` never reads `hideIcon` — hiding
     * the icon is the caller's job — so the prop has no effect on the DOM, exactly like upstream.
     */
    hideIcon: { type: Boolean, default: false },
    /** Separator between the parts of a multi-part label; the original's default is `/`. */
    separator: { type: String, default: undefined },
    /** `id` of the single label name, or the prefix of `<id>_<index>` for a multi-part label. */
    domId: { type: String, default: undefined },
    /**
     * Tooltip text. A string is also the accessible name (`aria-label`); a `{ value }` markdown
     * tooltip leaves the accessible name at the label. No tooltip is installed: the original uses a
     * managed hover, so neither page puts a `title` attribute on the DOM.
     */
    title: {
      type: [String, Object] as PropType<string | MarkdownTitle>,
      default: undefined,
    },
    /** Creation option: build the name through `HighlightedLabel` (`span.highlight`, icons). */
    supportHighlights: { type: Boolean, default: false },
    /** Creation option: render `$(iconId)` markers in the name, and choose the highlighted builder. */
    supportIcons: { type: Boolean, default: false },
    /** Creation option: build the description through `HighlightedLabel`. */
    supportDescriptionHighlights: { type: Boolean, default: false },
  },
  setup(props, { expose }) {
    const root = ref<HTMLElement>();
    const model = shallowRef<Model>();

    /** `Label#label` / `Label#options`: the values the name builder last ran with. */
    let appliedLabel: string | readonly string[] | undefined;
    let appliedOptions: Record<string, unknown> | undefined;
    /** The creation options that pick the name builder; upstream fixes them at construction. */
    let appliedBuilder: string | undefined;

    /**
     * The options the builders compare: everything `setLabel()` was called with except the label
     * itself, which upstream tests with `===` (so a fresh array of equal parts still rebuilds).
     */
    const optionsSnapshot = (): Record<string, unknown> => ({
      title: props.title,
      suffix: props.suffix,
      hideIcon: props.hideIcon,
      extraClasses: props.extraClasses,
      bold: props.bold,
      italic: props.italic,
      strikethrough: props.strikethrough,
      matches: props.matches,
      labelEscapeNewLines: props.labelEscapeNewLines,
      descriptionMatches: props.descriptionMatches,
      disabledCommand: props.disabledCommand,
      separator: props.separator,
      domId: props.domId,
      iconPath: props.iconPath,
      supportIcons: props.supportIcons,
    });

    /** The accessible name is `'' + label`, so a multi-part label joins with commas. */
    const labelText = (label: string | readonly string[]): string =>
      typeof label === 'string' ? label : Array.from(label).join(',');

    /** `LabelWithHighlights` is chosen when highlights or icons are supported, `Label` otherwise. */
    const highlightedName = (): boolean =>
      props.supportHighlights || props.supportIcons;

    function buildName(
      label: string | readonly string[],
      previous: NameState | undefined,
    ): NameState {
      const revision = (previous?.revision ?? 0) + 1;
      if (typeof label === 'string') {
        return {
          multiple: false,
          revision,
          entries: [
            { text: label, matches: props.matches ?? [], id: props.domId },
          ],
        };
      }
      const separator = props.separator || '/';
      const matches = splitMatches(label, separator, props.matches);
      return {
        multiple: true,
        revision,
        entries: label.map((text, index) => ({
          text,
          matches: matches?.[index] ?? [],
          id: props.domId ? `${props.domId}_${index}` : props.domId,
        })),
      };
    }

    /**
     * `Label#setLabel` / `LabelWithHighlights#setLabel`: an identical label and equal options leave
     * the name node alone. `label` is compared with `===`; the options deeply, key-order free.
     */
    function nextName(previous: NameState | undefined): NameState {
      const label = props.label;
      const options = optionsSnapshot();
      const builder = highlightedName() ? 'highlights' : 'plain';
      if (
        previous &&
        appliedLabel === label &&
        appliedBuilder === builder &&
        equals(appliedOptions, options)
      ) {
        return previous;
      }
      appliedLabel = label;
      appliedOptions = options;
      appliedBuilder = builder;
      return buildName(label, previous);
    }

    /** The leading slot: a ThemeIcon rewrites the class list, a URI only the background image. */
    function nextIcon(previous: IconState | undefined): IconState | undefined {
      const iconPath = props.iconPath;
      if (!iconPath) {
        return undefined;
      }
      if (isThemeIcon(iconPath)) {
        return {
          classNames: [
            'monaco-icon-label-iconpath',
            ...asClassNameArray(iconPath),
          ],
          url: '',
        };
      }
      // The original only rewrites `className` for a ThemeIcon, so a URI keeps the codicon classes
      // of a ThemeIcon this label showed before.
      return {
        classNames: previous?.classNames ?? ['monaco-icon-label-iconpath'],
        url: asCssUrl(iconPath.uri),
      };
    }

    /** The description node is created once — a later `setLabel` without a description keeps it. */
    function nextDescription(
      previous: DescriptionState | undefined,
    ): DescriptionState | undefined {
      const description = props.description;
      if (!description && !previous) {
        return undefined;
      }
      return {
        text:
          !props.supportDescriptionHighlights &&
          description &&
          props.labelEscapeNewLines
            ? escapeNewLines(description)
            : (description ?? ''),
        matches: props.descriptionMatches ?? [],
        escapeNewLines: props.labelEscapeNewLines,
        supportIcons: props.supportIcons,
        empty: !description,
      };
    }

    /** Same for the suffix container, which `dom.after` puts right behind the name container. */
    function nextSuffix(
      previous: SuffixState | undefined,
    ): SuffixState | undefined {
      const suffix = props.suffix;
      if (!suffix && !previous) {
        return undefined;
      }
      return { text: suffix ?? '' };
    }

    /** `IconLabel#setLabel` except for the parts that need a hover service. */
    function setLabel(): void {
      const previous = model.value;
      const rootClasses = ['monaco-icon-label'];
      const containerClasses = ['monaco-icon-label-container'];
      let ariaLabel = '';

      if (props.extraClasses) {
        rootClasses.push(...props.extraClasses);
      }
      if (props.bold) {
        rootClasses.push('bold');
      }
      if (props.italic) {
        rootClasses.push('italic');
      }
      if (props.strikethrough) {
        rootClasses.push('strikethrough');
      }
      if (props.disabledCommand) {
        containerClasses.push('disabled');
      }
      if (props.title) {
        ariaLabel +=
          typeof props.title === 'string'
            ? props.title
            : labelText(props.label);
      }

      model.value = {
        rootClasses,
        containerClasses,
        ariaLabel,
        icon: nextIcon(previous?.icon),
        name: nextName(previous?.name),
        description: nextDescription(previous?.description),
        suffix: nextSuffix(previous?.suffix),
      };
    }

    /**
     * The name container: one `a.label-name` for a string label, one per part plus separators for an
     * array. `Label` appends the separators as siblings; `LabelWithHighlights` wraps each part in a
     * `HighlightedLabel` and appends the separator *inside* the anchor behind it.
     */
    function nameChildren(name: NameState): VNode[] {
      const highlighted = highlightedName();
      if (!name.multiple) {
        const entry = name.entries[0];
        return [
          h(
            'a',
            { class: 'label-name', id: entry.id, key: 'single' },
            highlighted
              ? [
                  h(HighlightedLabel, {
                    text: entry.text,
                    highlights: entry.matches,
                    escapeNewLines: props.labelEscapeNewLines,
                    supportIcons: props.supportIcons,
                  }),
                ]
              : entry.text,
          ),
        ];
      }
      const separator = props.separator || '/';
      const children: VNode[] = [];
      for (const [index, entry] of name.entries.entries()) {
        const last = index === name.entries.length - 1;
        const highlightedLabel = h(HighlightedLabel, {
          text: entry.text,
          highlights: entry.matches,
          escapeNewLines: props.labelEscapeNewLines,
          supportIcons: props.supportIcons,
        });
        const separatorNode = h(
          'span',
          { class: 'label-separator' },
          separator,
        );
        children.push(
          h(
            'a',
            {
              class: 'label-name',
              id: entry.id,
              'data-icon-label-count': name.entries.length,
              'data-icon-label-index': index,
              role: 'treeitem',
              // Every effective `setLabel` rebuilds the anchors upstream (`container.textContent = ''`).
              key: `${name.revision}:${index}`,
            },
            highlighted
              ? last
                ? [highlightedLabel]
                : [highlightedLabel, separatorNode]
              : entry.text,
          ),
        );
        if (!highlighted && !last) {
          children.push(separatorNode);
        }
      }
      return children;
    }

    /** The description: a highlighted builder, or a plain text node that keeps `margin-left: 0`. */
    function descriptionChildren(description: DescriptionState): VNode[] {
      if (props.supportDescriptionHighlights) {
        return [
          h('span', { class: 'label-description' }, [
            h(HighlightedLabel, {
              text: description.text,
              highlights: description.matches,
              escapeNewLines: description.escapeNewLines,
              supportIcons: description.supportIcons,
            }),
          ]),
        ];
      }
      // `FastLabelNode.empty` always writes `margin-left`: `''` for a description that has text,
      // `'0'` for an empty one. Writing `''` after `'0'` leaves the (empty) style attribute in place,
      // so the style object is never dropped.
      return [
        h(
          'span',
          {
            class: 'label-description',
            style: { marginLeft: description.empty ? '0' : '' },
          },
          description.text,
        ),
      ];
    }

    watch(
      () => [
        props.label,
        props.description,
        props.suffix,
        props.matches,
        props.descriptionMatches,
        props.labelEscapeNewLines,
        props.bold,
        props.italic,
        props.strikethrough,
        props.disabledCommand,
        props.extraClasses,
        props.iconPath,
        props.hideIcon,
        props.separator,
        props.domId,
        props.title,
        props.supportHighlights,
        props.supportIcons,
        props.supportDescriptionHighlights,
      ],
      setLabel,
      { immediate: true },
    );

    /** Original `get element`. */
    expose({ element: root });

    return () => {
      const current = model.value!;
      const children: VNode[] = [];
      if (current.icon) {
        // The original prepends this node, so it always comes before the label container.
        children.push(
          h('div', {
            class: [...current.icon.classNames],
            style: {
              backgroundImage: current.icon.url,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'contain',
            },
            key: 'iconpath',
          }),
        );
      }
      const containerChildren: VNode[] = [
        h(
          'span',
          {
            class: [
              'monaco-icon-name-container',
              current.name.multiple ? 'multiple' : undefined,
            ],
            key: 'name',
          },
          nameChildren(current.name),
        ),
      ];
      if (current.suffix) {
        containerChildren.push(
          h('span', { class: 'monaco-icon-suffix-container', key: 'suffix' }, [
            h('span', { class: 'label-suffix' }, current.suffix.text),
          ]),
        );
      }
      if (current.description) {
        containerChildren.push(
          h(
            'span',
            { class: 'monaco-icon-description-container', key: 'description' },
            descriptionChildren(current.description),
          ),
        );
      }
      children.push(
        h(
          'div',
          { class: [...current.containerClasses], key: 'container' },
          containerChildren,
        ),
      );
      return h(
        'div',
        {
          ref: root,
          class: [...current.rootClasses],
          'aria-label': current.ariaLabel,
        },
        children,
      );
    };
  },
});
</script>
<style src="./iconlabel.css" />
<style src="./iconLabelTheme.css" />
