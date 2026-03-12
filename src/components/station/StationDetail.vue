<script setup lang="ts">
import type { ChargingStation } from '@/types/station'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
    station: ChargingStation
    show: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void
}>()

const router = useRouter()

// ─── Swipe-to-close gesture ──────────────────────────────────────────────────
const panelRef = ref<HTMLElement | null>(null)
const dragOffset = ref(0)
const isDragging = ref(false)
let startY = 0
let startX = 0
let dragging = false

function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return

    startY = touch.clientY
    startX = touch.clientX
    dragging = false
    dragOffset.value = 0
}

function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0]
    if (!touch) return

    const dy = touch.clientY - startY
    const dx = Math.abs(touch.clientX - startX)

    // Only start dragging if vertical movement > horizontal
    if (!dragging && dy > 8 && dy > dx) {
        dragging = true
        isDragging.value = true
    }

    if (dragging && dy > 0) {
        dragOffset.value = dy
        e.preventDefault()
    }
}

function onTouchEnd() {
    if (dragging && dragOffset.value > 100) {
        // Swipe threshold reached — close
        emit('close')
    }
    dragOffset.value = 0
    dragging = false
    isDragging.value = false
}

const isOperational = computed(() => props.station.StatusType?.IsOperational !== false)

const maxKw = computed(() =>
    Math.max(...(props.station.Connections?.map((c) => c.PowerKW ?? 0) ?? [0])),
)

