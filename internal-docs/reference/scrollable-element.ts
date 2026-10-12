// Real DomScrollableElement. The fixture provides the same slot content and resize scan integration.
import { DomScrollableElement } from '../../vscode/src/vs/base/browser/ui/scrollbar/scrollableElement.js';
import { ScrollbarVisibility } from '../../vscode/src/vs/base/common/scrollable.js';
import { scrollableRows } from '../../components/stories/ScrollableElementData';
export function mountScrollableElement(root: HTMLElement, surface: HTMLElement, state: any) {
  for (const key of Object.keys(state)) delete state[key];
  const params = new URLSearchParams(location.search);
  const mode = (key: string) => params.get(key) === 'hidden' ? ScrollbarVisibility.Hidden : params.get(key) === 'visible' ? ScrollbarVisibility.Visible : ScrollbarVisibility.Auto;
  function create(host: HTMLElement, id: string, index: number, height: number, options: any = {}) {
    const viewport = document.createElement('div'); viewport.className = 'vc-scrollable-viewport'; viewport.style.cssText = 'overflow:hidden;height:100%;width:100%';
    const content = document.createElement('div'); content.className = 'vc-scrollable-content'; content.style.display = 'flow-root'; viewport.append(content);
    const scrollable = new DomScrollableElement(viewport, options); const node = scrollable.getDomNode(); node.dataset.index = String(index); node.style.height = `${height}px`; host.append(node);
    scrollable.onScroll(e => { state[id] = { width:e.width, height:e.height, scrollWidth:e.scrollWidth, scrollHeight:e.scrollHeight, scrollTop:e.scrollTop, scrollLeft:e.scrollLeft }; });
    let frame = 0;
    const scan = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; scrollable.scanDomNode(); }); };
    const observer = new ResizeObserver(scan);
    function observe() { observer.disconnect(); observer.observe(viewport); observer.observe(content); for (const child of content.children) observer.observe(child); }
    const mutations = new MutationObserver(() => { observe(); scan(); }); mutations.observe(content, { subtree: true, childList: true, attributes: true, characterData: true });
    content.addEventListener('load', scan, true); observe(); scan();
    return { scrollable, node, content, scan };
  }
  function rows(host: HTMLElement, count: number, width: number, suffix?: string) {
    host.replaceChildren(); host.style.width = `${width}px`;
    for (const row of scrollableRows.slice(0, count)) {
      const element = document.createElement('div'); element.style.cssText = 'height:22px;line-height:22px;white-space:nowrap'; host.append(element);
      if (suffix) element.textContent = `${row.label} — ${suffix} content`;
      else { element.style.display = 'flex'; const name = document.createElement('span'); name.style.cssText = 'width:380px;flex-shrink:0'; name.textContent = row.label; const description = document.createElement('span'); description.textContent = row.detail; element.append(name, description); }
    }
  }
  let horizontal = mode('horizontal'), vertical = mode('vertical');
  const main = create(surface, 'main', 0, 176, { horizontal, vertical, scrollByPage: params.get('paged') === 'true', useShadows: params.get('shadows') !== 'false' });
  const mainRows = document.createElement('div'); main.content.append(mainRows); rows(mainRows, 28, 760);
  const horizontalOnly = create(surface, 'horizontal', 1, 44, { horizontal: ScrollbarVisibility.Visible, vertical: ScrollbarVisibility.Hidden });
  const horizontalRows = document.createElement('div'); horizontalOnly.content.append(horizontalRows); rows(horizontalRows, 2, 760);
  const outer = create(surface, 'outer', 2, 132);
  const heading = document.createElement('div'); heading.style.cssText = 'height:22px;line-height:22px'; heading.textContent = 'Nested scrolling'; outer.content.append(heading);
  const inner = create(outer.content, 'inner', 3, 66, { alwaysConsumeMouseWheel: params.get('contain') === 'true' }); inner.node.style.width = '260px';
  const innerRows = document.createElement('div'); inner.content.append(innerRows); rows(innerRows, 10, 500, 'nested');
  for (const row of scrollableRows.slice(0, 10)) { const element = document.createElement('div'); element.style.cssText = 'height:22px;line-height:22px;white-space:nowrap'; element.textContent = `${row.label} — outer content`; outer.content.append(element); }
  function button(className: string, label: string, run: () => void) { const element = document.createElement('button'); element.className = className; element.textContent = label; element.onclick = run; root.append(element); }
  button('fixture-position', 'Set position', () => main.scrollable.setScrollPosition({ scrollTop: 231, scrollLeft: 163 }));
  button('fixture-resize', 'Resize content', () => { main.node.style.height = '132px'; mainRows.style.height = ''; rows(mainRows, 12, 580); });
  button('fixture-shrink', 'Shrink content', () => { main.node.style.height = '176px'; mainRows.style.height = ''; rows(mainRows, 2, 200); });
  button('fixture-huge', 'Huge content', () => { mainRows.style.width = '100000px'; mainRows.style.height = '100000px'; });
  button('fixture-modes', 'Change modes', () => { horizontal = horizontal === ScrollbarVisibility.Hidden ? ScrollbarVisibility.Auto : ScrollbarVisibility.Hidden; vertical = vertical === ScrollbarVisibility.Visible ? ScrollbarVisibility.Auto : ScrollbarVisibility.Visible; main.scrollable.updateOptions({ horizontal, vertical }); });
  (window as any).referenceScrollableElement = main.scrollable;
}
