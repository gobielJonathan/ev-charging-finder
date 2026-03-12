<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => {
    const map: Record<string, string> = {
        home: 'EV Finder',
        feedback: 'Feedback',
        profile: 'Profile',
    }
    return map[route.name as string] ?? 'EV Finder'
})
const isHome = computed(() => route.name === 'home')
</script>

<template>
    <header class="app-header glass">
        <div class="header-inner">
            <div class="header-brand">
                <div class="brand-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>
                <div>
                    <span class="brand-name">{{ isHome ? 'ChargeNow' : title }}</span>
                    <span v-if="isHome" class="brand-tagline">Find EV stations nearby</span>
                </div>
            </div>
            <div class="header-actions">
                <slot name="actions" />
            </div>
        </div>
    </header>
</template>

<style scoped>
.app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: var(--header-height);
    border-bottom: 1px solid var(--border);
}

.header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 16px;
    max-width: 1280px;
    margin: 0 auto;
}

.header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

.brand-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: var(--shadow-glow);
    flex-shrink: 0;
}

.brand-name {
    display: block;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.3px;
    line-height: 1.2;
}

.brand-tagline {
    display: block;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1;
}

.header-actions {
    display: flex;
    gap: 8px;
}

@media (min-width: 768px) {
    .brand-name {
        font-size: 18px;
    }
}
</style>
