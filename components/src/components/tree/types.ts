export interface TreeAction {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

export interface TreeDecoration {
  badge?: string;
  /** A color ID such as gitDecoration.modifiedResourceForeground. */
  color?: string;
  tooltip?: string;
  strikethrough?: boolean;
}

export interface TreeNode {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  actions?: readonly TreeAction[];
  decoration?: TreeDecoration;
  children?: readonly TreeNode[];
}

export interface TreeRow {
  node: TreeNode;
  depth: number;
  parent?: string;
  ancestors: string[];
  position: number;
  setSize: number;
}
