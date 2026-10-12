import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Menu from '../src/components/menu/Menu.vue';
import MenuSpecimen from './MenuSpecimen.vue';
import Compare from './Compare.vue';
import { menuActions } from './menuData';
const meta = { title: 'Components/Menu', component: Menu, args: { actions: menuActions, ariaLabel: 'File menu' } } satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="menu" :theme="globals.theme" />' }) };
export const Playground: Story = { render: args => ({ components: { Menu }, setup: () => ({ args }), template: '<div class="playground"><div style="width:max-content"><Menu v-bind="args" /></div></div>' }),
  parameters: { docs: { source: { code: '<Menu :actions="[{ id: \'save\', label: \'Save\', keybinding: \'⌘S\' }, { separator: true }, { id: \'recent\', label: \'Open Recent\', children: recentFiles }]" @action="runCommand" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { MenuSpecimen }, setup: () => ({ globals: context.globals }), template: '<MenuSpecimen :theme="globals.theme" />' }) };
