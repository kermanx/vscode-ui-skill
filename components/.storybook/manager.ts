import { addons } from 'storybook/manager-api';

addons.setConfig({
  layoutCustomisations: {
    showPanel: (state, defaultValue) => state.storyId?.endsWith('--playground') ? defaultValue : false,
  },
});
