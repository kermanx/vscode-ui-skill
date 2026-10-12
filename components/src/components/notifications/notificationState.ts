/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */
import type { NotificationItem, NotificationTextPart } from "./types";

export function messageParts(
  message: NotificationItem["message"],
): NotificationTextPart[] {
  const nodes: NotificationTextPart[] = [];
  let length = 0;
  for (const node of typeof message === "string" ? [message] : message) {
    const text = typeof node === "string" ? node : node.label;
    const value = text.substring(0, 1000 - length).replace(/\r\n|\n|\r/g, " ");
    if (value) {
      const last = nodes.length - 1;
      if (typeof node === "string" && typeof nodes[last] === "string")
        nodes[last] += value;
      else
        nodes.push(
          typeof node === "string" ? value : { ...node, label: value },
        );
    }
    length += text.length;
    if (length > 1000) {
      nodes.push("...");
      break;
    }
  }
  if (typeof nodes[0] === "string") nodes[0] = nodes[0].trimStart();
  const last = nodes.length - 1;
  if (typeof nodes[last] === "string") nodes[last] = nodes[last].trimEnd();
  return nodes.filter((node) => node !== "");
}
export const rawMessage = (item: NotificationItem) =>
  typeof item.message === "string"
    ? item.message
    : item.message
        .map((node) => (typeof node === "string" ? node : node.label))
        .join("");
export const sourceLabel = (item: NotificationItem) =>
  typeof item.source === "string" ? item.source : item.source?.label;
export const hasPrimaryActions = (item: NotificationItem) =>
  !!item.actions?.primary?.length;
export const hasActiveProgress = (item: NotificationItem) =>
  !!item.progress &&
  !item.progress.done &&
  (item.progress.infinite === true ||
    typeof item.progress.total === "number" ||
    typeof item.progress.worked === "number");
export const isSticky = (item: NotificationItem, expanded: boolean) =>
  !!item.sticky ||
  (hasPrimaryActions(item) && item.severity === "error") ||
  (!hasPrimaryActions(item) && expanded) ||
  hasActiveProgress(item);
export const ariaLabel = (item: NotificationItem) =>
  `${item.severity === "error" ? "Error" : item.severity === "warning" ? "Warning" : "Info"}: ${rawMessage(item)}${sourceLabel(item) ? `, source: ${sourceLabel(item)}` : ""}, notification`;
export const linkTitle = (node: Exclude<NotificationTextPart, string>) =>
  node.title ||
  (node.href.startsWith("command:")
    ? `Click to execute command '${node.href.substring(8)}'`
    : node.href);

export function notificationHeight(
  item: NotificationItem,
  expanded: boolean,
  helper: HTMLElement,
): number {
  if (!expanded) return 42;
  let actions = hasActiveProgress(item) ? 0 : 1;
  if (!hasPrimaryActions(item)) actions++;
  if (item.actions?.secondary?.length) actions++;
  helper.style.width = `${450 - (10 + 30 + actions * 30 - Math.max(actions - 1, 0) * 4)}px`;
  const content = document.createElement("span");
  for (const node of messageParts(item.message)) {
    if (typeof node === "string") content.append(document.createTextNode(node));
    else {
      const link = document.createElement("a");
      link.href = node.href;
      link.title = linkTitle(node);
      link.tabIndex = 0;
      link.textContent = node.label;
      content.append(link);
    }
  }
  helper.append(content);
  const preferred = Math.max(helper.offsetHeight, helper.scrollHeight);
  helper.replaceChildren();
  return (
    42 +
    Math.max(0, preferred - 22) +
    (sourceLabel(item) || hasPrimaryActions(item) ? 42 : 0)
  );
}
