import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ActionBar from '../src/components/action-bar/ActionBar.vue';
import ActionBarSpecimen from './ActionBarSpecimen.vue';
import Compare from './Compare.vue';
import { actionBarActions } from './actionBarData';
const meta = { title: 'Components/Action Bar', component: ActionBar, args: { actions: actionBarActions, ariaLabel: 'File actions' }, argTypes: { orientation: { control: 'select', options: ['horizontal', 'vertical'] } } } satisfies Meta<typeof ActionBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="action-bar" :theme="globals.theme" />' }) };
export const Playground: Story = { render: args => ({ components: { ActionBar }, setup: () => ({ args }), template: '<div class="playground"><ActionBar v-bind="args" /></div>' }),
  parameters: { docs: { source: { code: '<ActionBar :actions="[{ id: \'add\', label: \'New File\', icon: \'new-file\' }, { separator: true }, { id: \'run\', label: \'Run\' }]" aria-label="File actions" @action="runCommand" />' } } } };
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { ActionBarSpecimen }, setup: () => ({ globals: context.globals }), template: '<ActionBarSpecimen :theme="globals.theme" />' }) };
