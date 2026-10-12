import { test, expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
const original = (theme: string) => `${process.env.REFERENCE_URL ?? '/reference/index.html'}?kind=codicon&theme=${theme}`;
// The pinned contribution stylesheet is the oracle for which `symbolIcon.*` variable paints which
// symbol id. It is parsed instead of hard-coding 34 mappings, so a rule missing from the replica
// copy cannot hide behind a hand-maintained list.
const pinnedSymbolIcons = readFileSync(resolve(process.cwd(), '../vscode/src/vs/editor/contrib/symbolIcons/browser/symbolIcons.css'), 'utf8');
const replicaSymbolIcons = readFileSync(resolve(process.cwd(), 'src/components/codicon/symbolIcons.css'), 'utf8');
/** Every `.codicon-colored.codicon.codicon-symbol-<id>` selector with the variable its rule sets. */
const symbolIconRules = pinnedSymbolIcons.split('}').flatMap(block => {
  const token = /--vscode-symbolIcon-([A-Za-z]+)Foreground/.exec(block);
  if (!token) return [];
  return [...block.matchAll(/\.codicon-colored\.codicon\.codicon-symbol-([a-z-]+)/g)].map(match => ({ id: match[1], token: token[1] }));
});
const rgb = (value: string) => {
  const hex = value.replace('#', '');
  const full = hex.length === 3 ? [...hex].map(character => character + character).join('') : hex;
  return `rgb(${parseInt(full.slice(0, 2), 16)}, ${parseInt(full.slice(2, 4), 16)}, ${parseInt(full.slice(4, 6), 16)})`;
};
async function pair(context: BrowserContext, theme = 'dark') {
  const pages = [await context.newPage(), await context.newPage()];
  const errors: string[] = [];
  for (const page of pages) page.on('pageerror', error => errors.push(error.message));
  await pages[0].goto(original(theme));
  await pages[1].goto(`/iframe.html?id=components-codicon--specimen&viewMode=story&globals=theme:${theme}`);
  for (const page of pages) {
    await page.waitForFunction(() => (window as any).fixtureReady);
    // The glyphs are the whole comparison, so wait for the icon face itself and then for a painted frame.
    await page.evaluate(async () => {
      await document.fonts.load('16px codicon');
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
  }
  expect(errors).toEqual([]);
  return pages;
}
// One screenshot of the whole specimen: every icon, label line and font-size context, zero tolerance.
async function pixels(pages: Page[], info: TestInfo, name: string) {
  const buffers: Buffer[] = [];
  for (const page of pages) { await page.bringToFront(); buffers.push(await page.getByTestId('specimen').screenshot({ animations: 'disabled' })); }
  const [a, b] = buffers.map(buffer => PNG.sync.read(buffer));
  expect({ width: a.width, height: a.height }).toEqual({ width: b.width, height: b.height });
  const diff = new PNG({ width: a.width, height: a.height });
  const count = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0, includeAA: true });
  if (count) for (const [index, body] of [...buffers, PNG.sync.write(diff)].entries()) await info.attach(`${name}-${index}`, { body, contentType: 'image/png' });
  expect(count, name).toBe(0);
}
const cell = (page: Page, key: string) => page.locator(`[data-key="${key}"] .codicon`);
/**
 * Colour probe: one `codicon-colored` icon per symbol id from the pinned stylesheet, appended to the
 * specimen so it sits in the same shell as the rendered icons (`#fixture.monaco-workbench` on the
 * original page, `.vc-theme` on the replica), read back as the computed colour and removed again.
 */
const coloredSymbolColors = (page: Page, ids: string[]) => page.evaluate((ids: string[]) => {
  const host = document.querySelector('[data-testid="specimen"]')!;
  const result: Record<string, string> = {};
  for (const id of ids) {
    const probe = document.createElement('span');
    probe.className = `codicon codicon-symbol-${id} codicon-colored`;
    host.append(probe);
    result[id] = getComputedStyle(probe).color;
    probe.remove();
  }
  return result;
}, ids);
// Every observable property of every rendered icon, including the ::before box that draws the glyph.
async function computed(page: Page) {
  return page.evaluate(() => {
    const result: Record<string, Record<string, string>> = {};
    for (const box of document.querySelectorAll('[data-key]')) {
      const key = (box as HTMLElement).dataset.key!;
      const element = box.querySelector('.codicon') as HTMLElement | null;
      if (!element) { result[key] = { missing: 'true' }; continue; }
      const style = getComputedStyle(element), before = getComputedStyle(element, '::before');
      result[key] = {
        className: element.className, fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight,
        color: style.color, opacity: style.opacity, display: style.display, textTransform: style.textTransform,
        animationName: style.animationName, animationDuration: style.animationDuration, animationTimingFunction: style.animationTimingFunction,
        transformOrigin: style.transformOrigin, content: before.content, beforeAnimationName: before.animationName,
      };
    }
    return result;
  });
}
async function state(page: Page) {
  return page.evaluate(() => { const { icons, ariaLabels } = (window as any).fixtureState; return { icons, ariaLabels }; });
}
// Codicon glyphs live in the private use area of the icon font; `none` means the id has no glyph at all.
const glyph = /^"[\uea60-\uecff]"$/;

for (const theme of ['dark', 'light', 'hcDark', 'hcLight']) {
  test(`Codicon visual parity / ${theme}`, async ({ context }, info) => {
    const pages = await pair(context, theme);
    await pixels(pages, info, 'icons');
    // Same icon set and the same accessible names on both sides.
    expect(await state(pages[1])).toEqual(await state(pages[0]));
    const icons = (await state(pages[0])).icons;
    for (const id of ['sync', 'sync~spin', 'gear~spin', 'loading', 'loading~spin', 'notebook-state-executing~spin', 'tree-item-loading', 'wrench-subaction']) {
      expect(icons, `${id} rendered`).toContain(id);
    }
    const styles = [await computed(pages[0]), await computed(pages[1])];
    // Font metrics, colors, glyphs and the animation contract are identical property by property.
    expect(styles[1]).toEqual(styles[0]);
    // Symbol colours. `codicon-colored` is the class `renderIcon(icon, true)` adds, and the colour
    // comes from the pinned symbolIcons.css contribution - not from codicon.css, and not from the
    // shared bundle by accident. The expected values are read from public/reference/themes.json (the
    // original algorithm's output), so the replica has to resolve the real `symbolIcon.*` variables
    // from src/theme/tokens.css: two uncoloured pages, or a colour hard-coded in the component,
    // fail here. No temporary `addStyleTag` injection is used or needed - the variables are part of
    // the generated token set, and asking for the themed value keeps that wiring under test.
    const colors: Record<string, string> = (await (await pages[0].request.get('/reference/themes.json')).json())[theme];
    const symbolIds = symbolIconRules.map(rule => rule.id);
    const probes = [await coloredSymbolColors(pages[0], symbolIds), await coloredSymbolColors(pages[1], symbolIds)];
    for (const { id, token } of symbolIconRules) {
      const expected = colors[`symbolIcon.${token}Foreground`];
      expect(expected, `themes.json ${theme} symbolIcon.${token}Foreground`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(probes[0][id], `original codicon-colored codicon-symbol-${id}`).toBe(rgb(expected));
      expect(probes[1][id], `replica codicon-colored codicon-symbol-${id}`).toBe(rgb(expected));
    }
    // The three coloured cells the specimen renders, and the same ids without `codicon-colored` in
    // the plain row: the class, not the id, selects the symbol colour.
    const iconForeground = rgb(colors['icon.foreground']);
    for (const [key, token] of [['colored/symbol-class', 'class'], ['colored/symbol-method', 'method'], ['colored/symbol-enum', 'enumerator']] as const) {
      for (const index of [0, 1]) expect(styles[index][key].color, `${index ? 'replica' : 'original'} ${key}`).toBe(rgb(colors[`symbolIcon.${token}Foreground`]));
      expect(styles[1][key].className, `replica ${key} class`).toContain('codicon-colored');
    }
    for (const key of ['plain/symbol-class', 'plain/symbol-method', 'plain/symbol-enum']) {
      for (const index of [0, 1]) expect(styles[index][key].color, `${index ? 'replica' : 'original'} ${key} keeps the default colour`).toBe(iconForeground);
    }
    // Two equally uncoloured pages would satisfy the equality above while proving nothing: every
    // shipped theme keeps the symbol colour apart from the default icon colour.
    expect(iconForeground, `${theme} symbol colour differs from the default icon colour`).not.toBe(rgb(colors['symbolIcon.classForeground']));
    for (const [key, style] of Object.entries(styles[0])) {
      // Only the escaped-marker line may contain no icon element at all.
      if (Object.keys(style).length === 1) { expect(key, 'only the escaped label line has no icon').toBe('labels/2'); continue; }
      expect(style.fontFamily, `${key} font-family`).toBe('codicon');
      expect(style.lineHeight, `${key} line-height`).toBe(style.fontSize);
      expect(style.content, `${key} ::before content`).toMatch(glyph);
    }
    // `$(iconId)` becomes an inline icon, `\$(iconId)` stays text; the accessible name is the stripped text.
    const labelText = [' Syncing  2 changes', ' Problems  1', 'Escaped $(icon) stays literal'];
    const labelIcons = [2, 2, 0];
    for (let index = 0; index < 3; index++) {
      const line = (page: Page) => page.locator(`[data-key="labels/${index}"]`);
      expect(await line(pages[1]).textContent()).toBe(await line(pages[0]).textContent());
      expect(await line(pages[1]).textContent()).toBe(labelText[index]);
      expect(await line(pages[1]).locator('.codicon').count()).toBe(await line(pages[0]).locator('.codicon').count());
      expect(await line(pages[0]).locator('.codicon').count()).toBe(labelIcons[index]);
      expect(await line(pages[1]).getAttribute('aria-label')).toBe(await line(pages[0]).getAttribute('aria-label'));
    }
  });
}

test('Codicon spin, disabled, size and naming rules match the pinned workbench', async ({ context, page }) => {
  const pages = await pair(context);
  const styles = [await computed(pages[0]), await computed(pages[1])];
  const at = (index: number, key: string, property: string) => styles[index][key][property];
  for (const index of [0, 1]) {
    const where = index ? 'replica' : 'original';
    // codicon-modifiers.css: sync/gear and notebook-state-executing need the modifier, loading spins on its own.
    expect(at(index, 'modifiers/sync', 'animationName'), `${where} plain sync`).toBe('none');
    for (const key of ['modifiers/sync~spin', 'modifiers/gear~spin', 'modifiers/notebook-state-executing~spin']) {
      expect(at(index, key, 'animationName'), `${where} ${key} animation-name`).toBe('codicon-spin');
      expect(at(index, key, 'animationDuration'), `${where} ${key} animation-duration`).toBe('1.5s');
      expect(at(index, key, 'animationTimingFunction'), `${where} ${key} animation-timing-function`).toBe('steps(30)');
    }
    // `loading` animates without the modifier. Its duration and easing come from the
    // @vscode/codicons stylesheet the theme layer imports (1s / cubic-bezier), not from codicon-modifiers.css.
    for (const key of ['modifiers/loading', 'modifiers/loading~spin']) expect(at(index, key, 'animationName'), `${where} ${key} animation-name`).toBe('codicon-spin');
    // transform-origin: center center, resolved against the icon box, so the rotation cannot wobble.
    for (const key of ['modifiers/sync~spin', 'modifiers/gear~spin']) {
      // Layout size, not getBoundingClientRect: the icon is rotating while we measure.
      const [width, height] = await cell(pages[index], key).evaluate(element => [element.offsetWidth, element.offsetHeight]);
      expect(at(index, key, 'transformOrigin'), `${where} ${key} transform-origin`).toBe(`${width / 2}px ${height / 2}px`);
    }
    // .codicon-tree-item-loading::before spins; the twistie element itself carries no animation.
    expect(at(index, 'modifiers/tree-item-loading', 'animationName'), `${where} tree twistie`).toBe('none');
    expect(at(index, 'modifiers/tree-item-loading', 'beforeAnimationName'), `${where} tree twistie ::before`).toBe('codicon-spin');
    // .codicon-modifier-disabled and .codicon-wrench-subaction.
    for (const key of ['disabled/check~disabled', 'disabled/folder~disabled', 'disabled/sync~spin~disabled']) {
      expect(at(index, key, 'opacity'), `${where} ${key} opacity`).toBe('0.4');
    }
    expect(at(index, 'plain/check', 'opacity'), `${where} enabled check opacity`).toBe('1');
    expect(at(index, 'modifiers/wrench-subaction', 'opacity'), `${where} wrench-subaction opacity`).toBe('0.5');
    // codicon.css pins 16px inside the workbench, an inline font-size still wins.
    for (const key of ['sizes/add', 'sizes/gear', 'sizes/check']) expect(at(index, key, 'fontSize'), `${where} ${key} font-size`).toBe('16px');
    expect(at(index, 'sizes/inline', 'fontSize'), `${where} inline font-size`).toBe('24px');
  }
  // getCodiconAriaLabel: `$(iconId)` markers become spaces, an escaped marker stays literal.
  const ariaLabels = (await state(pages[0])).ariaLabels;
  expect(ariaLabels).toEqual(['sync~spin  Syncing  check  2 changes', 'warning  Problems  error  1', 'Escaped \\ icon  stays literal']);
  expect((await state(pages[1])).ariaLabels).toEqual(ariaLabels);
  // The specimen renders decoration: no tab stop, no role, no disabled semantics, no hover or click behaviour.
  for (const page of pages) {
    expect(await page.locator('.codicon[tabindex], .codicon[role], .codicon[aria-disabled]').count()).toBe(0);
    const before = await computed(page);
    await cell(page, 'modifiers/sync').hover();
    await cell(page, 'modifiers/sync').click();
    expect(await computed(page)).toEqual(before);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  }
  // The label / title props are additive (the workbench names the container instead of the glyph).
  await page.goto('/iframe.html?id=components-codicon--playground&viewMode=story&globals=theme:dark&args=name:sync;spin:true;disabled:false;label:Syncing;title:Synchronizing%20changes');
  const named = page.locator('.playground .codicon');
  await expect(named).toHaveClass('codicon codicon-sync codicon-modifier-spin');
  await expect(named).toHaveAttribute('role', 'img');
  await expect(named).toHaveAttribute('aria-label', 'Syncing');
  await expect(named).toHaveAttribute('title', 'Synchronizing changes');
  await expect(named).not.toHaveAttribute('aria-hidden');
  await page.goto('/iframe.html?id=components-codicon--playground&viewMode=story&globals=theme:dark&args=name:loading;spin:false;disabled:true;label:;title:');
  const decorative = page.locator('.playground .codicon');
  await expect(decorative).toHaveClass('codicon codicon-loading codicon-modifier-disabled');
  await expect(decorative).toHaveAttribute('aria-hidden', 'true');
  await expect(decorative).not.toHaveAttribute('role');
  await expect(decorative).not.toHaveAttribute('aria-label');
});



test('Every registered Codicon has the correct glyph without runtime source dependencies', async ({ context }) => {
  const pages = await pair(context);
  const glyphs = await pages[0].evaluate(() => (window as any).fixtureCodiconGlyphs as Record<string, number>);
  expect(Object.keys(glyphs).length).toBeGreaterThan(500);
  for (const page of pages) {
    const rendered = await page.evaluate(ids => {
      const host = document.querySelector('.fixture-root, #fixture')!;
      const result: Record<string, string> = {};
      for (const id of ids) {
        const icon = document.createElement('span'); icon.className = `codicon codicon-${id}`; host.append(icon);
        result[id] = getComputedStyle(icon, '::before').content; icon.remove();
      }
      return result;
    }, Object.keys(glyphs));
    for (const [id, code] of Object.entries(glyphs)) expect(rendered[id], id).toBe(`"${String.fromCodePoint(code)}"`);
  }
});

test('Symbol icon colours are the pinned symbolIcons.css, aliased to the replica theme root', () => {
  // 34 selectors, 33 rules: `symbol-value` and `symbol-enum` share enumeratorForeground.
  expect(symbolIconRules).toHaveLength(34);
  expect(new Set(symbolIconRules.map(rule => rule.id)).size).toBe(34);
  const ruleLines = (css: string) => css.split('\n').filter(line =>
    line.startsWith('.monaco-editor ') || line.startsWith('.monaco-workbench ') || line.startsWith('.vc-theme ') || line.includes('{ color: var(--vscode-symbolIcon-'));
  // Rule for rule the pinned file, with the workbench shell aliased to `.vc-theme`: every upstream
  // line has to be present, and the copy may not invent a declaration of its own.
  expect(ruleLines(replicaSymbolIcons).map(line => line.replace('.vc-theme .codicon-colored', '.monaco-workbench .codicon-colored')))
    .toEqual(ruleLines(pinnedSymbolIcons));
  expect(pinnedSymbolIcons).toContain('.monaco-workbench .codicon-colored.codicon.codicon-symbol-array');
  expect(replicaSymbolIcons, 'the shell alias').toContain('.vc-theme .codicon-colored.codicon.codicon-symbol-array');
  expect(ruleLines(replicaSymbolIcons).filter(line => line.startsWith('.monaco-workbench ')), 'no dead workbench selector left').toEqual([]);
  // The component loads it after codicon.css, the order the workbench uses.
  const component = readFileSync(resolve(process.cwd(), 'src/components/codicon/Codicon.vue'), 'utf8');
  expect(component).toContain('<style src="./symbolIcons.css" />');
  expect(component.indexOf('<style src="./codicon.css" />')).toBeLessThan(component.indexOf('<style src="./symbolIcons.css" />'));
  // The whole point of the contribution import: the standalone harness builds only the display
  // fixtures, so this page has to bring the stylesheet itself instead of relying on another
  // fixture's import to drag it into the shared bundle.
  const fixture = readFileSync(resolve(process.cwd(), '../internal-docs/reference/codicon.ts'), 'utf8');
  expect(fixture).toContain("import '../../vscode/src/vs/editor/contrib/symbolIcons/browser/symbolIcons.css';");
});
