// Oracle only: the real platform-selecting SelectBox implementation.
import { SelectBox } from '../../vscode/src/vs/base/browser/ui/selectBox/selectBox.js';
import { ContextView, ContextViewDOMPosition, AnchorPosition } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { defaultSelectBoxStyles } from '../../vscode/src/vs/platform/theme/browser/defaultStyles.js';
import { selectExamples } from '../../components/stories/SelectBoxData';
export function mountSelectBox(root: HTMLElement, surface: HTMLElement, state: any) {
  surface.className = 'specimen'; surface.style.cssText = 'display:flex;flex-direction:column;gap:28px;padding:4px;box-sizing:border-box';
  root.style.setProperty('--vscode-icon-chevron-down-content', `'\\eab4'`); root.style.setProperty('--vscode-icon-chevron-down-font-family', 'codicon');
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  const provider = { showContextView: delegate => view.show(delegate), hideContextView: () => view.hide(), layout: () => view.layout() } as any;
  Object.assign(state, { selections: selectExamples.map(item => item.selected), events: [] });
  const selects = selectExamples.map((example, index) => {
    const outer = document.createElement('div'); outer.style.width = '184px'; outer.dataset.index = String(index); surface.append(outer);
    const host = document.createElement('div'); outer.append(host);
    if (example.toolbar) { outer.className = 'monaco-action-bar'; host.className = 'action-item'; }
    const select = new SelectBox(example.options.map(option => ({ ...option, isDisabled: option.disabled || option.separator, isSeparator: option.separator })), example.selected, provider, defaultSelectBoxStyles,
      { useCustomDrawn: example.custom, ariaLabel: example.ariaLabel, hideDisabledOptions: example.hideDisabled, maxVisibleOptions: example.maxVisibleOptions, anchorPosition: example.placement === 'above' ? AnchorPosition.ABOVE : AnchorPosition.BELOW });
    select.render(host); select.setEnabled(!example.disabled);
    select.onDidSelect(event => { state.selections[index] = event.index; state.events.push(`${index}:${event.index}`); });
    return select;
  });
  window.addEventListener('resize', () => provider.layout());
  window.addEventListener('scroll', () => provider.layout(), true);
  (window as any).fixtureSelects = selects;
}
