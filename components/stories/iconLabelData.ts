/** Icon label samples shared by the original fixture and the Vue specimen. */

/** One range to highlight, mirroring the original `IMatch`. */
export interface Match {
  start: number;
  end: number;
}

/**
 * Leading icon, mirroring the two branches of `IIconLabelValueOptions#iconPath`: a `ThemeIcon`
 * (rendered as a codicon in the `monaco-icon-label-iconpath` slot) or a `URI` (that slot's
 * `background-image`). The fixture maps these onto `ThemeIcon` / `URI`, the specimen onto the
 * component's `{ id }` / `{ uri }` props.
 */
export type IconPath = { kind: 'theme'; id: string } | { kind: 'uri'; uri: string };

/** Hover text: a plain string (also the accessible name) or a markdown tooltip. */
export type Title = { kind: 'text'; value: string } | { kind: 'markdown'; value: string };

/** One `setLabel(label, description, options)` call, mirroring `IIconLabelValueOptions`. */
export interface IconLabelInput {
  label: string | string[];
  description?: string;
  suffix?: string;
  matches?: Match[];
  descriptionMatches?: Match[];
  labelEscapeNewLines?: boolean;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  disabledCommand?: boolean;
  extraClasses?: string[];
  iconPath?: IconPath;
  hideIcon?: boolean;
  separator?: string;
  domId?: string;
  title?: Title;
}

/** Which ancestor chain a label sits in; the three contexts the parity rules key off. */
export type IconLabelHost = 'list' | 'tree' | 'pane';

/** One label of the specimen canvas: its creation options plus the `setLabel` call. */
export interface IconLabelRow {
  key: string;
  host: IconLabelHost;
  focused?: boolean;
  selected?: boolean;
  /** `IIconLabelCreationOptions`, i.e. what the original's constructor is given. */
  creation?: {
    supportHighlights?: boolean;
    supportIcons?: boolean;
    supportDescriptionHighlights?: boolean;
  };
  input: IconLabelInput;
}

/** Everything both pages read back from one rendered label. */
export interface IconLabelSnapshot {
  key: string;
  /** Full outerHTML: node order, attributes and inline styles in one string. */
  html: string;
  /** Recursive node description: `<tag.class>[children]`, `#text:...` for text nodes. */
  tree: string;
  rootClass: string;
  containerClass: string;
  nameContainerClass: string;
  ariaLabel: string | null;
  title: string | null;
  /** Children of the root and of the label container, by class, in DOM order. */
  rootChildren: string;
  containerChildren: string;
  /** The name container's children, recursively. */
  name: string;
  icon: string | null;
  iconStyle: string | null;
  suffix: string | null;
  description: string | null;
  /** Class list of the description node, which carries the `margin-left: 0` empty style. */
  descriptionStyle: string | null;
  /** `id` of every `a.label-name`, joined with `|`. */
  ids: string;
  /** `name=…;separator=…;highlight=…;codicon=…;text=…` of the whole label. */
  counts: string;
}

/** Geometry of every row, identical on both pages. */
export const listStyle = 'position:relative;width:100%;height:22px;white-space:nowrap;overflow:hidden';
export const rowStyle = 'position:relative;height:22px;line-height:22px;white-space:nowrap;overflow:hidden';
/** The tree context needs the `customview-tree` class, exactly like a view pane's tree. */
export const surfaceClass = 'specimen button-specimen customview-tree';
/** E.g. `file:///icons/folder.svg`; only the CSS `url()` around it is compared. */
export const uriIcon = 'file:///icons/folder.svg';
export const resourceLabelClass = 'custom-view-tree-node-item-resourceLabel';

/** Serialises one node: text nodes keep their text, elements their tag, classes and children. */
export function describeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return `#text:${node.textContent}`;
  }
  const element = node as Element;
  const classes = element.getAttribute('class');
  const children = element.childNodes.length
    ? `[${[...element.childNodes].map(describeNode).join(',')}]`
    : '';
  return `<${element.tagName.toLowerCase()}${classes ? `.${classes.trim().split(/\s+/).join('.')}` : ''}>${children}`;
}

