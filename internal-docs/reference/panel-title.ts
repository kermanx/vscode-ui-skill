// Real PanelPart/AbstractPaneCompositePart title, real PaneCompositeBar and native toolbars.
import { PanelPart } from '../../vscode/src/vs/workbench/browser/parts/panel/panelPart.js';
import { INotificationService } from '../../vscode/src/vs/platform/notification/common/notification.js';
import { IMenuService } from '../../vscode/src/vs/platform/actions/common/actions.js';
import { IActionViewItemService } from '../../vscode/src/vs/platform/actions/browser/actionViewItemService.js';
import { ITelemetryService } from '../../vscode/src/vs/platform/telemetry/common/telemetry.js';
import { Event } from '../../vscode/src/vs/base/common/event.js';
import { Dimension } from '../../vscode/src/vs/base/browser/dom.js';
import { Action } from '../../vscode/src/vs/base/common/actions.js';
import { createCompositeBarHost, type CompositeBarHostCallbacks } from './composite-bar-host';
import { createCompositeContent } from './composite-content';
import { actionsForMenu } from './menu';
import { panelTitleItems, panelTitlePrimary, panelTitleSecondary } from '../../components/stories/PanelTitleData';
export function mountPanelTitle(root: HTMLElement, surface: HTMLElement, state: any, callbacks?: CompositeBarHostCallbacks) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, { opens: [], visibility: [], badges: [], commands: [], actions: [] });
  const action = (id: string) => { state.actions.push(id); callbacks?.onChange?.(); };
  const params = new URLSearchParams(location.search);
  const items = panelTitleItems();
  const host = createCompositeBarHost(root, state, items, false, params.get('icons') === 'true', callbacks || createCompositeContent(surface, items, 'panel'));
  host.services.set(INotificationService, { error: (error: unknown) => { throw error; } } as any);
  host.services.set(IMenuService, { createMenu: () => ({ getActions: () => [], onDidChange: Event.None, dispose() {} }), getMenuActions: () => [] } as any);
  host.services.set(ITelemetryService, { publicLog2() {} } as any);
  host.services.set(IActionViewItemService, { lookUp: () => undefined, onDidChange: Event.None } as any);
  surface.className = 'specimen'; surface.style.cssText = 'height:35px;position:relative';
  const frame = document.createElement('div'); frame.className = 'part panel bottom pane-composite-part'; frame.style.cssText = 'position:relative'; surface.append(frame);
  class TitlePart extends PanelPart {
    override getContainer() { return frame; }
    override getActivePaneComposite(): any { return host.pane.getActivePaneComposite(); }
    protected override createCompositeBar() { return host.bar; }
    mount() { this.element = frame; this.titleArea = this.createTitleArea(frame); this.updateCompositeBar(); this.updateStyles(); }
    setActions() {
      this.toolBar!.setActions(panelTitlePrimary.map(entry => {
        if ('separator' in entry) throw new Error('Unexpected separator');
        return new Action(entry.id, entry.label, entry.icon ? `codicon-${entry.icon}` : '', !entry.disabled, async () => action(entry.id));
      }), actionsForMenu(panelTitleSecondary, action));
      this.titleArea!.classList.add('has-actions');
    }
    resize() { (this as any)._dimension = new Dimension(surface.clientWidth, 35); this.contentDimension = new Dimension(surface.clientWidth, 0); (this as any).layoutCompositeBar(); }
  }
  const part = host.instantiation.createInstance(TitlePart);
  part.mount(); part.setActions();
  new ResizeObserver(() => part.resize()).observe(surface);
  (window as any).fixtureApi = { focus: (index?: number) => host.bar.focus(index), badge: host.updateBadges, activate: (id: string) => host.core.activateComposite(id), pin: (id: string) => host.core.pin(id), unpin: (id: string) => host.core.unpin(id) };
}
