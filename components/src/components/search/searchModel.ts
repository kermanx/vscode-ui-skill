// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
import type { TreeNode } from '../tree/types';
import type { SearchFileResult, SearchMatch } from './types';
export interface SearchTreeNode extends TreeNode {
  file: SearchFileResult;
  match?: SearchMatch;
}
export function resultNodes(
  files: readonly SearchFileResult[],
): SearchTreeNode[] {
  return files.map((file) => ({
    id: file.id,
    label: file.name,
    file,
    children: file.matches.map((match) => ({
      id: match.id,
      label: match.before + match.text + match.after,
      file,
      match,
    })),
  }));
}
export function resultAria(
  node: SearchTreeNode,
  replacing: boolean,
  replacement: string,
) {
  if (!node.match) {
    const directory = node.file.description || '.';
    return `${node.file.matches.length} matches in file ${node.file.name} of folder ${directory}, Search result`;
  }
  const match = node.match;
  const text = (match.before + match.text + match.after).slice(
    0,
    match.before.length + match.text.length + 151,
  );
  const prefix = `'${text}' at column ${match.before.length + 1}`;
  return replacing && replacement
    ? `${prefix} replace ${match.text} with ${match.replacement ?? replacement}`
    : `${prefix} found ${match.text}`;
}
export function countMessage(files: readonly SearchFileResult[]) {
  const count = files.reduce((sum, file) => sum + file.matches.length, 0);
  return `${count} result${count === 1 ? '' : 's'} in ${files.length} file${files.length === 1 ? '' : 's'}`;
}

export function emptyMessage(
  include: string,
  exclude: string,
  onlyOpen: boolean,
) {
  const location = onlyOpen ? ' in open editors' : '';
  if (include && exclude)
    return onlyOpen
      ? `No results found in open editors matching '${include}' excluding '${exclude}' - `
      : `No results found in '${include}' excluding '${exclude}' - `;
  if (include)
    return onlyOpen
      ? `No results found in open editors matching '${include}' - `
      : `No results found in '${include}' - `;
  if (exclude) return `No results found${location} excluding '${exclude}' - `;
  return `No results found${location}. Review your configured exclusions and check your gitignore files - `;
}
