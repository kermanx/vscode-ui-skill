import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { menuPixels } from './menu-fixture';
test.use({ viewport: { width: 420, height: 760 } });
async function pair(context: BrowserContext, kind: string, theme: string) {
  const pages = [await context.newPage(), await context.newPage()];
  await pages[0].goto(`/reference/index.html?kind=${kind === 'dropdown-button' ? 'dropdown' : kind}&theme=${theme}`);
  await pages[1].goto(`/iframe.html?id=components-${kind}--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) { await page.waitForFunction(() => (window as any).fixtureReady); await page.evaluate(() => document.fonts.ready); }
  return pages;
}
const configs = [
  { kind: 'toggle', selector: '[data-index="0"] [role=checkbox]', text: 'Match Case' },
  { kind: 'input-box', selector: '[data-index="0"] input', text: 'Search files' },
  { kind: 'count-badge', selector: '[data-row="title-problems"] .monaco-count-badge', text: '42 problems detected' },
];
for (const theme of ['dark','light','hcDark','hcLight']) test(`Delayed control hover: Toggle, InputBox and CountBadge / ${theme}`, async ({ context }, info) => {
  for (const config of configs) {
    const pages = await pair(context, config.kind, theme);
    for (const page of pages) { await page.locator(config.selector).hover(); await expect(page.getByRole('tooltip')).toHaveText(config.text, { timeout: 2500 }); }
    await menuPixels(pages, info, `${theme}-${config.kind}`, '.workbench-hover-container');
    for (const page of pages) { await page.mouse.move(410,740); await expect(page.getByRole('tooltip')).toHaveCount(0); await page.close(); }
  }
});
test('Delayed hover snapshots text, strips toggle icons and uses HistoryInputBox focused placeholder', async ({ context }, info) => {
  const toggles = await pair(context, 'toggle', 'dark');
  for (const page of toggles) { await page.locator('[data-index="4"] [role=checkbox]').hover(); await expect(page.getByRole('tooltip')).toHaveText(' Empty toggle', { timeout:2500 }); }
  await menuPixels(toggles, info, 'toggle-icons', '.workbench-hover-container');
  const inputs = await pair(context, 'input-box', 'dark');
  for (const page of inputs) { await page.locator('[data-index="9"] input').focus(); await page.locator('[data-index="9"] input').hover(); await expect(page.getByRole('tooltip')).toHaveText('Find (⇅ for history)', { timeout:2500 }); }
  await menuPixels(inputs, info, 'history-tooltip', '.workbench-hover-container');
  const badges = await pair(context, 'count-badge', 'dark');
  for (const page of badges) { await page.evaluate(() => (window as any).countBadgeFixture.apply({ count:128, countFormat:'{0}', titleFormat:'{0} results' })); await page.locator('[data-row="dynamic"] .monaco-count-badge').hover(); await expect(page.getByRole('tooltip')).toHaveText('128 results', { timeout:2500 }); }
  await menuPixels(badges, info, 'updated-count-tooltip', '.workbench-hover-container');
});
const managedConfigs = [
  { kind: 'button', selector: '[data-index="0"]', text: 'Primary Button' },
  { kind: 'button', selector: '[data-index="1"]', text: 'Additional actions' },
  { kind: 'action-bar', selector: '[data-case="horizontal"] .action-label', text: 'New File' },
  { kind: 'icon-button', selector: '[data-index="4"] .action-label', text: 'Close editor' },
];
for (const theme of ['dark','light','hcDark','hcLight']) test(`Managed control hover: Button, ActionBar and IconButton / ${theme}`, async ({ context }, info) => {
  for (const config of managedConfigs) {
    const pages = await pair(context, config.kind, theme);
    for (const page of pages) { await page.locator(config.selector).first().hover(); await expect(page.getByRole('tooltip')).toHaveText(config.text, { timeout:2500 }); }
    await menuPixels(pages, info, `${theme}-${config.kind}-${config.text}`, '.workbench-hover-container');
    for (const page of pages) { await page.mouse.move(410,740); await expect(page.getByRole('tooltip')).toHaveCount(0); await page.close(); }
  }
});
test('Managed controls expose delayed keyboard focus and use updated action tooltips', async ({ context }, info) => {
  const buttons = await pair(context, 'button', 'dark');
  for (const page of buttons) { await page.locator('.outside').focus(); await page.locator('[data-index="0"]').focus(); await expect(page.getByRole('tooltip')).toHaveText('Primary Button', { timeout:2500 }); await page.locator('.outside').focus(); await expect(page.getByRole('tooltip')).toHaveCount(0); }
  const bars = await pair(context, 'action-bar', 'dark');
  for (const page of bars) { await page.locator('.outside').focus(); await page.locator('[data-case="horizontal"] .action-label').first().focus(); await expect(page.getByRole('tooltip')).toHaveText('New File', { timeout:2500 }); await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0); }
  const icons = await pair(context, 'icon-button', 'dark');
  for (const page of icons) { await page.locator('.fixture-update').click(); await page.locator('[data-index="0"] .action-label').hover(); await expect(page.getByRole('tooltip')).toHaveText('Create a folder', { timeout:2500 }); }
  await menuPixels(icons, info, 'updated-action-tooltip', '.workbench-hover-container');
});
for (const theme of ['dark','light','hcDark','hcLight']) test(`Composed control hover: Toolbar and DropdownButton / ${theme}`, async ({ context }, info) => {
  const bars = await pair(context, 'toolbar', theme);
  for (const page of bars) { await page.locator('[data-case="primary"] .action-label').first().hover(); await expect(page.getByRole('tooltip')).toHaveText('New File (⌘N)', { timeout:2500 }); }
  await menuPixels(bars, info, `${theme}-toolbar-primary`, '.workbench-hover-container');
  for (const page of bars) { await page.mouse.move(410,740); await expect(page.getByRole('tooltip')).toHaveCount(0); await page.locator('[data-case="secondary"] .codicon-toolbar-more').hover(); await expect(page.getByRole('tooltip')).toHaveText('More Actions...', { timeout:2500 }); }
  await menuPixels(bars, info, `${theme}-toolbar-more`, '.workbench-hover-container');
  const dropdowns = await pair(context, 'dropdown-button', theme);
  for (const page of dropdowns) { await page.locator('[data-index="0"] .monaco-dropdown-button').hover(); await expect(page.getByRole('tooltip')).toHaveText('More Actions...', { timeout:2500 }); }
  await menuPixels(dropdowns, info, `${theme}-dropdown-arrow`, '.workbench-hover-container');
});
test('Composed delegates share the 200ms instant window within one instance', async ({ context }, info) => {
  for (const [kind, first, second, text] of [
    ['toolbar', '[data-case="primary"] .codicon-new-file', '[data-case="primary"] .codicon-pin', 'Pin'],
    ['dropdown-button', '[data-index="0"] .monaco-button:not(.monaco-dropdown-button)', '[data-index="0"] .monaco-dropdown-button', 'More Actions...'],
  ]) {
    const pages = await pair(context, kind, 'dark');
    for (const page of pages) {
      await page.locator(first).hover(); await expect(page.getByRole('tooltip')).toHaveCount(1, { timeout:2500 });
      await page.locator(second).hover(); await expect(page.getByRole('tooltip')).toHaveText(text, { timeout:180 });
      await expect(page.getByRole('tooltip')).not.toHaveClass(/fade-in/);
      await page.mouse.move(410,740); await expect(page.getByRole('tooltip')).toHaveCount(0); await page.waitForTimeout(250);
      await page.locator(first).hover(); await page.waitForTimeout(250); await expect(page.getByRole('tooltip')).toHaveCount(0);
      await expect(page.getByRole('tooltip')).toHaveCount(1, { timeout:2000 });
      await expect(page.getByRole('tooltip')).toHaveClass(/fade-in/);
    }
    await menuPixels(pages, info, `${kind}-restored-delay`, '.workbench-hover-container');
  }
});
test('Hover service replaces another top-level hover and respects Alt locking', async ({ context }) => {
  const pages = await pair(context, 'button', 'dark');
  for (const page of pages) {
    await page.locator('.outside').focus(); await page.locator('[data-index="0"]').focus();
    await expect(page.getByRole('tooltip')).toHaveText('Primary Button', { timeout:2500 });
    await page.locator('[data-index="1"]').hover();
    await expect(page.getByRole('tooltip')).toHaveCount(1); await expect(page.getByRole('tooltip')).toHaveText('Additional actions', { timeout:2500 });
    await page.keyboard.down('Alt'); await page.locator('[data-index="0"]').hover(); await page.waitForTimeout(1700);
    await expect(page.getByRole('tooltip')).toHaveCount(1); await expect(page.getByRole('tooltip')).toHaveText('Additional actions');
    await page.keyboard.up('Alt');
  }
});
for (const theme of ['dark','light','hcDark','hcLight']) test(`Dialog reuses the native Checkbox tooltip / ${theme}`, async ({ context }, info) => {
  const pages = await pair(context, 'dialog', theme);
  for (const page of pages) {
    await page.setViewportSize({ width:800, height:700 });
    await page.evaluate(() => (window as any).fixtureOpenDialog(1));
    await page.getByRole('checkbox').hover(); await expect(page.getByRole('tooltip')).toHaveText('Do not ask me again', { timeout:2500 });
  }
  await menuPixels(pages, info, `${theme}-dialog-checkbox`, '.workbench-hover-container');
});
