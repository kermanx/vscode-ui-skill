import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 30000, workers: 2,
  use: { baseURL: 'http://localhost:6006', viewport: { width: 420, height: 480 }, deviceScaleFactor: 1 },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: { command: 'npm run dev -- --ci', url: 'http://localhost:6006', reuseExistingServer: true, timeout: 60000 },
});
