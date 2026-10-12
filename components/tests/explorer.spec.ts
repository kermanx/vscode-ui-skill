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
async function pair(context: BrowserContext, theme = 'dark', index = 0) {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages)
    page.on('pageerror', (error) => expect(error.message).toBe(''));
  await pages[0].goto(
    `/reference/index.html?kind=explorer&theme=${theme}&case=${index}`,
  );
  await pages[1].goto(
    `/iframe.html?id=compositions-explorer--specimen&viewMode=story&globals=theme:${theme}&case=${index}`,
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
    await settleFixturePaint(page);
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
  test(`Explorer default fixtures / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    for (let index = 0; index < 6; index++) {
      if (index)
        for (const page of pages)
          await page.evaluate(
            (index) => (window as any).fixtureShowExplorer(index),
            index,
          );
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
      (index) => (window as any).fixtureShowExplorer(index),
      index,
    );
}
function file(page: Page, name: string) {
  return page.locator('.explorer-folders-view .monaco-list-row').filter({
    has: page.locator('.label-name').filter({
      hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
    }),
  });
}
test('Explorer file selection, expansion, keyboard and context', async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) await file(page, 'App.tsx').click();
  await same(pages);
  await pixels(pages, info, 'selected-file');
  await press(pages, 'ArrowDown');
  await press(pages, 'Enter');
  await same(pages);
  for (const page of pages)
    await file(page, 'src').locator('.monaco-tl-twistie').click();
  await same(pages);
  await press(pages, 'ArrowRight');
  await same(pages);
  await press(pages, 'ArrowDown');
  await press(pages, 'ArrowRight');
  await same(pages);
  for (const page of pages)
    await file(page, 'README.md').click({ button: 'right' });
  await same(pages);
  await pixels(pages, info, 'context-focus');
});
test('Explorer open editors, dirty badge and native actions', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 1);
  for (const page of pages)
    await page
      .locator('.open-editors .monaco-list-row')
      .filter({ hasText: 'README.md' })
      .click();
  await same(pages);
  await press(pages, 'ArrowDown');
  await press(pages, 'Enter');
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Close Editor', exact: true })
      .first()
      .click();
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Unpin Editor', exact: true })
      .first()
      .click();
  await same(pages);
  for (const page of pages)
    await page
      .getByRole('button', {
        name: '3 unsaved, open unsaved editor',
        exact: true,
      })
      .click();
  await same(pages);
  await pixels(pages, info, 'editors-actions');
});
test('Explorer pane expansion and long tree scrolling', async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Open Editors Section', exact: true })
      .click();
  await same(pages);
  await pixels(pages, info, 'collapsed-editors');
  await press(pages, 'ArrowRight');
  await same(pages);
  await show(pages, 5);
  for (const page of pages)
    await page.evaluate(() => (window as any).fixtureExplorer.focusFiles());
  await press(pages, 'End');
  await same(pages);
  await pixels(pages, info, 'last-file');
  await press(pages, 'PageUp');
  await same(pages);
  for (const page of pages) {
    await page.mouse.move(280, 280);
    await page.mouse.wheel(0, -150);
  }
  await same(pages);
  await pixels(pages, info, 'scrolled-tree');
});

test('Explorer pointer modes, multiselect and group actions', async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) await file(page, 'App.tsx').dblclick();
  await same(pages);
  for (const page of pages)
    await file(page, 'index.ts').click({ button: 'middle' });
  await same(pages);
  for (const page of pages)
    await file(page, 'styles.css').click({ modifiers: ['Meta'] });
  await same(pages);
  for (const page of pages)
    await file(page, 'README.md').click({ modifiers: ['Shift'] });
  await same(pages);
  await pixels(pages, info, 'multiple-files');
  await show(pages, 1);
  for (const page of pages)
    await page
      .locator('.open-editors .monaco-list-row')
      .filter({ hasText: 'README.md' })
      .dblclick();
  await same(pages);
  for (const page of pages)
    await page
      .locator('.open-editors .monaco-list-row')
      .filter({ hasText: 'index.ts' })
      .click({ button: 'middle' });
  await same(pages);
  for (const page of pages)
    await page
      .locator('.open-editors .monaco-list-row')
      .filter({ hasText: 'Group 1' })
      .hover();
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Save All in Group', exact: true })
      .first()
      .click();
  await same(pages);
  for (const page of pages)
    await page
      .locator('.open-editors .monaco-list-row')
      .filter({ hasText: 'Group 2' })
      .hover();
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Close Group', exact: true })
      .last()
      .click();
  await same(pages);
});
test('Explorer source context menu actions and dismiss', async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await file(page, 'README.md').click({ button: 'right' });
  await same(pages);
  await pixels(pages, info, 'file-context-menu');
  await press(pages, 'ArrowDown');
  await press(pages, 'Enter');
  await same(pages);
  for (const page of pages) await file(page, 'App.tsx').click();
  await press(pages, 'Shift+F10');
  await same(pages);
  await pixels(pages, info, 'keyboard-context-menu');
  await press(pages, 'Escape');
  await same(pages);
});
