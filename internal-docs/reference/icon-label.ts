// Live oracle: `IconLabel` from the pinned Classic workbench sources. The DOM, the short-circuits
// of `Label`/`LabelWithHighlights`, the icon slot and `dispose()` come from the real class; nothing
// from components/src is imported here except the canvas data and the DOM description both pages
// share. The tree/pane context CSS (`views.css`) is loaded here because this page has no workbench
// shell to collect it.
import '../../vscode/src/vs/workbench/browser/parts/views/media/views.css';
import { IconLabel } from '../../vscode/src/vs/base/browser/ui/iconLabel/iconLabel.js';
import { ThemeIcon } from '../../vscode/src/vs/base/common/themables.js';
import { URI } from '../../vscode/src/vs/base/common/uri.js';
import {
  cloneInput, describeIconLabel, disposeRow, drivenRows, listStyle, rowStyle, rows, stepInput, stepLists, surfaceClass,
  type IconLabelDisposeResult, type IconLabelInput, type IconLabelRow, type IconLabelSnapshot, type IconLabelStep,
} from '../../components/stories/iconLabelData';

/** One label of the canvas: the real `IconLabel`, the input it last saw and what it rendered. */
interface LabelRecord {
  row: IconLabelRow;
  label: IconLabel;
  input: IconLabelInput;
  /** First child of the name container before the last `setLabel`, to spot rebuilt anchors. */
  firstChild: Node | null;
}

/** `IIconLabelValueOptions` for one input, exactly the keys callers pass. */
function labelOptions(input: IconLabelInput) {
  return {
    title: input.title
      ? input.title.kind === 'text' ? input.title.value : { value: input.title.value }
      : undefined,
    suffix: input.suffix,
    hideIcon: input.hideIcon,
    extraClasses: input.extraClasses,
    bold: input.bold,
    italic: input.italic,
    strikethrough: input.strikethrough,
    matches: input.matches,
    labelEscapeNewLines: input.labelEscapeNewLines,
    descriptionMatches: input.descriptionMatches,
    disabledCommand: input.disabledCommand,
    separator: input.separator,
    domId: input.domId,
    iconPath: input.iconPath
      ? input.iconPath.kind === 'theme' ? ThemeIcon.fromId(input.iconPath.id) : URI.parse(input.iconPath.uri)
      : undefined,
    supportIcons: undefined,
  };
}

/** The host chain of a row: a plain list row, a tree row item or a pane's tree contents. */
function createHost(surface: HTMLElement, row: IconLabelRow): HTMLElement {
  const list = document.createElement('div');
  list.className = 'monaco-list';
  list.setAttribute('style', listStyle);
  const listRow = document.createElement('div');
  listRow.className = `monaco-list-row${row.focused ? ' focused' : ''}${row.selected ? ' selected' : ''}`;
  listRow.dataset.key = row.key;
  listRow.setAttribute('style', rowStyle);
  list.append(listRow);
  surface.append(list);
  if (row.host === 'tree') {
    const item = document.createElement('div');
    item.className = 'custom-view-tree-node-item';
    listRow.append(item);
    return item;
  }
  if (row.host === 'pane') {
    const body = document.createElement('div');
    body.className = 'pane-body';
    const contents = document.createElement('div');
    contents.className = 'monaco-tl-contents';
    body.append(contents);
    listRow.append(body);
    return contents;
  }
  return listRow;
}

const nameFirstChild = (element: HTMLElement): Node | null => element.querySelector('.monaco-icon-name-container')?.firstChild ?? null;

/** `IconLabel#customHovers` is private; the fixture reads it to prove `dispose()` released them. */
const hoverCount = (label: IconLabel): number => (label as unknown as { customHovers: Map<unknown, unknown> }).customHovers.size;

export function mountIconLabel(root: HTMLElement, surface: HTMLElement, state: any) {
  // Kept for a remount of the same page; the surface stays the first child of `#fixture`, because
  // appending it behind the fractional-height `.outside` button would move every glyph onto a
  // different subpixel phase than the replica page.
  (window as any).fixtureRoot = root;
  root.prepend(surface);
  mountInto(surface, state);
}

function mountInto(surface: HTMLElement, state: any) {
  surface.className = surfaceClass;

  const records = new Map<string, LabelRecord>();

  function create(row: IconLabelRow, input: IconLabelInput): LabelRecord {
    const host = createHost(surface, row);
    const label = new IconLabel(host, row.creation);
    const record: LabelRecord = { row, label, input, firstChild: nameFirstChild(label.element) };
    records.set(row.key, record);
    apply(record, input);
    return record;
  }

  function apply(record: LabelRecord, input: IconLabelInput): void {
    record.input = input;
    record.label.setLabel(input.label, input.description, labelOptions(input));
  }

  // The static canvas, in the same order the replica renders it.
  const snapshots: IconLabelSnapshot[] = [];
  for (const row of rows) {
    snapshots.push(describeIconLabel(row.key, create(row, cloneInput(row.input)).label.element));
  }

  // The driven labels: every step is a full `setLabel` call, so short-circuits are observable.
  const driven = new Map<string, { record: LabelRecord; steps: IconLabelStep[] }>();
  for (const { row } of drivenRows) {
    const record = create(row, cloneInput(row.input));
    snapshots.push(describeIconLabel(row.key, record.label.element));
    record.firstChild = nameFirstChild(record.label.element);
    driven.set(row.key, { record, steps: [] });
  }

  // The disposed label: `dispose()` releases the managed hovers and leaves the DOM alone.
  const disposed = create(disposeRow, cloneInput(disposeRow.input));
  snapshots.push(describeIconLabel(disposeRow.key, disposed.label.element));

  /** Applies one step and records whether it replaced the anchors of the name container. */
  function setStep(row: string, step: Partial<IconLabelInput>): IconLabelStep {
    const { record, steps } = driven.get(row)!;
    const previous = record.firstChild;
    apply(record, stepInput(step, record.input));
    record.firstChild = nameFirstChild(record.label.element);
    const result: IconLabelStep = {
      snapshot: describeIconLabel(row, record.label.element),
      newNode: record.firstChild !== previous,
    };
    steps.push(result);
    state.steps[row] = steps;
    return result;
  }

  /** `dispose()` releases the managed hovers; the DOM it rendered stays exactly as it was. */
  function disposeDisposedRow(): IconLabelDisposeResult {
    const before = describeIconLabel(disposeRow.key, disposed.label.element);
    const hoverBefore = hoverCount(disposed.label);
    disposed.label.dispose();
    const after = describeIconLabel(disposeRow.key, disposed.label.element);
    return {
      before,
      after,
      changed: before.html !== after.html,
      hoverBefore,
      hoverAfter: hoverCount(disposed.label),
    };
  }

  (window as any).iconLabelFixture = {
    set: async (step: Partial<IconLabelInput>, row: string) => setStep(row, step),
    dispose: async () => disposeDisposedRow(),
    snapshot: (key: string) => describeIconLabel(key, records.get(key)!.label.element),
  };
  // Same step lists the specimen control walks through.
  (window as any).iconLabelSteps = stepLists;

  Object.assign(state, {
    labels: snapshots,
    steps: Object.fromEntries([...driven].map(([key, { steps }]) => [key, steps])),
    dispose: disposeDisposedRow(),
  });
}
