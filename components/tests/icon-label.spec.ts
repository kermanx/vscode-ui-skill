import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { stepLists, type IconLabelSnapshot, type IconLabelStep } from '../stories/iconLabelData';

// The canvas is 1360px tall (36 rows of 22px plus the 16px gap of the specimen surface); the default
// 480px viewport would capture it beyond the fold, so both pages get a viewport that fits it whole.
test.use({ viewport: { width: 420, height: 1400 }, deviceScaleFactor: 1 });

const original = (theme: string) => `${process.env.REFERENCE_URL ?? '/reference/index.html'}?kind=icon-label&theme=${theme}`;
const replica = (theme: string) => `/iframe.html?id=components-icon-label--specimen&viewMode=story&globals=theme:${theme}`;

async function pair(context: BrowserContext, theme = 'dark') {
  const pages: [Page, Page] = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.text().includes('[Vue warn]')) errors.push(message.text()); });
  }
  await pages[0].goto(original(theme));
  await pages[1].goto(replica(theme));
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady || (window as any).fixtureError);
    await page.evaluate(async () => { await document.fonts.load('16px codicon'); await document.fonts.ready; });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  expect(await pages[0].evaluate(() => (window as any).fixtureError ?? null), 'original fixture error').toBeNull();
  expect(errors, 'runtime errors').toEqual([]);
  return { pages, errors };
}

/**
 * The only animation in the canvas is the `codicon-spin` of the `$(sync~spin)` marker in the `icons`
 * row (an upstream codicon modifier, not an IconLabel behaviour). Both pages pin it to the same
 * frame before anything is measured or captured, and the animation contract itself is compared.
 */
const freeze = (page: Page) => page.evaluate(async () => {
  const animations = document.getAnimations();
  for (const animation of animations) {
    animation.pause();
    animation.currentTime = 0;
  }
  await Promise.all(animations.map(animation => animation.ready));
  return animations.map(animation => {
    const target = (animation.effect as KeyframeEffect).target as Element;
    const style = getComputedStyle(target);
    return {
      className: target.getAttribute('class'),
      name: style.animationName,
      duration: style.animationDuration,
      timing: style.animationTimingFunction,
      iterations: style.animationIterationCount,
      playState: animation.playState,
    };
  });
});

/** Zero-tolerance comparison of the whole deterministic canvas across both pages. */
async function pixels(pages: readonly Page[], info: TestInfo, name: string, target = '[data-testid="specimen"]') {
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront();
    await page.evaluate(() => window.scrollTo(0, 0));
    buffers.push(await page.locator(target).screenshot());
  }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }, `${name}: canvas size`).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
  return buffers;
}

/** The structural snapshot of every row, computed from the DOM on both pages. */
const labels = (page: Page): Promise<IconLabelSnapshot[]> => page.evaluate(() => (window as any).fixtureState.labels);
const disposeState = (page: Page) => page.evaluate(() => (window as any).fixtureState.dispose);
/** Applies one step of a timeline; both pages implement the same handle. */
const step = (page: Page, timeline: string, index: number): Promise<IconLabelStep> => page.evaluate(
  ([timeline, index]) => (window as any).iconLabelFixture.set((window as any).iconLabelSteps[timeline][index], timeline),
  [timeline, index] as const);

const rowOf = (key: string) => `[data-key="${key}"]`;
const labelOf = (page: Page, key: string) => page.locator(`${rowOf(key)} .monaco-icon-label`);
const pick = (snapshots: IconLabelSnapshot[], key: string): IconLabelSnapshot => {
  const snapshot = snapshots.find(entry => entry.key === key);
  expect(snapshot, `snapshot of ${key}`).toBeTruthy();
  return snapshot!;
};
/** Everything except the key: two rows have to render the very same label. */
const withoutKey = ({ key, ...rest }: IconLabelSnapshot) => { void key; return rest; };

/**
 * Every computed value the pinned stylesheet is responsible for, read from the live DOM of one page:
 * the description opacity in its contexts, the disabled container colour, the bold/italic/strike
 * text, the highlight runs of the list / focused list / filter-match contexts and the `::before`
 * icon slot.
 */
