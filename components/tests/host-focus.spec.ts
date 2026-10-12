import { test, expect, type BrowserContext } from '@playwright/test';
import { menuPixels } from './menu-fixture';

test.use({ viewport: { width: 1100, height: 700 } });
async function pair(context: BrowserContext, kind: string, theme = 'dark', query = '') {
  const pages = [await context.newPage(), await context.newPage()];
  await pages[0].goto(`/reference/index.html?kind=${kind}&theme=${theme}${query}`);
  await pages[1].goto(`/iframe.html?id=${kind === 'workbench' ? 'compositions' : 'components'}-${kind}--specimen&viewMode=story&globals=theme:${theme}${query}`);
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  return pages;
}

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`ActivityBar hands focus to content before mouse feedback expires / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, 'activity-bar', theme);
    for (const page of pages) {
      const item = page.locator('.activitybar .action-item').filter({ has: page.locator('.codicon-search') });
      await item.click();
      await expect(page.locator('[data-composite-content]')).toBeFocused();
      await expect(item).toHaveClass(/checked/);
      // This assertion must pass during the native 800ms mouse-feedback period.
      await expect(item).toHaveClass(/clicked/);
      if (theme === 'dark' || theme === 'light') {
        expect(await item.locator('.active-item-indicator').evaluate(element => getComputedStyle(element, '::before').borderLeftWidth)).toBe('2px');
      }
    }
    await menuPixels(pages, info, 'opened-view');
  });
}

test('ActivityBar focus-only clicks and keyboard activation reach the content', async ({ context }) => {
  const pages = await pair(context, 'activity-bar', 'light', '&side=right&clickBehavior=focus');
  for (const page of pages) {
    await page.locator('.codicon-files').click();
    await expect(page.locator('[data-composite-content]')).toBeFocused();
    await page.evaluate(() => (window as any).fixtureApi.focus(1));
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-composite-content]')).toBeFocused();
    await expect(page.locator('[data-composite-content]')).toHaveAttribute('aria-label', 'Search content');
  }
});

test('PanelTitle opens focusable content by mouse and keyboard', async ({ context }, info) => {
  const pages = await pair(context, 'panel-title');
  for (const page of pages) {
    await page.getByRole('tab').filter({ has: page.locator('a', { hasText: 'Output' }) }).click();
    await expect(page.locator('[data-composite-content]')).toBeFocused();
    await expect(page.locator('[data-composite-content]')).toHaveAttribute('aria-label', 'Output content');
  }
  await menuPixels(pages, info, 'panel-opened');
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus(0));
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-composite-content]')).toBeFocused();
    await expect(page.locator('[data-composite-content]')).toHaveAttribute('aria-label', 'Problems content');
  }
});

test('Workbench connects bar, editor, panel and status focus contracts', async ({ context }) => {
  const pages = await pair(context, 'workbench', 'dark', '&demo=true');
  for (const page of pages) {
    const editor = page.locator('[data-workbench-content="editor"]');
    const panel = page.locator('[data-workbench-content="panel"]');
    const search = page.locator('[data-activity-view="search"] textarea').first();
    await page.locator('.activitybar .codicon-search').click();
    await expect(search).toBeFocused();
    const selectedActivity = page.locator('.activitybar .action-item.checked');
    await expect(selectedActivity).toHaveClass(/clicked/);
    expect(await selectedActivity.locator('.active-item-indicator').evaluate(element => getComputedStyle(element, '::before').borderLeftWidth)).toBe('2px');

    await page.locator('.panel .action-item').filter({ has: page.locator('a', { hasText: 'Output' }) }).click();
    await expect(panel).toBeFocused();
    await page.locator('.part.editor .tab').filter({ hasText: 'package.json' }).click();
    await expect(editor).toBeFocused();

    await page.locator('.part.editor .tab.active').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.part.editor .tab.active')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(editor).toBeFocused();

    await page.evaluate(() => (window as any).fixtureApi.focus('status'));
    await page.keyboard.press('Escape');
    await expect(editor).toBeFocused();
    await page.locator('.panel .action-label[aria-label="Hide Panel"]').click();
    await expect(editor).toBeFocused();
    await page.locator('.statusbar-item').filter({ has: page.locator('[aria-label="2 errors and 1 warning"]') }).click();
    await expect(panel).toBeFocused();

    await page.waitForTimeout(310); // Leave the source action's double-click guard.
    await page.locator('.activitybar .codicon-search').click();
    await expect(editor).toBeFocused();
    await page.waitForTimeout(310);
    await page.locator('.activitybar .codicon-search').click();
    await expect(search).toBeFocused();
  }
});

test('Workbench file preview preserves Explorer focus and double-click enters the editor', async ({ context }) => {
  const pages = await pair(context, 'workbench', 'dark', '&demo=true');
  for (const page of pages) {
    const files = page.getByRole('tree', { name: 'Files Explorer', exact: true });
    const file = page.locator('.explorer-folders-view .monaco-list-row').filter({ hasText: 'package.json' });
    await file.click();
    await expect(files).toBeFocused();
    await expect(page.locator('.part.editor .tab.active')).toContainText('package.json');
    await file.dblclick();
    await expect(page.locator('[data-workbench-content="editor"]')).toBeFocused();
  }
});

test('Workbench keyboard tab changes update the visible document without polling fixture state', async ({ context }) => {
  for (const page of await pair(context, 'workbench', 'dark', '&demo=true')) {
    await page.locator('.part.editor .tab.active').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.part.editor .tab.active')).toContainText('package.json');
    await expect(page.locator('[data-workbench-content="editor"]')).toContainText('"name": "classic-workbench"');
    await expect(page.locator('.part.editor .tab.active')).toBeFocused();
  }
});

test('Workbench restores editor focus after keyboard closing the active tab', async ({ context }) => {
  for (const page of await pair(context, 'workbench', 'dark', '&demo=true')) {
    await page.locator('.part.editor .tab.active .action-label').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.part.editor .tab.active')).toContainText('package.json');
    await expect(page.locator('[data-workbench-content="editor"]')).toBeFocused();
    await expect(page.locator('[data-workbench-content="editor"]')).toContainText('"name": "classic-workbench"');
  }
});

test('Workbench reopens a closed file as a real selected tab', async ({ context }) => {
  const pages = await pair(context, 'workbench', 'dark', '&demo=true');
  for (const page of pages) {
    const tab = page.locator('.part.editor .tab').filter({ hasText: 'package.json' });
    await tab.click();
    await tab.locator('.action-label').click();
    await expect(tab).toHaveCount(0);
    await page.locator('.explorer-folders-view .monaco-list-row').filter({ hasText: 'package.json' }).dblclick();
    await expect(tab).toHaveCount(1);
    await expect(tab).toHaveClass(/active/);
    await expect(page.locator('[data-workbench-content="editor"]')).toContainText('"name": "classic-workbench"');
    await expect(page.locator('[data-workbench-content="editor"]')).toBeFocused();
    await page.mouse.move(1090, 690);
  }
});

test('Workbench reopens a clean file in preview then pins it on double-click', async ({ context }) => {
  for (const page of await pair(context, 'workbench', 'dark', '&demo=true')) {
    const tab = page.locator('.part.editor .tab').filter({ hasText: 'README.md' });
    await tab.locator('.action-label').click();
    await expect(tab).toHaveCount(0);
    const file = page.locator('.explorer-folders-view .monaco-list-row').filter({ hasText: 'README.md' });
    await file.click();
    await expect(tab).toHaveCount(1);
    await expect(tab.locator('.monaco-icon-label')).toHaveClass(/italic/);
    await expect(page.locator('.part.editor .tab').filter({ hasText: 'Untitled-1' })).toHaveCount(0);
    await expect(page.getByRole('tree', { name: 'Files Explorer', exact: true })).toBeFocused();
    await file.dblclick();
    await expect(tab.locator('.monaco-icon-label')).not.toHaveClass(/italic/);
    await expect(page.locator('[data-workbench-content="editor"]')).toBeFocused();
  }
});

test('Workbench hiding the sidebar preserves focus in the active panel', async ({ context }) => {
  for (const page of await pair(context, 'workbench', 'dark', '&demo=true')) {
    const panel = page.locator('[data-workbench-content="panel"]');
    await panel.focus();
    await page.evaluate(() => (window as any).fixtureApi.set({sidebarVisible:false}));
    await expect(panel).toBeFocused();
  }
});

test('Workbench keyboard panel, toolbar and status commands update their hosts', async ({ context }) => {
  for (const page of await pair(context, 'workbench', 'dark', '&demo=true')) {
    const panel = page.locator('[data-workbench-content="panel"]');
    await page.locator('.panel .action-item').filter({ has: page.locator('a', { hasText: 'Output' }) }).focus();
    await page.keyboard.press('Enter');
    await expect(panel).toContainText('Starting compilation');
    await page.locator('.panel .action-label[aria-label="Hide Panel"]').focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeHidden();
    const problems = page.locator('.statusbar-item [aria-label="2 errors and 1 warning"]');
    await problems.focus();
    await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Warning:');
    await expect(panel).toBeFocused();

  }
});
