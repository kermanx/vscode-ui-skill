import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type TestInfo,
} from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { settleFixturePaint } from './paint';
test.use({ viewport: { width: 420, height: 580 } });
test.setTimeout(60000);
async function pair(context: BrowserContext, theme = 'dark', index = 0) {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages)
    page.on('pageerror', (error) => expect(error.message).toBe(''));
  await pages[0].goto(
    `/reference/index.html?kind=search&theme=${theme}&case=${index}`,
  );
  await pages[1].goto(
    `/iframe.html?id=compositions-search--specimen&viewMode=story&globals=theme:${theme}&case=${index}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  return pages;
}
async function pixels(pages: Page[], info: TestInfo, name: string) {
  const shots = [];
  for (const page of pages) {
    await page.mouse.move(410, 575);
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll(
          '.scrollbar,.vc-tree-scrollbar,.vc-list-scrollbar',
        ),
      ].every((el) => getComputedStyle(el).opacity === '0'),
    );
    await settleFixturePaint(page, 'filter');
    shots.push(await page.screenshot());
  }
  const [a, b] = shots.map((bytes) => PNG.sync.read(bytes));
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: 0,
    includeAA: true,
  });
  if (count) {
    await info.attach(`${name}-source`, {
      body: shots[0],
      contentType: 'image/png',
    });
    await info.attach(`${name}-vue`, {
      body: shots[1],
      contentType: 'image/png',
    });
    await info.attach(`${name}-diff`, {
      body: PNG.sync.write(diff),
      contentType: 'image/png',
    });
  }
  expect(count, name).toBe(0);
}
async function same(pages: Page[]) {
  for (const page of pages)
    await page.evaluate(() => new Promise(requestAnimationFrame));
  const states = await Promise.all(
    pages.map((page) => page.evaluate(() => (window as any).fixtureState)),
  );
  expect(states[1]).toEqual(states[0]);
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight'])
  test(`Search default fixtures / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    for (let index = 0; index < 7; index++) {
      if (index)
        for (const page of pages)
          await page.evaluate(
            (index) => (window as any).fixtureShowSearch(index),
            index,
          );
      if (index === 3)
        for (const page of pages)
          await page.evaluate(() => (window as any).fixtureSearch.complete());
      await same(pages);
      await pixels(pages, info, `case-${index}`);
    }
  });
async function press(pages: Page[], key: string) {
  for (const page of pages) await page.keyboard.press(key);
}
async function show(pages: Page[], index: number) {
  for (const page of pages)
    await page.evaluate(
      (index) => (window as any).fixtureShowSearch(index),
      index,
    );
}