const styleState = (page: Page) => page.evaluate(() => {
  const read = (selector: string, pseudo?: string) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const style = getComputedStyle(element, pseudo);
    return {
      opacity: style.opacity, color: style.color, backgroundColor: style.backgroundColor,
      fontStyle: style.fontStyle, fontWeight: style.fontWeight, textDecorationLine: style.textDecorationLine,
      outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor, outlineOffset: style.outlineOffset,
      width: style.width, height: style.height, paddingRight: style.paddingRight, marginLeft: style.marginLeft,
      display: style.display, backgroundSize: style.backgroundSize, backgroundPosition: style.backgroundPosition, backgroundRepeat: style.backgroundRepeat,
      backgroundImage: style.backgroundImage, fontSize: style.fontSize, whiteSpace: style.whiteSpace,
    };
  };
  /** Reads one element of one row; the probe name is explicit, so two rows can share a selector. */
  const probe = (name: string, row: string, selector: string, pseudo?: string) =>
    [name, read(`[data-key="${row}"] ${selector}`, pseudo)] as const;
  return Object.fromEntries([
    probe('description', 'description', '.label-description'),
    probe('description-suffix', 'description-suffix', '.label-description'),
    probe('tree-row', 'tree-row', '.label-description'),
    probe('tree-selected', 'tree-selected', '.label-description'),
    probe('disabled-container', 'disabled', '.monaco-icon-label-container'),
    probe('disabled-description', 'disabled', '.label-description'),
    probe('bold-name', 'bold', '.label-name'),
    probe('italic-name', 'italic', '.label-name'),
    probe('strikethrough-name', 'strikethrough', '.label-name'),
    probe('suffix', 'suffix', '.label-suffix'),
    probe('highlight-list', 'highlights', '.highlight'),
    probe('highlight-tree', 'tree-highlight', '.highlight'),
    probe('highlight-pane', 'pane-filter', '.highlight'),
    probe('highlight-pane-icons', 'pane-filter-icons', '.highlight'),
    probe('icon-theme', 'icon-theme', '.monaco-icon-label-iconpath'),
    probe('icon-uri', 'icon-uri', '.monaco-icon-label-iconpath'),
    // The `::before` slot of the label root, which is the icon slot the stylesheet sizes.
    probe('icon-slot', 'icon-theme', '.monaco-icon-label', '::before'),
    // The name of a plain label is a text node; the highlighted builders wrap it in a span. Both
    // keep `white-space: pre` on the anchor, so labels with several spaces stay intact.
    probe('name-plain', 'plain', '.label-name'),
    probe('name-highlighted', 'highlights', '.label-name'),
  ]);
});

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`IconLabel visual and structural parity / ${theme}`, async ({ context }, info) => {
    const { pages, errors } = await pair(context, theme);
    const [referenceAnimations, vueAnimations] = await Promise.all(pages.map(freeze));
    expect(referenceAnimations, `${theme}: the only animation is the $(sync~spin) codicon`).toHaveLength(1);
    expect(vueAnimations, `${theme}: animation contract`).toEqual(referenceAnimations);

    await pixels(pages, info, 'initial');

    // Every row, node by node: classes, attributes, inline styles, separator placement and the
    // accessible name. The two pages build this DOM with completely different code.
    const [reference, vue] = await Promise.all(pages.map(labels));
    expect(reference.length, `${theme}: row count`).toBe(36);
    expect(vue, `${theme}: structural snapshot`).toEqual(reference);

    // Computed styles, including the light theme's 0.95 description opacity and the contexts that
    // override it.
    expect(await styleState(pages[1]), `${theme}: computed styles`).toEqual(await styleState(pages[0]));

    // `dispose()` releases the original's managed hovers and leaves the DOM untouched. The replica
    // has no hover service, so it has no hover bookkeeping to report — asserted, not normalized.
    const [referenceDispose, vueDispose] = await Promise.all(pages.map(disposeState));
    expect({ before: vueDispose.before, after: vueDispose.after, changed: vueDispose.changed })
      .toEqual({ before: referenceDispose.before, after: referenceDispose.after, changed: referenceDispose.changed });
    expect(referenceDispose, `${theme}: original dispose contract`).toMatchObject({ changed: false, hoverBefore: 1, hoverAfter: 0 });
    expect(vueDispose, `${theme}: replica has no hover bookkeeping`).toMatchObject({ changed: false, hoverBefore: null, hoverAfter: null });

    expect(errors).toEqual([]);
  });
}