const uniqueConnectors = computed(() => {
    const seen = new Set<string>()
    return (props.station.Connections ?? []).filter((c) => {
        const key = c.ConnectionType?.Title ?? 'Unknown'
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
})

const address = computed(() => {
    const a = props.station.AddressInfo
    return [a.AddressLine1, a.AddressLine2, a.Town, a.StateOrProvince, a.Postcode]
        .filter(Boolean)
        .join(', ')
})

const connectorColor = (kw: number | null) => {
    if (!kw) return 'var(--text-muted)'
    if (kw >= 50) return 'var(--primary)'
    if (kw >= 22) return 'var(--accent)'
    return 'var(--info)'
}

function goToFeedback() {
    router.push({ name: 'feedback', query: { id: props.station.ID, name: props.station.AddressInfo.Title } })
    emit('close')
}

function openDirections() {
    const { Latitude, Longitude } = props.station.AddressInfo
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${Latitude},${Longitude}`, '_blank')
}
</script>

<template>
    <!-- Backdrop -->
    <Transition name="backdrop">
        <div v-if="show" class="detail-backdrop" @click="emit('close')" />
    </Transition>

    <Transition name="slide-panel">
        <div v-if="show" ref="panelRef" class="station-detail" :class="{ 'station-detail--dragging': isDragging }"
            :style="dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined"
            @touchstart.passive="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
            <!-- Handle / close bar -->
            <div class="detail-handle">
                <div class="handle-bar" />
                <!-- <button class="close-btn" @click="emit('close')" aria-label="Close detail">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button> -->
            </div>

            <div class="detail-scroll">
                <!-- Header -->
                <div class="detail-header detail-anim" style="--anim-order: 0">
                    <div class="station-icon-wrap" :class="isOperational ? 'icon-wrap--ok' : 'icon-wrap--off'">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <div class="detail-title-block">
                        <div class="detail-badges">
                            <span class="status-pill" :class="isOperational ? 'pill--ok' : 'pill--off'">
                                <span class="status-dot" />
                                {{ station.StatusType?.Title ?? (isOperational ? 'Operational' : 'Non-Operational') }}
                            </span>
                            <span v-if="maxKw > 0" class="kw-pill">⚡ {{ maxKw }} kW</span>
                        </div>
                        <h2 class="detail-name">{{ station.AddressInfo.Title }}</h2>
                    </div>
                </div>

                <!-- Address & Operator -->
                <div class="detail-section detail-anim" style="--anim-order: 1">
                    <div class="info-row">
                        <div class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                        <div>
                            <p class="info-label">Address</p>
                            <p class="info-value">{{ address || 'Not available' }}</p>
                        </div>
                    </div>

                    <div v-if="station.OperatorInfo?.Title" class="info-row">
                        <div class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <div>
                            <p class="info-label">Operator</p>
                            <p class="info-value">{{ station.OperatorInfo.Title }}</p>
                        </div>
                    </div>

                    <div v-if="station.UsageType" class="info-row">
                        <div class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div>
                            <p class="info-label">Usage Type</p>
                            <p class="info-value">{{ station.UsageType.Title }}</p>
                        </div>
                    </div>

                    <div v-if="station.UsageCost" class="info-row">
                        <div class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <div>
                            <p class="info-label">Usage Cost</p>
                            <p class="info-value usage-cost">{{ station.UsageCost }}</p>
                        </div>
                    </div>
                </div>

                <!-- Connectors -->
                <div v-if="uniqueConnectors.length" class="detail-section detail-anim" style="--anim-order: 2">
                    <h4 class="section-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M5 12h14M5 12l4-4m-4 4 4 4" />
                        </svg>
                        Connectors ({{ station.Connections?.length }})
                    </h4>
                    <div class="connectors-grid">
                        <div v-for="(conn, i) in uniqueConnectors" :key="i" class="connector-chip"
                            :style="{ '--chip-color': connectorColor(conn.PowerKW) }">
                            <span class="connector-type">{{ conn.ConnectionType?.Title ?? 'Unknown' }}</span>
                            <span v-if="conn.PowerKW" class="connector-kw">{{ conn.PowerKW }} kW</span>
                            <span v-if="conn.CurrentType" class="connector-current">{{ conn.CurrentType.Title }}</span>
                        </div>
                    </div>
                </div>

                <!-- General comments -->
                <div v-if="station.GeneralComments" class="detail-section detail-anim" style="--anim-order: 3">
                    <h4 class="section-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Notes
                    </h4>
                    <p class="notes-text">{{ station.GeneralComments }}</p>
                </div>

                <!-- Actions -->
                <div class="detail-actions detail-anim" style="--anim-order: 4">
                    <button class="action-btn action-btn--secondary" @click="openDirections">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        Directions
                    </button>
                    <button class="action-btn action-btn--primary" @click="goToFeedback">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Leave Feedback
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/* ─── Backdrop ─── */
.detail-backdrop {
    position: absolute;
    inset: 0;
    z-index: 49;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
}

.backdrop-enter-active,
.backdrop-leave-active {
    transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
    opacity: 0;
}

/* ─── Panel ─── */
.station-detail {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    max-height: 50vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    will-change: transform;
}

.station-detail--dragging {
    /* Disable scroll while dragging */
    overflow: hidden;
}

/* Desktop: side panel */
@media (min-width: 768px) {
    .station-detail {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: auto;
        width: 380px;
        border-radius: var(--radius-xl) 0 0 var(--radius-xl);
        border-top: none;
        border-right: 1px solid var(--border);
        max-height: 100%;
    }
}

.detail-handle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px 0;
    flex-shrink: 0;
}

.handle-bar {
    width: 40px;
    height: 4px;
    background: var(--bg-surface);
    border-radius: 2px;
    margin: 0 auto;
}

@media (min-width: 768px) {
    .handle-bar {
        display: none;
    }
}

/* .close-btn {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-left: auto;
}

.close-btn:hover {
    background: var(--bg-card-2);
    color: var(--text-primary);
} */

.detail-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.detail-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.station-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon-wrap--ok {
    background: rgba(0, 200, 150, 0.15);
    color: var(--primary);
}

.icon-wrap--off {
    background: rgba(139, 146, 184, 0.1);
    color: var(--text-muted);
}

.detail-title-block {
    flex: 1;
    min-width: 0;
}

.detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
}

.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: var(--radius-full);
}

.pill--ok {
    background: rgba(46, 213, 115, 0.12);
    color: var(--success);
}

.pill--off {
    background: rgba(139, 146, 184, 0.1);
    color: var(--text-muted);
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}

.kw-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: var(--radius-full);
    background: rgba(0, 200, 150, 0.1);
    color: var(--primary);
}

.detail-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.3;
}

.detail-section {
    background: var(--bg-card-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.info-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.info-icon {
    width: 30px;
    height: 30px;
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
    margin-top: 1px;
}

.info-label {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 2px;
    font-weight: 500;
    letter-spacing: 0.3px;
}

.info-value {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.4;
}

.usage-cost {
    color: var(--accent);
    font-weight: 600;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.connectors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
}

.connector-chip {
    background: var(--bg-surface);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-left: 3px solid var(--chip-color);
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.connector-type {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
}

.connector-kw {
    font-size: 13px;
    font-weight: 700;
    color: var(--chip-color);
}

.connector-current {
    font-size: 10px;
    color: var(--text-muted);
}

.notes-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
}

.detail-actions {
    display: flex;
    gap: 10px;
}

.action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all var(--transition-fast);
}

.action-btn:active {
    transform: scale(0.97);
}

.action-btn--primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: #fff;
    box-shadow: var(--shadow-glow);
}

.action-btn--primary:hover {
    filter: brightness(1.1);
}

.action-btn--secondary {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border);
}

.action-btn--secondary:hover {
    background: var(--bg-card-2);
    border-color: var(--border-active);
}

/* ─── Staggered content animation ─── */
.detail-anim {
    animation: detailFadeUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(0.08s + var(--anim-order, 0) * 0.06s);
}

@keyframes detailFadeUp {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ─── Panel slide transition ─── */
.slide-panel-enter-active {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
}

.slide-panel-leave-active {
    transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease;
}

.slide-panel-enter-from {
    transform: translateY(100%);
    opacity: 0;
}

.slide-panel-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

@media (min-width: 768px) {
    .slide-panel-enter-from {
        transform: translateX(-100%);
    }

    .slide-panel-leave-to {
        transform: translateX(-100%);
    }
}
</style>
