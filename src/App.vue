<script setup lang="ts">
import { ref } from 'vue'
// import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useRoute } from 'vue-router'
// import BottomNav from '@/components/layout/BottomNav.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const route = useRoute()

// PWA update prompt
// const { needRefresh, updateServiceWorker } = useRegisterSW()
const dismissedUpdate = ref(false)

function applyUpdate() {
  // updateServiceWorker(true)
}
</script>

<template>
  <div class="app-shell">
    <AppHeader />
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <!-- <BottomNav /> -->

    <!-- PWA update banner -->
    <!-- <Transition name="pwa-banner">
      <div v-if="needRefresh && !dismissedUpdate" class="pwa-update-banner">
        <span class="pwa-update-text">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          New version available
        </span>
        <div class="pwa-update-actions">
          <button class="pwa-btn pwa-btn--update" @click="applyUpdate">Update</button>
          <button class="pwa-btn pwa-btn--dismiss" @click="dismissedUpdate = true">Later</button>
        </div>
      </div>
    </Transition> -->
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

/* ── PWA update banner ─────────────────────────────────────────── */
.pwa-update-banner {
  position: fixed;
  bottom: calc(var(--nav-height) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9000;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(18, 18, 30, 0.97);
  border: 1px solid rgba(0, 200, 150, 0.35);
  border-left: 3px solid var(--primary);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  white-space: nowrap;
  font-size: 13px;
}

@media (min-width: 1024px) {
  .pwa-update-banner {
    bottom: 20px;
  }
}

.pwa-update-text {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-weight: 500;
}

.pwa-update-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.pwa-btn {
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
}

.pwa-btn--update {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff;
  box-shadow: var(--shadow-glow);
}

.pwa-btn--update:hover {
  filter: brightness(1.1);
}

.pwa-btn--dismiss {
  background: var(--bg-surface);
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.pwa-btn--dismiss:hover {
  color: var(--text-secondary);
}

.pwa-banner-enter-active,
.pwa-banner-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.pwa-banner-enter-from,
.pwa-banner-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>