test('IconLabel renders the pinned node order, separators and highlight ranges', async ({ context }) => {
  const { pages, errors } = await pair(context);
  const [reference, vue] = await Promise.all(pages.map(labels));

  // The name container always comes first, then the suffix container (`dom.after(nameContainer)`),
  // then the description container (appended last): `description-suffix` proves the order.
  expect(pick(reference, 'plain').tree).toBe('<div.monaco-icon-label-container>[<span.monaco-icon-name-container>[<a.label-name>[#text:index.ts]]]');
  expect(pick(reference, 'description-suffix').containerChildren).toBe('monaco-icon-name-container|monaco-icon-suffix-container|monaco-icon-description-container');
  expect(pick(reference, 'description-suffix').tree).toBe('<div.monaco-icon-label-container>[<span.monaco-icon-name-container>[<a.label-name>[#text:index.ts]],<span.monaco-icon-suffix-container>[<span.label-suffix>[#text:M]],<span.monaco-icon-description-container>[<span.label-description>[#text:src/base]]]');
  expect(pick(reference, 'suffix').suffix).toBe('<span class="monaco-icon-suffix-container"><span class="label-suffix">modified</span></span>');

  // `Label` (no highlights, no icons) keeps the label as a text node and ignores `matches` entirely.
  expect(pick(reference, 'plain').counts).toBe('name=1;separator=0;highlight=0;codicon=0;description=0;suffix=0');
  expect(pick(reference, 'highlights').tree).toBe('<div.monaco-icon-label-container>[<span.monaco-icon-name-container>[<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:Button],#text:.tsx]]]]');
  // `supportHighlights` without `supportIcons`: `$(check)` stays literal text and the range over the
  // marker is highlighted as text.
  expect(pick(reference, 'icons-disabled').tree).toBe('<div.monaco-icon-label-container>[<span.monaco-icon-name-container>[<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:$(check)],#text: literal marker]]]]');
  expect(pick(reference, 'icons-disabled').counts).toBe('name=1;separator=0;highlight=1;codicon=0;description=0;suffix=0');
  // `supportIcons`: the markers become codicons, `~spin` keeps its modifier class.
  expect(pick(reference, 'icons').tree).toBe('<div.monaco-icon-label-container>[<span.monaco-icon-name-container>[<a.label-name>[<span.monaco-highlighted-label>[<span.codicon.codicon-check.codicon-colored>,#text: Sync ,<span.codicon.codicon-sync.codicon-modifier-spin.codicon-colored>,#text: done]]]]');
  expect(pick(reference, 'icons-highlights').tree).toBe('<div.monaco-icon-label-container>[<span.monaco-icon-name-container>[<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[<span.codicon.codicon-file.codicon-colored>],#text: ,<span.highlight>[#text:button],#text:.ts]]]]');
  expect(pick(reference, 'icons-highlights').counts).toBe('name=1;separator=0;highlight=2;codicon=1;description=0;suffix=0');

  // A multi-part label renders one anchor per part. `Label` puts the separators next to the anchors,
  // `LabelWithHighlights` puts them *inside* the anchor behind the highlighted label.
  expect(pick(reference, 'multi').name).toBe('<a.label-name>[#text:src],<span.label-separator>[#text:/],<a.label-name>[#text:components],<span.label-separator>[#text:/],<a.label-name>[#text:button.ts]');
  expect(pick(reference, 'multi').nameContainerClass).toBe('monaco-icon-name-container multiple');
  expect(pick(reference, 'multi-separator').name).toBe('<a.label-name>[#text:src],<span.label-separator>[#text:\u203a],<a.label-name>[#text:components],<span.label-separator>[#text:\u203a],<a.label-name>[#text:button.ts]');
  expect(pick(reference, 'multi-highlights').name).toBe('<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:src]],<span.label-separator>[#text:/]],<a.label-name>[<span.monaco-highlighted-label>[#text:c,<span.highlight>[#text:ompon],#text:ents],<span.label-separator>[#text:/]],<a.label-name>[<span.monaco-highlighted-label>[#text:b,<span.highlight>[#text:utton.],#text:ts]]');
  // `splitMatches` rebases the caller's ranges per part; the range that covers the `$(file)` marker
  // of the second part renders the codicon inside the highlight run.
  expect(pick(reference, 'multi-highlights').counts).toBe('name=3;separator=2;highlight=3;codicon=0;description=0;suffix=0');
  expect(pick(reference, 'multi-highlights-icons').name).toBe('<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:src]],<span.label-separator>[#text:/]],<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[<span.codicon.codicon-file.codicon-colored>],#text: button.ts]]');

  // `domId` becomes the single anchor's id, or `<id>_<index>` per part of a multi-part label.
  expect(pick(reference, 'multi-domId').ids).toBe('explorer-item_0|explorer-item_1');
  const anchors = await labelOf(pages[0], 'multi-domId').locator('a.label-name').evaluateAll(elements => elements.map(anchor => ({
    id: anchor.id, count: anchor.getAttribute('data-icon-label-count'), index: anchor.getAttribute('data-icon-label-index'), role: anchor.getAttribute('role'),
  })));
  expect(anchors).toEqual([
    { id: 'explorer-item_0', count: '2', index: '0', role: 'treeitem' },
    { id: 'explorer-item_1', count: '2', index: '1', role: 'treeitem' },
  ]);
  // A single label carries no `data-icon-label-*` and no role at all.
  expect(await labelOf(pages[0], 'plain').locator('a.label-name').evaluate(anchor => ({
    id: anchor.id, count: anchor.getAttribute('data-icon-label-count'), index: anchor.getAttribute('data-icon-label-index'), role: anchor.getAttribute('role'),
  }))).toEqual({ id: '', count: null, index: null, role: null });

  // `labelEscapeNewLines`: only the highlighted builders and the description escape their text.
  expect(pick(reference, 'escape-highlights').name).toBe('<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:one],#text:\u23CEtwo]]');
  expect(pick(reference, 'escape-description').description).toBe('<span class="monaco-icon-description-container"><span class="label-description"><span class="monaco-highlighted-label"><span class="highlight">a\u23CEb</span></span></span></span>');

  // `title`: a string is the accessible name, a markdown tooltip leaves it at the label. The label is
  // `'' + label`, so a multi-part label joins with commas.
  expect(pick(reference, 'title-text').ariaLabel).toBe('Show in Explorer');
  expect(pick(reference, 'title-markdown').ariaLabel).toBe('index.ts');
  expect(pick(reference, 'title-markdown-multi').ariaLabel).toBe('src,button.ts');
  expect(pick(reference, 'plain').ariaLabel, 'no title leaves an empty aria-label').toBe('');

  // The leading icon slot is `prepend`ed before the container: a ThemeIcon as a codicon, a URI as a
  // background image; `hideIcon` is never read by the pinned implementation.
  expect(pick(reference, 'icon-theme').rootChildren).toBe('monaco-icon-label-iconpath codicon codicon-file-code|monaco-icon-label-container');
  expect(pick(reference, 'icon-uri').rootChildren).toBe('monaco-icon-label-iconpath|monaco-icon-label-container');
  expect(pick(reference, 'icon-uri').iconStyle).toBe('background-image: url("file:///icons/folder.svg"); background-repeat: no-repeat; background-position: center center; background-size: contain;');
  expect(withoutKey(pick(reference, 'hide-icon')), 'hideIcon does not change the DOM').toEqual(withoutKey(pick(reference, 'icon-theme')));

  // `extraClasses` lands on the root, `disabledCommand` on the container.
  expect(pick(reference, 'tree-row').rootClass).toBe('monaco-icon-label custom-view-tree-node-item-resourceLabel');
  expect(pick(reference, 'disabled').containerClass).toBe('monaco-icon-label-container disabled');
  expect(pick(reference, 'description-highlights').description).toBe('<span class="monaco-icon-description-container"><span class="label-description"><span class="monaco-highlighted-label"><span class="highlight">src</span>/<span class="highlight">base</span>/browser</span></span></span>');

  // Both pages agree on all of it.
  expect(vue).toEqual(reference);
  expect(errors).toEqual([]);
});

