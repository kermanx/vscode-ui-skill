// Real Table, source Problems delegate and renderer classes; no replica table/layout code.
import { Table } from "../../vscode/src/vs/base/browser/ui/table/tableWidget.js";
import { HighlightedLabel } from "../../vscode/src/vs/base/browser/ui/highlightedlabel/highlightedLabel.js";
import { KeybindingLabel } from "../../vscode/src/vs/base/browser/ui/keybindingLabel/keybindingLabel.js";
import { KeyCodeChord } from "../../vscode/src/vs/base/common/keybindings.js";
import { KeyCodeUtils } from "../../vscode/src/vs/base/common/keyCodes.js";
import { OperatingSystem } from "../../vscode/src/vs/base/common/platform.js";
import { USLayoutResolvedKeybinding } from "../../vscode/src/vs/platform/keybinding/common/usLayoutResolvedKeybinding.js";
import { Emitter } from "../../vscode/src/vs/base/common/event.js";
import {
  defaultListStyles,
  defaultKeybindingLabelStyles,
} from "../../vscode/src/vs/platform/theme/browser/defaultStyles.js";
import "../../vscode/src/vs/workbench/contrib/markers/browser/media/markers.css";
import {
  tableColumns,
  tableRows,
  manyTableRows,
  changedTableRows,
} from "../../components/stories/TableData";
import type {
  TableCell,
  TableRow,
} from "../../components/src/components/table/types";
export function mountTable(
  root: HTMLElement,
  surface: HTMLElement,
  state: any,
) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, { focus: [], selection: [], contexts: [], events: [] });
  root.classList.add("markers-panel");
  surface.className = "specimen table-specimen markers-table-container";
  surface.style.background = "var(--vscode-panel-background)";
  const params = new URLSearchParams(location.search),
    multiple = params.get("multiple") !== "false";
  let rows = params.get("large") === "true" ? manyTableRows : tableRows;
  let height = 264;
  const columns = tableColumns.map((column) => ({ ...column }));
  const emitters = columns.map(() => new Emitter<void>());
  const table = new Table<TableRow>(
    "table-reference",
    surface,
    { headerRowHeight: 24, getHeight: () => 24 },
    columns.map((column, index) => ({
      label: column.label,
      weight: column.weight,
      get minimumWidth() {
        return columns[index].minimumWidth;
      },
      get maximumWidth() {
        return columns[index].maximumWidth;
      },
      templateId: "cell",
      project: (row: TableRow) => row.cells[column.id],
      onDidChangeWidthConstraints: emitters[index].event,
    })),
    [
      {
        templateId: "cell",
        renderTemplate(container: HTMLElement) {
          return { container, disposables: [] as { dispose(): void }[] };
        },
        renderElement(
          value: string | TableCell | undefined,
          _index: number,
          data: { container: HTMLElement; disposables: { dispose(): void }[] },
        ) {
          for (const value of data.disposables) value.dispose();
          data.disposables = [];
          data.container.replaceChildren();
          const cell =
            typeof value === "string" ? { text: value } : (value ?? {});
          if (cell.keybinding) {
            const os =
              cell.keybindingOS === "windows"
                ? OperatingSystem.Windows
                : cell.keybindingOS === "linux"
                  ? OperatingSystem.Linux
                  : OperatingSystem.Macintosh;
            const label = new KeybindingLabel(
              data.container,
              os,
              defaultKeybindingLabelStyles,
            );
            label.set(
              new USLayoutResolvedKeybinding(
                cell.keybinding.map(
                  (chord) =>
                    new KeyCodeChord(
                      !!chord.ctrlKey,
                      !!chord.shiftKey,
                      !!chord.altKey,
                      !!chord.metaKey,
                      KeyCodeUtils.fromString(chord.key ?? ""),
                    ),
                ),
                os,
              ),
            );
            data.disposables.push(label);
          } else {
            if (cell.icon) {
              const severity = document.createElement("div");
              severity.className = "severity";
              const icon = document.createElement("div");
              icon.className = `codicon codicon-${cell.icon}`;
              severity.append(icon);
              data.container.append(severity);
            }
            const message = document.createElement("div");
            message.className = "message";
            data.container.append(message);
            const label = new HighlightedLabel(message);
            label.set(cell.text ?? "", cell.highlights as any);
            data.disposables.push(label);
          }
        },
        disposeTemplate(data: { disposables: { dispose(): void }[] }) {
          for (const value of data.disposables) value.dispose();
        },
      },
    ],
    {
      identityProvider: { getId: (row) => row.id },
      multipleSelectionSupport: multiple,
      horizontalScrolling: false,
      smoothScrolling: false,
      keyboardNavigationLabelProvider: {
        getKeyboardNavigationLabel: (row) => row.label ?? "",
      },
      accessibilityProvider: {
        getWidgetAriaLabel: () => "Diagnostics",
        getAriaLabel: (row) => row.label ?? "",
      },
    },
  );
  table.domNode.style.height = `${height}px`;
  table.style(defaultListStyles);
  table.splice(0, 0, rows);
  table.layout(height, surface.clientWidth);
  new ResizeObserver(() => table.layout(height, surface.clientWidth)).observe(
    surface,
  );
  const widths = () =>
    columns.map((_, i) => (table as any).splitview.getViewSize(i));
  Object.defineProperty(state, "columns", { enumerable: true, get: widths });
  Object.defineProperty(state, "scrollTop", {
    enumerable: true,
    get: () => table.scrollTop,
  });
  table.onDidChangeFocus(
    (event) => (state.focus = event.elements.map((row) => row.id)),
  );
  table.onDidChangeSelection(
    (event) => (state.selection = event.elements.map((row) => row.id)),
  );
  table.onContextMenu((event) => {
    event.browserEvent.preventDefault();
    if (event.element) state.contexts.push(event.element.id);
  });
  (table as any).splitview.onDidSashChange((index: number) =>
    state.events.push({
      id: columns[index].id,
      width: widths()[index],
      widths: widths(),
    }),
  );
  const list = (table as any).list;
  const listElement = list.getHTMLElement() as HTMLElement;
  listElement.addEventListener(
    "keydown",
    (event) => {
      if (event.target !== listElement) return;
      if (
        (event.key === "Home" || event.key === "End") &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const fake = new KeyboardEvent("keydown", { altKey: event.altKey });
        if (event.key === "Home") list.focusFirst(fake);
        else list.focusLast(fake);
        const focused = list.getFocus();
        if (focused.length) list.reveal(focused[0]);
        list.setAnchor(focused[0]);
        list.domFocus();
      } else if (
        multiple &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        (event.key === "ArrowDown" || event.key === "ArrowUp")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const previous = list.getFocus()[0],
          fake = new KeyboardEvent("keydown");
        if (event.key === "ArrowDown") list.focusNext(1, false, fake);
        else list.focusPrevious(1, false, fake);
        const focused = list.getFocus()[0],
          selection = list.getSelection();
        if (typeof focused === "number")
          list.setSelection(
            selection.includes(focused)
              ? selection.filter((i: number) => i !== previous)
              : selection.concat(focused),
          );
        if (typeof focused === "number") list.reveal(focused);
        list.domFocus();
      }
    },
    true,
  );
  function update(next: TableRow[]) {
    rows = next;
    table.splice(0, table.length, rows);
  }
  function constraints() {
    Object.assign(columns[2], { minimumWidth: 150, maximumWidth: 180 });
    emitters[2].fire();
  }
  const api = {
    resize: () => table.resizeColumn(2, 40),
    constraints,
    update: () => update(changedTableRows(rows)),
    clear: () => update([]),
    scroll: () => (table.scrollTop = 1000),
    height: () => {
      height = 312;
      table.domNode.style.height = "312px";
      table.layout(height, surface.clientWidth);
    },
    focus: () => {
      table.setFocus([4]);
      table.reveal(4);
    },
  };
  (window as any).fixtureApi = api;
  (window as any).referenceTable = table;
  for (const [cls, label, fn] of [
    ["fixture-update", "Update rows", api.update],
    ["fixture-clear", "Clear rows", api.clear],
    ["fixture-constraints", "Change column constraints", constraints],
  ] as const) {
    const button = document.createElement("button");
    button.className = cls;
    button.textContent = label;
    button.onclick = fn;
    root.append(button);
  }
}
