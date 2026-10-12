import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const original = (theme: string) => `${process.env.REFERENCE_URL ?? '/reference/index.html'}?kind=highlighted-label&theme=${theme}`;
const replica = (theme: string) => `/iframe.html?id=components-highlighted-label--specimen&viewMode=story&globals=theme:${theme}`;

async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(original(theme));
  await pages[1].goto(replica(theme));
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(async () => { await document.fonts.load('16px codicon'); await document.fonts.ready; });
  }
  expect(errors).toEqual([]);
  return pages;
}

/** Zero-tolerance comparison of the whole deterministic canvas across both pages. */
async function pixels(pages: Page[], info: TestInfo, name: string) {
  const buffers: Buffer[] = [];
  for (const page of pages) { await page.bringToFront(); buffers.push(await page.getByTestId('specimen').screenshot({ animations: 'disabled' })); }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}

/** The fixture state each page publishes: DOM structure, highlight ranges and render counts. */
async function state(page: Page) {
  return page.evaluate(() => {
    const { labels, labelsDetail, propsHighlights, workingHighlights, expectedHighlights, renderCounts, titles } = (window as any).fixtureState;
    return { labels, labelsDetail, propsHighlights, workingHighlights, expectedHighlights, renderCounts, titles };
  });
}

/** Applies one dynamic step on one page and returns the state it recorded for that step. */
async function step(page: Page, index: number) {
  return page.evaluate(async (index: number) => {
    const updates = (window as any).highlightedLabelSteps;
    const handle = (window as any).highlightedLabelHandle;
    const change = await handle.set(updates[index]);
    return { snapshot: change.snapshot, count: handle.renderCount(), total: change.states.length };
  }, index);
}

const labelOf = (page: Page, key: string) => page.locator(`[data-key="${key}"] .monaco-highlighted-label`);
const spansOf = (page: Page, key: string) => page.locator(`[data-key="${key}"] .monaco-highlighted-label > span`);
const stylesOf = (page: Page, key: string) => page.evaluate((key: string) => {
  const label = document.querySelector(`[data-key="${key}"] .monaco-highlighted-label`)!;
  const span = label.querySelector('.highlight')!;
  const style = getComputedStyle(span);
  return {
    color: style.color, backgroundColor: style.backgroundColor,
    outlineColor: style.outlineColor, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset,
  };
}, key);

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Highlighted label visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'initial');
    // Every observable property of the initial canvas, page by page. Three intentional differences
    // are dropped here and covered by the dedicated tests below: the caller's ranges after escaping
    // (the original rewrites the array it was handed), the render counters, and the `title`
    // attribute (the original keeps the hover text inside its managed hover).
    // The specimen also publishes its dynamic row in the per-row maps; the fixture keeps that row
    // separate, so the comparison is limited to the shared row keys.
    const [reference, vue] = await Promise.all(pages.map(state));
    const rows = Object.keys(reference.renderCounts);
    const onlySharedRows = (source: typeof reference) => ({
      labels: source.labels,
      labelsDetail: Object.fromEntries(rows.map(key => [key, source.labelsDetail[key]])),
      propsHighlights: Object.fromEntries(rows.map(key => [key, source.propsHighlights[key]])),
      workingHighlights: Object.fromEntries(rows.map(key => [key, source.workingHighlights[key]])),
      expectedHighlights: Object.fromEntries(rows.map(key => [key, source.expectedHighlights[key]])),
      renderCounts: Object.fromEntries(rows.map(key => [key, source.renderCounts[key]])),
      titles: Object.fromEntries(rows.map(key => [key, source.titles[key]])),
    });
    // Intentional differences dropped here and covered by the dedicated tests below: the caller's
    // ranges after escaping (the original rewrites the array it was handed), the render counters,
    // and the `title` attribute (the original keeps the hover text inside its managed hover).
    const normalize = (value: unknown): unknown => Array.isArray(value)
      ? value.map(normalize)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value as Record<string, unknown>)
          .filter(([key]) => !['title', 'propsHighlights', 'renderCount', 'renderCounts', 'newNode'].includes(key))
          .map(([key, entry]) => [key, normalize(entry)]))
        : typeof value === 'string' ? value.replace(/ title="[^"]*"/, '') : value;
    expect(normalize(onlySharedRows(vue))).toEqual(normalize(onlySharedRows(reference)));
  });
}

