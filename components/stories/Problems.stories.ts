import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Problems from "../src/components/problems/Problems.vue";
import ProblemsSpecimen from "./ProblemsSpecimen.vue";
import Compare from "./Compare.vue";
import { problemItems } from "./ProblemsData";
const meta = {
  title: "Components/Problems",
  component: Problems,
  args: { items: problemItems, height: 320 },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Problems>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  render: (_, { globals }) => ({
    components: { Compare },
    setup: () => ({ globals }),
    template: '<Compare kind="problems" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { Problems },
    setup: () => ({ args }),
    template: '<Problems v-bind="args" />',
  }),
};
export const Specimen: Story = {
  tags: ["!autodocs"],
  render: (_, { globals }) => ({
    components: { ProblemsSpecimen },
    setup: () => ({ globals }),
    template: '<ProblemsSpecimen :theme="globals.theme" />',
  }),
};
