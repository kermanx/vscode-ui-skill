/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Icon naming, accessible labels and inline icon markers.

export interface ThemeIconLike {
  readonly id: string;
}

export const iconNameExpression = '[A-Za-z0-9-]+';
export const iconModifierExpression = '~[A-Za-z]+';

const themeIconIdRegex = new RegExp(`^(${iconNameExpression})(${iconModifierExpression})?$`);

/** `codicon codicon-<id> [codicon-modifier-<modifier>]`, falling back to `error` like ThemeIcon. */
export function asClassNameArray(icon: ThemeIconLike): string[] {
  const match = themeIconIdRegex.exec(icon.id);
  if (!match) {
    return asClassNameArray({ id: 'error' });
  }
  const [, id, modifier] = match;
  const classNames = ['codicon', 'codicon-' + id];
  if (modifier) {
    classNames.push('codicon-modifier-' + modifier.substring(1));
  }
  return classNames;
}

export function asClassName(icon: ThemeIconLike): string {
  return asClassNameArray(icon).join(' ');
}

/** Class list of a codicon element: `spin` overrides a `~modifier` in `name`, `disabled` is added on top. */
export function codiconClassNames(name: string, options: { spin?: boolean; disabled?: boolean } = {}): string[] {
  const classNames = asClassNameArray(options.spin ? modify({ id: name }, 'spin') : { id: name });
  if (options.disabled) {
    classNames.push('codicon-modifier-disabled');
  }
  return classNames;
}

/** Replaces an existing `~modifier` with `modifier`, exactly like `ThemeIcon.modify`. */
export function modify(icon: ThemeIconLike, modifier: 'disabled' | 'spin' | undefined): ThemeIconLike {
  let id = icon.id;
  const tildeIndex = id.lastIndexOf('~');
  if (tildeIndex !== -1) {
    id = id.substring(0, tildeIndex);
  }
  if (modifier) {
    id = `${id}~${modifier}`;
  }
  return { id };
}

/** `$(iconId)text` loses its markers and gains spaces so screen readers read the words, not the icon id. */
export function getCodiconAriaLabel(text: string | undefined): string {
  if (!text) {
    return '';
  }
  return text.replace(/\$\((.*?)\)/g, (_match, codiconName) => ` ${codiconName} `).trim();
}

export type LabelWithIconsPart = { text: string } | { icon: string };

const labelWithIconsRegex = new RegExp(`(\\\\)?\\$\\((${iconNameExpression}(?:${iconModifierExpression})?)\\)`, 'g');

/** Splits `abc $(iconId)xyz` into text and icon parts; `\$(iconId)` stays literal text. */
export function splitLabelWithIcons(text: string): LabelWithIconsPart[] {
  const parts: LabelWithIconsPart[] = [];
  let match: RegExpExecArray | null;
  let textStart = 0;
  let textStop = 0;
  labelWithIconsRegex.lastIndex = 0;
  while ((match = labelWithIconsRegex.exec(text)) !== null) {
    textStop = match.index || 0;
    if (textStart < textStop) {
      parts.push({ text: text.substring(textStart, textStop) });
    }
    textStart = (match.index || 0) + match[0].length;
    const [, escaped, codicon] = match;
    parts.push(escaped ? { text: `$(${codicon})` } : { icon: codicon });
  }
  if (textStart < text.length) {
    parts.push({ text: text.substring(textStart) });
  }
  return parts;
}
