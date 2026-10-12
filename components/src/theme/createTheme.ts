import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser';

export type ThemeBase = 'dark' | 'light' | 'hcDark' | 'hcLight';
export interface ColorTheme {
  name?: string;
  type?: string;
  include?: string;
  colors?: Record<string, string | null>;
}
export type ThemeSource = ColorTheme | string;
export interface ThemeOptions {
  base?: ThemeBase;
  /** Path of the entry file, used to resolve relative includes. */
  fileName?: string;
  /** Included JSON/JSONC files, keyed by their relative paths. */
  files?: Record<string, ThemeSource>;
}

function read(source: ThemeSource): ColorTheme {
  const errors: ParseError[] = [];
  const theme =
    typeof source === 'string'
      ? parse(source, errors, { allowTrailingComma: true })
      : source;
  if (errors.length)
    throw new Error(
      `Theme JSON: ${printParseErrorCode(errors[0].error)} at offset ${errors[0].offset}.`,
    );
  if (!theme || typeof theme !== 'object' || Array.isArray(theme))
    throw new Error('Theme must be a JSON object.');
  if (
    theme.colors !== undefined &&
    (!theme.colors ||
      typeof theme.colors !== 'object' ||
      Array.isArray(theme.colors))
  ) {
    throw new Error('Theme colors must be an object.');
  }
  return theme;
}

function normalize(path: string) {
  const parts: string[] = [];
  for (const part of path.replaceAll('\\', '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..' && parts.length && parts.at(-1) !== '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

/** Convert a JSON/JSONC color theme into scoped CSS variables with a built-in base. */
export function createTheme(source: ThemeSource, options: ThemeOptions = {}) {
  const files = new Map(
    Object.entries(options.files ?? {}).map(([path, value]) => [
      normalize(path),
      value,
    ]),
  );
  const visiting = new Set<string>();
  function merge(input: ThemeSource, fileName: string): ColorTheme {
    if (visiting.has(fileName))
      throw new Error(`Circular theme include: ${fileName}.`);
    visiting.add(fileName);
    const theme = read(input);
    let parent: ColorTheme = {};
    if (theme.include !== undefined) {
      if (typeof theme.include !== 'string')
        throw new Error('Theme include must be a file path.');
      const directory = fileName.includes('/')
        ? fileName.slice(0, fileName.lastIndexOf('/') + 1)
        : '';
      const path = normalize(directory + theme.include);
      const included = files.get(path);
      if (included === undefined)
        throw new Error(
          `Missing included theme: ${path}. Provide it in options.files.`,
        );
      parent = merge(included, path);
    }
    visiting.delete(fileName);
    return {
      ...parent,
      ...theme,
      colors: { ...parent.colors, ...theme.colors },
    };
  }
  const theme = merge(source, normalize(options.fileName ?? 'theme.json'));
  const bases: Record<string, ThemeBase> = {
    dark: 'dark',
    light: 'light',
    hc: 'hcDark',
    hcDark: 'hcDark',
    hcLight: 'hcLight',
    vs: 'light',
    'vs-dark': 'dark',
    'hc-black': 'hcDark',
    'hc-light': 'hcLight',
  };
  const base = options.base ?? bases[theme.type ?? ''] ?? 'dark';
  const style: Record<`--vscode-${string}`, string> = {};
  for (const [id, value] of Object.entries(theme.colors ?? {})) {
    if (!/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)*$/.test(id))
      throw new Error(`Invalid color ID: ${id}.`);
    // "default" and null discard inherited overrides and reveal the built-in base.
    if (value === null || value === 'default') continue;
    if (
      typeof value !== 'string' ||
      !/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
    ) {
      throw new Error(
        `Color ${id} must use #RGB, #RGBA, #RRGGBB, or #RRGGBBAA.`,
      );
    }
    style[`--vscode-${id.replaceAll('.', '-')}`] = value;
  }
  return { name: theme.name ?? 'Custom theme', base, style };
}