test('IconLabel computed styles follow the pinned workbench rules', async ({ context }) => {
  const light = await pair(context, 'light');
  const [referenceLight, vueLight] = await Promise.all(light.pages.map(styleState));
  expect(vueLight).toEqual(referenceLight);
  // The `.vs` (light) rule raises the description to 0.95; the replica aliases it from its own theme
  // root. A focused or selected list row wins over both with opacity 1.
  expect(referenceLight['description']!.opacity).toBe('0.95');
  expect(referenceLight['description-suffix']!.opacity).toBe('0.95');
  expect(referenceLight['tree-row']!.opacity).toBe('1');
  expect(referenceLight['tree-selected']!.opacity).toBe('1');

  const dark = await pair(context, 'dark');
  const [reference, vue] = await Promise.all(dark.pages.map(styleState));
  expect(vue).toEqual(reference);
  expect(reference['description']!.opacity).toBe('0.7');
  expect(reference['description']!.fontSize).toBe('11.7px');
  expect(reference['description']!.marginLeft).toBe('5.85px');
  expect(reference['description-suffix']!.opacity).toBe('0.7');
  expect(reference['suffix']!.opacity).toBe('0.7');
  // `.monaco-list-row.focused/.selected` raises the description to full opacity.
  expect(reference['tree-row']!.opacity).toBe('1');
  expect(reference['tree-selected']!.opacity).toBe('1');

  // `disabledCommand` colours the whole container with the disabled foreground token.
  const token = await dark.pages[0].evaluate(() => getComputedStyle(document.querySelector('[data-key="disabled"] .monaco-icon-label')!).getPropertyValue('--vscode-disabledForeground').trim());
  expect(token).toBe('rgba(204, 204, 204, 0.5)');
  expect(reference['disabled-container']!.color).toBe('rgba(204, 204, 204, 0.5)');
  expect(reference['disabled-container']!.opacity, 'disabled uses the colour token, not opacity').toBe('1');
  // The description keeps its own opacity inside the disabled container.
  expect(reference['disabled-description']!.opacity).toBe('0.7');

  // Bold / italic / strikethrough only touch the text of the three label nodes.
  expect(reference['bold-name']!.fontWeight, 'computed weight of `bold`').toBe('700');
  expect(reference['italic-name']!.fontStyle).toBe('italic');
  expect(reference['strikethrough-name']!.textDecorationLine).toBe('line-through');
  expect(reference['bold-name']!.fontStyle).toBe('normal');
  expect(reference['italic-name']!.textDecorationLine).toBe('none');

  // Highlight runs: the list context uses `list.highlightForeground`, the filter-match context
  // (`pane-body .monaco-tl-contents`) keeps the inherited colour and paints the filter background.
  expect(reference['highlight-list']!.color).toBe('rgb(42, 170, 255)');
  expect(reference['highlight-list']!.outlineStyle).toBe('none');
  expect(reference['highlight-tree']!.color).toBe('rgb(42, 170, 255)');
  expect(reference['highlight-pane']!.color).toBe('rgb(204, 204, 204)');
  expect(reference['highlight-pane']!.backgroundColor).toBe('rgba(234, 92, 0, 0.33)');
  expect(reference['highlight-pane']!.outlineOffset).toBe('-1px');
  expect(reference['highlight-pane-icons']!.backgroundColor).toBe('rgba(234, 92, 0, 0.33)');

  // The `::before` icon slot of the pinned stylesheet: 16×22, 6px right padding, a 16px background.
  const before = reference['icon-slot']!;
  expect(before.width).toBe('16px');
  expect(before.height).toBe('22px');
  expect(before.paddingRight).toBe('6px');
  expect(before.backgroundSize).toBe('16px auto');
  expect(before.backgroundPosition, 'computed value of `left center`').toBe('0% 50%');
  expect(before.backgroundRepeat).toBe('no-repeat');
  // `display: inline-block` is blockified because the pseudo element is a flex item.
  expect(['inline-block', 'block']).toContain(before.display);
  // A ThemeIcon paints through the codicon font, a URI through the background image.
  expect(reference['icon-theme']!.backgroundImage).toBe('none');
  expect(reference['icon-uri']!.backgroundImage).toContain('file:///icons/folder.svg');
  expect(reference['icon-uri']!.backgroundSize).toBe('contain');

  // Both name builders keep `white-space: pre` on the anchor, like the description node.
  expect(reference['name-plain']!.whiteSpace).toBe('pre');
  expect(reference['name-highlighted']!.whiteSpace).toBe('pre');
  expect(reference['description']!.whiteSpace).toBe('pre');
});

