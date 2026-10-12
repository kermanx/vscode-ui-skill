import "../../vscode/src/vs/workbench/services/progress/browser/media/progressService.css";
// Real PaneCompositeBar and its original action/view-item constructors run against a small host.
import { PaneCompositeBar } from "../../vscode/src/vs/workbench/browser/parts/paneCompositeBar.js";
import { InstantiationService } from "../../vscode/src/vs/platform/instantiation/common/instantiationService.js";
import { ServiceCollection } from "../../vscode/src/vs/platform/instantiation/common/serviceCollection.js";
import {
  IStorageService,
  InMemoryStorageService,
} from "../../vscode/src/vs/platform/storage/common/storage.js";
import { IContextMenuService } from "../../vscode/src/vs/platform/contextview/browser/contextView.js";
import { IThemeService } from "../../vscode/src/vs/platform/theme/common/themeService.js";
import { IHoverService } from "../../vscode/src/vs/platform/hover/browser/hover.js";
import { IConfigurationService } from "../../vscode/src/vs/platform/configuration/common/configuration.js";
import { IKeybindingService } from "../../vscode/src/vs/platform/keybinding/common/keybinding.js";
import { ICommandService } from "../../vscode/src/vs/platform/commands/common/commands.js";
import { IContextKeyService } from "../../vscode/src/vs/platform/contextkey/common/contextkey.js";
import {
  IViewDescriptorService,
  ViewContainerLocation,
} from "../../vscode/src/vs/workbench/common/views.js";
import { IViewsService } from "../../vscode/src/vs/workbench/services/views/common/viewsService.js";
import {
  IWorkbenchLayoutService,
  Parts,
} from "../../vscode/src/vs/workbench/services/layout/browser/layoutService.js";
import { IExtensionService } from "../../vscode/src/vs/workbench/services/extensions/common/extensions.js";
import { IWorkbenchEnvironmentService } from "../../vscode/src/vs/workbench/services/environment/common/environmentService.js";
import {
  IActivityService,
  NumberBadge,
  IconBadge,
  ProgressBadge,
} from "../../vscode/src/vs/workbench/services/activity/common/activity.js";
import { ActionsOrientation } from "../../vscode/src/vs/base/browser/ui/actionbar/actionbar.js";
import {
  ContextView,
  ContextViewDOMPosition,
} from "../../vscode/src/vs/base/browser/ui/contextview/contextview.js";
import { ContextMenuHandler } from "../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js";
import { HoverPosition } from "../../vscode/src/vs/base/browser/ui/hover/hoverWidget.js";
import { Color } from "../../vscode/src/vs/base/common/color.js";
import { ColorScheme } from "../../vscode/src/vs/platform/theme/common/theme.js";
import { Emitter, Event } from "../../vscode/src/vs/base/common/event.js";
import { getIconsStyleSheet } from "../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js";
import { installFixtureHoverService } from "./hover-service";
import type { CompositeItem } from "../../components/src/components/composite-bar/types";
// These imports register the real theming participants, in addition to loading native CSS.
import "../../vscode/src/vs/workbench/browser/parts/activitybar/activitybarPart.js";
import "../../vscode/src/vs/workbench/browser/parts/panel/panelPart.js";

export interface CompositeBarHostCallbacks {
  onOpen?: (id: string, focus: boolean) => void;
  onVisibility?: (visible: boolean) => void;
  onChange?: () => void;
}

