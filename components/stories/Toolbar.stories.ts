import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Toolbar from '../src/components/toolbar/Toolbar.vue';
import ToolbarSpecimen from './ToolbarSpecimen.vue';
import Compare from './Compare.vue';
import { toolbarPrimary, toolbarSecondary } from './ToolbarData';
const meta = { title: 'Components/Toolbar', component: Toolbar, args: { primary: toolbarPrimary, secondary: toolbarSecondary, ariaLabel: 'File actions', alignment: 'left' }, argTypes: { alignment: { control: 'select', options: ['left', 'right'] } } } satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="toolbar" :theme="globals.theme" />' }) };
export const Playground: Story = { render: args => ({ components: { Toolbar }, setup: () => ({ args }), template: '<div class="playground" style="height:300px"><div style="height:26px"><Toolbar v-bind="args" /></div></div>' }),
  parameters: { docs: { source: { code: '<Toolbar :primary="[{ id: \'new\', label: \'New File\', icon: \'new-file\' }]" :secondary="[{ id: \'save-all\', label: \'Save All\' }]" aria-label="File actions" @action="runCommand" />' } } } };
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { ToolbarSpecimen }, setup: () => ({ globals: context.globals }), template: '<ToolbarSpecimen :theme="globals.theme" />' }) };
