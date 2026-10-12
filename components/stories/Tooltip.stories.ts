import type { Meta, StoryObj } from '@storybook/vue3-vite';
import HoverSpecimen from './HoverSpecimen.vue';
import Compare from './Compare.vue';
import Tooltip from '../src/components/tooltip/Tooltip.vue';
const meta = { title: 'Components/Tooltip', component: Tooltip, args: { text: 'Inspect the current value.', placement: 'element' } } satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = { render: args => ({ components: { Tooltip }, setup: () => ({ args }), template: '<div class="playground"><Tooltip v-bind="args"><button>Hover or focus me</button></Tooltip></div>' }) };

export const Review: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="tooltip" :theme="globals.theme" />' }) };
export const Specimen: Story = { parameters: { controls: { disable: true } }, render: (_, context) => ({ components: { HoverSpecimen }, setup: () => ({ globals: context.globals }), template: '<HoverSpecimen :theme="globals.theme" />' }) };