export function createCompositeBarHost(
  root: HTMLElement,
  state: any,
  items: CompositeItem[],
  vertical: boolean,
  icons = vertical,
  callbacks: CompositeBarHostCallbacks = {},
) {
  const params = new URLSearchParams(location.search);
  const color = (id: string) =>
    Color.Format.CSS.parse(
      getComputedStyle(root)
        .getPropertyValue(`--vscode-${id.replaceAll(".", "-")}`)
        .trim(),
    ) || undefined;
  const theme = {
    getColorTheme: () => ({
      getColor: color,
      defines: () => false,
      type: root.classList.contains("hc-black")
        ? ColorScheme.HIGH_CONTRAST_DARK
        : root.classList.contains("hc-light")
          ? ColorScheme.HIGH_CONTRAST_LIGHT
          : root.classList.contains("vs")
            ? ColorScheme.LIGHT
            : ColorScheme.DARK,
    }),
    onDidColorThemeChange: Event.None,
  };
  const { service: hover, config: hoverConfig } =
    installFixtureHoverService(root);
  const style = document.createElement("style");
  style.textContent = getIconsStyleSheet(undefined).getCSS();
  root.append(style);
  const config = {
    ...hoverConfig,
    getValue: (key: string) =>
      key === "workbench.activityBar.iconClickBehavior"
        ? params.get("clickBehavior") || "toggle"
        : key === "workbench.panel.showLabels"
          ? !icons
          : hoverConfig.getValue(key),
  };
  const keys = {
    onDidUpdateKeybindings: Event.None,
    lookupKeybinding: (id: string) => {
      const item = items.find((item) => item.id === id);
      return item?.keybinding ? { getLabel: () => item.keybinding } : undefined;
    },
  };
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  window.addEventListener("resize", () => view.layout());
  const menus = new ContextMenuHandler(
    {
      showContextView: (delegate) => view.show(delegate),
      hideContextView: (data) => view.hide(data),
    } as any,
    { publicLog2() {} } as any,
    {
      error: (error) => {
        throw error;
      },
    } as any,
    keys as any,
  );
  const opened = new Emitter<any>(),
    closed = new Emitter<any>(),
    activitiesChanged = new Emitter<any>(),
    containersChanged = new Emitter<any>();
  let activeId = params.get("active") || items[0]?.id;
  let visible = params.get("visible") !== "false";
  const locationId = vertical
    ? ViewContainerLocation.Sidebar
    : ViewContainerLocation.Panel;
  const containers = items.map((item, order) => ({
    id: item.id,
    title: item.label,
    order,
  }));
  const models = new Map(
    containers.map((container) => [
      container.id,
      {
        viewContainer: container,
        title: container.title,
        icon: {
          id: items.find((item) => item.id === container.id)?.icon || "circle",
        },
        keybindingId: items.find((item) => item.id === container.id)?.keybinding
          ? container.id
          : undefined,
        activeViewDescriptors: [{}],
        allViewDescriptors: [],
        onDidChangeContainerInfo: Event.None,
        onDidChangeActiveViewDescriptors: Event.None,
      },
    ]),
  );
  const descriptor = {
    getViewContainerById: (id: string) =>
      containers.find((container) => container.id === id),
    getViewContainerLocation: () => locationId,
    getDefaultViewContainerLocation: () => locationId,
    getViewContainersByLocation: (at: number) =>
      at === locationId ? containers : [],
    getDefaultViewContainer: () => containers[0],
    getViewContainerModel: (container: any) => models.get(container.id),
    onDidChangeViewContainers: containersChanged.event,
    onDidChangeContainerLocation: Event.None,
    isViewContainerRemovedPermanently: () => false,
    canMoveViews: () => false,
    getViewContainerBadgeEnablementState: (id: string) =>
      items.find((item) => item.id === id)?.badgesEnabled !== false,
    setViewContainerBadgeEnablementState: (id: string, enabled: boolean) => {
      const item = items.find((item) => item.id === id);
      if (item) item.badgesEnabled = enabled;
      state.badges.push({ id, enabled });
    },
  };
  const pane = {
    onDidPaneCompositeOpen: opened.event,
    onDidPaneCompositeClose: closed.event,
    getActivePaneComposite: () =>
      activeId && visible ? { getId: () => activeId } : undefined,
    openPaneComposite: async (id: string, focus: boolean) => {
      state.opens.push({ id, focus });
      if (activeId && activeId !== id) closed.fire({ getId: () => activeId });
      activeId = id;
      visible = true;
      state.activeId = id;
      state.visible = visible;
      const composite = { getId: () => id };
      // CompositePart opens the content and transfers focus before firing open.
      callbacks.onOpen?.(id, !!focus);
      opened.fire(composite);
      return composite;
    },
  };
  const layout = {
    isVisible: () => visible,
    setPartHidden: (hidden: boolean) => {
      visible = !hidden;
      state.visible = visible;
      state.visibility.push(visible);
      if (hidden) closed.fire({ getId: () => activeId });
      callbacks.onVisibility?.(visible);
    },
    getSideBarPosition: () => (params.get("side") === "right" ? 1 : 0),
    registerPart: () => ({ dispose() {} }),
    isFloatingPanelsEnabled: () => false,
    isModernUICompact: () => false,
  };
  const activity = {
    onDidChangeActivity: activitiesChanged.event,
    getViewContainerActivities: (id: string) =>
      (items.find((item) => item.id === id)?.badges || []).map((badge) => ({
        badge:
          badge.type === "number"
            ? new NumberBadge(badge.value, () => badge.description || "")
            : badge.type === "icon"
              ? new IconBadge({ id: badge.icon }, () => badge.description || "")
              : new ProgressBadge(() => badge.description || ""),
      })),
  };
  const services = new ServiceCollection();
  for (const [id, service] of [
    [IStorageService, new InMemoryStorageService()],
    [IContextMenuService, menus],
    [IThemeService, theme],
    [IHoverService, hover],
    [IConfigurationService, config],
    [IKeybindingService, keys],
    [
      ICommandService,
      {
        executeCommand: async (id: string, ...args: unknown[]) =>
          state.commands.push({ id, args }),
      },
    ],
    [IContextKeyService, { contextMatchesRules: () => true, createKey: (_key: string, defaultValue: unknown) => { let value = defaultValue; return { set: (next: unknown) => value = next, get: () => value, reset: () => value = defaultValue }; } }],
    [IViewDescriptorService, descriptor],
    [IViewsService, { isViewContainerActive: () => true }],
    [IWorkbenchLayoutService, layout],
    [
      IExtensionService,
      { whenInstalledExtensionsRegistered: () => Promise.resolve(), onDidRegisterExtensions: Event.None },
    ],
    [IWorkbenchEnvironmentService, {}],
    [IActivityService, activity],
  ] as [any, any][])
    services.set(id, service);
  const instantiation = new InstantiationService(services, true);
  const bar = instantiation.createInstance(
    PaneCompositeBar,
    locationId,
    {
      partContainerClass: vertical ? "activitybar" : "panel",
      pinnedViewContainersKey: "fixture.pinned",
      placeholderViewContainersKey: "fixture.placeholders",
      viewContainersWorkspaceStateKey: "fixture.state",
      icon: icons,
      iconSize: vertical ? 24 : 16,
      compact: !vertical,
      orientation: vertical
        ? ActionsOrientation.VERTICAL
        : ActionsOrientation.HORIZONTAL,
      preventLoopNavigation: vertical,
      recomputeSizes: !vertical,
      compositeSize: vertical ? 48 : 0,
      overflowActionSize: vertical ? 48 : 44,
      activityHoverOptions: {
        position: () =>
          vertical
            ? params.get("side") === "right"
              ? HoverPosition.LEFT
              : HoverPosition.RIGHT
            : HoverPosition.ABOVE,
      },
      transformContextMenuActionsForComposite: () => [],
      fillExtraContextMenuActions: () => {},
      colors: (theme) =>
        vertical
          ? {
              activeForegroundColor: theme.getColor("activityBar.foreground"),
              inactiveForegroundColor: theme.getColor(
                "activityBar.inactiveForeground",
              ),
              activeBorderColor: theme.getColor("activityBar.activeBorder"),
              activeBackground: theme.getColor("activityBar.activeBackground"),
              badgeBackground: theme.getColor("activityBarBadge.background"),
              badgeForeground: theme.getColor("activityBarBadge.foreground"),
              dragAndDropBorder: theme.getColor("activityBar.dropBorder"),
            }
          : {
              activeBackgroundColor: theme.getColor("panel.background"),
              inactiveBackgroundColor: theme.getColor("panel.background"),
              activeBorderBottomColor: theme.getColor(
                "panelTitle.activeBorder",
              ),
              activeForegroundColor: theme.getColor(
                "panelTitle.activeForeground",
              ),
              inactiveForegroundColor: theme.getColor(
                "panelTitle.inactiveForeground",
              ),
              badgeBackground: theme.getColor("panelTitleBadge.background"),
              badgeForeground: theme.getColor("panelTitleBadge.foreground"),
              dragAndDropBorder: theme.getColor("panel.dropBorder"),
            },
    },
    vertical ? Parts.ACTIVITYBAR_PART : Parts.PANEL_PART,
    pane as any,
  );
  // Pin/visibility are public persisted inputs; setting the source model avoids a fake item implementation.
  const core = (bar as any).compositeBar;
  core.setCompositeBarItems(
    items.map((item, order) => ({
      id: item.id,
      name: item.label,
      order,
      pinned: item.pinned !== false,
      visible: item.visible !== false,
    })),
  );
  if (visible) core.activateComposite(activeId);
  Object.assign(state, { activeId, visible });
  return {
    instantiation, services, pane, layout,
    bar,
    core,
    color,
    updateBadges: (id: string, badges: CompositeItem["badges"]) => {
      const item = items.find((item) => item.id === id);
      if (item) item.badges = badges;
      activitiesChanged.fire(
        containers.find((container) => container.id === id),
      );
    },
  };
}
