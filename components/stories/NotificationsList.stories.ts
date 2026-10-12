import type { Meta, StoryObj } from "@storybook/vue3-vite";
import NotificationsList from "../src/components/notifications/NotificationsList.vue";
import NotificationsListSpecimen from "./NotificationsListSpecimen.vue";
import Compare from "./Compare.vue";
import { notificationItems } from "./NotificationsData";
const meta = {
  title: "Components/Notifications List",
  component: NotificationsList,
  args: { items: notificationItems, maxHeight: 280 },
} satisfies Meta<typeof NotificationsList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="notifications-list" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { NotificationsList },
    setup: () => ({ args }),
    template:
      '<div class="playground" style="max-width:450px"><NotificationsList v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          "通知按items顺序显示。消息可为文本或显式链接节点；主操作使条目自动展开，进度运行时禁止关闭。展开状态可用expandedIds控制。主操作默认关闭通知，keepOpen可保留；次操作保持打开。",
      },
      source: {
        code: '<NotificationsList v-model:items="notifications" v-model:expanded-ids="expanded" @action="runAction" @link="openLink" />',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { NotificationsListSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<NotificationsListSpecimen :theme="globals.theme" />',
  }),
};
