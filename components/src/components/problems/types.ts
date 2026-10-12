export type ProblemSeverity = "error" | "warning" | "info";
export interface ProblemLocation {
  /** File path used to group diagnostics and identify their opening location. */
  resource: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}
export interface ProblemRelatedInformation extends ProblemLocation {
  id: string;
  message: string;
}
export interface ProblemItem extends ProblemLocation {
  id: string;
  severity: ProblemSeverity;
  message: string;
  source?: string;
  code?: string | { value: string; target: string };
  relatedInformation?: readonly ProblemRelatedInformation[];
  /** Available commands; choosing one emits an action request for the host to handle. */
  quickFixes?: readonly { id: string; label: string; disabled?: boolean }[];
}
export interface ProblemOpenEvent {
  id: string;
  location: ProblemLocation;
  preserveFocus: boolean;
  pinned: boolean;
  sideBySide: boolean;
}
export interface ProblemsHandle {
  focus(): void;
  focusFilter(): void;
  reveal(id: string): void;
  collapseAll(): void;
  getFocus(): string | undefined;
}
