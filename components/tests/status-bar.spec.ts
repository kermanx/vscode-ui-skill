import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { menuPixels } from "./menu-fixture";
const runtimeErrors = new WeakMap<Page, string[]>();
test.use({ viewport: { width: 900, height: 500 } });
async function pair(
  context: BrowserContext,
  theme = "dark",
  variant = "default",
) {
  const pages = [await context.newPage(), await context.newPage()],
    errors: string[] = [];
  for (const page of pages) {
    runtimeErrors.set(page, errors);
    page.on("pageerror", (error) => errors.push(error.message));
  }
  await pages[0].goto(
    `/reference/index.html?kind=status-bar&theme=${theme}&variant=${variant}`,
  );
  await pages[1].goto(
    `/iframe.html?id=components-status-bar--specimen&viewMode=story&globals=theme:${theme}&variant=${variant}`,
  );
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(errors).toEqual([]);
  return pages;
}
async function state(page: Page) {
  return page.evaluate(() => ({
    state: (window as any).fixtureState,
    focus: document.activeElement?.getAttribute("aria-label"),
    items: [...document.querySelectorAll(".statusbar-item")].map((element) => ({
      id: element.id,
      ariaHidden: element.getAttribute("aria-hidden"),
      class: [...element.classList].sort(),
      label: element.querySelector("a")?.textContent,
      role: element.querySelector("a")?.getAttribute("role"),
      tab: element.querySelector("a")?.getAttribute("tabindex"),
      display: (element as HTMLElement).style.display,
    })),
  }));
}
async function equal(pages: Page[]) {
  for (const page of pages) expect(runtimeErrors.get(page)).toEqual([]);
  expect(await state(pages[1])).toEqual(await state(pages[0]));
}
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`StatusBar appearance, kinds, compact items and window state / ${theme}`, async ({
    context,
  }, info) => {
    for (const variant of [
      "default",
      "kinds",
      "priority",
      "no-folder",
      "inactive",
    ]) {
      const pages = await pair(context, theme, variant);
      await equal(pages);
      await menuPixels(pages, info, `${theme}-${variant}`);
      if (variant === "kinds")
        for (const kind of [
          "standard",
          "warning",
          "error",
          "prominent",
          "remote",
          "offline",
        ]) {
          for (const page of pages)
            await page.locator(`#kind-${kind} a`).hover();
          await menuPixels(pages, info, `${theme}-${kind}-hover`);
        }
      if (variant === "default") {
        for (const page of pages)
          await page.evaluate(() => (window as any).fixtureApi.focus(false));
        await menuPixels(pages, info, `${theme}-bar-focus`);
        for (const page of pages) await page.keyboard.press("ArrowRight");
        await menuPixels(pages, info, `${theme}-entry-focus`);
        for (const page of pages) {
          await page.locator(".outside").focus();
          await page.locator("#sync a").hover();
        }
        await menuPixels(pages, info, `${theme}-compact-hover`);
      }
      for (const page of pages) await page.close();
    }
  });
