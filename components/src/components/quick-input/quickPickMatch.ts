// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.
// The picker uses the original wildcard, prefix, camel-case and icon-aware match algorithms.
const CharCode = {
  a: 97,
  z: 122,
  A: 65,
  Z: 90,
  Digit0: 48,
  Digit9: 57,
  Space: 32,
  Tab: 9,
  LineFeed: 10,
  CarriageReturn: 13,
};
const _parseIconsRegex = /\$\([A-Za-z0-9~-]+\)/g;
class RegExpCache {
  private values = new Map<string, RegExp>();
  get(key: string) {
    const value = this.values.get(key);
    if (value) {
      this.values.delete(key);
      this.values.set(key, value);
    }
    return value;
  }
  set(key: string, value: RegExp) {
    this.values.delete(key);
    this.values.set(key, value);
    if (this.values.size > 10000)
      this.values.delete(this.values.keys().next().value!);
  }
}
const fuzzyRegExpCache = new RegExpCache();
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});
const intlFileNameCollatorBaseNumeric = {
  value: { collator, collatorIsNumeric: collator.resolvedOptions().numeric },
};

export function convertSimple2RegExpPattern(pattern: string): string {
  return pattern
    .replace(/[\-\\\{\}\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, '\\$&')
    .replace(/[\*]/g, '.*');
}

export function compareSubstring(
  a: string,
  b: string,
  aStart: number = 0,
  aEnd: number = a.length,
  bStart: number = 0,
  bEnd: number = b.length,
): number {
  for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
    const codeA = a.charCodeAt(aStart);
    const codeB = b.charCodeAt(bStart);
    if (codeA < codeB) {
      return -1;
    } else if (codeA > codeB) {
      return 1;
    }
  }
  const aLen = aEnd - aStart;
  const bLen = bEnd - bStart;
  if (aLen < bLen) {
    return -1;
  } else if (aLen > bLen) {
    return 1;
  }
  return 0;
}

export function compareSubstringIgnoreCase(
  a: string,
  b: string,
  aStart: number = 0,
  aEnd: number = a.length,
  bStart: number = 0,
  bEnd: number = b.length,
): number {
  for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
    let codeA = a.charCodeAt(aStart);
    let codeB = b.charCodeAt(bStart);

    if (codeA === codeB) {
      // equal
      continue;
    }

    if (codeA >= 128 || codeB >= 128) {
      // not ASCII letters -> fallback to lower-casing strings
      return compareSubstring(
        a.toLowerCase(),
        b.toLowerCase(),
        aStart,
        aEnd,
        bStart,
        bEnd,
      );
    }

    // mapper lower-case ascii letter onto upper-case varinats
    // [97-122] (lower ascii) --> [65-90] (upper ascii)
    if (isLowerAsciiLetter(codeA)) {
      codeA -= 32;
    }
    if (isLowerAsciiLetter(codeB)) {
      codeB -= 32;
    }

    // compare both code points
    const diff = codeA - codeB;
    if (diff === 0) {
      continue;
    }

    return diff;
  }

  const aLen = aEnd - aStart;
  const bLen = bEnd - bStart;

  if (aLen < bLen) {
    return -1;
  } else if (aLen > bLen) {
    return 1;
  }

  return 0;
}

export function isLowerAsciiLetter(code: number): boolean {
  return code >= CharCode.a && code <= CharCode.z;
}

export function startsWithIgnoreCase(str: string, candidate: string): boolean {
  const len = candidate.length;
  return (
    len <= str.length &&
    compareSubstringIgnoreCase(str, candidate, 0, len) === 0
  );
}

export interface IFilter {
  // Returns null if word doesn't match.
  (word: string, wordToMatchAgainst: string): IMatch[] | null;
}

export interface IMatch {
  start: number;
  end: number;
}

export function or(...filter: IFilter[]): IFilter {
  return function (word: string, wordToMatchAgainst: string): IMatch[] | null {
    for (let i = 0, len = filter.length; i < len; i++) {
      const match = filter[i](word, wordToMatchAgainst);
      if (match) {
        return match;
      }
    }
    return null;
  };
}

export const matchesPrefix: IFilter = _matchesPrefix.bind(undefined, true);

function _matchesPrefix(
  ignoreCase: boolean,
  word: string,
  wordToMatchAgainst: string,
): IMatch[] | null {
  if (!wordToMatchAgainst || wordToMatchAgainst.length < word.length) {
    return null;
  }

  let matches: boolean;
  if (ignoreCase) {
    matches = startsWithIgnoreCase(wordToMatchAgainst, word);
  } else {
    matches = wordToMatchAgainst.indexOf(word) === 0;
  }

  if (!matches) {
    return null;
  }

  return word.length > 0 ? [{ start: 0, end: word.length }] : [];
}