test('HighlightedLabel DOM, ranges, icons and styles match the pinned workbench', async ({ context }) => {
  const pages = await pair(context);
  const [reference, vue] = await Promise.all(pages.map(state));

  // Every row renders the same text, the same node sequence and the same span classes. Two
  // intentional differences are asserted on their own below: `propsHighlights` of an escaped row
  // (the original rewrites the array it was handed) and the render counters, which the fixture
  // derives from node identity while the replica counts its own `render()` calls.
  const nodeState = (detail: Record<string, Record<string, unknown>[]>) => Object.fromEntries(
    Object.entries(detail).map(([key, snapshots]) => [key, snapshots.map(({ propsHighlights, newNode, renderCount, ...rest }) => { void propsHighlights; void newNode; void renderCount; const html = String(rest.html ?? ''); return { ...rest, html: html.replace(/ title="[^"]*"/, '') }; })]),
  );
  expect(vue.labels).toEqual(reference.labels);
  expect(nodeState(vue.labelsDetail)).toEqual(nodeState(reference.labelsDetail));
  expect(vue.workingHighlights).toEqual(reference.workingHighlights);
  expect(vue.expectedHighlights).toEqual(reference.expectedHighlights);
  // No row carries a DOM title: the original keeps the hover text inside its managed hover. The
  // replica has no hover service and maps `title` onto the root node; asserted in its own test.
  expect(reference.titles).toEqual(Object.fromEntries(Object.keys(reference.titles).map(key => [key, null])));
  expect(Object.entries(vue.titles).filter(([key]) => key !== 'title')).toEqual(
    Object.entries(reference.titles).filter(([key]) => key !== 'title'));
  // An empty label renders no children at all, so the first `set()` still finds no first child.
  expect(reference.labelsDetail.empty[0].nodes).toBe('');
  expect(reference.labelsDetail.empty[0].newNode).toBe(false);
  expect(vue.labelsDetail.empty[0].nodes).toBe('');

  const nodes = Object.fromEntries(reference.labels.map(({ key, nodes }: { key: string; nodes: string }) => [key, nodes]));
  expect(nodes.empty).toBe('');
  expect(nodes.plain).toBe('#text:No highlights');
  expect(nodes.single).toBe('#text:Single ,<span class="highlight">highlight</>');
  expect(nodes.multi).toBe('<span class="highlight">alpha</>,#text: ,<span class="highlight">beta</>,#text: ,<span class="highlight">gamma</>');
  expect(nodes.classes).toBe('<span class="highlight nowrap label-name">Extra</>,#text: ,<span class="highlight">classes</>');
  expect(nodes.adjacent).toBe('<span class="highlight">ab</>,<span class="highlight">cd</>,<span class="highlight">ef</>');
  // Overlapping ranges are clipped by the running `pos`, exactly like the original.
  expect(nodes.overlap).toBe('<span class="highlight">abc</>,<span class="highlight">de</>,#text:f');
  // Zero-length ranges produce no span at all, not an empty one.
  expect(nodes.zero).toBe('#text:Zero ,<span class="highlight">length</>');
  // `supportIcons` splits the surrounding text and the highlight run into icons and text nodes.
  expect(nodes.icons).toBe('<span class="highlight"></>,#text: Sync ,<span class="codicon codicon-sync codicon-modifier-spin codicon-colored"></>,#text: done');
  // `escapeNewLines` replaces CRLF/CR/LF with `⏎` and shifts the ranges.
  expect(nodes.crlf).toBe('<span class="highlight">a⏎b</>');
  expect(nodes.cr).toBe('<span class="highlight">a⏎b</>');
  expect(nodes.lf).toBe('<span class="highlight">a⏎b</>');
  expect(nodes.title).toBe('<span class="highlight">Titled</>');

  for (const page of pages) {
    const label = labelOf(page, 'icons');
    await expect(label).toHaveClass('monaco-highlighted-label');
    // The root is a plain span: no role, no tab stop, no aria attributes.
    await expect(label).not.toHaveAttribute('role', /.*/);
    await expect(label).not.toHaveAttribute('tabindex', /.*/);
    await expect(label).not.toHaveAttribute('aria-label', /.*/);
    await expect(labelOf(page, 'single')).not.toHaveAttribute('title', /.*/);
    // `span.highlight` carries the extra classes; the codicon keeps the pinned class list.
    await expect(spansOf(page, 'classes').first()).toHaveClass('highlight nowrap label-name');
    await expect(spansOf(page, 'classes').nth(1)).toHaveClass('highlight');
    // The icon that sits in the highlight run is a child of that run, like the original's dom.$.
    await expect(spansOf(page, 'icons').first()).toHaveClass('highlight');
    await expect(page.locator('[data-key="icons"] .highlight > .codicon').first()).toHaveClass('codicon codicon-check codicon-colored');
    await expect(page.locator('[data-key="icons"] .monaco-highlighted-label > .codicon').first()).toHaveClass('codicon codicon-sync codicon-modifier-spin codicon-colored');
    await expect(page.locator('[data-key="zero"] .highlight')).toHaveCount(1);
    await expect(page.locator('[data-key="zero"] .highlight')).not.toHaveClass(/skipped/);
    await expect(labelOf(page, 'empty')).toHaveText('');
    await expect(labelOf(page, 'plain')).toHaveText('No highlights');
  }

  // Only the replica maps the `title` prop onto the root node; the original keeps it in its hover.
  await expect(labelOf(pages[1], 'title')).toHaveAttribute('title', 'Managed hover title');
  await expect(labelOf(pages[0], 'title')).not.toHaveAttribute('title', /.*/);

  // `escapeNewLines` rewrites the caller's array in the original; the replica must leave it alone.
  for (const [index, page] of pages.entries()) {
    const { propsHighlights, workingHighlights, expectedHighlights } = await state(page);
    expect(workingHighlights, `${index ? 'replica' : 'original'} rendered ranges`).toEqual(expectedHighlights);
    if (index === 0) {
      // The original adjusts the array it was handed: `{0,4}` over `a\r\nb` becomes `{0,3}`.
      expect(propsHighlights['crlf']).toBe('0-3');
      expect(propsHighlights['crlf-range']).toBe('0-3,4-7,8-13');
      expect(propsHighlights['cr']).toBe('0-3');
      expect(propsHighlights['lf']).toBe('0-3');
      // Ranges before the break are untouched, and `\r`/`\n` alone only shift by the match length.
      expect(propsHighlights.single).toBe('7-16');
      expect(propsHighlights.multi).toBe('0-5,6-10,11-16');
    } else {
      // The replica escapes a copy, so the props the caller passed stay exactly as given.
      expect(propsHighlights['crlf']).toBe('0-4');
      expect(propsHighlights['crlf-range']).toBe('0-4,5-9,10-15');
      expect(propsHighlights['cr']).toBe('0-3');
      expect(propsHighlights['lf']).toBe('0-3');
    }
  }

  // Context colours: list rows use `list.highlightForeground`, filtered tree rows `list.filterMatch*`.
  const keys = ['single', 'pane', 'pane-focused'];
  const referenceStyles = await Promise.all(keys.map(key => stylesOf(pages[0], key)));
  const vueStyles = await Promise.all(keys.map(key => stylesOf(pages[1], key)));
  expect(vueStyles).toEqual(referenceStyles);
  const [list, filter, filterFocused] = referenceStyles;
  expect(list.color).not.toBe('rgb(204, 204, 204)');
  expect(list.outlineStyle).toBe('none');
  expect(filter.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  //  declares the outline through the shorthand with an unresolved variable, and the
  // list rules above it set a width without a style, so the used value keeps
  // while the offset still comes from the filter context. Both pages must agree on that.
  expect(filter.outlineOffset).toBe('-1px');
  // The filter context wins over the focused list row, on both pages.
  expect(filterFocused).toEqual(filter);
});

test('HighlightedLabel set() short-circuits unchanged data and re-renders changed data', async ({ context }) => {
  const pages = await pair(context);
  const steps = await pages[0].evaluate(() => (window as any).highlightedLabelSteps.length);
  expect(steps).toBe(8);
  const recorded = [];
  for (let index = 0; index < steps; index++) {
    recorded.push({ reference: await step(pages[0], index), vue: await step(pages[1], index) });
  }
  // Identical recorded sequence on both pages: text, nodes, classes, rendered ranges and counts.
  // `propsHighlights` is excluded on purpose: the original rewrites the caller's array while
  // escaping, and the replica leaves it untouched; that difference is asserted separately below.
  // The replica maps  onto the root node; the original keeps it in its managed hover, so the
  // attribute is stripped before the sequences are compared and asserted in its own test.
  const withoutProps = (result: { snapshot: Record<string, unknown> }) => {
    const { propsHighlights, html, ...rest } = result.snapshot;
    void propsHighlights;
    return { ...rest, html: String(html).replace(/ title="[^"]*"/, '') };
  };
  expect(recorded.map(({ vue: result }) => withoutProps(result))).toEqual(recorded.map(({ reference: result }) => withoutProps(result)));
  for (const [index, { reference, vue }] of recorded.entries()) {
    expect(vue.count, `step ${index + 1} render count`).toBe(reference.count);
  }
  // Steps 1-3 change text, title and text again, so every one of them rebuilds the label.
  for (const index of [0, 1, 2]) {
    expect(recorded[index].reference.snapshot.newNode, `step ${index + 1} rebuilds`).toBe(true);
  }
  // Step 4 repeats step 3 byte for byte: `didEverRender` plus equal text/title/highlights skip the
  // render, so the child nodes are left in place and no new nodes are created.
  expect(recorded[3].reference.snapshot.newNode).toBe(false);
  expect(recorded[3].vue.snapshot.newNode).toBe(false);
  expect(recorded[3].reference.snapshot.nodes).toBe(recorded[2].reference.snapshot.nodes);
  expect(recorded[3].vue.snapshot.nodes).toBe(recorded[2].vue.snapshot.nodes);
  expect(recorded[3].reference.snapshot.renderCount).toBe(recorded[2].reference.snapshot.renderCount);
  expect(recorded[3].vue.snapshot.renderCount).toBe(recorded[2].vue.snapshot.renderCount);
  // Step 8 escapes new lines: `⏎` replaces CRLF and the highlight range shrinks on both pages.
  expect(recorded[7].reference.snapshot.text).toBe('a⏎b');
  expect(recorded[7].vue.snapshot.text).toBe('a⏎b');
  expect(recorded[7].reference.snapshot.highlights).toBe('0-3');
  expect(recorded[7].vue.snapshot.highlights).toBe('0-3');
  // The original rewrote the array it was handed, the replica left it at the caller's values.
  expect(recorded[7].reference.snapshot.propsHighlights).toBe('0-3');
  expect(recorded[7].vue.snapshot.propsHighlights).toBe('0-4');
  // The step whose highlight range covers the `$(check)` marker renders that icon inside the run.
  const icons = recorded.find(({ reference: result }) => String(result.snapshot.html).includes('codicon-check'));
  expect(icons, 'a step renders an icon inside a highlight').toBeTruthy();
  expect(String(icons!.reference.snapshot.html)).toContain('<span class="highlight"><span class="codicon codicon-check codicon-colored"></span></span>');
  expect(String(icons!.reference.snapshot.html)).toContain('amic ');
  expect(icons!.reference.snapshot.classes).toContain('codicon codicon-check codicon-colored');
  // Node identity: the short-circuit at step 5 leaves the very same first child in place and does
  // not touch the render count, while the next step that changes the ranges rebuilds the node.
  const identity = await Promise.all(pages.map(page => page.evaluate(async () => {
    const handle = (window as any).highlightedLabelHandle;
    const updates = (window as any).highlightedLabelSteps;
    await handle.set(updates[2]);
    await handle.set(updates[3]);
    const first = handle.element.firstChild;
    const count = handle.renderCount();
    await handle.set(updates[4]);
    const afterRepeat = handle.element.firstChild;
    const repeatedCount = handle.renderCount();
    const repeatedNode = handle.element.firstChild;
    await handle.set(updates[5]);
    return { sameOnRepeat: first === afterRepeat, sameCount: count === repeatedCount, sameAfterChange: repeatedNode === handle.element.firstChild };
  })));
  expect(identity[1]).toEqual(identity[0]);
  expect(identity[0]).toEqual({ sameOnRepeat: true, sameCount: true, sameAfterChange: false });
});

test('HighlightedLabel title prop: replica keeps a native title, the original only a managed hover', async ({ context }) => {
  const pages = await pair(context);
  // The original hands the hover text to `setupManagedHover`; with no hover service registered the
  // text never reaches the DOM. The replica has no hover service either and uses a native `title`
  // instead, the same fallback the other Classic components in this package document.
  const [reference, vue] = pages;
  await expect(labelOf(reference, 'title')).toHaveText('Titled');
  await expect(labelOf(reference, 'title')).not.toHaveAttribute('title', /.*/);
  expect(await reference.locator('.monaco-highlighted-label[title]').count()).toBe(0);
  await expect(labelOf(vue, 'title')).toHaveText('Titled');
  await expect(labelOf(vue, 'title')).toHaveAttribute('title', 'Managed hover title');
  expect(await vue.locator('.monaco-highlighted-label[title]').count()).toBe(1);
  // Both pages render the same nodes and text; only the tooltip carrier differs.
  expect(await labelOf(vue, 'title').evaluate(element => element.innerHTML))
    .toBe(await labelOf(reference, 'title').evaluate(element => element.innerHTML));
  // Step 2 sets a title, step 3 repeats the previous text without one.
  for (const page of pages) {
    await page.evaluate(async () => {
      const updates = (window as any).highlightedLabelSteps;
      const handle = (window as any).highlightedLabelHandle;
      await handle.set(updates[1]);
      await handle.set(updates[2]);
    });
    await expect(labelOf(page, 'dynamic')).toHaveText('Dynamic label');
  }
  await expect(labelOf(vue, 'dynamic')).not.toHaveAttribute('title', /.*/);
});
