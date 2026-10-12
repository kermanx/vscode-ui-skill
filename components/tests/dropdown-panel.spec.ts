import { test, expect } from '@playwright/test';
import { menuPair, menuPixels, menuState } from './menu-fixture';
for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Dropdown composes Menu with original appearance / ${theme}`, async ({ context }, info) => {
    const pages = await menuPair(context, 'dropdown-panel', theme);
    await menuPixels(pages, info, 'dropdown-default');
    for (const page of pages) {
      const label = page.locator('[data-index="0"] .dropdown-label');
      await label.focus(); await page.keyboard.press('Enter');
      await expect(page.getByRole('menu')).toBeFocused();
    }
    await menuPixels(pages, info, 'dropdown-open', '.context-view:not(.monaco-submenu)');
    for (const page of pages) {
      await page.keyboard.press('End'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowRight');
      await expect(page.getByRole('menuitem', { name: 'Workspace' })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('menu')).not.toBeVisible();
      await expect(page.locator('[data-index="0"] .dropdown-label')).toBeFocused();
    }
    expect(await menuState(pages[1])).toEqual(await menuState(pages[0]));
    expect((await menuState(pages[1])).actions).toEqual(['workspace']);
  });
}
test('Dropdown mouse opening, disabled trigger, Escape and outside dismissal', async ({ context }) => {
  const pages = await menuPair(context, 'dropdown-panel');
  for (const page of pages) {
    const trigger = page.locator('[data-index="0"] .dropdown-label');
    await trigger.focus();
    await trigger.click(); await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await trigger.click(); await page.mouse.click(390, 350); await expect(page.getByRole('menu')).not.toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const disabled = page.locator('[data-index="1"] .dropdown-label');
    await disabled.focus(); await page.keyboard.press('Space'); await disabled.click({ force: true });
    await expect(page.getByRole('menu')).not.toBeVisible();
  }
});
test('Dropdown closes and restores the trigger when its host resizes', async ({ context }) => {
  const pages = await menuPair(context, 'dropdown-panel');
  for (const page of pages) {
    const trigger = page.locator('[data-index="0"] .dropdown-label');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeFocused();
    await page.setViewportSize({ width: 500, height: 520 });
    await expect(page.getByRole('menu')).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
  expect(await menuState(pages[1])).toEqual(await menuState(pages[0]));
});
