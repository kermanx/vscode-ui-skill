// Independent oracle: real MainStatusbarPart, StatusbarEntryItem and registered statusbar commands.
import { MainStatusbarPart } from "../../vscode/src/vs/workbench/browser/parts/statusbar/statusbarPart.js";
import { StatusbarEntryItem } from "../../vscode/src/vs/workbench/browser/parts/statusbar/statusbarItem.js";
import { WorkbenchHoverDelegate } from "../../vscode/src/vs/platform/hover/browser/hover.js";
import {
  IStatusbarService,
  ShowTooltipCommand,
  ToggleTooltipCommand,
  StatusbarAlignment,
} from "../../vscode/src/vs/workbench/services/statusbar/browser/statusbar.js";
import { IWorkbenchLayoutService } from "../../vscode/src/vs/workbench/services/layout/browser/layoutService.js";
import { IEditorService } from "../../vscode/src/vs/workbench/services/editor/common/editorService.js";
import { IConfigurationService } from "../../vscode/src/vs/platform/configuration/common/configuration.js";
import { CommandsRegistry } from "../../vscode/src/vs/platform/commands/common/commands.js";
import {
  ContextView,
  ContextViewDOMPosition,
} from "../../vscode/src/vs/base/browser/ui/contextview/contextview.js";
import { ContextMenuHandler } from "../../vscode/src/vs/platform/contextview/browser/contextMenuHandler.js";
import { Color } from "../../vscode/src/vs/base/common/color.js";
import { ColorScheme } from "../../vscode/src/vs/platform/theme/common/theme.js";
import { Event, Emitter } from "../../vscode/src/vs/base/common/event.js";
import { Disposable } from "../../vscode/src/vs/base/common/lifecycle.js";
import { createFixtureHoverService } from "./hover-service";
import { statusBarVariant } from "../../components/stories/StatusBarData";
import type {
  StatusBarEntry,
  StatusBarLocation,
} from "../../components/src/components/status-bar/types";
export function mountStatusBar(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
  host: { focusEditor?: () => void; onChange?: () => void } = {},
) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, { commands: [], visibility: [], escapes: 0, hides: 0 });
  const variant =
    new URLSearchParams(location.search).get("variant") || "default";
  surface.className = "specimen";
  surface.style.cssText =
    "height:220px;display:flex;align-items:flex-end;padding-bottom:20px;box-sizing:border-box";
  const element = document.createElement("footer");
  element.className = "part statusbar";
  element.style.position = "relative";
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "off");
  element.setAttribute("aria-label", "Status Bar");
  surface.append(element);
  if (variant === "inactive")
    root.style.setProperty("--vscode-statusBar-inactiveBackground", "#454545");
  const colors = getComputedStyle(root),
    type = root.classList.contains("hc-black")
      ? ColorScheme.HIGH_CONTRAST_DARK
      : root.classList.contains("hc-light")
        ? ColorScheme.HIGH_CONTRAST_LIGHT
        : root.classList.contains("vs")
          ? ColorScheme.LIGHT
          : ColorScheme.DARK;
  const theme = {
    getColorTheme: () => ({
      type,
      getColor: (id: string) => {
        const value = colors
          .getPropertyValue(`--vscode-${id.replaceAll(".", "-")}`)
          .trim();
        return value ? Color.Format.CSS.parse(value) : undefined;
      },
      defines: () => false,
    }),
    onDidColorThemeChange: Event.None,
  };
  const { service: hover, config: hoverConfig } =
    createFixtureHoverService(root);
  const configuration = {
    ...hoverConfig,
    getValue: (key: string) =>
      key === "workbench.statusBar.visible" ? true : hoverConfig.getValue(key),
    updateValue: () => {
      state.hides++;
      return Promise.resolve();
    },
  };
  const commands = {
    executeCommand: (id: string, ...args: unknown[]) => {
      state.commands.push({ id, args });
      host.onChange?.();
      return Promise.resolve();
    },
  };
  const telemetry = { publicLog2() {} },
    notifications = {
      error: (error: unknown) => {
        throw error;
      },
    };
  const view = new ContextView(root, ContextViewDOMPosition.FIXED);
  window.addEventListener("resize", () => view.layout());
  const contextMenu = new ContextMenuHandler(
    {
      showContextView: (delegate: any) => view.show(delegate),
      hideContextView: (data: any) => view.hide(data),
    } as any,
    telemetry as any,
    notifications as any,
    { lookupKeybinding: () => undefined } as any,
  );
  const active = new Emitter<number>();
  const storage = {
    get: () => undefined,
    store() {},
    remove() {},
    onDidChangeValue: () => Event.None,
    onWillSaveState: Event.None,
  };
  const context = {
    createScoped: () => ({
      createKey: () => ({ set() {}, reset() {} }),
      dispose() {},
    }),
  };
  const layout = {
    registerPart: () => Disposable.None,
    isVisible: () => true,
    isFloatingPanelsEnabled: () => false,
    isModernUICompact: () => false,
  };
  const instantiation = {
    createInstance: (Ctor: any, ...args: any[]) => {
      if (Ctor === WorkbenchHoverDelegate)
        return new Ctor(args[0], args[1], args[2], configuration as any, hover);
      if (Ctor === StatusbarEntryItem)
        return new Ctor(
          args[0],
          args[1],
          args[2],
          commands as any,
          hover,
          notifications as any,
          telemetry as any,
          theme as any,
        );
      throw new Error(`Unexpected StatusBar constructor ${Ctor.name}`);
    },
    invokeFunction: (fn: any) =>
      fn({
        get: (id: unknown) => {
          if (id === IConfigurationService) return configuration;
          if (id === IWorkbenchLayoutService) return layout;
          throw new Error("Unexpected context menu service");
        },
      }),
  };
  const part = new MainStatusbarPart(
    instantiation as any,
    theme as any,
    {
      getWorkbenchState: () => (variant === "no-folder" ? 1 : 2),
      onDidChangeWorkbenchState: Event.None,
    } as any,
    storage as any,
    layout as any,
    {
      showContextMenu: (delegate: any) => contextMenu.showContextMenu(delegate),
    } as any,
    context as any,
    configuration as any,
    {
      hasFocus: variant !== "inactive",
      onDidChangeFocus: Event.None,
      onDidChangeActiveWindow: active.event,
    } as any,
  );
  part.create(element);
  active.fire((window as any).vscodeWindowId);
  const records: { entry: StatusBarEntry; accessor: any }[] = [];
  function convert(entry: StatusBarEntry) {
    const command =
      typeof entry.command === "object" &&
      entry.command.id === ShowTooltipCommand.id
        ? ShowTooltipCommand
        : typeof entry.command === "object" &&
            entry.command.id === ToggleTooltipCommand.id
          ? ToggleTooltipCommand
          : entry.command;
    return { ...entry, command };
  }
  function priority(value: StatusBarEntry["priority"]): any {
    if (value === undefined || typeof value === "number") return value;
    const at = (value: StatusBarLocation) => ({
      ...value,
      alignment:
        value.alignment === "right"
          ? StatusbarAlignment.RIGHT
          : StatusbarAlignment.LEFT,
    });
    return "primary" in value
      ? {
          ...value,
          primary:
            typeof value.primary === "number"
              ? value.primary
              : at(value.primary),
        }
      : at(value);
  }
  function add(entry: StatusBarEntry) {
    records.push({
      entry,
      accessor: part.addEntry(
        convert(entry) as any,
        entry.id,
        entry.alignment === "right"
          ? StatusbarAlignment.RIGHT
          : StatusbarAlignment.LEFT,
        priority(entry.priority),
      ),
    });
  }
  for (const entry of statusBarVariant(variant)) add(entry);
  part.onDidChangeEntryVisibility((event) => state.visibility.push(event));
  const accessor = {
    get: (id: unknown) => {
      if (id === IStatusbarService) return part;
      if (id === IEditorService)
        return {
          activeEditorPane: {
            focus: () => {
              state.escapes++;
              if (host.focusEditor) host.focusEditor();
              else root.querySelector<HTMLButtonElement>(".outside")?.focus();
            },
          },
        };
      throw new Error("Unexpected StatusBar service");
    },
  };
  // The workbench dispatches registered keybindings before entry-local handlers.
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        !(event.target instanceof Node) ||
        !element.contains(event.target) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      const id = (
        {
          ArrowLeft: "focusPrevious",
          ArrowUp: "focusPrevious",
          ArrowRight: "focusNext",
          ArrowDown: "focusNext",
          Home: "focusFirst",
          End: "focusLast",
          Escape: "clearFocus",
        } as Record<string, string>
      )[event.key];
      if (!id) return;
      CommandsRegistry.getCommand(`workbench.statusBar.${id}`)!.handler(
        accessor as any,
      );
      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );
  (window as any).fixtureApi = {
    focus: (preserve = true) => part.focus(preserve),
    next: () => part.focusNextEntry(),
    previous: () => part.focusPreviousEntry(),
    hide: (id: string) => part.updateEntryVisibility(id, false),
    show: (id: string) => part.updateEntryVisibility(id, true),
    remove: (id: string) => {
      for (let index = records.length - 1; index >= 0; index--) {
        if (records[index].entry.id === id) {
          records[index].accessor.dispose();
          records.splice(index, 1);
        }
      }
    },
    add,
    update: (id: string, patch: Partial<StatusBarEntry>) => {
      for (const record of records.filter((record) => record.entry.id === id)) {
        record.entry = { ...record.entry, ...patch };
        record.accessor.update(convert(record.entry));
      }
    },
    afterTick: () => Promise.resolve(),
  };
  new ResizeObserver(() =>
    part.layout(surface.clientWidth, 22, 178, 0),
  ).observe(surface);
}
