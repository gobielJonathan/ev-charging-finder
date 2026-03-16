<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const navItems = [
    {
        name: 'home',
        label: 'Map',
        path: '/',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
    },
    {
        name: 'add-station',
        label: 'Add',
        path: '/add-station',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    },
    {
        name: 'feedback',
        label: 'Feedback',
        path: '/feedback',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    },
    {
        name: 'profile',
        label: 'Profile',
        path: '/profile',
        icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    },
]

const active = computed(() => route.name)
</script>

<template>
    <nav class="bottom-nav glass" aria-label="Main navigation">
        <RouterLink v-for="item in navItems" :key="item.name" :to="item.path" class="nav-item"
            :class="{ 'nav-item--active': active === item.name }" :aria-label="item.label">
            <span class="nav-icon" v-html="item.icon" />
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="active === item.name" class="nav-indicator" />
        </RouterLink>
    </nav>

    <!-- Desktop sidebar nav -->
    <nav class="side-nav glass" aria-label="Main navigation">
        <RouterLink v-for="item in navItems" :key="item.name" :to="item.path" class="side-nav-item"
            :class="{ 'side-nav-item--active': active === item.name }">
            <span class="nav-icon" v-html="item.icon" />
            <span class="side-nav-label">{{ item.label }}</span>
        </RouterLink>
    </nav>
</template>

<style scoped>
/* ---- Bottom Nav (mobile/tablet) ---- */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    height: var(--nav-height);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: stretch;
    padding: 0 8px;
    padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    text-decoration: none;
    color: var(--text-muted);
    position: relative;
    transition: color var(--transition-fast);
    border-radius: var(--radius-md);
    padding: 6px 4px;
}

.nav-item:hover {
    color: var(--text-secondary);
}

.nav-item--active {
    color: var(--primary);
}

.nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    transition: background var(--transition-fast), transform var(--transition-fast);
}

.nav-item--active .nav-icon {
    background: var(--primary-light);
    transform: translateY(-1px);
    color: var(--primary);
}

.nav-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.3px;
}

.nav-indicator {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: var(--primary);
    border-radius: 50%;
}

/* ---- Side Nav (desktop) ---- */
.side-nav {
    display: none;
}

@media (min-width: 1024px) {
    .bottom-nav {
        display: none;
    }

    .side-nav {
        display: flex;
        flex-direction: column;
        position: fixed;
        left: 0;
        top: var(--header-height);
        bottom: 0;
        width: 72px;
        z-index: 90;
        border-right: 1px solid var(--border);
        padding: 16px 0;
        gap: 4px;
        align-items: center;
    }

    .side-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        text-decoration: none;
        color: var(--text-muted);
        width: 56px;
        transition: all var(--transition-fast);
    }

    .side-nav-item:hover {
        background: var(--bg-surface);
        color: var(--text-secondary);
    }

    .side-nav-item--active {
        color: var(--primary);
        background: rgba(0, 200, 150, 0.1);
    }

    .side-nav-label {
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
    }
}
</style>
