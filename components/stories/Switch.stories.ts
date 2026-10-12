import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, watch } from 'vue';
import Switch from '../src/components/switch/Switch.vue';
import SwitchSpecimen from './SwitchSpecimen.vue';
import Compare from './Compare.vue';
const meta = { title: 'Components/Switch', component: Switch,
  args: { checked: false, ariaLabel: 'Choose model automatically', title: '', disabled: false },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { Compare }, setup: () => ({ globals: context.globals }), template: '<Compare kind="switch" :theme="globals.theme" />' }),
};
export const Playground: Story = {
  render: args => ({ components: { Switch }, setup() { const checked = ref(args.checked); watch(() => args.checked, value => { checked.value = value; }); return { args, checked }; },
    template: '<div class="playground"><Switch v-bind="args" v-model:checked="checked" /><p class="state-readout">checked: {{ checked }}</p></div>' }),
  parameters: { docs: { description: { story: '原版胶囊 Switch，用于立即生效的设置。原生 button 支持 Enter 和 Space，Space 在 keyup 切换。程序设置 checked 不发 change；禁用开关跳过 Tab。外部标签 span 只显示文字，aria-description 可传入说明。title 的全局 hover 服务尚未接入。' }, source: { code: '<Switch v-model:checked="auto" ariaLabel="Choose model automatically" />' } } },
};
export const Specimen: Story = { parameters: { controls: { disable: true } },
  render: (_, context) => ({ components: { SwitchSpecimen }, setup: () => ({ globals: context.globals }), template: '<SwitchSpecimen :theme="globals.theme" />' }),
};
