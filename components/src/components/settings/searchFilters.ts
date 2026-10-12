/* Copyright (c) Microsoft Corporation. Licensed under the MIT License. */
import type { MenuEntry } from '../menu/types';
const choices = [
  ['modifiedSettingsSearch', 'Modified', '@modified'],
  null,
  ['extSettingsSearch', 'Extension ID...', '@ext:'],
  ['featuresSettingsSearch', 'Feature...', '@feature:'],
  ['tagSettingsSearch', 'Tag...', '@tag:'],
  ['langSettingsSearch', 'Language...', '@lang:'],
  ['idSettingsSearch', 'Setting ID...', '@id:'],
  null,
  ['onlineSettingsSearch', 'Online services', '@tag:usesOnlineServices'],
  ['policySettingsSearch', 'Organization policies', '@policy'],
  null,
  ['stableSettingsSearch', 'Stable', '@stable'],
  ['previewSettingsSearch', 'Preview', '@tag:preview'],
  ['experimentalSettingsSearch', 'Experimental', '@tag:experimental'],
  null,
  ['advancedSettingsSearch', 'Advanced', '@tag:advanced'],
  ['expAssignmentSettingsSearch', 'ExP Assigned', '@tag:hasExPAssignment'],
] as const;
export function searchFilterActions(query: string): MenuEntry[] {
  return choices.map((choice) =>
    choice
      ? {
          id: choice[0],
          label: choice[1],
          checked: choice[2].endsWith(':')
            ? undefined
            : query.split(' ').includes(choice[2]),
        }
      : { separator: true },
  );
}
export function applySearchFilter(query: string, id: string): string {
  const choice = choices.find((choice) => choice?.[0] === id);
  if (!choice) return query;
  const filter = choice[2];
  if (filter.endsWith(':')) return query.trimEnd() + ' ' + filter;
  if (query.split(' ').includes(filter))
    return query
      .split(' ')
      .filter((word) => word !== filter)
      .join(' ');
  const exclusive = ['@stable', '@tag:preview', '@tag:experimental'];
  if (exclusive.includes(filter))
    query = query
      .split(' ')
      .filter((word) => !exclusive.includes(word))
      .join(' ');
  return query.trimEnd() ? query.trimEnd() + ' ' + filter : filter;
}