export function matchesContiguousSubString(
  word: string,
  wordToMatchAgainst: string,
): IMatch[] | null {
  if (word.length > wordToMatchAgainst.length) {
    return null;
  }

  const index = wordToMatchAgainst.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) {
    return null;
  }

  return [{ start: index, end: index + word.length }];
}

export function matchesSubString(
  word: string,
  wordToMatchAgainst: string,
): IMatch[] | null {
  if (word.length > wordToMatchAgainst.length) {
    return null;
  }

  return _matchesSubString(
    word.toLowerCase(),
    wordToMatchAgainst.toLowerCase(),
    0,
    0,
  );
}

function _matchesSubString(
  word: string,
  wordToMatchAgainst: string,
  i: number,
  j: number,
): IMatch[] | null {
  if (i === word.length) {
    return [];
  } else if (j === wordToMatchAgainst.length) {
    return null;
  } else {
    if (word[i] === wordToMatchAgainst[j]) {
      let result: IMatch[] | null = null;
      if (
        (result = _matchesSubString(word, wordToMatchAgainst, i + 1, j + 1))
      ) {
        return join({ start: j, end: j + 1 }, result);
      }
      return null;
    }

    return _matchesSubString(word, wordToMatchAgainst, i, j + 1);
  }
}

function isLower(code: number): boolean {
  return CharCode.a <= code && code <= CharCode.z;
}

export function isUpper(code: number): boolean {
  return CharCode.A <= code && code <= CharCode.Z;
}

function isNumber(code: number): boolean {
  return CharCode.Digit0 <= code && code <= CharCode.Digit9;
}

function isWhitespace(code: number): boolean {
  return (
    code === CharCode.Space ||
    code === CharCode.Tab ||
    code === CharCode.LineFeed ||
    code === CharCode.CarriageReturn
  );
}

function isAlphanumeric(code: number): boolean {
  return isLower(code) || isUpper(code) || isNumber(code);
}

function join(head: IMatch, tail: IMatch[]): IMatch[] {
  if (tail.length === 0) {
    tail = [head];
  } else if (head.end === tail[0].start) {
    tail[0].start = head.start;
  } else {
    tail.unshift(head);
  }
  return tail;
}

function nextAnchor(camelCaseWord: string, start: number): number {
  for (let i = start; i < camelCaseWord.length; i++) {
    const c = camelCaseWord.charCodeAt(i);
    if (
      isUpper(c) ||
      isNumber(c) ||
      (i > 0 && !isAlphanumeric(camelCaseWord.charCodeAt(i - 1)))
    ) {
      return i;
    }
  }
  return camelCaseWord.length;
}

function _matchesCamelCase(
  word: string,
  camelCaseWord: string,
  i: number,
  j: number,
): IMatch[] | null {
  if (i === word.length) {
    return [];
  } else if (j === camelCaseWord.length) {
    return null;
  } else if (word[i] !== camelCaseWord[j].toLowerCase()) {
    return null;
  } else {
    let result: IMatch[] | null = null;
    let nextUpperIndex = j + 1;
    result = _matchesCamelCase(word, camelCaseWord, i + 1, j + 1);
    while (
      !result &&
      (nextUpperIndex = nextAnchor(camelCaseWord, nextUpperIndex)) <
        camelCaseWord.length
    ) {
      result = _matchesCamelCase(word, camelCaseWord, i + 1, nextUpperIndex);
      nextUpperIndex++;
    }
    return result === null ? null : join({ start: j, end: j + 1 }, result);
  }
}

interface ICamelCaseAnalysis {
  upperPercent: number;
  lowerPercent: number;
  alphaPercent: number;
  numericPercent: number;
}

function analyzeCamelCaseWord(word: string): ICamelCaseAnalysis {
  let upper = 0,
    lower = 0,
    alpha = 0,
    numeric = 0,
    code = 0;

  for (let i = 0; i < word.length; i++) {
    code = word.charCodeAt(i);

    if (isUpper(code)) {
      upper++;
    }
    if (isLower(code)) {
      lower++;
    }
    if (isAlphanumeric(code)) {
      alpha++;
    }
    if (isNumber(code)) {
      numeric++;
    }
  }

  const upperPercent = upper / word.length;
  const lowerPercent = lower / word.length;
  const alphaPercent = alpha / word.length;
  const numericPercent = numeric / word.length;

  return { upperPercent, lowerPercent, alphaPercent, numericPercent };
}

