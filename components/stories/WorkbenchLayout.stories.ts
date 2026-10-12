import type { Meta, StoryObj } from "@storybook/vue3-vite";
import WorkbenchLayout from "../src/components/workbench/WorkbenchLayout.vue";
import WorkbenchLayoutSpecimen from "./WorkbenchLayoutSpecimen.vue";
import Compare from "./Compare.vue";
const meta = {
  title: "Compositions/Workbench Layout",
  component: WorkbenchLayout,
} satisfies Meta<typeof WorkbenchLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="workbench-layout" :theme="globals.theme" />',
  }),
};
export const Specimen: Story = {
  render: (_, context) => ({
    components: { WorkbenchLayoutSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<WorkbenchLayoutSpecimen :theme="globals.theme" />',
  }),
};
