import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { settleFixturePaint } from './paint';
test.use({ viewport: { width: 800, height: 700 } });
// Each theme test paints fifteen independent native/replica fixtures.
test.setTimeout(120000);
async function pair(context: BrowserContext, theme = 'dark', index = 0) {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages)
    page.on('pageerror', (error) => expect(error.message).toBe(''));
  await pages[0].goto(
    `/reference/index.html?kind=quick-pick&theme=${theme}&case=${index}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-quick-pick--specimen&viewMode=story&globals=theme:${theme}&case=${index}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.quick-input-widget')).toBeVisible();
  }
  return pages;
}
async function show(pages: Page[], index: number) {
  for (const page of pages)
    await page.evaluate(
      (index) => (window as any).fixtureOpenQuickPick(index),
      index,
    );
}
async function patch(pages: Page[], props: Record<string, unknown>) {
  for (const page of pages)
    await page.evaluate(
      (props) => (window as any).fixtureUpdateQuickPick(props),
      props,
    );
}
async function pixels(
  pages: Page[],
  info: TestInfo,
  name: string,
  settle = true,
) {
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront();
    await page.mouse.move(795, 695);
    if (settle) {
      await settleFixturePaint(page, 'filter');
      // Recreate the list's compositor layer after its row cache reuses templates.
      // The final focus, event log, DOM geometry and computed styles must be unchanged.
      const unchanged = await page.evaluate(async () => {
        const rows = [
          ...document.querySelectorAll<HTMLElement>(
            '.quick-input-list .monaco-list-rows',
          ),
        ];
        const styles = rows.map((row) => row.style.transform);
        const focused = document.activeElement;
        const events = JSON.stringify((window as any).fixtureState);
        const snapshot = () =>
          JSON.stringify(
            rows
              .flatMap((row) => [row, ...row.querySelectorAll('*')])
              .map((element) => {
                const style = getComputedStyle(element);
                return {
                  rect: element.getBoundingClientRect().toJSON(),
                  style: [...style]
                    .sort()
                    .map((key) => [key, style.getPropertyValue(key)]),
                };
              }),
          );
        const before = snapshot();
        const frame = () => new Promise(requestAnimationFrame);
        for (const row of rows) row.style.transform = 'none';
        await frame();
        await frame();
        rows.forEach((row, index) => {
          row.style.transform = styles[index];
        });
        await frame();
        await frame();
        return {
          focus: focused === document.activeElement,
          events: events === JSON.stringify((window as any).fixtureState),
          geometryAndStyle: before === snapshot(),
        };
      });
      expect(unchanged).toEqual({
        focus: true,
        events: true,
        geometryAndStyle: true,
      });
    }
    buffers.push(
      await page.screenshot({ caret: 'hide', animations: 'disabled' }),
    );
  }
  const [a, b] = buffers.map((buffer) => PNG.sync.read(buffer));
  expect([b.width, b.height]).toEqual([a.width, a.height]);
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0,
    includeAA: true,
  });
  if (count)
    for (const [suffix, body] of [
      ['original', buffers[0]],
      ['replica', buffers[1]],
      ['diff', PNG.sync.write(diff)],
    ] as const)
      await info.attach(`${name}-${suffix}`, {
        body,
        contentType: 'image/png',
      });
  expect(count, `${name} pixels`).toBe(0);
}

for (const theme of ['dark', 'light', 'hcDark', 'hcLight'])
  test(`QuickPick ${theme} default fixtures`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    for (const index of [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15]) {
      if (index) await show(pages, index);
      await pixels(pages, info, `${theme}-${index}`);
    }
  });
async function same(pages: Page[]) {
  for (const page of pages)
    await page.evaluate(async () => {
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    });
  const states = await Promise.all(
    pages.map((page) =>
      page.evaluate(() => {
        const root = document.querySelector<HTMLElement>(
          '.quick-input-widget',
        )!;
        const current = document.activeElement;
        return {
          events: Object.fromEntries(
            [
              'accepts',
              'hides',
              'buttons',
              'changes',
              'active',
              'selection',
              'itemButtons',
              'separatorButtons',
              'links',
            ].map((key) => [key, (window as any).fixtureState[key]]),
          ),
          model: (window as any).fixtureQuickPick.snapshot(),
          visible: !!root.offsetWidth,
          focus: current?.matches('input')
            ? 'input'
            : current?.matches('.monaco-list')
              ? 'list'
              : current?.getAttribute('aria-label') || current?.textContent,
          rows: [
            ...root.querySelectorAll('.quick-input-list .monaco-list-row'),
          ].map((row) => ({
            label: row.getAttribute('aria-label'),
            role: row.getAttribute('role'),
            checked:
              row.getAttribute('role') === 'checkbox'
                ? row.getAttribute('aria-checked')
                : undefined,
            focused: row.classList.contains('focused'),
          })),
        };
      }),
    ),
  );
  expect(states[1]).toEqual(states[0]);
}
async function press(pages: Page[], key: string) {
  for (const page of pages) await page.keyboard.press(key);
}
async function input(pages: Page[], text: string) {
  for (const page of pages)
    await page.locator('.quick-input-box input').fill(text);
}
async function api(pages: Page[], method: string, argument?: unknown) {
  for (const page of pages)
    await page.evaluate(
      ({ method, argument }) =>
        (window as any).fixtureQuickPick[method](argument),
      { method, argument },
    );
}
test('QuickPick single navigation, filtering and accept', async ({
  context,
}, info) => {
  const pages = await pair(context);
  await same(pages);
  for (const key of [
    'ArrowDown',
    'ArrowDown',
    'ArrowUp',
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
  ]) {
    await press(pages, key);
    await same(pages);
  }
  for (const query of ['op', 'sav', 'absent', '']) {
    await input(pages, query);
    await same(pages);
    await pixels(pages, info, `filter-${query}`);
  }
  await press(pages, 'ArrowDown');
  await press(pages, 'Enter');
  await same(pages);
});
test('QuickPick source fuzzy, contiguous and icon-aware matching', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 3);
  for (const query of [
    'fb',
    'FB',
    'f b',
    '*bar',
    ' foo ',
    '$(folder)',
    'third',
    'zz',
    '',
  ]) {
    await input(pages, query);
    await same(pages);
    await pixels(pages, info, `fuzzy-${query}`);
  }
  await patch(pages, { matchOnLabelMode: 'contiguous' });
  for (const query of ['bar', ' BAR', 'file', '']) {
    await input(pages, query);
    await same(pages);
  }
  await patch(pages, { matchOnDescription: true, matchOnDetail: true });
  await input(pages, 'third');
  await same(pages);
  await pixels(pages, info, 'detail-match');
});
test('QuickPick multi checkbox, filtered select all and keyboard', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 2);
  await same(pages);
  for (const page of pages)
    await page
      .locator('.quick-input-list-entry')
      .filter({ hasText: 'Open Folder' })
      .locator('.monaco-checkbox')
      .click();
  await same(pages);
  await pixels(pages, info, 'multi-check');
  await input(pages, 'New');
  for (const page of pages)
    await page.locator('.quick-input-header > .monaco-checkbox').click();
  await same(pages);
  await input(pages, '');
  await press(pages, 'ArrowDown');
  await same(pages);
  await press(pages, ' ');
  await same(pages);
  await pixels(pages, info, 'multi-key');
  await press(pages, 'Enter');
  await same(pages);
});
test('QuickPick item and separator buttons, non-pickable and middle click', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 1);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Remove from recently opened', exact: true })
      .click();
  await same(pages);
  await show(pages, 5);
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Refresh languages', exact: true })
      .click();
  await same(pages);
  for (const key of ['Meta+ArrowDown', 'Meta+ArrowDown', 'Meta+ArrowUp']) {
    await press(pages, key);
    await same(pages);
  }
  await pixels(pages, info, 'groups');
  await show(pages, 2);
  for (const page of pages)
    await page
      .locator('.quick-input-list-entry')
      .filter({ hasText: 'Manage features…' })
      .click();
  await same(pages);
  await show(pages, 1);
  for (const page of pages)
    await page
      .locator('.quick-input-list-entry')
      .filter({ hasText: 'Notes.md' })
      .click({ button: 'middle' });
  await same(pages);
});
test('QuickPick variable row pages, reveal and scrolling', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 10);
  for (const key of [
    'PageDown',
    'PageDown',
    'PageUp',
    'Control+End',
    'Control+Home',
  ]) {
    await press(pages, key);
    await same(pages);
    await pixels(pages, info, key);
  }
  await api(pages, 'focusItem', 'last');
  await same(pages);
  await api(pages, 'focusItem', 'previous');
  await same(pages);
  for (const page of pages) {
    await page.locator('.quick-input-list').hover();
    await page.mouse.wheel(0, -160);
  }
  await same(pages);
  await pixels(pages, info, 'wheel');
});
test('QuickPick activation, live items and background accept', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 13);
  await same(pages);
  await api(pages, 'accept', true);
  await same(pages);
  await press(pages, 'ArrowDown');
  await press(pages, 'ArrowRight');
  await same(pages);
  await patch(pages, { activeIds: ['settings'] });
  await same(pages);
  await patch(pages, {
    items: [
      { id: 'new', label: 'New Entry' },
      {
        id: 'settings',
        label: 'Updated Settings',
        detail: 'A changed description',
      },
    ],
    itemActivation: 'last',
  });
  await same(pages);
  await pixels(pages, info, 'updated-items');
});

test('QuickPick image icons, tooltip delay and hover keyboard', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 14);
  await same(pages);
  for (const page of pages) {
    await page
      .locator('.quick-input-list-entry')
      .filter({ hasText: 'Sample workspace' })
      .hover({ position: { x: 300, y: 10 } });
    await expect(page.locator('.monaco-hover')).toBeVisible();
  }
  await pixels(pages, info, 'tooltip', false);
  for (const page of pages) await page.mouse.move(790, 690);
  for (const page of pages)
    await expect(page.locator('.monaco-hover')).toBeHidden();
  await press(pages, 'Control+Space');
  for (const page of pages)
    await expect(page.locator('.monaco-hover')).toBeVisible();
  await press(pages, 'ArrowDown');
  for (const page of pages)
    await expect(page.locator('.monaco-hover')).toContainText(
      'Shared with the development team.',
    );
  await press(pages, 'Control+Space');
  for (const page of pages)
    await expect(page.locator('.monaco-hover')).toBeHidden();
});
test('QuickPick disabled, live count visibility, external selection and blur', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 9);
  await same(pages);
  await patch(pages, {
    enabled: true,
    hideCheckAll: true,
    hideCountBadge: true,
    ok: false,
    description: 'Choose an item.',
  });
  await same(pages);
  await pixels(pages, info, 'live-header');
  await patch(pages, {
    selectedIds: ['save', 'settings'],
    activeIds: ['folder'],
  });
  await same(pages);
  await press(pages, 'Enter');
  await same(pages);
  await show(pages, 13);
  await patch(pages, { ignoreFocusOut: true });
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Move focus outside', exact: true })
      .click();
  await same(pages);
  await api(pages, 'focus');
  await press(pages, 'Escape');
  await same(pages);
});

for (const theme of ['dark', 'light', 'hcDark', 'hcLight'])
  test(`QuickPick delayed busy / ${theme}`, async ({ context }, info) => {
    await context.clock.install();
    const pages = await pair(context, theme);
    await context.clock.pauseAt(Date.now() + 1000);
    await show(pages, 7);
    const progress = async () =>
      Promise.all(
        pages.map((page) =>
          page.locator('.quick-input-progress').evaluate((el) => ({
            infinite: el.classList.contains('infinite'),
            hidden: el.getAttribute('aria-hidden'),
          })),
        ),
      );
    await context.clock.fastForward(799);
    expect(await progress()).toEqual([
      { infinite: false, hidden: 'true' },
      { infinite: false, hidden: 'true' },
    ]);
    await context.clock.fastForward(1);
    expect(await progress()).toEqual([
      { infinite: true, hidden: null },
      { infinite: true, hidden: null },
    ]);
    await context.clock.resume();
    await pixels(pages, info, 'busy');
    await context.clock.pauseAt(
      (await pages[0].evaluate(() => Date.now())) + 100,
    );
    await patch(pages, { busy: false });
    expect(await progress()).toEqual([
      { infinite: false, hidden: 'true' },
      { infinite: false, hidden: 'true' },
    ]);
    await patch(pages, { busy: true });
    await context.clock.fastForward(500);
    await patch(pages, { busy: false });
    await context.clock.fastForward(300);
    expect(await progress()).toEqual([
      { infinite: false, hidden: 'true' },
      { infinite: false, hidden: 'true' },
    ]);
  });

test('QuickPick preserve scroll on items and reset check state', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 10);
  await api(pages, 'focusItem', 'last');
  await same(pages);
  const items = Array.from({ length: 100 }, (_, index) => ({
    id: `item-${index}`,
    label: `Updated item ${index + 1}`,
    detail: index % 7 === 0 ? `Detail ${index + 1}` : undefined,
  }));
  await patch(pages, { keepScrollPosition: true, items });
  await same(pages);
  await pixels(pages, info, 'kept-scroll');
  await show(pages, 2);
  await same(pages);
  await patch(pages, {
    items: [
      { id: 'file', label: 'New file' },
      { id: 'save', label: 'Save all' },
      { id: 'extra', label: 'Extra item' },
    ],
  });
  await same(pages);
});
test('QuickPick group selection, composition and accept veto', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 5);
  for (const page of pages)
    await page
      .locator('.monaco-list-row')
      .filter({ has: page.locator('.quick-input-list-separator-as-item') })
      .filter({ hasText: 'Tools' })
      .click({ position: { x: 100, y: 15 } });
  await same(pages);
  await pixels(pages, info, 'group-click');
  await show(pages, 16);
  await same(pages);
  for (const page of pages)
    await page
      .locator('.quick-input-box input')
      .dispatchEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        isComposing: true,
      });
  await same(pages);
  await press(pages, 'Enter');
  await same(pages);
  for (const page of pages)
    expect(
      await page.evaluate(() => (window as any).fixtureState.accepts),
    ).toEqual([]);
  await press(pages, 'Escape');
  await same(pages);
});
