import type { Meta, StoryObj } from "@storybook/vue3-vite";
import Banner from "../src/components/banner/Banner.vue";
import BannerSpecimen from "./BannerSpecimen.vue";
import Compare from "./Compare.vue";
import { bannerItems } from "./BannerData";
const meta = {
  title: "Components/Banner",
  component: Banner,
  args: { items: [bannerItems.welcome] },
} satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="banner" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { Banner },
    setup: () => ({ args }),
    template: '<div class="playground"><Banner v-bind="args" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          "items 按展示顺序保存通知；更高 priority 优先，同级显示最新一条。关闭当前通知会恢复队列中的上一条。show(item) 更新并置后，hide(id) 移除而不触发 close。左右或上下键在链接与关闭操作之间循环，Escape 回到 Banner。message 插槽接收当前 item；自定义内容应提供 ariaLabel。",
      },
      source: {
        code: '<Banner ref="banner" v-model:items="banners" @action="(id, href) => open(href)" @close="rememberDismissal" />',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { BannerSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<BannerSpecimen :theme="globals.theme" />',
  }),
};
