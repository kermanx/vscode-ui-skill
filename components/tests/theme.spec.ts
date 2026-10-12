import { test, expect } from '@playwright/test';
import { createTheme } from '../src/theme/createTheme';

test('Color themes accept JSONC, alpha, include precedence and base defaults', () => {
  const theme = createTheme(`{ // comments and trailing commas are accepted
    "name": "Sample", "include": "../base.json",
    "colors": { "button.background": "#12345678", "button.border": "default", },
  }`, { fileName: 'themes/custom.json', files: { 'base.json': {
    type: 'light', colors: { 'foreground': '#123', 'button.background': '#abcdef', 'button.border': '#444' },
  } } });
  expect(theme).toEqual({ name: 'Sample', base: 'light', style: { '--vscode-foreground': '#123', '--vscode-button-background': '#12345678' } });
  expect(createTheme({ type: 'hc' }).base).toBe('hcDark');
  expect(createTheme({ type: 'dark' }, { base: 'hcLight' }).base).toBe('hcLight');
  expect(createTheme({ colors: { 'button.background': null } }).style).toEqual({});
});

test('Invalid or unresolved themes produce actionable errors', () => {
  expect(() => createTheme('{')).toThrow('Theme JSON');
  expect(() => createTheme({ include: './base.json' })).toThrow('Missing included theme: base.json');
  expect(() => createTheme({ include: 'theme.json' }, { files: { 'theme.json': { include: 'theme.json' } } })).toThrow('Circular theme include');
  expect(() => createTheme({ colors: { 'button.background': 'url(example.com)' } })).toThrow('button.background must use');
});

test('Imported theme updates scoped component colors and file includes', async ({ page }) => {
  await page.goto('/iframe.html?id=themes-import--preview&viewMode=story&globals=theme:hcDark');
  const preview = page.getByTestId('imported-theme');
  const source = page.getByRole('textbox', { name: 'Theme JSON' });
  await source.fill('{"type":"light","colors":{"sideBar.background":"#ffeecc","button.background":"#126789","gitDecoration.modifiedResourceForeground":"#c000a0"}}');
  await expect(preview).toHaveAttribute('data-theme', 'light');
  expect(await preview.evaluate(el => getComputedStyle(el).getPropertyValue('--vscode-contrastBorder').trim())).toBe('');
  await expect(preview).toHaveCSS('background-color', 'rgb(255, 238, 204)');
  await expect(preview.getByRole('button', { name: 'Create File', exact: true })).toHaveCSS('background-color', 'rgb(18, 103, 137)');
  await expect(preview.locator('[data-id="button"] .monaco-icon-label')).toHaveCSS('color', 'rgb(192, 0, 160)');
  await page.getByLabel('Theme files', { exact: true }).setInputFiles([
    { name: 'custom.jsonc', mimeType: 'application/json', buffer: Buffer.from('{"include":"./base.json","colors":{"button.background":"#abcdef"}}') },
    { name: 'base.json', mimeType: 'application/json', buffer: Buffer.from('{"type":"light","colors":{"sideBar.background":"#fafafa"}}') },
  ]);
  await expect(preview).toHaveCSS('background-color', 'rgb(250, 250, 250)');
  await expect(preview.getByRole('button', { name: 'Create File', exact: true })).toHaveCSS('background-color', 'rgb(171, 205, 239)');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await source.fill('{"include":"missing.json"}');
  await expect(page.getByRole('alert')).toContainText('Missing included theme');
});

for (const component of ['tree-view', 'action-bar', 'menu', 'dropdown', 'codicon', 'keybinding-label', 'progress-bar', 'count-badge', 'toolbar', 'scrollable-element', 'context-menu', 'breadcrumbs']) test(`Storybook toolbar switches both reference and Vue themes / ${component}`, async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto(`/?path=/story/components-${component}--review&globals=theme:dark`);
  const story = page.frameLocator('#storybook-preview-iframe');
  const replica = story.frameLocator('iframe[title="Vue replica"]');
  const original = story.frameLocator('iframe[title="VS Code original"]');
  await replica.locator('.fixture-root').waitFor();
  await page.getByText('Dark+（深色）', { exact: true }).click();
  await page.getByText('Light+（浅色）', { exact: true }).click();
  await expect(story.locator('.gallery-root')).toHaveAttribute('data-theme', 'light');
  await expect(replica.locator('.fixture-root')).toHaveAttribute('data-theme', 'light');
  await expect(original.locator('#fixture')).toHaveClass(/\bvs\b/);
  await page.getByText('Light+（浅色）', { exact: true }).click();
  await page.getByText('高对比度 · 深色', { exact: true }).click();
  await expect(replica.locator('.fixture-root')).toHaveAttribute('data-theme', 'hcDark');
  await expect(original.locator('#fixture')).toHaveClass(/hc-black/);
});