const query = (page: Page) => page.locator('.search-container textarea');
const replacement = (page: Page) => page.locator('.replace-container textarea');
function row(page: Page, text: string) {
  return page
    .locator('.search-view .monaco-list-row')
    .filter({ hasText: text });
}
test('Search input submits, validation and replace activation', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 1);
  for (const page of pages) await query(page).fill('Text');
  await same(pages);
  await press(pages, 'Enter');
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('checkbox', { name: 'Match Case', exact: true })
      .click();
  await same(pages);
  for (const page of pages) await replacement(page).fill('Replacement');
  await same(pages);
  for (const page of pages)
    await page.evaluate(() => (window as any).fixtureSearch.complete());
  for (const page of pages)
    await page
      .locator('.replace-container')
      .getByRole('button', { name: 'Replace All', exact: true })
      .click();
  await same(pages);
  await pixels(pages, info, 'replace-activated');
  for (const page of pages)
    await page
      .getByRole('checkbox', { name: 'Use Regular Expression', exact: true })
      .click();
  for (const page of pages) await query(page).fill('[');
  await press(pages, 'Enter');
  await same(pages);
  await pixels(pages, info, 'invalid-regex');
  await press(pages, 'Escape');
  await same(pages);
});
test('Search details and mutually exclusive filters', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 2);
  for (const page of pages)
    await page
      .getByRole('checkbox', {
        name: 'Search only in Open Editors',
        exact: true,
      })
      .click();
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('checkbox', {
        name: 'Search only in Changed Files (Source Control)',
        exact: true,
      })
      .click();
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('textbox', { name: 'files to include', exact: true })
      .fill('*.tsx');
  await press(pages, 'Enter');
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Toggle Search Details', exact: true })
      .click();
  await same(pages);
  await pixels(pages, info, 'details-closed');
  await press(pages, 'Tab');
  await same(pages);
});
test('Search result selection, actions and replacement previews', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 1);
  for (const page of pages) await row(page, 'import { Button').click();
  await same(pages);
  await pixels(pages, info, 'selected-result');
  await press(pages, 'ArrowDown');
  await press(pages, 'Enter');
  await same(pages);
  for (const page of pages)
    await row(page, 'export function Button').dblclick();
  await same(pages);
  for (const page of pages)
    await row(page, 'export function Button')
      .getByRole('button', { name: 'Replace', exact: true })
      .click();
  await same(pages);
  for (const page of pages) await row(page, 'handles keyboard').click();
  for (const page of pages)
    await row(page, 'handles keyboard')
      .getByRole('button', { name: 'Dismiss', exact: true })
      .click();
  await same(pages);
  await pixels(pages, info, 'readonly-action');
});
test('Search toggle focus flow and multiline sizing', async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Toggle Replace', exact: true })
      .click();
  await same(pages);
  for (const page of pages) await query(page).click();
  await press(pages, 'Tab');
  for (const page of pages)
    expect(
      await replacement(page).evaluate((el) => el === document.activeElement),
    ).toBe(true);
  await press(pages, 'Tab');
  await press(pages, 'ArrowRight');
  await press(pages, 'ArrowRight');
  await press(pages, 'Tab');
  for (const page of pages)
    expect(
      await page
        .getByRole('checkbox', { name: 'Preserve Case', exact: true })
        .evaluate((el) => el === document.activeElement),
    ).toBe(true);
  for (const page of pages) await query(page).fill('first line');
  await press(pages, 'End');
  await press(pages, 'Control+Enter');
  await same(pages);
  await pixels(pages, info, 'multiline');
});
test('Search long result tree scroll and collapse', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 5);
  for (const page of pages)
    await page.evaluate(() => (window as any).fixtureSearch.focusResults());
  for (let i = 0; i < 71; i++) await press(pages, 'ArrowDown');
  await same(pages);
  await pixels(pages, info, 'last-result');
  await press(pages, 'PageUp');
  await same(pages);
  for (const page of pages) {
    await page.mouse.move(280, 280);
    await page.mouse.wheel(0, -150);
  }
  await same(pages);
  await pixels(pages, info, 'scrolled-results');
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Collapse All', exact: true })
      .click();
  await same(pages);
  await pixels(pages, info, 'collapsed-results');
});

test('Search context menu and title expansion', async ({ context }, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page
      .locator('.filematch')
      .filter({ hasText: 'App.tsx' })
      .click({ button: 'right' });
  await same(pages);
  await pixels(pages, info, 'context-menu');
  for (const page of pages)
    await page
      .getByRole('menuitem', { name: 'Copy Path', exact: true })
      .click();
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Collapse All', exact: true })
      .click();
  await same(pages);
  await pixels(pages, info, 'collapsed-title');
  for (const page of pages)
    await page.getByRole('button', { name: 'Expand All', exact: true }).click();
  await same(pages);
  await pixels(pages, info, 'expanded-title');
});

test('Search resizing preserves native layout', async ({ context }, info) => {
  const pages = await pair(context, 'dark', 2);
  for (const size of [
    [380, 520],
    [280, 340],
  ]) {
    for (const page of pages)
      await page.evaluate(
        ([width, height]) =>
          (window as any).fixtureSearch.resize(width, height),
        size,
      );
    await same(pages);
    await pixels(pages, info, `size-${size[0]}`);
  }
});

test('Search summary filter links open details and submit', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 7);
  await same(pages);
  await pixels(pages, info, 'filtered-summary');
  for (const page of pages)
    await page
      .locator('.messages a')
      .filter({ hasText: /^enable$/ })
      .click();
  await same(pages);
  await pixels(pages, info, 'enable-exclusions');
  for (const page of pages)
    await page
      .locator('.messages a')
      .filter({ hasText: /^disable$/ })
      .click();
  await same(pages);
  await pixels(pages, info, 'disable-open-only');
});
