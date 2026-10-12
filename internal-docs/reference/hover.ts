// Independent oracle: real workbench HoverWidget, HoverService and managed delegate.
import { WorkbenchHoverDelegate } from '../../vscode/src/vs/platform/hover/browser/hover.js';
import { HoverPosition } from '../../vscode/src/vs/base/browser/ui/hover/hoverWidget.js';
import { AnchorAlignment } from '../../vscode/src/vs/base/browser/ui/contextview/contextview.js';
import { createFixtureHoverService } from './hover-service';
import { hoverFixtureOptions } from '../../components/stories/HoverData';
export function mountHover(root: HTMLElement, surface: HTMLElement, state: any) {
  const options = hoverFixtureOptions();
  Object.assign(state, { actions: [], visibility: [] });
  surface.className = 'specimen'; surface.style.cssText = 'height:300px;position:relative';
  const target = document.createElement('button'); target.className = 'hover-target'; target.textContent = 'Hover target'; target.style.cssText = 'position:absolute;left:110px;top:110px;width:120px;height:26px'; surface.append(target);
  const { service, config } = createFixtureHoverService(root, options.delay);
  const content = options.html ? document.createElement('div') : options.content;
  if (content instanceof HTMLElement) { content.innerHTML = '<p>Rendered <strong>HTML</strong> and <code>code</code>.</p><a href="#details">Read details</a>'; content.querySelector('a')!.addEventListener('click', e => { e.preventDefault(); state.actions.push('link'); }); }
  const nestedContent = document.createElement('div'); nestedContent.innerHTML = '<p>Nested hover content.</p><button class="nested-inside">Keep parent open</button>';
  let nestedTarget: HTMLButtonElement;
  function showNested() { service.showInstantHover({ target: nestedTarget, content: nestedContent, position: { hoverPosition: HoverPosition.RIGHT }, trapFocus: true }, true); }
  if (options.nested && content instanceof HTMLElement) { nestedTarget = document.createElement('button'); nestedTarget.className = 'nested-target'; nestedTarget.textContent = 'Nested target'; content.prepend(nestedTarget); nestedTarget.addEventListener('click', showNested); }
  (window as any).showNestedHover = showNested;
  const actions = options.actions.map(action => ({ commandId: action.id, label: action.label, iconClass: action.icon ? `codicon codicon-${action.icon}` : undefined, run: () => state.actions.push(action.id) }));
  const callbacks = { onDidShow: () => state.visibility.push(true), onDidHide: () => state.visibility.push(false) };
  const delegate = new WorkbenchHoverDelegate(options.placement, undefined, callbacks, config as any, service);
  const managed = options.tooltip ? service.setupManagedHover(delegate, target, content, { actions }) : undefined;
  function show(focus = true) {
    if (managed) { managed.show(focus); return; }
    service.showInstantHover({ target, content, appearance: { showPointer: options.pointer, compact: options.compact }, position: { hoverPosition: { above: HoverPosition.ABOVE, below: HoverPosition.BELOW, left: HoverPosition.LEFT, right: HoverPosition.RIGHT }[options.position], anchorAlignment: options.alignment === 'right' ? AnchorAlignment.RIGHT : AnchorAlignment.LEFT, forcePosition: options.force }, persistence: { hideOnHover: options.hideOnHover, sticky: options.sticky }, trapFocus: true, actions, ...callbacks }, focus);
  }
  if (!options.tooltip) target.addEventListener('click', () => show());
  (window as any).showHover = show; (window as any).hideHover = () => managed ? managed.hide() : service.hideHover();
}