/** Read one rendered label back from the DOM, the same way on both pages. */
export function describeIconLabel(key: string, element: HTMLElement | null): IconLabelSnapshot {
  if (!element) {
    throw new Error(`no element for ${key}`);
  }
  const container = element.querySelector<HTMLElement>('.monaco-icon-label-container');
  const nameContainer = element.querySelector<HTMLElement>('.monaco-icon-name-container');
  const icon = element.querySelector<HTMLElement>('.monaco-icon-label-iconpath');
  const suffix = element.querySelector<HTMLElement>('.monaco-icon-suffix-container');
  const description = element.querySelector<HTMLElement>('.monaco-icon-description-container');
  const descriptionLabel = element.querySelector<HTMLElement>('.label-description');
  const count = (selector: string) => element.querySelectorAll(selector).length;
  return {
    key,
    html: element.outerHTML,
    tree: [...element.childNodes].map(describeNode).join(','),
    rootClass: element.className,
    containerClass: container?.className ?? '',
    nameContainerClass: nameContainer?.className ?? '',
    ariaLabel: element.getAttribute('aria-label'),
    title: element.getAttribute('title'),
    rootChildren: [...element.children].map(child => child.className).join('|'),
    containerChildren: container ? [...container.children].map(child => child.className).join('|') : '',
    name: nameContainer ? [...nameContainer.childNodes].map(describeNode).join(',') : '',
    icon: icon?.outerHTML ?? null,
    iconStyle: icon?.getAttribute('style') ?? null,
    suffix: suffix?.outerHTML ?? null,
    description: description?.outerHTML ?? null,
    descriptionStyle: descriptionLabel?.getAttribute('style') ?? null,
    ids: [...element.querySelectorAll('a.label-name')].map(anchor => anchor.id).join('|'),
    counts: [
      `name=${count('a.label-name')}`,
      `separator=${count('.label-separator')}`,
      `highlight=${count('.highlight')}`,
      `codicon=${count('.codicon')}`,
      `description=${count('.monaco-icon-description-container')}`,
      `suffix=${count('.monaco-icon-suffix-container')}`,
    ].join(';'),
  };
}

/**
 * The static canvas. The three creation options, every documented `setLabel` option and the three
 * host contexts are covered; `highlights`/`icons` also cover the builder combinations that decide
 * whether the name goes through `HighlightedLabel` at all.
 */
