/** Highlighted label samples shared by the original fixture and the Vue specimen. */

/** One range to highlight, mirroring the original `IHighlight`. */
export interface Highlight {
  start: number;
  end: number;
  extraClasses?: readonly string[];
}

/** One `set()` call, mirroring `HighlightedLabel.set`. */
export interface HighlightInput {
  text?: string;
  highlights?: readonly Highlight[];
  title?: string;
  escapeNewLines?: boolean;
  supportIcons?: boolean;
}

/** Everything the fixture and the specimen observe about one `set()` call. */
export interface LabelSnapshot {
  set: number;
  text: string;
  /** Full outerHTML of the label element, so nested codicons stay comparable. */
  html: string;
  /** One entry per direct child node: text, `span.highlight` or codicon. */
  nodes: string;
  classes: string;
  /** The caller's array after `set()`; the original rewrites it in place when escaping. */
  propsHighlights: string;
  /** The ranges the label actually rendered. */
  highlights: string;
  /** Whether this `set()` replaced the rendered child nodes. */
  newNode: boolean;
  renderCount: number;
}

/** `HighlightedLabel.escapeNewLines`: `\r\n|\r|\n` becomes `⏎`, highlights shift with the text. */
export function escapeNewLines(text: string, highlights: readonly Highlight[]): string {
  let total = 0;
  let extra = 0;
  return text.replace(/\r\n|\r|\n/g, (match, offset: number) => {
    extra = match === '\r\n' ? -1 : 0;
    offset += total;
    for (const highlight of highlights) {
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
}

/** Ranges a label should render: the caller's array with `escapeNewLines` applied to a copy. */
export function expectedHighlights(text: string | undefined, highlights: readonly Highlight[], escape: boolean): Highlight[] {
  const ranges = highlights.map(highlight => ({ ...highlight }));
  if (escape) {
    escapeNewLines(text || '', ranges);
  }
  return ranges;
}

/** Serialises a highlight list, so snapshots from both pages can be compared as strings. */
export function describeHighlights(highlights: readonly Highlight[]): string {
  return highlights.map(highlight => `${highlight.start}-${highlight.end}${highlight.extraClasses?.length ? `:${highlight.extraClasses.join(' ')}` : ''}`).join(',');
}

/** Node sequence of a rendered label, one entry per child node: text, `span.highlight`, codicon. */
export function describeNodes(element: HTMLElement): string {
  return [...element.childNodes].map(node => node.nodeType === Node.TEXT_NODE
    ? `#text:${node.textContent}`
    : `<${(node as Element).tagName.toLowerCase()} class="${(node as Element).className}">${node.textContent}</>`).join(',');
}

/** Class names of every element a label rendered, in document order. */
export function describeClasses(element: HTMLElement): string {
  return [...element.querySelectorAll('span')].map(span => span.className).join('|');
}

/** The dynamic-update list: the specimen control and the fixture replay these inputs in order. */
export const dynamicInitial: HighlightInput = { text: 'Initial label', highlights: [{ start: 0, end: 7 }] };
export const dynamicUpdates: readonly HighlightInput[] = [
  { text: 'Dynamic label', highlights: [{ start: 0, end: 4 }] },
  { title: 'Dynamic title' },
  { text: 'Dynamic label', highlights: [{ start: 0, end: 4 }] },
  // Same text, same ranges and the same (empty) title as the step before: this one must be skipped.
  { text: 'Dynamic label', highlights: [{ start: 0, end: 4 }] },
  { text: 'Dynamic label', highlights: [{ start: 0, end: 4 }] },
  { text: 'Dynamic label', highlights: [{ start: 8, end: 13 }] },
  { text: 'Dynamic $(check) label', highlights: [{ start: 0, end: 3 }, { start: 8, end: 16 }], supportIcons: true },
  { text: 'a\r\nb', highlights: [{ start: 0, end: 4 }], escapeNewLines: true },
];

/**
 * A step that only carries a title keeps the current text and highlights, like the callers that
 * call `set()` again with the same label. `title` is always passed, so it resets to `''`.
 */
export function stepInput(update: HighlightInput, previous: HighlightInput): HighlightInput {
  return {
    text: update.text !== undefined ? update.text : previous.text,
    highlights: update.highlights !== undefined ? update.highlights : previous.highlights ?? [],
    title: update.title ?? '',
    escapeNewLines: update.escapeNewLines,
    supportIcons: update.supportIcons,
  };
}

/** Fresh, value-equal input for `set()`: the original mutates the array it is given. */
export function cloneInput(input: HighlightInput): HighlightInput {
  return { ...input, highlights: (input.highlights ?? []).map(highlight => ({ ...highlight })) };
}
