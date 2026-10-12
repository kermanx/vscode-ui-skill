import type { QuickInputProps } from '../src/components/quick-input/types';
export interface QuickInputExample extends QuickInputProps {
  name: string;
  value?: string;
  keepOpenOnAccept?: boolean;
}
export const quickInputExamples: QuickInputExample[] = [
  { name: 'Plain input', placeholder: 'Type a name' },
  {
    name: 'Title, steps and back',
    title: 'Create a project',
    step: 1,
    totalSteps: 3,
    description: 'Choose the name for your new project.',
    placeholder: 'Project name',
    value: 'workspace',
    prompt: 'Enter a project name.',
    backButton: true,
    buttons: [{ id: 'settings', icon: 'gear', tooltip: 'Configure project' }],
  },
  {
    name: 'Password',
    title: 'Connect to the server',
    placeholder: 'Password',
    value: 'secret',
    password: true,
    prompt: 'Enter your account password.',
  },
  {
    name: 'Information',
    title: 'Choose a branch',
    placeholder: 'Branch name',
    value: 'feature',
    validationMessage: '$(info) This branch will be created locally.',
    severity: 'info',
  },
  {
    name: 'Warning',
    placeholder: 'Destination',
    value: 'shared',
    validationMessage: '$(warning) This folder is shared with other users.',
    severity: 'warning',
  },
  {
    name: 'Error and link',
    title: 'Create a folder',
    placeholder: 'Folder name',
    value: 'invalid/name',
    validationMessage:
      '$(error) A folder name cannot contain a slash. [Naming rules](https://example.com/naming "Learn about names")',
    severity: 'error',
    keepOpenOnAccept: true,
  },
  {
    name: 'Busy',
    title: 'Checking availability',
    placeholder: 'Repository name',
    value: 'vscode-ui',
    busy: true,
    prompt: 'Checking the remote repository.',
  },
  {
    name: 'Disabled editing',
    title: 'Read-only input',
    value: 'This value cannot be edited',
    enabled: false,
    backButton: true,
    buttons: [{ id: 'refresh', icon: 'refresh', tooltip: 'Refresh' }],
  },
  {
    name: 'Keep open on blur',
    title: 'Persistent input',
    placeholder: 'Filter',
    ignoreFocusOut: true,
    prompt: 'You can focus another control while this input stays open.',
  },
  {
    name: 'Value selection',
    title: 'Rename symbol',
    value: 'mySelectedName',
    valueSelection: [2, 10],
    placeholder: 'New name',
  },
  {
    name: 'Buttons without a title',
    backButton: true,
    buttons: [
      { id: 'refresh', icon: 'refresh', tooltip: 'Refresh' },
      { id: 'settings', icon: 'gear', tooltip: 'Configure' },
    ],
    placeholder: 'Search settings',
  },
  {
    name: 'Description and long prompt',
    description: 'The description appears below the input and progress area.',
    placeholder: 'Workspace location',
    prompt:
      'Select a location for the workspace. [Open documentation](https://example.com/workspaces) for additional guidance on organizing files.',
  },
  {
    name: 'Long title and validation',
    title:
      'This is a long title that describes the current step of a multi-step input flow and truncates when space is limited',
    step: 2,
    totalSteps: 4,
    description: 'Choose a location that all members can access.',
    value: 'workspace',
    validationMessage:
      '$(warning) This workspace already exists. Choose another name, or read the [workspace documentation](https://example.com/workspaces) to understand how to continue safely.',
    severity: 'warning',
  },
];
export function quickInputProps(example: QuickInputExample) {
  const { name, value, keepOpenOnAccept, ...props } = example;
  return props;
}
