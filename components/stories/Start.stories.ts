import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Compare from './Compare.vue';
const meta = { title: 'Start here', component: Compare } satisfies Meta<typeof Compare>;
export default meta;
export const Review: StoryObj = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="tree" :theme="globals.theme" />' }),
};