export const rows: readonly IconLabelRow[] = [
  { key: 'plain', host: 'list', input: { label: 'index.ts' } },
  { key: 'highlights', host: 'list', creation: { supportHighlights: true }, input: { label: 'Button.tsx', matches: [{ start: 0, end: 6 }] } },
  { key: 'icons', host: 'list', creation: { supportIcons: true }, input: { label: '$(check) Sync $(sync~spin) done' } },
  { key: 'icons-highlights', host: 'list', creation: { supportHighlights: true, supportIcons: true }, input: { label: '$(file) button.ts', matches: [{ start: 0, end: 7 }, { start: 8, end: 14 }] } },
  // `supportHighlights` without `supportIcons`: the marker stays literal text, and the range over
  // it is highlighted as text.
  { key: 'icons-disabled', host: 'list', creation: { supportHighlights: true }, input: { label: '$(check) literal marker', matches: [{ start: 0, end: 8 }] } },
  { key: 'description', host: 'list', input: { label: 'index.ts', description: 'src/base/browser' } },
  { key: 'description-highlights', host: 'list', creation: { supportDescriptionHighlights: true }, input: { label: 'index.ts', description: 'src/base/browser', descriptionMatches: [{ start: 0, end: 3 }, { start: 4, end: 8 }] } },
  { key: 'escape-highlights', host: 'list', creation: { supportHighlights: true }, input: { label: 'one\r\ntwo', matches: [{ start: 0, end: 4 }], labelEscapeNewLines: true } },
  { key: 'escape-description', host: 'list', creation: { supportDescriptionHighlights: true }, input: { label: 'index.ts', description: 'a\r\nb', descriptionMatches: [{ start: 0, end: 4 }], labelEscapeNewLines: true } },
  { key: 'suffix', host: 'list', input: { label: 'index.ts', suffix: 'modified' } },
  { key: 'description-suffix', host: 'list', input: { label: 'index.ts', description: 'src/base', suffix: 'M' } },
  { key: 'multi', host: 'list', input: { label: ['src', 'components', 'button.ts'] } },
  { key: 'multi-separator', host: 'list', input: { label: ['src', 'components', 'button.ts'], separator: '\u203a' } },
  { key: 'multi-domId', host: 'list', input: { label: ['src', 'button.ts'], domId: 'explorer-item' } },
  // The matches are given for the joined text, so `splitMatches` rebases them per part.
  { key: 'multi-highlights', host: 'list', creation: { supportHighlights: true }, input: { label: ['src', 'components', 'button.ts'], matches: [{ start: 0, end: 3 }, { start: 5, end: 10 }, { start: 16, end: 22 }] } },
  // The second range covers the `$(file)` marker of the second part, so the icon renders inside
  // the highlight run.
  { key: 'multi-highlights-icons', host: 'list', creation: { supportHighlights: true, supportIcons: true }, input: { label: ['src', '$(file) button.ts'], matches: [{ start: 0, end: 3 }, { start: 4, end: 11 }] } },
  { key: 'bold', host: 'list', input: { label: 'bold label', bold: true } },
  { key: 'italic', host: 'list', input: { label: 'italic label', italic: true } },
  { key: 'strikethrough', host: 'list', input: { label: 'strikethrough label', strikethrough: true } },
  { key: 'disabled', host: 'list', input: { label: 'unavailable', description: 'disabled command', disabledCommand: true } },
  { key: 'disabled-tree', host: 'tree', input: { label: 'unavailable', description: 'src/base', disabledCommand: true, extraClasses: [resourceLabelClass] } },
  { key: 'icon-theme', host: 'list', input: { label: 'index.ts', description: 'src', iconPath: { kind: 'theme', id: 'file-code' } } },
  { key: 'icon-uri', host: 'list', input: { label: 'index.ts', description: 'src', iconPath: { kind: 'uri', uri: uriIcon } } },
  // `hideIcon` is part of the options but the pinned implementation never reads it.
  { key: 'hide-icon', host: 'list', input: { label: 'index.ts', description: 'src', iconPath: { kind: 'theme', id: 'file-code' }, hideIcon: true } },
  { key: 'extra-classes', host: 'tree', input: { label: 'index.ts', description: 'src/base', extraClasses: [resourceLabelClass], iconPath: { kind: 'theme', id: 'file-code' } } },
  { key: 'tree-row', host: 'tree', focused: true, input: { label: 'index.ts', description: 'src/base/browser', extraClasses: [resourceLabelClass], iconPath: { kind: 'theme', id: 'file-code' } } },
  { key: 'tree-selected', host: 'tree', selected: true, input: { label: 'main.ts', description: 'src', extraClasses: [resourceLabelClass] } },
  { key: 'tree-highlight', host: 'tree', creation: { supportHighlights: true }, input: { label: 'index.ts', description: 'src/base', matches: [{ start: 0, end: 5 }], extraClasses: [resourceLabelClass] } },
  // `.pane-body .monaco-tl-contents` is the filter-match context of `views.css`.
  { key: 'pane-filter', host: 'pane', creation: { supportHighlights: true }, input: { label: 'index.ts', matches: [{ start: 0, end: 5 }] } },
  { key: 'pane-filter-icons', host: 'pane', creation: { supportHighlights: true, supportIcons: true }, input: { label: '$(search) index.ts', description: 'src', matches: [{ start: 0, end: 9 }] } },
  // A string title is the accessible name; a markdown tooltip leaves it at the label.
  { key: 'title-text', host: 'list', input: { label: 'index.ts', title: { kind: 'text', value: 'Show in Explorer' } } },
  { key: 'title-markdown', host: 'list', input: { label: 'index.ts', title: { kind: 'markdown', value: 'Show in **Explorer**' } } },
  { key: 'title-markdown-multi', host: 'list', input: { label: ['src', 'button.ts'], title: { kind: 'markdown', value: 'Open' } } },
];

/** The row the name timeline drives. */
export const dynamicInitial: IconLabelInput = {
  label: 'index.ts',
  description: 'src/base',
  matches: [{ start: 0, end: 5 }],
};

/**
 * The dynamic timeline. Both pages replay it step by step: identical steps prove the short-circuit,
 * a fresh array of equal parts proves that `label` is compared with `===` (and rebuilds), and the
 * remaining steps walk every option that changes the DOM.
 */
export const dynamicUpdates: readonly Partial<IconLabelInput>[] = [
  { label: 'main.ts', matches: [{ start: 0, end: 4 }] },
  { description: 'src/editor' },
  // Byte-for-byte the step before: the name builder and both `FastLabelNode`s must not touch the DOM.
  { description: 'src/editor' },
  { suffix: 'modified' },
  // A removed description keeps its node and gets `margin-left: 0`; the suffix keeps an empty text.
  { suffix: undefined, description: undefined },
  { label: ['src', 'components', 'button.ts'], separator: '\u203a', domId: 'dynamic-item', matches: [{ start: 0, end: 3 }, { start: 6, end: 16 }] },
  // A fresh array with the same parts: `this.label === label` fails, so every anchor is rebuilt.
  { label: ['src', 'components', 'button.ts'], separator: '\u203a', domId: 'dynamic-item', matches: [{ start: 0, end: 3 }, { start: 6, end: 16 }] },
  { description: 'src/base/browser', descriptionMatches: [{ start: 4, end: 8 }] },
  { iconPath: { kind: 'theme', id: 'file-code' } },
  // A URI only rewrites the background image, so the codicon classes of the step before survive.
  { iconPath: { kind: 'uri', uri: uriIcon } },
  { iconPath: undefined },
  { bold: true, italic: true, strikethrough: true, disabledCommand: true, extraClasses: [resourceLabelClass] },
  { label: 'one\r\ntwo', matches: [{ start: 0, end: 4 }], labelEscapeNewLines: true },
  { title: { kind: 'text', value: 'Show in Explorer' } },
  { title: { kind: 'markdown', value: 'Show in **Explorer**' } },
  { title: undefined, label: ['src', 'button.ts'] },
];

