import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { menuPixels } from "./menu-fixture";
async function pair(context: BrowserContext, theme = "dark", options = "") {
  const pages = [await context.newPage(), await context.newPage()],
    errors: string[] = [];
  for (const page of pages)
    page.on("pageerror", (error) => errors.push(error.message));
  await pages[0].goto(
    `/reference/index.html?kind=notifications-list&theme=${theme}${options}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-notifications-list--specimen&viewMode=story&globals=theme:${theme}${options}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(errors).toEqual([]);
  return pages;
}
const row = (page: Page, index: number) =>
  page.locator(`.monaco-list-row[data-index="${index}"]`);
const list = (page: Page) => page.locator(".monaco-list");
const state = (page: Page) => page.evaluate(() => (window as any).fixtureState);
async function equal(pages: Page[]) {
  await expect(async () => {
    expect(await state(pages[1])).toEqual(await state(pages[0]));
  }).toPass({ timeout: 5000 });
}
async function api(pages: Page[], action: string) {
  for (const page of pages)
    await page.evaluate(
      (action) => (window as any).fixtureApi[action](),
      action,
    );
  await equal(pages);
}
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`NotificationsList true renderer, expansion, links and progress / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await equal(pages);
    await menuPixels(pages, info, "initial");
    for (const page of pages) {
      await row(page, 0).hover();
      await row(page, 0)
        .getByRole("button", { name: "Expand Notification", exact: true })
        .click();
    }
    await equal(pages);
    await menuPixels(pages, info, "expanded-source");
    for (const page of pages) {
      await row(page, 1).dblclick();
    }
    await equal(pages);
    await menuPixels(pages, info, "expanded-message");
    await api(pages, "progress");
    await menuPixels(pages, info, "progress-done");
    await api(pages, "update");
    await menuPixels(pages, info, "message-update");
  });
test("NotificationsList primary choice menus, keepOpen, secondary menus and message links", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page.setViewportSize({ width: 720, height: 480 });
  for (const page of pages) {
    await row(page, 0).locator(".notification-list-item-message a").click();
    await row(page, 2)
      .getByRole("button", { name: "Retry", exact: true })
      .click();
  }
  await equal(pages);
  expect((await state(pages[1])).items).toContain("error");
  for (const page of pages)
    await row(page, 2).locator(".monaco-dropdown-button").click();
  await menuPixels(pages, info, "primary-menu", ".context-view");
  for (const page of pages)
    await page
      .getByRole("menuitem", { name: "Retry all connections", exact: true })
      .click();
  await equal(pages);
  for (const page of pages)
    await row(page, 2)
      .locator(".notification-list-item-toolbar-container")
      .getByRole("button", { name: "More Actions...", exact: true })
      .click();
  await menuPixels(pages, info, "secondary-menu", ".context-view");
  for (const page of pages)
    await page
      .getByRole("menuitem", { name: "Open logs", exact: true })
      .click();
  await equal(pages);
  for (const page of pages)
    await row(page, 2)
      .getByRole("button", { name: "Ignore", exact: true })
      .click();
  await equal(pages);
  expect((await state(pages[1])).items).not.toContain("error");
});
test("NotificationsList focus-only navigation, progress dismissal guard, copy and focus restoration", async ({
  context,
}, info) => {
  const pages = await pair(context);
  await api(pages, "focus");
  for (const key of [
    "ArrowRight",
    "ArrowDown",
    "Enter",
    "ArrowLeft",
    "End",
    "Home",
  ]) {
    for (const page of pages) await page.keyboard.press(key);
    await equal(pages);
  }
  await menuPixels(pages, info, "keyboard");
  for (const page of pages) {
    await row(page, 3).click({ button: "middle" });
    expect((await state(page)).items).toContain("progress");
    await row(page, 0).click({ button: "right" });
  }
  await menuPixels(pages, info, "copy-menu", ".context-view");
  for (const page of pages)
    await page
      .getByRole("menuitem", { name: "Copy Text", exact: true })
      .click();
  await equal(pages);
  await api(pages, "clear");
  expect((await state(pages[1])).items).toEqual(["progress"]);
  await menuPixels(pages, info, "only-progress");
});
test("NotificationsList platform dismissal, focus restoration, source filters and resize-close", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page.setViewportSize({ width: 720, height: 480 });
  await api(pages, "focus");
  const mac = await pages[0].evaluate(() => navigator.platform.includes("Mac"));
  for (const page of pages) {
    await page.keyboard.press("End");
    await page.keyboard.press(mac ? "Meta+Backspace" : "Delete");
    expect((await state(page)).items).toContain("progress");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press(mac ? "Meta+Backspace" : "Delete");
  }
  await equal(pages);
  expect((await state(pages[1])).focus).toEqual(["info"]);
  expect((await state(pages[1])).items).not.toContain("warning");
  await menuPixels(pages, info, "dismiss-focus");
  for (const page of pages) {
    await page.bringToFront();
    await row(page, 1)
      .locator(".notification-list-item-toolbar-container")
      .getByRole("button", { name: "More Actions...", exact: true })
      .click();
    await page.bringToFront();
    await page.getByRole("menu").focus();
    await expect.poll(async () => (await state(page)).focus).toEqual([]);
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
  }
  await equal(pages);
  for (const page of pages) {
    await page.bringToFront();
    await row(page, 1)
      .locator(".notification-list-item-toolbar-container")
      .getByRole("button", { name: "More Actions...", exact: true })
      .click();
    await expect(
      page.getByRole("menuitem", {
        name: "Turn On All Notifications from 'Remote Tools'",
        exact: true,
      }),
    ).toBeVisible();
    await page.setViewportSize({ width: 721, height: 480 });
    await expect(page.getByRole("menuitem")).toHaveCount(0);
  }
});
test("NotificationsList virtual rows, page navigation, wheel and dynamic prepend preserve focus", async ({
  context,
}, info) => {
  test.setTimeout(60000);
  const pages = await pair(context, "dark", "&large=true");
  for (const page of pages)
    expect(await page.locator(".monaco-list-row").count()).toBeLessThan(12);
  await api(pages, "focus");
  for (const key of ["PageDown", "PageDown", "PageUp", "End", "Home"]) {
    for (const page of pages) await page.keyboard.press(key);
    await equal(pages);
  }
  for (const page of pages) {
    await list(page).hover();
    await page.mouse.wheel(0, 125);
  }
  await menuPixels(pages, info, "large-wheel");
  await api(pages, "add");
  await menuPixels(pages, info, "large-prepend");
  expect((await state(pages[1])).focus).toEqual(["notification-0"]);
  for (const page of pages)
    expect(await page.locator(".monaco-list-row").count()).toBeLessThan(12);
});
