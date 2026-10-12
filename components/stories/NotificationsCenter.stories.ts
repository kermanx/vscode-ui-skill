import type { Meta, StoryObj } from "@storybook/vue3-vite";
import NotificationsCenter from "../src/components/notifications/NotificationsCenter.vue";
import NotificationsCenterSpecimen from "./NotificationsCenterSpecimen.vue";
import Compare from "./Compare.vue";
import { notificationItems } from "./NotificationsData";
const meta = {
  title: "Components/Notifications Center",
  component: NotificationsCenter,
  args: {
    items: notificationItems,
    open: true,
    position: "bottom-right",
    statusBarVisible: true,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NotificationsCenter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  render: (_, { globals }) => ({
    components: { Compare },
    setup: () => ({ theme: globals.theme }),
    template: '<Compare kind="notifications-center" :theme="theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { NotificationsCenter },
    setup: () => ({ args }),
    template:
      '<div style="height:480px;position:relative"><NotificationsCenter v-bind="args" /></div>',
  }),
};
export const Specimen: Story = {
  tags: ["!autodocs"],
  render: (_, { globals }) => ({
    components: { NotificationsCenterSpecimen },
    setup: () => ({ theme: globals.theme }),
    template: '<NotificationsCenterSpecimen :theme="theme" />',
  }),
};
