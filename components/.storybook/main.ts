import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/vue3-vite',
    options: { docgen: false, builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
  stories: ['../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs'],
  staticDirs: ['../public'],
};
export default config;
