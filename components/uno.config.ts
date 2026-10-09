import { defineConfig, presetWind3 } from 'unocss';

// No reset: browser defaults and VS Code's local box models are part of the reference.
export default defineConfig({
  presets: [presetWind3()],
  shortcuts: {
    'vc-button-layout': 'box-border flex w-full items-center justify-center text-center cursor-pointer',
    'vc-tree-row-layout': 'absolute box-border overflow-hidden w-full cursor-pointer',
    'vc-tree-content-layout': 'flex h-full items-center relative',
  },
});
