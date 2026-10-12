import type { Preview } from '@storybook/vue3-vite';
import '../src/components/action-bar/actionbar.css';
import '../src/theme/platform';
import 'virtual:uno.css';
import '../src/theme/theme.css';
import '../stories/gallery.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    options: { storySort: { order: ['Start here', 'Compositions', 'Components', 'Themes'] } },
  },
  globalTypes: {
    theme: {
      description: '配色主题：深色 / 浅色 / 高对比度',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark+（深色）' }, { value: 'light', title: 'Light+（浅色）' },
          { value: 'hcDark', title: '高对比度 · 深色' }, { value: 'hcLight', title: '高对比度 · 浅色' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark' },
  decorators: [(story, context) => context.name === 'Specimen' ? ({ components: { story }, template: '<story />' }) : ({
    components: { story },
    setup: () => ({ globals: context.globals }),
    template: '<div class="vc-theme gallery-root" :data-theme="globals.theme"><story /></div>',
  })],
};
export default preview;
