/* Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License. */
import {
  matchesFuzzy,
  matchesFuzzy2,
  parse,
  splitGlobAware,
  type Match,
} from "./matching.js";
import type {
  ProblemItem,
  ProblemRelatedInformation,
  ProblemSeverity,
} from "./types";
export interface ProblemNode {
  id: string;
  label: string;
  kind: "resource" | "marker" | "related";
  resource: string;
  item?: ProblemItem;
  related?: ProblemRelatedInformation;
  children?: ProblemNode[];
  matches?: Match[];
  lineMatches?: Match[][];
  sourceMatches?: Match[];
  codeMatches?: Match[];
  messageMatches?: Match[];
}
export const basename = (path: string) =>
  path.substring(path.lastIndexOf("/") + 1);
export const resourceId = (path: string) => `resource:${path}`;
export const lines = (message: string) => message.split(/\r\n|\r|\n/);
const ranks = { error: 8, warning: 4, info: 2 };
export function problemTree(
  items: readonly ProblemItem[],
  filter: string,
  severities: readonly ProblemSeverity[]
): ProblemNode[] {
  const sources: string[] = [],
    excludes: string[] = [];
  let text = filter.trim(),
    match: RegExpExecArray | null;
  const sourceExpression = /(!)?@source:("[^"]*"|[^\s,]+)(\s*)/i;
  while ((match = sourceExpression.exec(text))) {
    let source = match[2];
    if (source.startsWith('"') && source.endsWith('"'))
      source = source.slice(1, -1);
    (match[1] ? excludes : sources).push(source.toLowerCase());
    text = (
      text.slice(0, match.index) + text.slice(match.index + match[0].length)
    ).trim();
  }
  const negate = text.startsWith("!"),
    query = (negate ? text.replace(/^!+/, "") : text).trim();
  const includesExpression: Record<string, boolean> = {},
    excludesExpression: Record<string, boolean> = {};
  for (let pattern of splitGlobAware(text, ",")
    .map((s) => s.trim())
    .filter(Boolean)) {
    const target = pattern.startsWith("!")
      ? excludesExpression
      : includesExpression;
    pattern = pattern.replace(/^!+/, "");
    if (!pattern) continue;
    if (pattern[0] === ".") pattern = "*" + pattern;
    target[`**/${pattern}/**`] = target[`**/${pattern}`] = true;
  }
  const include = parse(includesExpression),
    exclude = parse(excludesExpression);
  const grouped = new Map<string, ProblemItem[]>();
  for (const item of items) {
    const group = grouped.get(item.resource) || [];
    group.push(item);
    grouped.set(item.resource, group);
  }
  return [...grouped]
    .map(([resource, entries]) => {
      entries.sort(
        (a, b) =>
          ranks[b.severity] - ranks[a.severity] ||
          a.line - b.line ||
          a.column - b.column ||
          (a.endLine || a.line) - (b.endLine || b.line) ||
          (a.endColumn || a.column) - (b.endColumn || b.column)
      );
      return { resource, entries };
    })
    .sort(
      (a, b) =>
        ranks[b.entries[0].severity] - ranks[a.entries[0].severity] ||
        a.resource.localeCompare(b.resource)
    )
    .flatMap(({ resource, entries }) => {
      if (exclude(resource)) return [];
      const included = include(resource);
      const uriMatches =
        !included && query && !negate
          ? matchesFuzzy2(query, basename(resource))
          : null;
      const parent = included || uriMatches ? true : undefined;
      const children = entries.flatMap((item) => {
        const source = item.source?.toLowerCase();
        if (
          !severities.includes(item.severity) ||
          (source && excludes.includes(source)) ||
          (sources.length && (!source || !sources.includes(source)))
        )
          return [];
        const lineMatches = lines(item.message).map(
          (line) => matchesFuzzy(query, line) || []
        );
        const sourceMatches = item.source
          ? matchesFuzzy2(query, item.source)
          : null;
        const codeMatches = item.code
          ? matchesFuzzy2(
              query,
              typeof item.code === "string" ? item.code : item.code.value
            )
          : null;
        const matched =
          sourceMatches || codeMatches || lineMatches.some((m) => m.length);
        const visibility = !query
          ? true
          : matched && !negate
          ? true
          : matched && negate && !parent
          ? false
          : !matched && negate && !parent
          ? true
          : parent;
        if (visibility === false) return [];
        const related = (item.relatedInformation || []).flatMap((info) => {
          const matches = query
            ? matchesFuzzy2(query, basename(info.resource))
            : null;
          const messageMatches = query
            ? matchesFuzzy(query, basename(info.message))
            : null;
          const found = matches || messageMatches;
          const visible = !query
            ? true
            : found && !negate
            ? true
            : found && negate && visibility === undefined
            ? false
            : !found && negate && visibility === undefined
            ? true
            : visibility;
          return visible
            ? [
                {
                  id: info.id,
                  label: info.message,
                  kind: "related" as const,
                  resource: info.resource,
                  related: info,
                  item,
                  matches: !negate ? matches || [] : [],
                  messageMatches: !negate ? messageMatches || [] : [],
                },
              ]
            : [];
        });
        if (!visibility && !related.length) return [];
        return [
          {
            id: item.id,
            label: item.message,
            kind: "marker" as const,
            resource,
            item,
            children: related,
            lineMatches: !negate ? lineMatches : [],
            sourceMatches: !negate ? sourceMatches || [] : [],
            codeMatches: !negate ? codeMatches || [] : [],
          },
        ];
      });
      return children.length
        ? [
            {
              id: resourceId(resource),
              label: basename(resource),
              kind: "resource" as const,
              resource,
              children,
              matches: uriMatches || [],
            },
          ]
        : [];
    });
}