/**
 * The plain-description timeline: no creation option, so the description is a text node whose
 * `FastLabelNode.empty` state is observable, and the plain name builder never escapes new lines.
 */
export const descriptionInitial: IconLabelInput = { label: 'index.ts' };

export const descriptionUpdates: readonly Partial<IconLabelInput>[] = [
  { description: 'src/base' },
  // The node stays, its text is cleared and `empty` adds `margin-left: 0`.
  { description: undefined },
  { description: 'src/editor' },
  // Only the highlighted builders escape, so this name keeps its CR/LF.
  { label: 'one\r\ntwo', description: 'a\r\nb', labelEscapeNewLines: true },
];

/** The two rows the timelines drive, in canvas order, with the steps each of them replays. */
export const drivenRows: readonly { row: IconLabelRow; updates: readonly Partial<IconLabelInput>[] }[] = [
  { row: { key: 'dynamic', host: 'list', creation: { supportHighlights: true, supportDescriptionHighlights: true }, input: dynamicInitial }, updates: dynamicUpdates },
  { row: { key: 'description-dynamic', host: 'list', input: descriptionInitial }, updates: descriptionUpdates },
];

/** The step lists both pages publish as `window.iconLabelSteps`, keyed by row. */
export const stepLists: Record<string, readonly Partial<IconLabelInput>[]> = Object.fromEntries(
  drivenRows.map(({ row, updates }) => [row.key, updates]),
);

/** The row the fixture disposes and the specimen keeps mounted: `dispose()` does not change the DOM. */
export const disposeRow: IconLabelRow = {
  key: 'dispose',
  host: 'list',
  input: { label: 'disposed.ts', description: 'src', title: { kind: 'text', value: 'Disposed label' } },
};

/** Replica-only probe: mounting and unmounting the component has to leave no trace. */
export const probeRow: IconLabelRow = {
  key: 'probe',
  host: 'list',
  input: { label: 'probe.ts', description: 'src', suffix: 'probe' },
};

/** A step merged over the current input; `undefined` clears a field, like a fresh `setLabel` call. */
export function stepInput(update: Partial<IconLabelInput>, previous: IconLabelInput): IconLabelInput {
  return { ...previous, ...update };
}

/** Fresh, value-equal input, so neither page can observe the other's array identities. */
export function cloneInput(input: IconLabelInput): IconLabelInput {
  return {
    ...input,
    matches: input.matches?.map(match => ({ ...match })),
    descriptionMatches: input.descriptionMatches?.map(match => ({ ...match })),
    extraClasses: input.extraClasses ? [...input.extraClasses] : undefined,
    iconPath: input.iconPath ? { ...input.iconPath } : undefined,
    title: input.title ? { ...input.title } : undefined,
  };
}

/** What one dynamic step did to the DOM. */
export interface IconLabelStep {
  snapshot: IconLabelSnapshot;
  /** Whether this step replaced the first child of the name container. */
  newNode: boolean;
}

/** `dispose()`: the original releases its managed hovers, the DOM stays exactly as it was. */
export interface IconLabelDisposeResult {
  before: IconLabelSnapshot;
  after: IconLabelSnapshot;
  changed: boolean;
  /** `customHovers.size` of the original; `null` on the replica, which has no hover service. */
  hoverBefore: number | null;
  hoverAfter: number | null;
}

/** The imperative entry point both pages publish as `window.iconLabelFixture`. */
export interface IconLabelFixtureHandle {
  /** Applies one step of that row's timeline; the row key is `dynamic` or `description-dynamic`. */
  set(step: Partial<IconLabelInput>, row: string): Promise<IconLabelStep>;
  dispose(): Promise<IconLabelDisposeResult>;
  snapshot(key: string): IconLabelSnapshot;
  /** Replica only: mount or unmount the probe row. */
  probe?(mounted: boolean): Promise<IconLabelSnapshot | null>;
}
