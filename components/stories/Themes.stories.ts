import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ThemePreview from './ThemePreview.vue';

export default { title: 'Themes/Import', component: ThemePreview, parameters: { controls: { disable: true } } } satisfies Meta<typeof ThemePreview>;
export const Preview: StoryObj<typeof ThemePreview> = {};
