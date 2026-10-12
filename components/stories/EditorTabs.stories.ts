import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import EditorTabs from "../src/components/editor-tabs/EditorTabs.vue";
import EditorTabsSpecimen from "./EditorTabsSpecimen.vue";
import Compare from "./Compare.vue";
import { editorTabs } from "./EditorTabsData";
const meta = {
  title: "Components/Editor Tabs",
  component: EditorTabs,
  args: {
    items: editorTabs,
    active: true,
    compact: false,
    showIcons: true,
    sizing: "fit",
    stickySizing: "normal",
  },
} satisfies Meta<typeof EditorTabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { Compare },
    setup: () => ({ globals: context.globals }),
    template: '<Compare kind="editor-tabs" :theme="globals.theme" />',
  }),
};
export const Playground: Story = {
  render: (args) => ({
    components: { EditorTabs },
    setup: () => ({
      args,
      activeId: ref("readme"),
      selectedIds: ref<string[]>([]),
    }),
    template:
      '<div class="playground"><EditorTabs v-bind="args" v-model:active-id="activeId" v-model:selected-ids="selectedIds" /></div>',
  }),
  parameters: {
    docs: {
      description: {
        story:
          "标签栏覆盖预览、固定、未保存、多选、关闭请求及横向滚动。文件关闭和取消固定交由调用方更新 items。",
      },
      source: {
        code: '<EditorTabs :items="tabs" v-model:active-id="activeId" @close="closeEditors" @pin="pinEditor" @unpin="unpinEditor" />',
      },
    },
  },
};
export const Specimen: Story = {
  parameters: { controls: { disable: true } },
  render: (_, context) => ({
    components: { EditorTabsSpecimen },
    setup: () => ({ globals: context.globals }),
    template: '<EditorTabsSpecimen :theme="globals.theme" />',
  }),
};
