import type { Meta, StoryObj } from '@storybook/vue3-vite';
import DropdownButton from '../src/components/button/DropdownButton.vue';
import DropdownSpecimen from './DropdownSpecimen.vue';
import Compare from './Compare.vue';
import { dropdownActions } from './dropdownData';
const meta = { title: 'Components/Dropdown Button', component: DropdownButton,
  args: { label: 'Open Folder', actions: dropdownActions, secondary: false, disabled: false, includePrimary: true },
} satisfies Meta<typeof DropdownButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="dropdown" :theme="globals.theme" />' }),
};
export const Playground: Story = { render: args => ({ components: { DropdownButton }, setup: () => ({ args }), template: '<div class="playground" style="min-height:300px"><div style="width:184px"><DropdownButton v-bind="args" /></div></div>' }),
  parameters: { docs: { source: { code: '<DropdownButton label="Open Folder" :actions="[{ id: \'new-window\', label: \'Open in New Window\' }]" @click="openFolder" @action="runAction" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { DropdownSpecimen }, setup: () => ({ globals: context.globals }), template: '<DropdownSpecimen :theme="globals.theme" />' }),
};
