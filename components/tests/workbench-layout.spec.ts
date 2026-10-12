import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { menuPixels } from "./menu-fixture";
test.use({ viewport: { width: 900, height: 620 } });
async function pair(context: BrowserContext, theme = "dark", side = "left") {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages)
    page.on("pageerror", (error) => errors.push(error.message));
  await pages[0]!.goto(
    `/reference/index.html?kind=workbench-layout&theme=${theme}&side=${side}`,
  );
  await pages[1]!.goto(
    `/iframe.html?id=compositions-workbench-layout--specimen&viewMode=story&globals=theme:${theme}&side=${side}`,
  );
  for (const page of pages)
    await page.waitForFunction(() => (window as any).fixtureReady);
  expect(errors).toEqual([]);
  await equal(pages);
  return pages;
}
async function state(page: Page) {
  return page.evaluate(() => ({
    state: (window as any).fixtureState,
    parts: [...document.querySelectorAll<HTMLElement>("[data-workbench-part]")]
      .map((e) => [e.dataset.workbenchPart, e.getBoundingClientRect().toJSON()])
      .sort(),
  }));
}
async function equal(pages: Page[]) {
  await expect(async () =>
    expect(await state(pages[1]!)).toEqual(await state(pages[0]!)),
  ).toPass({ timeout: 2000 });
}
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`WorkbenchLayout classic part arrangement / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme);
    await menuPixels(pages, info, "initial");
  });
test("WorkbenchLayout right sidebar, window resize and controlled visibility", async ({
  context,
}, info) => {
  const pages = await pair(context, "light", "right");
  for (const width of [1100, 700, 580, 900]) {
    for (const page of pages)
      await page.setViewportSize({ width, height: 620 });
    await equal(pages);
    await menuPixels(pages, info, `width-${width}`);
  }
  for (const value of [
    { sidebarVisible: false },
    { panelVisible: false },
    { statusBarVisible: false },
    { activityBarVisible: false },
    {
      sidebarVisible: true,
      panelVisible: true,
      statusBarVisible: true,
      activityBarVisible: true,
    },
    { sidebarWidth: 270, panelHeight: 120 },
  ]) {
    for (const page of pages)
      await page.evaluate(
        (value) => (window as any).fixtureApi.set(value),
        value,
      );
    await equal(pages);
    await menuPixels(pages, info, JSON.stringify(value));
  }
});
test("WorkbenchLayout source constrained sash dragging", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const [axis, delta] of [
    ["vertical", 65],
    ["horizontal", -45],
  ] as const) {
    for (const page of pages) {
      const sash = page.locator(`.monaco-sash.${axis}:not(.disabled)`).first();
      const b = (await sash.boundingBox())!;
      const x = b.x + b.width / 2,
        y = b.y + b.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(
        x + (axis === "vertical" ? delta : 0),
        y + (axis === "horizontal" ? delta : 0),
        { steps: 5 },
      );
      await page.mouse.up();
      await page.mouse.move(890, 600);
    }
    await equal(pages);
    await menuPixels(pages, info, axis);
  }
});

for (const side of ["left", "right"])
  test(`WorkbenchLayout sash reset and snap restoration / ${side}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, "dark", side);
    for (const axis of ["vertical", "horizontal"]) {
      for (const page of pages) {
        const sash = page
          .locator(`.monaco-sash.${axis}:not(.disabled)`)
          .first();
        await sash.dblclick();
        await page.mouse.move(890, 600);
      }
      await equal(pages);
      await menuPixels(pages, info, `reset-${axis}`);
    }
    for (const [axis, delta] of [
      ["vertical", side === "left" ? -350 : 350],
      ["horizontal", 250],
    ] as const) {
      for (const page of pages) {
        const sash = page
          .locator(`.monaco-sash.${axis}:not(.disabled)`)
          .first();
        const b = (await sash.boundingBox())!;
        const x = b.x + b.width / 2,
          y = b.y + b.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(
          x + (axis === "vertical" ? delta : 0),
          y + (axis === "horizontal" ? delta : 0),
          { steps: 8 },
        );
        await page.mouse.up();
        await page.mouse.move(890, 600);
      }
      await equal(pages);
      await menuPixels(pages, info, `snap-${axis}`);
      for (const page of pages)
        await page.evaluate(
          (value) => (window as any).fixtureApi.set(value),
          axis === "vertical"
            ? { sidebarVisible: true }
            : { panelVisible: true },
        );
      await equal(pages);
      await menuPixels(pages, info, `restore-${axis}`);
    }
  });