test('IconLabel setLabel short-circuits equal data and rebuilds changed data', async ({ context }, info) => {
  const { pages, errors } = await pair(context);
  const timelines = await pages[0].evaluate(() => Object.keys((window as any).iconLabelSteps));
  expect(timelines).toEqual(['dynamic', 'description-dynamic']);

  const recorded: Record<string, { reference: IconLabelStep; vue: IconLabelStep }[]> = {};
  for (const timeline of timelines) {
    const length = await pages[0].evaluate(timeline => (window as any).iconLabelSteps[timeline].length, timeline);
    expect(length, `${timeline}: timeline length`).toBe(stepLists[timeline]!.length);
    recorded[timeline] = [];
    for (let index = 0; index < length; index++) {
      recorded[timeline]!.push({ reference: await step(pages[0], timeline, index), vue: await step(pages[1], timeline, index) });
    }
    expect(recorded[timeline]!.map(({ vue: result }) => result.snapshot), `${timeline}: snapshots`).toEqual(recorded[timeline]!.map(({ reference: result }) => result.snapshot));
    expect(recorded[timeline]!.map(({ vue: result }) => result.newNode), `${timeline}: rebuild pattern`).toEqual(recorded[timeline]!.map(({ reference: result }) => result.newNode));
  }

  const dynamic = recorded.dynamic!.map(({ reference: result }) => result);
  const description = recorded['description-dynamic']!.map(({ reference: result }) => result);
  // 0 = the name node survived, 1 = the anchors were recreated.
  expect(dynamic.map(result => result.newNode ? 1 : 0).join('')).toBe('0000011111111001');
  expect(description.map(result => result.newNode ? 1 : 0).join('')).toBe('0000');

  // Steps 1-5 change options of a *string* label: the builder runs, but `if (!this.singleLabel)`
  // keeps the anchor, so the very same DOM node survives.
  for (const index of [0, 1, 3, 4]) {
    expect(dynamic[index]!.newNode, `step ${index + 1} keeps the anchor`).toBe(false);
  }
  // Step 3 repeats step 2 byte for byte: `this.label === label` plus `objects.equals(options)` skip
  // the builder, so no node is touched at all.
  expect(dynamic[2]!.snapshot.html).toBe(dynamic[1]!.snapshot.html);
  expect(dynamic[2]!.snapshot.tree).toBe(dynamic[1]!.snapshot.tree);
  // Step 5 clears the description of the highlighted builder: the node stays, the text becomes empty.
  expect(dynamic[4]!.snapshot.description).toBe('<span class="monaco-icon-description-container"><span class="label-description"><span class="monaco-highlighted-label"></span></span></span>');
  expect(dynamic[4]!.snapshot.suffix).toBe('<span class="monaco-icon-suffix-container"><span class="label-suffix"></span></span>');
  // Step 6 switches to a multi-part label: `container.textContent = ''` rebuilds every anchor and
  // `LabelWithHighlights` moves the separators inside them.
  expect(dynamic[5]!.newNode).toBe(true);
  expect(dynamic[5]!.snapshot.nameContainerClass).toBe('monaco-icon-name-container multiple');
  expect(dynamic[5]!.snapshot.ids).toBe('dynamic-item_0|dynamic-item_1|dynamic-item_2');
  expect(dynamic[5]!.snapshot.name).toBe('<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:src]],<span.label-separator>[#text:\u203a]],<a.label-name>[<span.monaco-highlighted-label>[#text:co,<span.highlight>[#text:mponents]],<span.label-separator>[#text:\u203a]],<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:b],#text:utton.ts]]');
  // Step 7 hands in a fresh array with the same parts: `this.label === label` fails, so it rebuilds
  // again even though the rendered text is identical.
  expect(dynamic[6]!.newNode, 'a fresh array of equal parts rebuilds').toBe(true);
  expect(dynamic[6]!.snapshot.name).toBe(dynamic[5]!.snapshot.name);
  // Step 8 adds a highlighted description; step 13 switches back to a string label.
  expect(dynamic[7]!.snapshot.description).toContain('<span class="highlight">base</span>');
  expect(dynamic[12]!.newNode, 'an array to string rebuilds').toBe(true);
  expect(dynamic[12]!.snapshot.nameContainerClass).toBe('monaco-icon-name-container');
  expect(dynamic[12]!.snapshot.name).toBe('<a.label-name>[<span.monaco-highlighted-label>[<span.highlight>[#text:one],#text:\u23CEtwo]]');
  // Steps 14-16 only change the tooltip: the anchor of a string label survives, and the markdown
  // branch keeps the raw label (not the escaped text) as the accessible name.
  expect(dynamic[13]!.newNode).toBe(false);
  expect(dynamic[13]!.snapshot.ariaLabel).toBe('Show in Explorer');
  expect(dynamic[14]!.snapshot.ariaLabel).toBe('one\r\ntwo');
  expect(dynamic[15]!.newNode, 'a string to array rebuilds').toBe(true);

  // The plain-description timeline: `FastLabelNode.empty` keeps the node and writes `margin-left`.
  expect(description[0]!.snapshot.descriptionStyle, 'a filled description has no inline style').toBeNull();
  expect(description[1]!.snapshot.description).toBe('<span class="monaco-icon-description-container"><span class="label-description" style="margin-left: 0px;"></span></span>');
  // Writing `''` back leaves the (now empty) style attribute in place, exactly like upstream.
  expect(description[2]!.snapshot.descriptionStyle).toBe('');
  expect(description[2]!.snapshot.description).toBe('<span class="monaco-icon-description-container"><span class="label-description" style="">src/editor</span></span>');
  // The plain builder never escapes: the name keeps its CR/LF while the description escapes.
  expect(description[3]!.snapshot.name).toBe('<a.label-name>[#text:one\r\ntwo]');
  expect(description[3]!.snapshot.description).toContain('>a\u23CEb<');

  // The canvas after both timelines: same pixels, with the animation pinned again.
  await Promise.all(pages.map(freeze));
  await pixels(pages, info, 'after-steps');
  expect(errors).toEqual([]);
});

