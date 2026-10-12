// matching.js is the precomputed fuzzy/glob implementation. This file describes
// its small public surface; model.ts contains the diagnostic filtering policy.
export interface Match {
  start: number;
  end: number;
}
export function matchesFuzzy(pattern: string, value: string): Match[] | null;
export function matchesFuzzy2(pattern: string, value: string): Match[] | null;
export function splitGlobAware(pattern: string, separator: string): string[];
export function parse(
  expression: Record<string, boolean>,
): (path: string) => string | null;
