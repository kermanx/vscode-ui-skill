import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Dropdown from '../src/components/dropdown/Dropdown.vue';
import Menu from '../src/components/menu/Menu.vue';
import DropdownPanelSpecimen from './DropdownPanelSpecimen.vue';
import Compare from './Compare.vue';
import { menuActions } from './menuData';
const meta = { title: 'Components/Dropdown', component: Dropdown, args: { label: 'More Actions', disabled: false, alignment: 'left' } } satisfies Meta<typeof Dropdown>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="dropdown-panel" :theme="globals.theme" />' }) };
export const Playground: Story = { render: args => ({ components: { Dropdown, Menu }, setup: () => ({ args, menuActions }), template: '<div class="playground" style="min-height:320px"><div style="width:184px;height:24px"><Dropdown v-bind="args" v-slot="{ close }"><Menu :actions="menuActions" @action="close" @cancel="close" /></Dropdown></div></div>' }),
  parameters: { docs: { source: { code: '<Dropdown label="More Actions" v-slot="{ close }">\n  <Menu :actions="actions" @action="id => { runCommand(id); close(); }" @cancel="close" />\n</Dropdown>' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { DropdownPanelSpecimen }, setup: () => ({ globals: context.globals }), template: '<DropdownPanelSpecimen :theme="globals.theme" />' }) };
