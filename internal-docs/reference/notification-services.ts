// Minimal host services; all notification, list, menu and model implementations are real.
import { InstantiationService } from "../../vscode/src/vs/platform/instantiation/common/instantiationService.js";
import { ServiceCollection } from "../../vscode/src/vs/platform/instantiation/common/serviceCollection.js";
import { IConfigurationService } from "../../vscode/src/vs/platform/configuration/common/configuration.js";
import { IContextKeyService } from "../../vscode/src/vs/platform/contextkey/common/contextkey.js";
import { ContextKeyService } from "../../vscode/src/vs/platform/contextkey/browser/contextKeyService.js";
import {
  IListService,
  ListService,
} from "../../vscode/src/vs/platform/list/browser/listService.js";
import { IKeybindingService } from "../../vscode/src/vs/platform/keybinding/common/keybinding.js";
import {
  ICommandService,
  CommandsRegistry,
} from "../../vscode/src/vs/platform/commands/common/commands.js";
import { IContextMenuService } from "../../vscode/src/vs/platform/contextview/browser/contextView.js";
import {
  ContextView,
  ContextViewDOMPosition,
} from "../../vscode/src/vs/base/browser/ui/contextview/contextview.js";
import { ContextMenuHandler } from "../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js";
import { IHoverService } from "../../vscode/src/vs/platform/hover/browser/hover.js";
import { getBaseLayerHoverDelegate } from "../../vscode/src/vs/base/browser/ui/hover/hoverDelegate2.js";
import { IOpenerService } from "../../vscode/src/vs/platform/opener/common/opener.js";
import { IClipboardService } from "../../vscode/src/vs/platform/clipboard/common/clipboardService.js";
import { ITelemetryService } from "../../vscode/src/vs/platform/telemetry/common/telemetry.js";
import {
  INotificationService,
  NotificationsFilter,
} from "../../vscode/src/vs/platform/notification/common/notification.js";
import { IAccessibilitySignalService } from "../../vscode/src/vs/platform/accessibilitySignal/browser/accessibilitySignalService.js";
import { IThemeService } from "../../vscode/src/vs/platform/theme/common/themeService.js";
import { Color } from "../../vscode/src/vs/base/common/color.js";
import { Event, Emitter } from "../../vscode/src/vs/base/common/event.js";
import { getIconsStyleSheet } from "../../vscode/src/vs/platform/theme/browser/iconsStyleSheet.js";
import "../../vscode/src/vs/workbench/browser/actions/listCommands.js";

export function notificationServices(root: HTMLElement, state: any) {
  const collection = new ServiceCollection();
  const configurationChanged = new Emitter<any>();
  const config = {
    getValue: (key: string) =>
      key === "workbench.list.mouseWheelScrollSensitivity"
        ? 1
        : key === "workbench.list.fastScrollSensitivity"
          ? 5
          : key === "workbench.notifications.position"
            ? state.position || "bottom-right"
            : key === "workbench.list.openMode"
              ? "singleClick"
              : false,
    updateValue: (_key: string, value: unknown) => {
      state.position = value;
      configurationChanged.fire({
        affectsConfiguration: (key: string) =>
          key === "workbench.notifications.position",
        affectedKeys: new Set(["workbench.notifications.position"]),
      });
      return Promise.resolve();
    },
    onDidChangeConfiguration: configurationChanged.event,
  };
  const keys = {
    lookupKeybinding: () => undefined,
    mightProducePrintableCharacter: () => false,
    softDispatch: () => ({ kind: 0 }),
    inChordMode: false,
    onDidUpdateKeybindings: Event.None,
  };
  const telemetry = { publicLog2() {} };
  const filters = new Map<string, number>(),
    filterEvent = new Emitter<void>();
  const notification = {
    error: console.error,
    getFilter: (source?: { id: string }) =>
      source
        ? filters.get(source.id) || NotificationsFilter.OFF
        : state.doNotDisturb
          ? NotificationsFilter.ERROR
          : NotificationsFilter.OFF,
    getFilters: () =>
      (state.sources || []).map((source: any) => ({
        ...source,
        filter: filters.get(source.id) || NotificationsFilter.OFF,
      })),
    onDidChangeFilter: filterEvent.event,
    setFilter: (value: number | { id: string; filter: number }) => {
      if (typeof value === "number") {
        state.doNotDisturb = value === NotificationsFilter.ERROR;
        filterEvent.fire();
        return;
      }
      filters.set(value.id, value.filter);
      state.filters.push({
        id: value.id,
        filtered: value.filter === NotificationsFilter.ERROR,
      });
      filterEvent.fire();
    },
  };
  const context = new ContextKeyService(config as any),
    listService = new ListService();
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  window.addEventListener("resize", () => view.layout());
  const contextView = {
    showContextView: (delegate: any) => view.show(delegate),
    hideContextView: (data: unknown) => view.hide(data),
  };
  const menu = new ContextMenuHandler(
    contextView as any,
    telemetry as any,
    notification as any,
    keys as any,
  );
  const style = document.createElement("style");
  style.textContent = getIconsStyleSheet(undefined).getCSS();
  document.head.append(style);
  collection.set(IConfigurationService, config as any);
  collection.set(IContextKeyService, context);
  collection.set(IListService, listService);
  collection.set(IKeybindingService, keys as any);
  collection.set(ITelemetryService, telemetry as any);
  collection.set(INotificationService, notification as any);
  collection.set(IContextMenuService, menu as any);
  collection.set(IHoverService, getBaseLayerHoverDelegate() as any);
  collection.set(IOpenerService, {
    open: (uri: any) => {
      state.links.push(uri.toString());
      return Promise.resolve(true);
    },
  } as any);
  collection.set(IClipboardService, {
    writeText: (text: string) => {
      state.copies.push(text);
      return Promise.resolve();
    },
  } as any);
  collection.set(IAccessibilitySignalService, { playSignal() {} } as any);
  collection.set(IThemeService, {
    getColorTheme: () => ({
      getColor: (id: string) => {
        const value = getComputedStyle(root)
          .getPropertyValue(`--vscode-${id.replaceAll(".", "-")}`)
          .trim();
        return value ? Color.Format.CSS.parse(value) : undefined;
      },
    }),
    onDidColorThemeChange: Event.None,
  } as any);
  const instantiation = new InstantiationService(collection, true);
  collection.set(ICommandService, {
    executeCommand: (id: string, ...args: unknown[]) =>
      Promise.resolve(
        instantiation.invokeFunction((accessor) =>
          CommandsRegistry.getCommand(id)?.handler(accessor, ...args),
        ),
      ),
  } as any);
  return {
    instantiation,
    collection,
    config,
    context,
    listService,
    menu,
    view,
    notification,
    filters,
    configurationChanged,
  };
}
