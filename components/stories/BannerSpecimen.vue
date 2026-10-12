<script setup lang="ts">
import { onMounted, ref } from "vue";
import Banner from "../src/components/banner/Banner.vue";
import type { BannerHandle, BannerItem } from "../src/components/banner/types";
import { bannerItems } from "./BannerData";
defineProps<{ theme?: string }>();
const variant =
  new URLSearchParams(location.search).get("variant") || "welcome";
const items = ref<readonly BannerItem[]>([
  bannerItems[variant] || bannerItems.welcome,
]);
const banner = ref<BannerHandle>();
const closes = ref<string[]>([]),
  actions = ref<{ id: string; href: string }[]>([]);
function show(name: string) {
  banner.value?.show({ ...bannerItems[name] });
}
onMounted(() => {
  Object.defineProperty(window, "fixtureState", {
    configurable: true,
    get: () => ({
      active: banner.value?.getActiveItem()?.id ?? null,
      items: items.value.map((item) => item.id),
      closes: [...closes.value],
      actions: [...actions.value],
    }),
  });
  (window as any).fixtureApi = {
    show,
    hide: (id: string) => banner.value?.hide(id),
    focus: () => banner.value?.focus(),
    next: () => banner.value?.focusNextAction(),
    previous: () => banner.value?.focusPreviousAction(),
    update: () =>
      banner.value?.show({
        ...bannerItems.welcome,
        message: "Workspace information has changed.",
        actions: [{ label: "Review", href: "#review" }],
      }),
    clear: () => {
      items.value = [];
    },
    replace: () => {
      items.value = [bannerItems.neutral, bannerItems.latest];
    },
  };
  (window as any).fixtureReady = true;
});
</script>
<template>
  <div class="vc-theme fixture-root" :data-theme="theme || 'dark'">
    <div class="specimen" data-testid="specimen" style="height: 52px">
      <Banner
        ref="banner"
        v-model:items="items"
        @close="closes.push($event)"
        @action="(id, href) => actions.push({ id, href })"
      >
        <template v-if="variant === 'rich'" #message
          ><div class="rendered-markdown">
            <p>
              Workspace <strong>ready</strong>.
              <a
                href="#guide"
                @click.prevent.stop="
                  actions.push({ id: 'rich', href: '#guide' })
                "
                >Read the guide</a
              >.
            </p>
          </div></template
        >
      </Banner>
    </div>
    <button class="outside">Move focus outside</button>
    <button @click="show('warning')">Show priority banner</button>
    <button @click="show('neutral')">Show neutral banner</button>
    <button @click="banner?.focus()">Focus banner</button>
  </div>
</template>