test('IconLabel icon slot switches, keeps stale classes and is removed again', async ({ context }) => {
  const { pages, errors } = await pair(context);
  // Steps 9-11 of the name timeline drive `iconPath`: ThemeIcon, then URI, then unset. Each step is
  // applied on both pages and compared, so the "a URI keeps the previous class list" quirk is covered.
  const icons: { icon: string | null; style: string | null }[][] = [[], []];
  for (const [pageIndex, page] of pages.entries()) {
    for (const index of [8, 9, 10]) {
      const result = await step(page, 'dynamic', index);
      icons[pageIndex]!.push({ icon: result.snapshot.icon, style: result.snapshot.iconStyle });
    }
  }
  expect(icons[1]).toEqual(icons[0]);
  expect(icons[0]![0]).toEqual({
    icon: '<div class="monaco-icon-label-iconpath codicon codicon-file-code" style="background-repeat: no-repeat; background-position: center center; background-size: contain;"></div>',
    style: 'background-repeat: no-repeat; background-position: center center; background-size: contain;',
  });
  // The URI branch only writes the background image: the codicon classes of the ThemeIcon stay.
  expect(icons[0]![1]!.icon).toContain('class="monaco-icon-label-iconpath codicon codicon-file-code"');
  expect(icons[0]![1]!.icon).toContain('background-image');
  expect(icons[0]![2]).toEqual({ icon: null, style: null });

  // The static rows: a ThemeIcon, a URI, and no icon slot at all when `iconPath` is unset.
  const [reference, vue] = await Promise.all(pages.map(labels));
  // The URI branch writes `background-image` first on a fresh node, so it also leads the inline style.
  expect(pick(reference, 'icon-uri').icon).toBe('<div class="monaco-icon-label-iconpath" style="background-image: url(&quot;file:///icons/folder.svg&quot;); background-repeat: no-repeat; background-position: center center; background-size: contain;"></div>');
  expect(pick(reference, 'icon-uri').iconStyle).toBe('background-image: url("file:///icons/folder.svg"); background-repeat: no-repeat; background-position: center center; background-size: contain;');
  expect(pick(reference, 'plain').icon).toBeNull();
  // The URI is escaped by `CSS.escape` and wrapped in `url('…')`, exactly like `cssValue.asCSSUrl`.
  expect(await labelOf(pages[1], 'icon-uri').locator('.monaco-icon-label-iconpath').evaluate(element => element.style.backgroundImage))
    .toBe(await labelOf(pages[0], 'icon-uri').locator('.monaco-icon-label-iconpath').evaluate(element => element.style.backgroundImage));
  expect(vue).toEqual(reference);
  expect(errors).toEqual([]);
});

