<script setup lang="ts">
import { useRoute } from 'vue-router'
// import BottomNav from '@/components/layout/BottomNav.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { SpeedInsights } from '@vercel/speed-insights/vue';
import { Analytics } from '@vercel/analytics/vue';

const route = useRoute()
</script>

<template>
  <div class="app-shell">
    <SpeedInsights />
    <Analytics />
    <AppHeader />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <!-- <BottomNav /> -->
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--bg);
}

.app-main {
  flex: 1;
  padding-top: var(--header-height);
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (min-width: 1024px) {
  .app-main {
    padding-bottom: 0;
  }
}
</style>
