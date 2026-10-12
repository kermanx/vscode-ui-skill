// Live oracle: HighlightedLabel from the pinned Classic workbench sources.
// DOM, short-circuit and highlight ranges come from the real class; nothing from
// components/src is imported here except the shared fixture data in components/stories.
import '../../vscode/src/vs/base/browser/ui/highlightedlabel/highlightedLabel.js';
// The filter-match context (`views.css`) is collected by the workbench after its base `style.css`.
import '../../vscode/src/vs/workbench/browser/parts/views/media/views.css';
import { HighlightedLabel, type IHighlight } from '../../vscode/src/vs/base/browser/ui/highlightedlabel/highlightedLabel.js';
import {
  cloneInput, describeHighlights, dynamicInitial, dynamicUpdates, expectedHighlights, stepInput,
  type Highlight, type HighlightInput, type LabelSnapshot,
} from '../../components/stories/highlightedLabelData';

export type { HighlightInput };

/** Node sequence of a rendered label, one entry per child node. */
function describeNodes(element: HTMLElement): string {
  return [...element.childNodes].map(node => node.nodeType === Node.TEXT_NODE
    ? `#text:${node.textContent}`
    : `<${(node as Element).tagName.toLowerCase()} class="${(node as Element).className}">${node.textContent}</>`).join(',');
}

/** Class names of every element the label rendered, in document order. */
function describeClasses(element: HTMLElement): string {
  return [...element.querySelectorAll('span')].map(span => span.className).join('|');
}

interface Recorder {
  key: string;
  label: HighlightedLabel;
  /** The caller's array; the original rewrites it in place when `escapeNewLines` is set. */
  propsHighlights: readonly Highlight[];
  /** Ranges the label actually rendered (`this.highlights`). */
  working: readonly Highlight[];
  /** `render()` calls, i.e. how often the child nodes were rebuilt. */
  renders: number;
  sets: number;
  snapshots: LabelSnapshot[];
  firstChild: Node | null;
}

function createRecorder(key: string, host: HTMLElement): Recorder {
  const label = new HighlightedLabel(host);
  return { key, label, propsHighlights: [], working: [], renders: 0, sets: 0, snapshots: [], firstChild: null };
}

/**
 * Calls `set()` and records everything the parity test compares. `renders` only grows when the
 * label rebuilt its child nodes, so an unchanged count plus an unchanged `firstChild` proves the
 * `didEverRender` short-circuit skipped the render.
 */
function record(recorder: Recorder, input: HighlightInput): LabelSnapshot {
  const { label } = recorder;
  // Fresh, value-equal inputs on every call: the original mutates the array it is given.
  const highlights = (input.highlights ?? []).map(highlight => ({ ...highlight }));
  recorder.propsHighlights = highlights;
  label.set(input.text, highlights as IHighlight[], input.title ?? '', input.escapeNewLines, input.supportIcons);
  recorder.working = label.highlights;
  recorder.sets++;
  const firstChild = label.element.firstChild;
  const newNode = firstChild !== recorder.firstChild;
  recorder.firstChild = firstChild;
  if (newNode) {
    recorder.renders++;
  }
  const snapshot: LabelSnapshot = {
    set: recorder.sets,
    text: label.element.textContent ?? '',
    html: label.element.outerHTML,
    nodes: describeNodes(label.element),
    classes: describeClasses(label.element),
    propsHighlights: describeHighlights(recorder.propsHighlights),
    highlights: describeHighlights(recorder.working),
    newNode,
    renderCount: recorder.renders,
  };
  recorder.snapshots.push(snapshot);
  return snapshot;
}

const listStyle = 'position:relative;width:100%;height:22px;white-space:nowrap;overflow:hidden';
const rowStyle = 'position:relative;height:22px;line-height:22px;white-space:nowrap;overflow:hidden';

/**
 * Every row is a `.monaco-list-row`; the `pane` rows also sit in a `.pane-body .monaco-tl-contents`
 * so the filter-match context rules apply, exactly like a tree row inside a view pane.
 */
const cases: { key: string; host: 'list' | 'pane'; input: HighlightInput }[] = [
  { key: 'empty', host: 'list', input: {} },
  { key: 'plain', host: 'list', input: { text: 'No highlights' } },
  { key: 'single', host: 'list', input: { text: 'Single highlight', highlights: [{ start: 7, end: 16 }] } },
  { key: 'multi', host: 'list', input: { text: 'alpha beta gamma', highlights: [{ start: 0, end: 5 }, { start: 6, end: 10 }, { start: 11, end: 16 }] } },
  { key: 'classes', host: 'list', input: { text: 'Extra classes', highlights: [{ start: 0, end: 5, extraClasses: ['nowrap', 'label-name'] }, { start: 6, end: 13 }] } },
  { key: 'adjacent', host: 'list', input: { text: 'abcdef', highlights: [{ start: 0, end: 2 }, { start: 2, end: 4 }, { start: 4, end: 6 }] } },
  { key: 'overlap', host: 'list', input: { text: 'abcdef', highlights: [{ start: 0, end: 3 }, { start: 2, end: 5 }] } },
  { key: 'zero', host: 'list', input: { text: 'Zero length', highlights: [{ start: 0, end: 0, extraClasses: ['skipped'] }, { start: 5, end: 5 }, { start: 5, end: 11 }] } },
  // The range covers the leading `$(check)` marker, so the icon is rendered inside the highlight.
  { key: 'icons', host: 'list', input: { text: '$(check) Sync $(sync~spin) done', highlights: [{ start: 0, end: 8 }], supportIcons: true } },
  { key: 'symbol-icon', host: 'list', input: { text: '$(symbol-class) hello', supportIcons: true } },
  { key: 'html', host: 'list', input: { text: 'hel<lo & goodbye' } },
  { key: 'crlf', host: 'list', input: { text: 'a\r\nb', highlights: [{ start: 0, end: 4 }], escapeNewLines: true } },
  { key: 'crlf-range', host: 'list', input: { text: 'one\r\ntwo\r\nthree', highlights: [{ start: 0, end: 4 }, { start: 5, end: 9 }, { start: 10, end: 15 }], escapeNewLines: true } },
  { key: 'cr', host: 'list', input: { text: 'a\rb', highlights: [{ start: 0, end: 3 }], escapeNewLines: true } },
  { key: 'lf', host: 'list', input: { text: 'a\nb', highlights: [{ start: 0, end: 3 }], escapeNewLines: true } },
  { key: 'title', host: 'list', input: { text: 'Titled', highlights: [{ start: 0, end: 6 }], title: 'Managed hover title' } },
  { key: 'pane', host: 'pane', input: { text: 'Filter match', highlights: [{ start: 0, end: 6 }] } },
  { key: 'pane-focused', host: 'pane', input: { text: 'Filter match focused', highlights: [{ start: 7, end: 14 }] } },
];

