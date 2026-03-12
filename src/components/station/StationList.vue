<script setup lang="ts">
import { ref, computed } from 'vue'
import StationCard from './StationCard.vue'
import { useStationStore } from '@/stores/stationStore'
import type { ChargingStation } from '@/types/station'

const store = useStationStore()
const filter = ref<'all' | 'online' | 'fast'>('all')

const filtered = computed(() => {
    if (filter.value === 'online') return store.stations.filter((s) => s.StatusType?.IsOperational !== false)
    if (filter.value === 'fast') return store.stations.filter((s) => Math.max(...(s.Connections?.map((c) => c.PowerKW ?? 0) ?? [0])) >= 50)
    return store.stations
})

const skeletons = Array.from({ length: 4 })

const emit = defineEmits<{
    (e: 'stationClick', station: ChargingStation): void
}>()
</script>

<template>
    <div class="station-list">
        <!-- Filter chips -->
        <div class="filter-bar">
            <button v-for="f in (['all', 'online', 'fast'] as const)" :key="f" class="filter-chip"
                :class="{ 'filter-chip--active': filter === f }" @click="filter = f">
                <span v-if="f === 'all'">All ({{ store.stations.length }})</span>
                <span v-if="f === 'online'">
                    <svg width="8" height="8" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="4" fill="var(--success)" />
                    </svg>
                    Online
                </span>
                <span v-if="f === 'fast'">⚡ Fast (≥50kW)</span>
            </button>
        </div>

        <!-- Loading skeletons -->
        <div v-if="store.isLoading" class="list-body">
            <div v-for="(_, i) in skeletons" :key="i" class="skeleton-card">
                <div class="skel skel-strip" />
                <div class="skel-body">
                    <div class="skel skel-title" />
                    <div class="skel skel-sub" />
                    <div class="skel-chips">
                        <div class="skel skel-chip" />
                        <div class="skel skel-chip skel-chip--sm" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!filtered.length" class="empty-state">
            <div class="empty-icon">🔌</div>
            <p class="empty-title">No stations found</p>
            <p class="empty-sub">Try moving the map or changing filters</p>
        </div>

        <!-- Station items -->
        <div v-else class="list-body">
            <div v-for="(station, i) in filtered" :key="station.ID" class="card-wrap"
                :style="{ animationDelay: `${i * 35}ms` }">
                <StationCard :station="station" @click="emit('stationClick', station)" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.station-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
}

.card-wrap {
    animation: cardIn 0.3s ease both;
}

@keyframes cardIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.filter-bar {
    display: flex;
    gap: 7px;
    flex-shrink: 0;
    overflow-x: auto;
    padding-bottom: 2px;
}

.filter-bar::-webkit-scrollbar {
    height: 0;
}

.filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--border);
    background: var(--bg-card-2);
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.filter-chip:hover {
    border-color: var(--border-active);
    color: var(--text-primary);
}

.filter-chip--active {
    background: rgba(0, 200, 150, 0.12);
    border-color: var(--primary);
    color: var(--primary);
}

.list-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    flex: 1;
    padding-right: 2px;
}

/* Skeletons */
.skeleton-card {
    display: flex;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    animation: fadeIn 0.3s ease;
}

.skel {
    background: linear-gradient(90deg, var(--bg-card-2) 25%, var(--bg-surface) 50%, var(--bg-card-2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
}

.skel-strip {
    width: 4px;
    flex-shrink: 0;
    border-radius: 0;
}

.skel-body {
    flex: 1;
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.skel-title {
    height: 16px;
    width: 70%;
}

.skel-sub {
    height: 12px;
    width: 50%;
}

.skel-chips {
    display: flex;
    gap: 6px;
}

.skel-chip {
    height: 20px;
    width: 60px;
    border-radius: 20px;
}

.skel-chip--sm {
    width: 40px;
}

/* Empty */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 16px;
    text-align: center;
}

.empty-icon {
    font-size: 36px;
}

.empty-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
}

.empty-sub {
    font-size: 13px;
    color: var(--text-muted);
}
</style>
