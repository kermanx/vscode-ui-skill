import type { ProblemItem } from "../src/components/problems/types";
export const problemItems: ProblemItem[] = [
  {
    id: "assign",
    resource: "/workspace/src/app.ts",
    severity: "error",
    message:
      "Type 'string' is not assignable to type 'number'.\nThe expected type comes from property 'count'.",
    line: 12,
    column: 7,
    endColumn: 12,
    source: "ts",
    code: { value: "2322", target: "https://example.com/diagnostics/2322" },
    quickFixes: [
      { id: "convert", label: "Convert to number" },
      { id: "change-type", label: "Change the declared type" },
    ],
    relatedInformation: [
      {
        id: "definition",
        resource: "/workspace/src/types.ts",
        message: "'count' is declared here.",
        line: 4,
        column: 3,
      },
    ],
  },
  {
    id: "unused",
    resource: "/workspace/src/app.ts",
    severity: "warning",
    message: "'options' is declared but its value is never read.",
    line: 8,
    column: 9,
    source: "eslint",
    code: "no-unused-vars",
  },
  {
    id: "style",
    resource: "/workspace/styles/main.css",
    severity: "warning",
    message: "Unknown property: colr",
    line: 6,
    column: 3,
    source: "css",
    code: "unknownProperties",
    quickFixes: [{ id: "color", label: "Rename to color" }],
  },
  {
    id: "todo",
    resource: "/workspace/README.md",
    severity: "info",
    message: "Consider documenting the installation steps.",
    line: 2,
    column: 1,
    source: "Workspace Notes",
  },
];
export function manyProblems(): ProblemItem[] {
  return Array.from({ length: 240 }, (_, index) => ({
    id: `problem-${index}`,
    resource: `/workspace/src/file${String(Math.floor(index / 6)).padStart(
      2,
      "0"
    )}.ts`,
    severity: (["error", "warning", "info"] as const)[index % 3],
    message: `Diagnostic ${index}${
      index % 5 === 0 ? "\nAdditional context for this diagnostic." : ""
    }`,
    line: (index % 6) + 1,
    column: 3,
    source: "ts",
    code: String(2000 + index),
  }));
}