test('IconLabel installs no tooltip and carries the correct accessible name', async ({ context }) => {
  const { pages, errors } = await pair(context);
  for (const [index, page] of pages.entries()) {
    const side = index ? 'replica' : 'original';
    // The original hands the hover text to `setupManagedHover`; without a hover service the DOM keeps
    // no `title` at all. The replica does not add one either — asserted, not normalized away.
    expect(await page.locator('[data-testid="specimen"] [title]').count(), `${side}: no title attribute`).toBe(0);
    await expect(labelOf(page, 'title-text')).toHaveAttribute('aria-label', 'Show in Explorer');
    await expect(labelOf(page, 'title-markdown')).toHaveAttribute('aria-label', 'index.ts');
    await expect(labelOf(page, 'plain')).toHaveAttribute('aria-label', '');
  }
  // The hover text really is registered by the original (`customHovers`) and released on dispose.
  expect(await pages[0].evaluate(() => (window as any).fixtureState.dispose.hoverBefore)).toBe(1);
  expect(await pages[0].evaluate(() => (window as any).fixtureState.dispose.hoverAfter)).toBe(0);
  expect(errors).toEqual([]);
});

test('IconLabel mounts and unmounts on the replica without leaving anything behind', async ({ context }) => {
  // The original cannot be unmounted, so this covers the replica's side of `dispose()`: Vue's unmount
  // is the counterpart of the original's teardown, and it has to be repeatable and side-effect free.
  const { pages, errors } = await pair(context);
  const probe = (index: number, mounted: boolean) => pages[index]!.evaluate(
    mounted => (window as any).iconLabelFixture.probe(mounted), mounted);
  expect(await pages[0]!.evaluate(() => typeof (window as any).iconLabelFixture.probe), 'the original has no probe').toBe('undefined');
  const before = await probe(1, true);
  expect(before).toBeTruthy();
  expect(await probe(1, false), 'the unmounted probe is gone').toBeNull();
  expect(await pages[1]!.locator('[data-testid="probe"] .monaco-icon-label').count()).toBe(0);
  expect(await probe(1, true), 'a remount renders the same DOM').toEqual(before);
  expect(await pages[1]!.locator('[data-testid="probe"] .monaco-icon-label').count()).toBe(1);
  expect(errors).toEqual([]);
});

