import type { Meta, StoryObj } from "@storybook/vue3-vite";
import NotificationToasts from "../src/components/notifications/NotificationToasts.vue";
import NotificationToastsSpecimen from "./NotificationToastsSpecimen.vue";
import Compare from "./Compare.vue";
import { notificationItems } from "./NotificationsData";
const meta = {
  title: "Components/Notification Toasts",
  component: NotificationToasts,
  args: {
    items: notificationItems,
    position: "bottom-right",
    statusBarVisible: true,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NotificationToasts>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  render: (_, { globals }) => ({
    components: { Compare },
    setup: () => ({ theme: globals.theme }),
    template: '<Compare kind="notification-toasts" :theme="theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { NotificationToasts },
    setup: () => ({ args }),
    template:
      '<div style="height:480px;position:relative"><NotificationToasts v-bind="args" /></div>',
  }),
};
export const Specimen: Story = {
  tags: ["!autodocs"],
  render: (_, { globals }) => ({
    components: { NotificationToastsSpecimen },
    setup: () => ({ theme: globals.theme }),
    template: '<NotificationToastsSpecimen :theme="theme" />',
  }),
};