function isUpperCaseWord(analysis: ICamelCaseAnalysis): boolean {
  const { upperPercent, lowerPercent } = analysis;
  return lowerPercent === 0 && upperPercent > 0.6;
}

function isCamelCaseWord(analysis: ICamelCaseAnalysis): boolean {
  const { upperPercent, lowerPercent, alphaPercent, numericPercent } = analysis;
  return (
    lowerPercent > 0.2 &&
    upperPercent < 0.8 &&
    alphaPercent > 0.6 &&
    numericPercent < 0.2
  );
}

function isCamelCasePattern(word: string): boolean {
  let upper = 0,
    lower = 0,
    code = 0,
    whitespace = 0;

  for (let i = 0; i < word.length; i++) {
    code = word.charCodeAt(i);

    if (isUpper(code)) {
      upper++;
    }
    if (isLower(code)) {
      lower++;
    }
    if (isWhitespace(code)) {
      whitespace++;
    }
  }

  if ((upper === 0 || lower === 0) && whitespace === 0) {
    return word.length <= 30;
  } else {
    return upper <= 5;
  }
}

export function matchesCamelCase(
  word: string,
  camelCaseWord: string,
): IMatch[] | null {
  if (!camelCaseWord) {
    return null;
  }

  camelCaseWord = camelCaseWord.trim();

  if (camelCaseWord.length === 0) {
    return null;
  }

  if (!isCamelCasePattern(word)) {
    return null;
  }

  // TODO: Consider removing this check
  if (camelCaseWord.length > 60) {
    camelCaseWord = camelCaseWord.substring(0, 60);
  }

  const analysis = analyzeCamelCaseWord(camelCaseWord);

  if (!isCamelCaseWord(analysis)) {
    if (!isUpperCaseWord(analysis)) {
      return null;
    }

    camelCaseWord = camelCaseWord.toLowerCase();
  }

  let result: IMatch[] | null = null;
  let i = 0;

  word = word.toLowerCase();
  while (
    i < camelCaseWord.length &&
    (result = _matchesCamelCase(word, camelCaseWord, 0, i)) === null
  ) {
    i = nextAnchor(camelCaseWord, i + 1);
  }

  return result;
}

const fuzzyContiguousFilter = or(
  matchesPrefix,
  matchesCamelCase,
  matchesContiguousSubString,
);

const fuzzySeparateFilter = or(
  matchesPrefix,
  matchesCamelCase,
  matchesSubString,
);

export function matchesFuzzy(
  word: string,
  wordToMatchAgainst: string,
  enableSeparateSubstringMatching = false,
): IMatch[] | null {
  if (typeof word !== 'string' || typeof wordToMatchAgainst !== 'string') {
    return null; // return early for invalid input
  }

  // Form RegExp for wildcard matches
  let regexp = fuzzyRegExpCache.get(word);
  if (!regexp) {
    regexp = new RegExp(convertSimple2RegExpPattern(word), 'i');
    fuzzyRegExpCache.set(word, regexp);
  }

  // RegExp Filter
  const match = regexp.exec(wordToMatchAgainst);
  if (match) {
    return [{ start: match.index, end: match.index + match[0].length }];
  }

  // Default Filter
  return enableSeparateSubstringMatching
    ? fuzzySeparateFilter(word, wordToMatchAgainst)
    : fuzzyContiguousFilter(word, wordToMatchAgainst);
}

export function getCodiconAriaLabel(text: string | undefined) {
  if (!text) {
    return '';
  }

  return text
    .replace(/\$\((.*?)\)/g, (_match, codiconName) => ` ${codiconName} `)
    .trim();
}

export interface IParsedLabelWithIcons {
  readonly text: string;
  readonly iconOffsets?: readonly number[];
}

export function parseLabelWithIcons(input: string): IParsedLabelWithIcons {
  _parseIconsRegex.lastIndex = 0;

  let text = '';
  const iconOffsets: number[] = [];
  let iconsOffset = 0;

  while (true) {
    const pos = _parseIconsRegex.lastIndex;
    const match = _parseIconsRegex.exec(input);

    const chars = input.substring(pos, match?.index);
    if (chars.length > 0) {
      text += chars;
      for (let i = 0; i < chars.length; i++) {
        iconOffsets.push(iconsOffset);
      }
    }
    if (!match) {
      break;
    }
    iconsOffset += match[0].length;
  }

  return { text, iconOffsets };
}

