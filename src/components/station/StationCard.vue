<script setup lang="ts">
import type { ChargingStation } from '@/types/station'
import { computed } from 'vue'

const props = defineProps<{
    station: ChargingStation
    compact?: boolean
    selected?: boolean
}>()

const emit = defineEmits<{
    (e: 'click', station: ChargingStation): void
}>()

const maxKw = computed(() =>
    Math.max(...(props.station.Connections?.map((c) => c.PowerKW ?? 0) ?? [0])),
)

const isOperational = computed(() => props.station.StatusType?.IsOperational !== false)

const speedLabel = computed(() => {
    if (maxKw.value >= 100) return 'Ultra Fast'
    if (maxKw.value >= 50) return 'Fast'
    if (maxKw.value >= 22) return 'Medium'
    return 'Slow'
})

const speedClass = computed(() => {
    if (maxKw.value >= 50) return 'fast'
    if (maxKw.value >= 22) return 'medium'
    return 'slow'
})

const connectorCount = computed(() => props.station.Connections?.length ?? 0)
const address = computed(() => {
    const a = props.station.AddressInfo
    return [a.AddressLine1, a.Town, a.StateOrProvince].filter(Boolean).join(', ')
})

const distance = computed(() => {
    const d = props.station.AddressInfo.Distance
    if (d == null) return null
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`
})

const directionsUrl = computed(() => {
    const { Latitude, Longitude } = props.station.AddressInfo
    return `https://www.google.com/maps/dir/?api=1&destination=${Latitude},${Longitude}`
})
</script>

<template>
    <!-- Using div+role instead of <button> so we can nest an <a> for directions -->
    <div class="station-card" :class="{ 'station-card--compact': compact, 'station-card--selected': selected }"
        role="button" tabindex="0" @click="emit('click', station)" @keydown.enter.prevent="emit('click', station)"
        @keydown.space.prevent="emit('click', station)">
        <!-- Status indicator strip -->
        <div class="status-strip" :class="isOperational ? 'status-strip--ok' : 'status-strip--off'" />

        <div class="card-body">
            <!-- Top row -->
            <div class="card-top">
                <div class="station-info">
                    <h3 class="station-name">{{ station.AddressInfo.Title }}</h3>
                    <p class="station-address">{{ address }}</p>
                </div>
                <div class="card-meta">
                    <span v-if="distance" class="distance-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                        {{ distance }}
                    </span>
                    <span class="status-badge" :class="isOperational ? 'status-badge--ok' : 'status-badge--off'">
                        {{ isOperational ? 'Online' : 'Offline' }}
                    </span>
                </div>
            </div>

            <!-- Stats row -->
            <div class="card-stats">
                <div class="stat-chip" :class="`stat-chip--${speedClass}`">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span>{{ maxKw > 0 ? `${maxKw} kW` : 'N/A' }}</span>
                    <span class="speed-label">{{ speedLabel }}</span>
                </div>

                <div class="stat-chip stat-chip--neutral">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M5 12h14M5 12l4-4m-4 4 4 4" />
                    </svg>
                    <span>{{ connectorCount }} port{{ connectorCount !== 1 ? 's' : '' }}</span>
                </div>

                <div v-if="station.UsageType" class="stat-chip stat-chip--neutral">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                    </svg>
                    <span class="truncate">{{ station.UsageType.Title }}</span>
                </div>
            </div>

            <!-- Cost -->
            <div v-if="station.UsageCost && !compact" class="cost-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span>{{ station.UsageCost }}</span>
            </div>
        </div>

        <!-- Right side: directions + chevron -->
        <div class="card-right">
            <!-- Directions link — stops propagation so it doesn't open detail panel -->
            <a class="directions-btn" :href="directionsUrl" target="_blank" rel="noopener noreferrer"
                title="Open in Google Maps" @click.stop>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
            </a>
        </div>
    </div>
</template>

<style scoped>
.station-card {
    position: relative;
    display: flex;
    align-items: stretch;
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    text-align: left;
    overflow: hidden;
    opacity: 1;
    /* Reset browser button defaults */
    appearance: none;
    -webkit-appearance: none;
    transition: background var(--transition-fast), border-color var(--transition-fast),
        transform var(--transition-fast), box-shadow var(--transition-fast);
}

.station-card:hover {
    background: var(--bg-card-2);
    border-color: var(--border-active);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.station-card:active {
    transform: scale(0.97);
    transition-duration: 0.08s;
}

.station-card--selected {
    border-color: var(--primary);
    background: rgba(0, 200, 150, 0.06);
    box-shadow: 0 0 0 1px var(--primary), var(--shadow-glow);
}

.status-strip {
    width: 4px;
    flex-shrink: 0;
    border-radius: 4px 0 0 4px;
}

.status-strip--ok {
    background: var(--success);
}

.status-strip--off {
    background: var(--text-muted);
}

.card-body {
    flex: 1;
    padding: 14px 12px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.card-top {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    align-items: flex-start;
}

.station-info {
    flex: 1;
    min-width: 0;
}

.station-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 2px;
}

.station-address {
    font-size: 11px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.card-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
}

.distance-badge {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
}

.status-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: var(--radius-full);
    letter-spacing: 0.3px;
}

.status-badge--ok {
    background: rgba(46, 213, 115, 0.15);
    color: var(--success);
}

.status-badge--off {
    background: rgba(139, 146, 184, 0.15);
    color: var(--text-muted);
}

.card-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}

.stat-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    line-height: 1;
}

.stat-chip--fast {
    background: rgba(0, 200, 150, 0.12);
    color: var(--primary);
}

.stat-chip--medium {
    background: rgba(245, 166, 35, 0.12);
    color: var(--accent);
}

.stat-chip--slow {
    background: rgba(30, 144, 255, 0.12);
    color: var(--info);
}

.stat-chip--neutral {
    background: var(--bg-surface);
    color: var(--text-secondary);
}

.speed-label {
    opacity: 0.7;
    font-size: 10px;
}

.cost-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-secondary);
}

.card-right {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 0 10px;
    flex-shrink: 0;
    border-left: 1px solid var(--border);
}

.directions-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    background: rgba(0, 200, 150, 0.1);
    color: var(--primary);
    text-decoration: none;
    transition: background var(--transition-fast), transform var(--transition-fast);
    flex-shrink: 0;
}

.directions-btn:hover {
    background: rgba(0, 200, 150, 0.2);
    transform: scale(1.1);
}

.directions-btn:active {
    transform: scale(0.95);
}
</style>