test("StatusBar keyboard navigation, no-command entries and command arguments", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "kinds");
  for (const page of pages) {
    await page.locator(".outside").focus();
    await page.evaluate(() => (window as any).fixtureApi.focus(false));
  }
  await equal(pages);
  await menuPixels(pages, info, "bar-focus");
  for (const key of [
    "ArrowRight",
    "ArrowRight",
    "ArrowDown",
    "End",
    "ArrowRight",
    "ArrowLeft",
    "Home",
    "ArrowUp",
  ]) {
    for (const page of pages) await page.keyboard.press(key);
    await equal(pages);
  }
  for (const page of pages) await page.keyboard.press("Enter");
  await equal(pages);
  expect((await state(pages[0])).state.commands).toHaveLength(0);
  for (const page of pages) {
    await page.keyboard.press("Home");
    await page.keyboard.down("Enter");
  }
  await equal(pages);
  expect((await state(pages[0])).state.commands).toHaveLength(1);
  for (const page of pages) {
    await page.keyboard.up("Enter");
    await page.keyboard.press("Escape");
  }
  await equal(pages);
  expect((await state(pages[0])).focus).toBe("Status Bar");
  for (const page of pages) await page.keyboard.press("Escape");
  await equal(pages);
  expect((await state(pages[0])).state.escapes).toBe(1);
  const commandPages = await pair(context);
  for (const page of commandPages) await page.locator("#branch a").click();
  await equal(commandPages);
  expect((await state(commandPages[0])).state.commands).toEqual([
    { id: "git.checkout", args: ["main"] },
  ]);
});
test("StatusBar visibility, relative fallback, updating and removing entries", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "priority");
  for (const page of pages)
    await page.evaluate(() => {
      const api = (window as any).fixtureApi;
      api.hide("b");
      api.hide("before");
    });
  await equal(pages);
  await menuPixels(pages, info, "hidden-reference");
  for (const page of pages) {
    await page.evaluate(() => {
      const api = (window as any).fixtureApi;
      api.show("b");
      api.remove("b");
    });
  }
  await equal(pages);
  await menuPixels(pages, info, "removed-reference");
  for (const page of pages)
    await page.evaluate(() => {
      const api = (window as any).fixtureApi;
      api.update("a", {
        text: "$(check) Updated A",
        ariaLabel: "Updated A",
        command: "updated",
        kind: "warning",
      });
      api.add({
        id: "added",
        name: "Added",
        text: "Added",
        ariaLabel: "Added",
        priority: 20,
        command: "added",
      });
    });
  await equal(pages);
  await menuPixels(pages, info, "updated-added");
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus(false));
    await page.keyboard.press("ArrowRight");
    await page.locator(".outside").focus();
    await page.evaluate(() => (window as any).fixtureApi.focus());
    await page.waitForTimeout(20);
  }
  await equal(pages);
});
test("StatusBar clips native overflow instead of adding a menu", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const width of [500, 320, 220]) {
    for (const page of pages)
      await page.setViewportSize({ width, height: 500 });
    await menuPixels(pages, info, `overflow-${width}`);
    await equal(pages);
  }
});
test("StatusBar context menu toggles entry visibility", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page.locator("#branch").click({ button: "right" });
  await menuPixels(pages, info, "context-menu", ".monaco-menu-container");
  for (const page of pages) {
    // The native menu ignores clicks during its first 100ms.
    await page.waitForTimeout(120);
    await page.getByRole("menuitemcheckbox", { name: /Git branch$/ }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  await equal(pages);
  await menuPixels(pages, info, "context-hidden");
});
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`StatusBar real hover and pinned tooltip commands / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme, "tooltip");
    for (const page of pages) {
      await page.locator("#show a").hover();
      await expect(page.getByRole("tooltip")).toHaveText(
        "Status details stay open while you inspect them.Inspect",
        { timeout: 2500 },
      );
    }
    await menuPixels(
      pages,
      info,
      `${theme}-delayed-tooltip`,
      ".workbench-hover-container",
    );
    for (const page of pages) {
      await page.locator("#show a").click();
      await expect(page.getByRole("tooltip")).toBeFocused();
      await page.mouse.move(890, 490);
      await page.waitForTimeout(250);
      await expect(page.locator(".workbench-hover-container")).toHaveClass(
        /locked/,
      );
    }
    await menuPixels(
      pages,
      info,
      `${theme}-sticky-tooltip`,
      ".workbench-hover-container",
    );
    for (const page of pages) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await page.locator("#toggle a").click();
      await expect(page.getByRole("tooltip")).toBeVisible();
      await page.locator("#toggle a").click();
      await expect(page.getByRole("tooltip")).toHaveCount(0);
    }
  });
test("StatusBar tooltip footer commands and large hover height", async ({
  context,
}, info) => {
  const pages = await pair(context, "dark", "tooltip");
  for (const page of pages) {
    await page.locator("#show a").click();
    await page.locator(".action-container").click();
  }
  await equal(pages);
  expect((await state(pages[0])).state.commands).toEqual([
    { id: "status.inspect", args: [] },
  ]);
  for (const page of pages) {
    await page.locator("#long a").hover();
    await expect(page.getByRole("tooltip")).toBeVisible({ timeout: 2500 });
  }
  await menuPixels(pages, info, "long-tooltip", ".workbench-hover-container");
});
for (const theme of ["dark", "light", "hcDark", "hcLight"])
  test(`StatusBar progress icons and active command feedback / ${theme}`, async ({
    context,
  }, info) => {
    const pages = await pair(context, theme, "progress");
    for (const page of pages)
      await page.evaluate(() => {
        for (const animation of document.getAnimations()) {
          animation.pause();
          animation.currentTime = 300;
        }
      });
    await equal(pages);
    await menuPixels(pages, info, `${theme}-progress`);
    for (const page of pages) {
      await page.locator("#syncing a").hover();
      await page.mouse.down();
    }
    await menuPixels(pages, info, `${theme}-active`);
    for (const page of pages) await page.mouse.up();
    await equal(pages);
  });

test("StatusBar preserves focused items when entries are inserted, removed and updated", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.evaluate(() => (window as any).fixtureApi.focus(false));
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
  }
  const originalFocus = (await state(pages[0])).focus;
  for (const page of pages)
    await page.evaluate(async () => {
      const api = (window as any).fixtureApi;
      api.add({
        id: "inserted",
        name: "Inserted",
        text: "Inserted",
        ariaLabel: "Inserted",
        priority: 2000,
      });
      await api.afterTick();
    });
  await equal(pages);
  expect((await state(pages[0])).focus).toBe(originalFocus);
  for (const page of pages)
    await page.evaluate(async () => {
      const api = (window as any).fixtureApi;
      api.remove("remote");
      await api.afterTick();
    });
  await equal(pages);
  expect((await state(pages[0])).focus).toBe(originalFocus);
  for (const page of pages)
    await page.evaluate(async () => {
      const api = (window as any).fixtureApi;
      api.update("branch", {
        text: "Updated branch",
        ariaLabel: "Updated branch",
      });
      await api.afterTick();
    });
  await equal(pages);
  expect((await state(pages[0])).focus).toBe("Updated branch");
  await menuPixels(pages, info, "stable-focus");
});

test("StatusBar supports duplicate entry IDs and context action-like IDs", async ({
  context,
}, info) => {
  const pages = await pair(context);
  for (const page of pages)
    await page.evaluate(async () => {
      const api = (window as any).fixtureApi;
      for (const entry of [
        {
          id: "duplicate",
          name: "Duplicate",
          text: "One",
          ariaLabel: "Duplicate one",
          priority: 2001,
        },
        {
          id: "duplicate",
          name: "Duplicate",
          text: "Two",
          ariaLabel: "Duplicate two",
          priority: 2000,
        },
        {
          id: "__hide-statusbar",
          name: "Reserved status",
          text: "RS",
          ariaLabel: "Reserved status",
          priority: 3000,
        },
        {
          id: "__hide-entry:branch",
          name: "Reserved entry",
          text: "RE",
          ariaLabel: "Reserved entry",
          priority: 3001,
        },
      ])
        api.add(entry);
      await api.afterTick();
    });
  await equal(pages);
  for (const page of pages)
    await page
      .getByRole("button", { name: "Duplicate two", exact: true })
      .focus();
  for (const page of pages)
    await page.evaluate(async () => {
      const api = (window as any).fixtureApi;
      api.add({
        id: "duplicate",
        name: "Duplicate",
        text: "Three",
        ariaLabel: "Duplicate three",
        priority: 2002,
      });
      await api.afterTick();
    });
  await equal(pages);
  expect((await state(pages[0])).focus).toBe("Duplicate two");
  for (const label of ["Reserved status", "Reserved entry", "Duplicate"]) {
    for (const page of pages) {
      await page.locator("#branch").click({ button: "right" });
      await page.waitForTimeout(120);
      await page
        .getByRole("menuitemcheckbox", { name: new RegExp(`${label}$`) })
        .click();
      await expect(page.getByRole("menu")).toHaveCount(0);
    }
    await equal(pages);
  }
  expect((await state(pages[0])).state.hides).toBe(0);
  await menuPixels(pages, info, "duplicate-and-reserved-hidden");
  for (const page of pages) {
    await page.locator("#branch").click({ button: "right" });
    await page.waitForTimeout(120);
    await page
      .getByRole("menuitem", { name: "Hide Status Bar", exact: true })
      .click();
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  await equal(pages);
  expect((await state(pages[0])).state.hides).toBe(1);
});

test("StatusBar context menu closes on host resize", async ({ context }) => {
  const pages = await pair(context);
  for (const page of pages) {
    await page.locator("#branch").click({ button: "right" });
    await expect(page.getByRole("menu")).toBeVisible();
    await page.setViewportSize({ width: 850, height: 500 });
    await expect(page.getByRole("menu")).toHaveCount(0);
  }
  await equal(pages);
});