export function matchesFuzzyIconAware(
  query: string,
  target: IParsedLabelWithIcons,
  enableSeparateSubstringMatching = false,
): IMatch[] | null {
  const { text, iconOffsets } = target;

  // Return early if there are no icon markers in the word to match against
  if (!iconOffsets || iconOffsets.length === 0) {
    return matchesFuzzy(query, text, enableSeparateSubstringMatching);
  }

  // Trim the word to match against because it could have leading
  // whitespace now if the word started with an icon
  const wordToMatchAgainstWithoutIconsTrimmed = text.replace(/^ +/, '');
  const leadingWhitespaceOffset =
    text.length - wordToMatchAgainstWithoutIconsTrimmed.length;

  // match on value without icon
  const matches = matchesFuzzy(
    query,
    wordToMatchAgainstWithoutIconsTrimmed,
    enableSeparateSubstringMatching,
  );

  // Map matches back to offsets with icon and trimming
  if (matches) {
    for (const match of matches) {
      const iconOffset =
        iconOffsets[
          match.start + leadingWhitespaceOffset
        ] /* icon offsets at index */ +
        leadingWhitespaceOffset; /* overall leading whitespace offset */
      match.start += iconOffset;
      match.end += iconOffset;
    }
  }

  return matches;
}

export function compareFileNames(
  one: string | null,
  other: string | null,
  caseSensitive = false,
): number {
  const a = one || '';
  const b = other || '';
  const result = intlFileNameCollatorBaseNumeric.value.collator.compare(a, b);

  // Using the numeric option will make compare(`foo1`, `foo01`) === 0. Disambiguate.
  if (
    intlFileNameCollatorBaseNumeric.value.collatorIsNumeric &&
    result === 0 &&
    a !== b
  ) {
    return a < b ? -1 : 1;
  }

  return result;
}

export function compareAnything(
  one: string,
  other: string,
  lookFor: string,
): number {
  const elementAName = one.toLowerCase();
  const elementBName = other.toLowerCase();

  // Sort prefix matches over non prefix matches
  const prefixCompare = compareByPrefix(one, other, lookFor);
  if (prefixCompare) {
    return prefixCompare;
  }

  // Sort suffix matches over non suffix matches
  const elementASuffixMatch = elementAName.endsWith(lookFor);
  const elementBSuffixMatch = elementBName.endsWith(lookFor);
  if (elementASuffixMatch !== elementBSuffixMatch) {
    return elementASuffixMatch ? -1 : 1;
  }

  // Understand file names
  const r = compareFileNames(elementAName, elementBName);
  if (r !== 0) {
    return r;
  }

  // Compare by name
  return elementAName.localeCompare(elementBName);
}

export function compareByPrefix(
  one: string,
  other: string,
  lookFor: string,
): number {
  const elementAName = one.toLowerCase();
  const elementBName = other.toLowerCase();

  // Sort prefix matches over non prefix matches
  const elementAPrefixMatch = elementAName.startsWith(lookFor);
  const elementBPrefixMatch = elementBName.startsWith(lookFor);
  if (elementAPrefixMatch !== elementBPrefixMatch) {
    return elementAPrefixMatch ? -1 : 1;
  }

  // Same prefix: Sort shorter matches to the top to have those on top that match more precisely
  else if (elementAPrefixMatch && elementBPrefixMatch) {
    if (elementAName.length < elementBName.length) {
      return -1;
    }

    if (elementAName.length > elementBName.length) {
      return 1;
    }
  }

  return 0;
}

export function matchesContiguousIconAware(
  query: string,
  target: IParsedLabelWithIcons,
): IMatch[] | null {
  const { text, iconOffsets } = target;

  // Return early if there are no icon markers in the word to match against
  if (!iconOffsets || iconOffsets.length === 0) {
    return matchesContiguous(query, text);
  }

  // Trim the word to match against because it could have leading
  // whitespace now if the word started with an icon
  const wordToMatchAgainstWithoutIconsTrimmed = text.replace(/^ +/, '');
  const leadingWhitespaceOffset =
    text.length - wordToMatchAgainstWithoutIconsTrimmed.length;

  // match on value without icon
  const matches = matchesContiguous(
    query,
    wordToMatchAgainstWithoutIconsTrimmed,
  );

  // Map matches back to offsets with icon and trimming
  if (matches) {
    for (const match of matches) {
      const iconOffset =
        iconOffsets[
          match.start + leadingWhitespaceOffset
        ] /* icon offsets at index */ +
        leadingWhitespaceOffset; /* overall leading whitespace offset */
      match.start += iconOffset;
      match.end += iconOffset;
    }
  }

  return matches;
}

function matchesContiguous(
  word: string,
  wordToMatchAgainst: string,
): IMatch[] | null {
  const matchIndex = wordToMatchAgainst
    .toLowerCase()
    .indexOf(word.toLowerCase());
  if (matchIndex !== -1) {
    return [{ start: matchIndex, end: matchIndex + word.length }];
  }
  return null;
}
