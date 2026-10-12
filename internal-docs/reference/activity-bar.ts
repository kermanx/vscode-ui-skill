import { createCompositeBarHost, type CompositeBarHostCallbacks } from "./composite-bar-host";
import { createCompositeContent } from './composite-content';
import { activityBarItems } from "../../components/stories/ActivityBarData";
export function mountActivityBar(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
  callbacks?: CompositeBarHostCallbacks,
  items = activityBarItems(),
) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, { opens: [], visibility: [], badges: [], commands: [] });
  const host = createCompositeBarHost(root, state, items, true, true, callbacks || createCompositeContent(surface, items, 'activity'));
  surface.className = "specimen";
  surface.style.cssText = "width:48px;height:360px;position:relative";
  const part = document.createElement("div");
  part.className = `part activitybar ${new URLSearchParams(location.search).get("side") === "right" ? "right" : "left"}`;
  part.style.cssText = `position:relative;background-color:${host.color("activityBar.background") || ""};border-color:${host.color("activityBar.border") || host.color("contrastBorder") || ""}`;
  if (host.color("activityBar.border") || host.color("contrastBorder"))
    part.classList.add("bordered");
  const content = document.createElement("div");
  content.className = "content";
  part.append(content);
  surface.append(part);
  host.bar.create(content);
  new ResizeObserver(() =>
    host.bar.layout(surface.clientWidth, surface.clientHeight),
  ).observe(surface);
  (window as any).fixtureApi = {
    focus: (index?: number) => host.bar.focus(index),
    setVisible: (visible: boolean) => visible ? host.pane.openPaneComposite(state.activeId, false) : host.layout.setPartHidden(true),
    badge: host.updateBadges,
    open: (id: string, focus = true) => host.pane.openPaneComposite(id, focus),
    activate: (id: string) => host.core.activateComposite(id),
    pin: (id: string) => host.core.pin(id),
    unpin: (id: string) => host.core.unpin(id),
  };
}
