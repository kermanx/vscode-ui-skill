import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [UnoCSS(), vue()],
  server: { watch: { ignored: ['**/dist/**', '**/storybook-static/**', '**/test-results/**', '**/playwright-report/**'] } },
});
