// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import type {
  StatusBarEntry,
  StatusBarPriority,
  StatusBarLocation,
} from './types';
export function priority(entry: StatusBarEntry): StatusBarPriority {
  if (
    entry.priority &&
    typeof entry.priority === 'object' &&
    'primary' in entry.priority
  )
    return entry.priority;
  let secondary = 149417;
  for (let i = 0; i < entry.id.length; i++)
    secondary = ((secondary << 5) - secondary + entry.id.charCodeAt(i)) | 0;
  return { primary: entry.priority ?? 0, secondary };
}
export function relative(entry: StatusBarEntry): StatusBarLocation | undefined {
  const value = priority(entry).primary;
  return typeof value === 'number' ? undefined : value;
}
/** Numeric priorities descend within each alignment, then relative entries join their reference. */
export function orderEntries(
  entries: readonly StatusBarEntry[],
): StatusBarEntry[] {
  const ids = new Set(entries.map((entry) => entry.id)),
    numbered: StatusBarEntry[] = [],
    relatives = new Map<string, Map<string, StatusBarEntry>>();
  for (const entry of entries) {
    const location = relative(entry);
    if (!location || !ids.has(location.location.id)) numbered.push(entry);
    else {
      let group = relatives.get(location.location.id);
      if (!group)
        for (const members of relatives.values())
          if (members.has(location.location.id)) {
            group = members;
            break;
          }
      if (!group) {
        group = new Map();
        relatives.set(location.location.id, group);
      }
      group.set(entry.id, entry);
    }
  }
  numbered.sort((a, b) => {
    if ((a.alignment || 'left') !== (b.alignment || 'left'))
      return a.alignment === 'right' ? 1 : -1;
    const pa = priority(a),
      pb = priority(b);
    const primaryA =
      typeof pa.primary === 'number'
        ? pa.primary
        : pa.primary.location.priority;
    const primaryB =
      typeof pb.primary === 'number'
        ? pb.primary
        : pb.primary.location.priority;
    return primaryB - primaryA || pb.secondary - pa.secondary;
  });
  const result: StatusBarEntry[] = [];
  for (const entry of numbered) {
    const group = [...(relatives.get(entry.id)?.values() || [])].sort(
      (a, b) => priority(b).secondary - priority(a).secondary,
    );
    result.push(
      ...group.filter((item) => relative(item)?.alignment === 'left'),
      entry,
      ...group.filter((item) => relative(item)?.alignment === 'right'),
    );
    relatives.delete(entry.id);
  }
  for (const group of relatives.values())
    result.push(
      ...[...group.values()].sort(
        (a, b) => priority(b).secondary - priority(a).secondary,
      ),
    );
  return result;
}
export function compactGroups(
  entries: readonly StatusBarEntry[],
  hidden: readonly string[],
) {
  const visible = new Map(
    entries
      .filter((entry) => !hidden.includes(entry.id))
      .map((entry) => [entry.id, entry]),
  );
  const groups = new Map<string, Set<string>>(),
    classes = new Map<StatusBarEntry, Set<string>>();
  for (const entry of entries) classes.set(entry, new Set());
  for (const entry of visible.values()) {
    const at = relative(entry),
      reference = at && visible.get(at.location.id);
    if (!at?.compact || !reference) continue;
    let group = groups.get(reference.id);
    if (!group)
      for (const candidate of groups.values())
        if (candidate.has(reference.id)) {
          group = candidate;
          break;
        }
    if (!group) {
      group = new Set();
      groups.set(reference.id, group);
    }
    group.add(entry.id);
    group.add(reference.id);
    classes
      .get(entry)!
      .add(at.alignment === 'left' ? 'compact-right' : 'compact-left');
    classes
      .get(reference)!
      .add(at.alignment === 'left' ? 'compact-left' : 'compact-right');
  }
  for (const alignment of ['left', 'right']) {
    const aligned = entries.filter(
      (entry) => (entry.alignment || 'left') === alignment,
    );
    const shown = aligned.filter((entry) => !hidden.includes(entry.id));
    if (shown.length) {
      classes.get(shown[0]!)!.add('first-visible-item');
      classes.get(shown.at(-1)!)!.add('last-visible-item');
    }
    const neighbors = alignment === 'left' ? shown : [...shown].reverse();
    neighbors.forEach((entry, index) => {
      const previous = neighbors[index - 1];
      const isCompact =
        previous &&
        classes
          .get(previous)!
          .has(alignment === 'left' ? 'compact-right' : 'compact-left') &&
        classes
          .get(entry)!
          .has(alignment === 'left' ? 'compact-left' : 'compact-right');
      if (
        previous?.kind &&
        previous.kind !== 'standard' &&
        entry.kind &&
        entry.kind !== 'standard' &&
        !isCompact
      )
        classes.get(entry)!.add('visible-background-color-neighbor');
    });
  }
  return { groups: [...groups.values()], classes };
}