/** Builds the workbench-shaped host for one label and appends it to the specimen surface. */
function addRow(surface: HTMLElement, key: string, host: 'list' | 'pane', focused: boolean): HTMLElement {
  const list = document.createElement('div');
  list.className = 'monaco-list';
  list.setAttribute('style', listStyle);
  const row = document.createElement('div');
  row.className = `monaco-list-row${focused ? ' focused' : ''}`;
  row.dataset.key = key;
  row.setAttribute('style', rowStyle);
  const container = document.createElement('div');
  if (host === 'pane') {
    const body = document.createElement('div');
    body.className = 'pane-body';
    const contents = document.createElement('div');
    contents.className = 'monaco-tl-contents';
    body.append(contents);
    container.append(body);
  }
  row.append(container);
  list.append(row);
  surface.append(list);
  return (container.querySelector('.monaco-tl-contents') ?? container) as HTMLElement;
}

const recorders = new Map<string, Recorder>();
let dynamic: Recorder;
let applied: HighlightInput = cloneInput(dynamicInitial);

export function mountHighlightedLabel(_root: HTMLElement, surface: HTMLElement, state: any) {
  recorders.clear();
  for (const { key, host, input } of cases) {
    const recorder = createRecorder(key, addRow(surface, key, host, key === 'pane-focused'));
    recorders.set(key, recorder);
    record(recorder, input);
  }
  applied = cloneInput(dynamicInitial);
  dynamic = createRecorder('dynamic', addRow(surface, 'dynamic', 'list', false));
  recorders.set('dynamic', dynamic);
  record(dynamic, applied);
  (window as any).highlightedLabelHandle = {
    set: (step: HighlightInput) => stepLabel(step),
    renderCount: () => dynamic.renders,
    element: dynamic.label.element,
    get highlights() { return dynamic.working; },
  };
  // Same step list the specimen control walks through.
  (window as any).highlightedLabelSteps = dynamicUpdates;

  Object.assign(state, {
    // The dynamic label is compared through `dynamicDetail`, not through these per-row maps.
    labels: cases.map(({ key }) => {
      const { text, nodes, classes } = recorders.get(key)!.snapshots[0];
      return { key, text, nodes, classes };
    }),
    labelsDetail: Object.fromEntries([...recorders].map(([key, recorder]) => [key, recorder.snapshots])),
    propsHighlights: Object.fromEntries(cases.map(({ key }) => [key, describeHighlights(recorders.get(key)!.propsHighlights)])),
    workingHighlights: Object.fromEntries(cases.map(({ key }) => [key, describeHighlights(recorders.get(key)!.working)])),
    expectedHighlights: Object.fromEntries(cases.map(({ key, input }) => [key, describeHighlights(expectedHighlights(input.text, input.highlights ?? [], Boolean(input.escapeNewLines)))])),
    renderCounts: Object.fromEntries(cases.map(({ key }) => [key, recorders.get(key)!.renders])),
    titles: Object.fromEntries(cases.map(({ key }) => [key, recorders.get(key)!.label.element.getAttribute('title')])),
  });
}

/**
 * Replays one step on the dynamic label, keeping the current text and highlights when the step only
 * carries a title. The caller always receives a fresh array, so the original's in-place escaping
 * stays observable without leaking into the next step. `snapshot` is the state of this very step,
 * returned directly so a caller never has to guess which array entry belongs to it.
 */
function stepLabel(step: HighlightInput): Promise<{ renderCount: number; states: LabelSnapshot[]; snapshot: LabelSnapshot }> {
  applied = cloneInput(stepInput(step, applied));
  const snapshot = record(dynamic, applied);
  // The DOM is read one microtask later: both this page and the Vue page finish their update then.
  return Promise.resolve().then(() => {
    snapshot.html = dynamic.label.element.outerHTML;
    snapshot.nodes = describeNodes(dynamic.label.element);
    snapshot.classes = describeClasses(dynamic.label.element);
    (window as any).fixtureState.dynamicDetail = dynamic.snapshots;
    return { renderCount: dynamic.renders, states: dynamic.snapshots.slice(1), snapshot };
  });
}

/** Replays the whole `dynamicUpdates` list, the same way the specimen control does it step by step. */
export async function applyHighlightedLabelUpdate(): Promise<{ renderCount: number; states: LabelSnapshot[] }> {
  let result = { renderCount: dynamic.renders, states: dynamic.snapshots.slice(1), snapshot: dynamic.snapshots[0] };
  for (const update of dynamicUpdates) {
    result = await stepLabel(update);
  }
  return result;
}