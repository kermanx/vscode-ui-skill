import { expect, type Page } from '@playwright/test';

// Compare a fresh paint while keeping the final DOM state, layout and styles intact.
export async function settleFixturePaint(page: Page, repaint: 'transform' | 'filter' = 'transform', selector = '[data-testid="specimen"]') {
    await page.bringToFront();
    const unchanged = await page.evaluate(async ({repaint,selector}) => {
      await Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
      const root = document.documentElement;
      const original = root.style[repaint];
      const active = document.activeElement;
      const state = JSON.stringify((window as any).fixtureState);
      // Theme variables repeat on every descendant. Intern exact property/value
      // pairs so large compositions still compare every computed property
      // without retaining several copies of the full theme for each element.
      const pairIds = new Map<string, number>();
      const pairs: [string, string][] = [];
      const intern = (key: string, value: string) => {
        const identity = JSON.stringify([key, value]);
        let id = pairIds.get(identity);
        if (id === undefined) {
          id = pairs.length;
          pairs.push([key, value]);
          pairIds.set(identity, id);
        }
        return id;
      };
      const snapshot = () => [...document.querySelectorAll(`${selector}, ${selector} *`)].map(element => {
        const style = getComputedStyle(element);
        return { rect: element.getBoundingClientRect().toJSON(), style: [...style].sort().map(key => intern(key, style.getPropertyValue(key))) };
      });
      const before = JSON.stringify(snapshot());
      const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      root.style[repaint] = repaint === 'filter' ? 'brightness(1)' : 'translateZ(0)';
      await frame(); await frame();
      root.style[repaint] = original;
      await frame(); await frame();
      const after = snapshot();
      const previous = JSON.parse(before);
      const changes = after.flatMap((entry, index) => {
        const old = previous[index];
        if (!old || JSON.stringify(old) === JSON.stringify(entry)) return [];
        return [{ index, rect: JSON.stringify(old.rect) === JSON.stringify(entry.rect) ? undefined : [old.rect, entry.rect], styles: entry.style.flatMap((id, styleIndex) => old.style[styleIndex] === id ? [] : [[pairs[id][0], pairs[old.style[styleIndex]]?.[1], pairs[id][1]]]) }];
      });
      return { focus: document.activeElement === active, state: JSON.stringify((window as any).fixtureState) === state, layoutAndStyle: JSON.stringify(after) === before ? true : changes };
    }, {repaint,selector});
    expect(unchanged).toEqual({ focus: true, state: true, layoutAndStyle: true });
}
