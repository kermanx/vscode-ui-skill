import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

async function pair(context: BrowserContext, kind: 'button' | 'tree', theme = 'dark', options = '') {
  const original = await context.newPage(), replica = await context.newPage();
  const errors: string[] = [];
  for (const page of [original, replica]) page.on('pageerror', error => errors.push(error.message));
  await original.goto(`/reference/index.html?kind=${kind}&theme=${theme}&${options}`);
  await replica.goto(`/iframe.html?id=components-${kind === 'tree' ? 'tree-view' : 'button'}--specimen&viewMode=story&globals=theme:${theme}&args=${options.replaceAll('=', ':').replaceAll('&', ';')}`);
  for (const page of [original, replica]) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(errors, 'runtime errors').toEqual([]);
  return [original, replica] as const;
}
async function state(page: Page) {
  return page.evaluate(() => {
    const state = (window as any).fixtureState;
    return { ...state, expanded: [...state.expanded].sort(), selection: [...state.selection].sort() };
  });
}
async function equalState(pages: readonly Page[]) {
  await expect.poll(async () => JSON.stringify(await state(pages[1])) === JSON.stringify(await state(pages[0]))).toBe(true);
}
async function equalPixels(pages: readonly Page[], testInfo: TestInfo, name: string, compareButtonCorners = false) {
  // Both images are produced live in one browser/environment, never from replica snapshots.
  const buffers: Buffer[] = [];
  for (const page of pages) {
    await page.bringToFront();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    buffers.push(await page.getByTestId('specimen').screenshot({ animations: 'disabled' }));
  }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: b.width, height: b.height }).toEqual({ width: a.width, height: a.height });
  if (compareButtonCorners) {
    // Chromium's incremental rounded border/outline rasterization can differ by 1–2/255,
    // including after focus leaves. Check geometry/colors, then normalize only those corners.
    const measurements = [];
    for (const page of pages) measurements.push(await page.locator('[data-index="1"]').evaluate(el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect(), host = el.closest('[data-testid="specimen"]')!.getBoundingClientRect();
      return { x: r.x - host.x, y: r.y - host.y, width: r.width, height: r.height,
        styles: ['border', 'border-radius', 'background-color', 'color', 'outline', 'outline-offset', 'padding', 'font'].map(k => s.getPropertyValue(k)) };
    }));
    expect(measurements[1]).toEqual(measurements[0]);
    const r = measurements[0];
    for (let i = 0; i < a.data.length; i += 4) {
      const x = (i / 4) % a.width, y = Math.floor(i / 4 / a.width);
      const nearCorner = (Math.abs(x - r.x) <= 8 || Math.abs(x - r.x - r.width) <= 8)
        && (Math.abs(y - r.y) <= 8 || Math.abs(y - r.y - r.height) <= 8);
      if (nearCorner && [0, 1, 2, 3].every(c => Math.abs(a.data[i + c] - b.data[i + c]) <= 2)) {
        for (let c = 0; c < 4; c++) b.data[i + c] = a.data[i + c];
      }
    }
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) {
    await testInfo.attach(`${name}-original`, { body: buffers[0], contentType: 'image/png' });
    await testInfo.attach(`${name}-replica`, { body: buffers[1], contentType: 'image/png' });
    await testInfo.attach(`${name}-diff`, { body: PNG.sync.write(diff), contentType: 'image/png' });
  }
  expect(count, `${name}: differing pixels`).toBe(0);
}

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Button visual + keyboard parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, 'button', theme);
    await equalPixels(pages, info, 'default');
    for (const page of pages) await page.locator('[data-index="0"]').hover();
    await equalPixels(pages, info, 'hover');
    for (const page of pages) {
      await page.mouse.move(410, 400);
      await page.locator('[data-index="1"]').focus();
      await page.keyboard.down('Space');
    }
    await equalState(pages);
    expect((await state(pages[0])).clicks).toBe(1);
    await equalPixels(pages, info, 'keyboard-focus', theme.startsWith('hc'));
    for (const page of pages) {
      await page.keyboard.up('Space');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-index="1"]')).not.toBeFocused();
      await page.locator('[data-index="4"]').focus();
      await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    }
    await equalState(pages);
    expect((await state(pages[0])).clicks).toBe(2);
    await equalPixels(pages, info, 'disabled-focus', theme.startsWith('hc'));
  });

  test(`Tree appearance + selection parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, 'tree', theme);
    await equalPixels(pages, info, 'default');
    for (const page of pages) await page.locator('[data-id="button"]').click();
    await equalState(pages);
    await equalPixels(pages, info, 'selected');
    for (const page of pages) await page.keyboard.press('ArrowDown');
    await equalState(pages);
    await equalPixels(pages, info, 'focus-vs-selection');
    for (const page of pages) await page.getByText('Move focus outside').click();
    await equalPixels(pages, info, 'inactive-selection');
  });
}

test('Tree navigation, expansion, multi-selection and typeahead', async ({ context }, info) => {
  const pages = await pair(context, 'tree');
  for (const page of pages) await page.getByRole('tree').focus();
  for (const key of ['ArrowDown', 'ArrowRight', 'ArrowRight', 'Enter', 'ArrowDown', 'ArrowLeft', ' ', 'ArrowRight', 'ArrowRight', 'Escape', 'p']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages);
  }
  for (const page of pages) await page.locator('[data-id="src"]').locator('[class*="twistie"]').click();
  await equalState(pages);
  for (const page of pages) await page.locator('[data-id="src"]').locator('[class*="twistie"]').click();
  await equalState(pages);
  for (const page of pages) {
    await page.locator('[data-id="button"]').click();
    await page.locator('[data-id="app"]').click({ modifiers: ['Shift'] });
  }
  await equalState(pages);
  await equalPixels(pages, info, 'range-selection');
  for (const page of pages) await page.locator('[data-id="package"]').click({ modifiers: ['ControlOrMeta'] });
  await equalState(pages);
  for (const page of pages) await page.keyboard.press('ControlOrMeta+a');
  await equalState(pages);
  for (const page of pages) await page.keyboard.press('Escape');
  await equalState(pages);
});

test('Tree virtual scrolling and page navigation', async ({ context }, info) => {
  const pages = await pair(context, 'tree', 'dark', 'large=true');
  for (const page of pages) await page.getByRole('tree').focus();
  for (const key of ['ArrowDown', 'PageDown', 'PageDown', 'PageDown', 'PageUp']) {
    for (const page of pages) await page.keyboard.press(key);
    await equalState(pages);
  }
  for (const page of pages) await page.mouse.move(200, 100);
  await equalPixels(pages, info, 'page-navigation');
  expect(await pages[1].getByRole('treeitem').count()).toBeLessThan(20);
});

test('Tree single selection and label expansion option', async ({ context }) => {
  const pages = await pair(context, 'tree', 'dark', 'multiple=false&expandOnLabel=true');
  for (const id of ['src', 'src', 'components', 'stories', 'package']) {
    for (const page of pages) await page.locator(`[data-id="${id}"]`).click();
    await equalState(pages);
  }
  for (const page of pages) await page.keyboard.press('ControlOrMeta+a');
  await equalState(pages);
});

test('Tree double click, recursive expansion, context menu and blank space', async ({ context }, info) => {
  const pages = await pair(context, 'tree');
  for (const page of pages) await page.locator('[data-id="components"]').dblclick();
  await equalState(pages);
  for (const page of pages) await page.locator('[data-id="src"]').locator('[class*="twistie"]').click({ modifiers: ['Alt'] });
  await equalState(pages);
  for (const page of pages) await page.locator('[data-id="src"]').locator('[class*="twistie"]').click({ modifiers: ['Alt'] });
  await equalState(pages);
  await equalPixels(pages, info, 'recursive-expanded');
  for (const page of pages) {
    await page.locator('[data-id="button"]').click();
    await page.locator('[data-id="package"]').click({ button: 'right' });
  }
  await equalState(pages);
  for (const page of pages) {
    await page.locator('[data-id="src"]').locator('[class*="twistie"]').click();
    await page.getByRole('tree').click({ position: { x: 200, y: 255 } });
  }
  await equalState(pages);
  expect((await state(pages[1])).selection).toEqual([]);
});

test('Button Tab order, modifier keys, disabled mouse activation', async ({ context }) => {
  const pages = await pair(context, 'button');
  for (const page of pages) {
    await page.locator('[data-index="0"]').focus();
    for (let index = 1; index < 6; index++) {
      await page.keyboard.press('Tab');
      await expect(page.locator(`[data-index="${index}"]`)).toBeFocused();
    }
    await page.locator('[data-index="4"]').click({ force: true });
    await page.locator('[data-index="0"]').focus();
    await page.keyboard.press('Shift+Enter'); await page.keyboard.press('Control+Space');
  }
  await equalState(pages);
  expect((await state(pages[0])).clicks).toBe(0);
});

async function scrollPosition(page: Page) {
  return page.evaluate(() => (window as any).referenceTree?.scrollTop ?? document.querySelector('.vc-tree-viewport')?.scrollTop ?? 0);
}
test('Tree wheel, scrollbar dragging and resize', async ({ context }, info) => {
  const pages = await pair(context, 'tree', 'dark', 'large=true');
  for (const page of pages) { await page.mouse.move(200, 150); await page.mouse.wheel(0, 120); }
  await expect.poll(() => scrollPosition(pages[1])).toBe(await scrollPosition(pages[0]));
  await equalPixels(pages, info, 'wheel');
  for (const page of pages) {
    const thumb = page.locator('.scrollbar.vertical .slider, .vc-tree-thumb');
    const box = await thumb.boundingBox();
    await page.mouse.move(box!.x + 5, box!.y + 5); await page.mouse.down();
    await page.mouse.move(box!.x + 5, box!.y + 45); await page.mouse.up();
  }
  await expect.poll(() => scrollPosition(pages[1])).toBe(await scrollPosition(pages[0]));
  for (const page of pages) {
    await page.setViewportSize({ width: 270, height: 480 });
    await page.mouse.move(100, 150);
  }
  await equalPixels(pages, info, 'narrow-scroll');
});

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Tree inline actions, decorations and keyboard toolbar / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, 'tree', theme);
    for (const page of pages) {
      await page.locator('[data-id="readme"]').click();
      await page.locator('[data-id="button"]').hover();
    }
    await equalPixels(pages, info, 'hover-actions');
    for (const page of pages) await page.locator('[data-id="button"]').getByRole('button', { name: 'Open to the Side' }).click();
    await equalState(pages);
    expect((await state(pages[1])).selection).toEqual(['readme']);
    expect((await state(pages[1])).actions).toEqual(['button:open']);
    for (const page of pages) {
      await page.locator('[data-id="tree"]').click();
      await page.mouse.move(410, 400);
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-id="tree"]').getByRole('button', { name: 'Open to the Side' })).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-id="tree"]').getByRole('button', { name: 'Discard Changes' })).toBeFocused();
    }
    await equalPixels(pages, info, 'disabled-action-focus');
    for (const page of pages) {
      await page.keyboard.press('Enter');
      await page.keyboard.press('Home');
      await page.keyboard.down('Space');
    }
    await equalState(pages);
    expect((await state(pages[1])).actions).toEqual(['button:open']);
    for (const page of pages) await page.keyboard.up('Space');
    await equalState(pages);
    expect((await state(pages[1])).actions).toEqual(['button:open', 'tree:open']);
    for (const page of pages) {
      await page.keyboard.press('End');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-id="tree"]').getByRole('button', { name: 'Open to the Side' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByRole('tree')).toBeFocused();
    }
    await equalState(pages);
    await equalPixels(pages, info, 'return-to-tree');
  });
}
