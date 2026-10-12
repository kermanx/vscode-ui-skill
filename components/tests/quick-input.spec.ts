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
async function pair(context: BrowserContext, theme = 'dark', index = 0) {
  const pages = [await context.newPage(), await context.newPage()];
  for (const page of pages)
    page.on('pageerror', (error) => expect(error.message).toBe(''));
  await pages[0].goto(
    `/reference/index.html?kind=quick-input&theme=${theme}&case=${index}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-quick-input--specimen&viewMode=story&globals=theme:${theme}&case=${index}`,
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
      (index) => (window as any).fixtureOpenQuickInput(index),
      index,
    );
}
async function patch(pages: Page[], props: Record<string, unknown>) {
  for (const page of pages)
    await page.evaluate(
      (props) => (window as any).fixtureUpdateQuickInput(props),
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
    if (settle) await settleFixturePaint(page);
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
async function same(pages: Page[]) {
  const states = await Promise.all(
    pages.map((page) =>
      page.evaluate(() => {
        const root = document.querySelector<HTMLElement>(
          '.quick-input-widget',
        )!;
        const input = root.querySelector<HTMLInputElement>(
          '.quick-input-box input',
        )!;
        const active = document.activeElement;
        const visible = !!root.offsetWidth && !!root.offsetHeight;
        return {
          state: Object.fromEntries(
            ['accepts', 'hides', 'buttons', 'changes', 'links'].map((key) => [
              key,
              (window as any).fixtureState[key],
            ]),
          ),
          open: visible,
          focus:
            active === input
              ? 'input'
              : active?.getAttribute('aria-label') || active?.textContent,
          ...(visible
            ? {
                input: {
                  value: input.value,
                  type: input.type,
                  readonly: input.readOnly,
                  disabled: input.disabled,
                  label: input.getAttribute('aria-label'),
                  selection: [input.selectionStart, input.selectionEnd],
                  description: document.getElementById(
                    input.getAttribute('aria-describedby') || '',
                  )?.textContent,
                  controls: !!document.getElementById(
                    input.getAttribute('aria-controls') || '',
                  ),
                },
                title: root.querySelector('.quick-input-title')?.textContent,
                buttons: [
                  ...root.querySelectorAll(
                    '.quick-input-titlebar .action-label',
                  ),
                ].map((b) => ({
                  label: b.getAttribute('aria-label'),
                  disabled: b.getAttribute('aria-disabled'),
                })),
                message: root.querySelector('.quick-input-message')
                  ?.textContent,
              }
            : {}),
        };
      }),
    ),
  );
  expect(states[1]).toEqual(states[0]);
  return states[0];
}
for (const theme of ['dark', 'light', 'hcDark', 'hcLight'])
  test(`QuickInput content and severity / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    for (let index = 0; index < 13; index++) {
      if (index === 6) continue;
      if (index) await show(pages, index);
      await same(pages);
      await pixels(pages, info, `case-${index}`);
    }
  });
test('QuickInput value, password, selection and raw accept', async ({
  context,
}, info) => {
  const pages = await pair(context, 'dark', 1);
  for (const page of pages)
    await page.locator('.quick-input-box input').fill('new-project');
  let state = await same(pages);
  expect(state.state.changes).toEqual(['new-project']);
  for (const page of pages) await page.keyboard.press('Enter');
  state = await same(pages);
  expect(state.state.accepts).toEqual([{ index: 1, value: 'new-project' }]);
  expect(state.open).toBe(false);
  await pixels(pages, info, 'accepted');
  await show(pages, 2);
  await same(pages);
  for (const page of pages) {
    await expect(page.locator('.quick-input-box input')).toHaveAttribute(
      'type',
      'password',
    );
    await page.keyboard.press('Escape');
  }
  await same(pages);
  await show(pages, 9);
  state = await same(pages);
  expect(state.input?.selection).toEqual([2, 10]);
  await show(pages, 5);
  for (const page of pages) await page.keyboard.press('Enter');
  state = await same(pages);
  expect(state.open).toBe(true);
  expect(state.state.accepts.at(-1)).toEqual({
    index: 5,
    value: 'invalid/name',
  });
  await show(pages, 7);
  for (const page of pages) {
    await page.keyboard.type('attempt');
    await page.keyboard.press('Enter');
  }
  state = await same(pages);
  expect(state.state.accepts.at(-1)).toEqual({
    index: 7,
    value: 'This value cannot be edited',
  });
});
test('QuickInput blur and focus restoration', async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Move focus outside', exact: true })
      .focus();
  let state = await same(pages);
  expect(state.open).toBe(false);
  expect(state.state.hides.at(-1).reason).toBe('blur');
  expect(state.focus).toBe('Move focus outside');
  await show(pages, 8);
  for (const page of pages)
    await page
      .getByRole('button', { name: 'Move focus outside', exact: true })
      .focus();
  state = await same(pages);
  expect(state.open).toBe(true);
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureQuickInput.focus());
    await page.keyboard.press('Escape');
  }
  state = await same(pages);
  expect(state.open).toBe(false);
  expect(state.focus).toBe('Move focus outside');
  await show(pages, 0);
  for (const page of pages) await page.keyboard.press('Escape');
  state = await same(pages);
  expect(state.focus).toBe('Plain input');
});
test('QuickInput actions and links', async ({ context }, info) => {
  const pages = await pair(context, 'dark', 1);
  for (const page of pages) {
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page
      .getByRole('button', { name: 'Configure project', exact: true })
      .click();
  }
  let state = await same(pages);
  expect(state.state.buttons).toEqual(['back', 'settings']);
  expect(state.open).toBe(true);
  await show(pages, 5);
  for (const page of pages) {
    await page.locator('.quick-input-message a').click();
    await page.locator('.quick-input-message a').focus();
    await page.keyboard.press('Enter');
  }
  state = await same(pages);
  expect(state.state.links).toEqual([
    'https://example.com/naming',
    'https://example.com/naming',
  ]);
  expect(state.state.accepts).toEqual([]);
  await pixels(pages, info, 'link-focus');
});
test('QuickInput live properties and layout', async ({ context }, info) => {
  const pages = await pair(context, 'dark', 1);
  await patch(pages, {
    title: 'Updated title',
    description: 'Updated description',
    value: 'new value',
    valueSelection: [0, 3],
    severity: 'error',
    validationMessage: '$(error) Try another value.',
  });
  await same(pages);
  await pixels(pages, info, 'updated');
  await patch(pages, {
    severity: 'ignore',
    validationMessage: '',
    prompt: 'Continue.',
    backButton: false,
    buttons: [],
    step: undefined,
    totalSteps: undefined,
  });
  await same(pages);
  await pixels(pages, info, 'reset');
  for (const page of pages)
    await page.setViewportSize({ width: 500, height: 700 });
  await same(pages);
  await pixels(pages, info, 'small');
});
for (const theme of ['dark', 'light', 'hcDark', 'hcLight'])
  test(`QuickInput delayed busy / ${theme}`, async ({ context }, info) => {
    await context.clock.install();
    const pages = await pair(context, theme);
    await context.clock.pauseAt(Date.now() + 1000);
    await show(pages, 6);
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
test('QuickInput keyboard modifiers and composition', async ({ context }) => {
  const pages = await pair(context, 'dark', 5);
  for (const page of pages) {
    await page.locator('.quick-input-box input').dispatchEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      isComposing: true,
    });
    await page.keyboard.press('Shift+Escape');
  }
  let state = await same(pages);
  expect(state.state.accepts).toEqual([]);
  expect(state.open).toBe(true);
  for (const key of ['Shift+Enter', 'Control+Enter', 'Alt+Enter']) {
    for (const page of pages) await page.keyboard.press(key);
    await same(pages);
  }
  state = await same(pages);
  expect(state.state.accepts).toHaveLength(3);
  for (const page of pages) await page.keyboard.press('Alt+Escape');
  state = await same(pages);
  expect(state.open).toBe(false);
});
test('QuickInput title keyboard navigation and disabled actions', async ({
  context,
}) => {
  const pages = await pair(context, 'dark', 1);
  for (const key of ['Shift+Tab', 'Shift+Tab', 'Tab', 'Tab']) {
    for (const page of pages) await page.keyboard.press(key);
    await same(pages);
  }
  await show(pages, 10);
  for (const page of pages)
    await page.getByRole('button', { name: 'Refresh', exact: true }).focus();
  for (const key of ['ArrowRight', 'ArrowRight', 'ArrowLeft', 'Enter']) {
    for (const page of pages) await page.keyboard.press(key);
    await same(pages);
  }
  await show(pages, 7);
  for (const page of pages) {
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  }
  let state = await same(pages);
  expect(state.state.buttons).toEqual(['settings']);
  await patch(pages, { enabled: true });
  for (const page of pages)
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  state = await same(pages);
  expect(state.state.buttons).toEqual(['settings', 'refresh']);
});
test('QuickInput hiding cancels pending busy and reopens cleanly', async ({
  context,
}) => {
  await context.clock.install();
  const pages = await pair(context);
  await context.clock.pauseAt(Date.now() + 1000);
  await show(pages, 6);
  await context.clock.fastForward(500);
  for (const page of pages)
    await page.evaluate(() => (window as any).fixtureQuickInput.hide());
  await context.clock.fastForward(500);
  let state = await same(pages);
  expect(state.open).toBe(false);
  await show(pages, 0);
  state = await same(pages);
  expect(state.open).toBe(true);
  for (const page of pages)
    await expect(page.locator('.quick-input-progress')).not.toHaveClass(
      /infinite/,
    );
});
