// Independent oracle: the actual BannerPart, its registered commands and Link.
import { BannerPart } from "../../vscode/src/vs/workbench/browser/parts/banner/bannerPart.js";
import { Link } from "../../vscode/src/vs/platform/opener/browser/link.js";
import { MarkdownRendererService } from "../../vscode/src/vs/platform/markdown/browser/markdownRenderer.js";
import { MarkdownString } from "../../vscode/src/vs/base/common/htmlContent.js";
import { Event } from "../../vscode/src/vs/base/common/event.js";
import { Disposable } from "../../vscode/src/vs/base/common/lifecycle.js";
import { URI } from "../../vscode/src/vs/base/common/uri.js";
import { CommandsRegistry } from "../../vscode/src/vs/platform/commands/common/commands.js";
import { IBannerService } from "../../vscode/src/vs/workbench/services/banner/browser/bannerService.js";
import { getBaseLayerHoverDelegate } from "../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js";
import { getIconsStyleSheet } from "../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js";
import { bannerItems } from "../../components/stories/BannerData";
import type { BannerItem } from "../../components/src/components/banner/types";

export function mountBanner(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
) {
  const iconStyle = document.createElement("style");
  iconStyle.textContent = getIconsStyleSheet(undefined).getCSS();
  document.head.append(iconStyle);
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, { closes: [], actions: [] });
  surface.className = "specimen";
  surface.style.height = "52px";
  const element = document.createElement("div");
  element.className = "part banner";
  element.style.height = "26px";
  surface.append(element);
  const opener = {
    open: (href: string) => {
      state.actions.push({ id: (banner as any).item?.id, href });
      return Promise.resolve(true);
    },
  };
  const theme = {
    getColorTheme: () => ({ getColor: () => undefined }),
    onDidColorThemeChange: Event.None,
  };
  const layout = {
    registerPart: () => Disposable.None,
    setPartHidden: (hidden: boolean) => {
      element.style.display = hidden ? "none" : "";
    },
  };
  const context = {
    createScoped: () => ({
      createKey: () => ({ set() {}, reset() {} }),
      dispose() {},
    }),
  };
  const instantiation = {
    createInstance: (Ctor: typeof Link, ...args: any[]) =>
      new Ctor(
        args[0],
        args[1],
        args[2],
        getBaseLayerHoverDelegate() as any,
        opener as any,
      ),
  };
  const banner = new BannerPart(
    theme as any,
    layout as any,
    { onWillSaveState: Event.None } as any,
    context as any,
    instantiation as any,
    new MarkdownRendererService(opener as any),
  );
  banner.create(element);
  Object.defineProperties(state, {
    active: { enumerable: true, get: () => (banner as any).item?.id ?? null },
    items: { enumerable: true, get: () => [...(banner as any).items.keys()] },
  });
  const variant =
    new URLSearchParams(location.search).get("variant") || "welcome";
  function showItem(item: BannerItem) {
    banner.show({
      ...item,
      icon:
        typeof item.icon === "string"
          ? { id: item.icon }
          : item.icon
            ? URI.parse(item.icon.url)
            : undefined,
      message:
        variant === "rich"
          ? new MarkdownString("Workspace **ready**. [Read the guide](#guide).")
          : item.message,
      onClose: () => state.closes.push(item.id),
    });
  }
  function show(name: string) {
    showItem({ ...bannerItems[name] });
  }
  show(variant in bannerItems ? variant : "welcome");
  const accessor = {
    get: (id: unknown) => {
      if (id === IBannerService) return banner;
      throw new Error("Unexpected Banner service");
    },
  };
  window.addEventListener("keydown", (event) => {
    if (!(event.target instanceof Node) || !element.contains(event.target))
      return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    const command =
      event.key === "Escape"
        ? "focusBanner"
        : ["ArrowRight", "ArrowDown"].includes(event.key)
          ? "focusNextAction"
          : ["ArrowLeft", "ArrowUp"].includes(event.key)
            ? "focusPreviousAction"
            : undefined;
    if (!command) return;
    CommandsRegistry.getCommand(`workbench.banner.${command}`)!.handler(
      accessor as any,
    );
    event.preventDefault();
  });
  function clear() {
    for (const id of [...(banner as any).items.keys()] as string[])
      banner.hide(id);
  }
  (window as any).fixtureApi = {
    show,
    hide: (id: string) => banner.hide(id),
    focus: () => banner.focus(),
    next: () => banner.focusNextAction(),
    previous: () => banner.focusPreviousAction(),
    update: () =>
      showItem({
        ...bannerItems.welcome,
        message: "Workspace information has changed.",
        actions: [{ label: "Review", href: "#review" }],
      }),
    clear,
    replace: () => {
      clear();
      show("neutral");
      show("latest");
    },
  };
  for (const [label, run] of [
    ["Show priority banner", () => show("warning")],
    ["Show neutral banner", () => show("neutral")],
    ["Focus banner", () => banner.focus()],
  ] as const) {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", run);
    root.append(button);
  }
  const resize = () =>
    banner.layout(surface.clientWidth, banner.minimumHeight, 0, 0);
  new ResizeObserver(resize).observe(surface);
  banner.onDidChange(resize);
  resize();
}