test('IconLabel keeps the pinned workbench source contract', async () => {
  const component = readFileSync(resolve(process.cwd(), 'src/components/icon-label/IconLabel.vue'), 'utf8');
  const helper = readFileSync(resolve(process.cwd(), 'src/components/icon-label/iconLabel.ts'), 'utf8');
  const theme = readFileSync(resolve(process.cwd(), 'src/components/icon-label/iconLabelTheme.css'), 'utf8');
  const upstream = readFileSync(resolve(process.cwd(), '../vscode/src/vs/base/browser/ui/iconLabel/iconlabel.css'), 'utf8');
  const copy = readFileSync(resolve(process.cwd(), 'src/components/icon-label/iconlabel.css'), 'utf8');
  expect(copy, 'iconlabel.css is a verbatim copy').toBe(upstream);
  for (const source of [component, helper]) {
    // Only the upstream file names may be mentioned, in provenance comments; nothing is imported
    // from the clone and no path into it is left behind.
    expect(source, 'no clone path in the component source').not.toContain('vscode/');
    expect(source, 'no clone import').not.toMatch(/from\s+['"][^'"]*vs\/base/);
  }
  // The replica adds no native tooltip: `title` is read for the accessible name only, and the light
  // alias is scoped to the replica theme root.
  expect(component, 'the title prop is only read for the aria-label').toContain('ariaLabel += typeof props.title');
  expect(component, 'no title attribute binding').not.toMatch(/['"]title['"]\s*:/);
  expect(theme, 'the .vs alias for the light theme').toContain('.vc-theme[data-theme="light"] .monaco-icon-label .label-description');
  // The separator default, the icon slot class and the re-used components come from the original.
  expect(component).toContain("props.separator || '/'");
  expect(component).toContain('monaco-icon-label-iconpath');
  expect(helper, 'splitMatches keeps the separator length in the running offset').toContain('labelRange.end + separator.length');
  expect(component).toContain("import HighlightedLabel from '../highlighted-label/HighlightedLabel.vue'");
  expect(component).toContain("from '../codicon/icons'");
});
