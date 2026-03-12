<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeMount } from 'vue'
import EVMap from '@/components/map/EVMap.vue'
import StationList from '@/components/station/StationList.vue'
import StationDetail from '@/components/station/StationDetail.vue'
import LocationPermissionModal from '@/components/map/LocationPermissionModal.vue'
import { useStationStore } from '@/stores/stationStore'
import type { ChargingStation } from '@/types/station'

// ─── Store & refs ───────────────────────────────────────────────────────────
const store = useStationStore()
const mapRef = ref<InstanceType<typeof EVMap> | null>(null)
const isListExpanded = ref(false)
const isLocating = ref(false)
let moveDebounce: ReturnType<typeof setTimeout> | null = null

// ─── Location permission state ───────────────────────────────────────────────
// 'idle'       → show modal (initial)
// 'requesting' → browser geolocation is in-flight (show spinner in modal)
// 'granted'    → user allowed location
// 'denied'     → user skipped or browser denied (show banner briefly)
type PermState = 'idle' | 'requesting' | 'granted' | 'denied'
const permState = ref<PermState>('idle')
let deniedBannerTimer: ReturnType<typeof setTimeout> | null = null

const PERM_KEY = 'chargenow_location_perm'

// ─── Permission modal handlers ───────────────────────────────────────────────

// Called when geolocation resolves — shared by both silent restore and modal flow.
function applyUserLocation(latitude: number, longitude: number) {
    store.clearStations()
    store.setUserLocation(latitude, longitude)
    // Stations will be fetched by map's moveend event when it flies to the new location
    nextTick(() => mapRef.value?.flyToUser())
}

// Silent locate: runs geolocation without showing the modal at all.
// Used when the user has already granted permission on a previous visit.
function locateSilently() {
    if (!navigator.geolocation) {
        useFallbackLocation()
        return
    }
    // Keep permState at 'granted' the whole time — modal never appears
    permState.value = 'granted'
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            applyUserLocation(pos.coords.latitude, pos.coords.longitude)
            localStorage.setItem(PERM_KEY, 'granted')
        },
        () => {
            // Geolocation failed — fall back to Jakarta without changing permission
            store.clearStations()
            store.setUserLocation(-6.2244, 106.8224)
            nextTick(() => mapRef.value?.flyToUser())
        },
        { timeout: 10000, maximumAge: 60000 },
    )
}

// Modal flow: shows requesting spinner, called when user taps "Allow" in the modal.
function handleAllowLocation() {
    if (!navigator.geolocation) {
        useFallbackLocation()
        return
    }
    permState.value = 'requesting'
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            applyUserLocation(pos.coords.latitude, pos.coords.longitude)
            permState.value = 'granted'
            localStorage.setItem(PERM_KEY, 'granted')
        },
        () => {
            // Browser denied or timed out
            useFallbackLocation()
            scheduleDeniedBannerHide()
        },
        { timeout: 10000, maximumAge: 30000 },
    )
}

function handleDenyLocation() {
    store.clearStations()
    store.setUserLocation(-6.2244, 106.8224)
    permState.value = 'denied'
    localStorage.setItem(PERM_KEY, 'denied') // explicit user choice — safe to persist
    scheduleDeniedBannerHide()
}

function useFallbackLocation() {
    store.clearStations()
    store.setUserLocation(-6.2244, 106.8224)
    permState.value = 'denied'
    // NOTE: do NOT write to localStorage here — this is called on geolocation
    // failure too, and we must not overwrite a previously granted permission.
}

function scheduleDeniedBannerHide() {
    if (deniedBannerTimer) clearTimeout(deniedBannerTimer)
    deniedBannerTimer = setTimeout(() => {
        // Only hide banner automatically, keep perm state as 'denied'
        // (banner component uses v-if which we control separately)
        permState.value = 'granted' // re-use 'granted' to hide banner; user location is set
    }, 7000)
}

// ─── Map events ──────────────────────────────────────────────────────────────
function onMapMoved(
    bounds: { north: number; south: number; east: number; west: number },
    _center: { lat: number; lng: number },
) {
    if (moveDebounce) clearTimeout(moveDebounce)
    moveDebounce = setTimeout(() => {
        store.loadStations(bounds)
    }, 600)
}

function onStationClick(station: ChargingStation) {
    store.selectStation(station)
    isListExpanded.value = false
}

// ─── Locate button ────────────────────────────────────────────────────────────
// If permission was already granted, re-locate and reload nearby stations fresh
function flyToUser() {
    if (permState.value === 'idle') {
        // Show the modal instead of silently asking
        return
    }
    if (!navigator.geolocation || permState.value === 'denied') {
        // Already denied — just fly to the fallback position (Jakarta)
        mapRef.value?.flyToUser()
        return
    }
    isLocating.value = true
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords
            store.setUserLocation(latitude, longitude)
            store.clearStations()
            mapRef.value?.flyToUser()
            // Stations will be fetched by map's moveend event
            isLocating.value = false
        },
        () => {
            // Use cached user location from store
            store.clearStations()
            mapRef.value?.flyToUser()
            isLocating.value = false
        },
        { timeout: 6000, maximumAge: 30000 },
    )
}

// ─── Error toast ─────────────────────────────────────────────────────────────
const errorToastVisible = ref(false)
let errorDismissTimer: ReturnType<typeof setTimeout> | null = null

watch(
    () => store.error,
    (val) => {
        if (!val) { errorToastVisible.value = false; return }
        errorToastVisible.value = true
        if (errorDismissTimer) clearTimeout(errorDismissTimer)
        errorDismissTimer = setTimeout(() => {
            errorToastVisible.value = false
        }, 6000)
    },
)

// ─── Init ─────────────────────────────────────────────────────────────────────
// Watch mapRef: the moment EVMap finishes mounting, fly to user if we already
// have their location (handles the race where geolocation resolves before mount).
watch(mapRef, (mapInstance) => {
    if (mapInstance && store.hasUserLocation) {
        nextTick(() => mapRef.value?.flyToUser())
    }
}, { once: true })

onMounted(() => {
    const saved = localStorage.getItem(PERM_KEY)
    if (saved === 'granted') {
        // User already allowed location — skip modal entirely, locate silently
        locateSilently()
    } else if (saved === 'denied') {
        // User previously chose Jakarta — load it silently, no modal, no banner
        store.clearStations()
        store.setUserLocation(-6.2244, 106.8224)
        // Stations will be fetched by map's moveend event on init
        permState.value = 'granted' // 'granted' hides both modal and banner
    }
    // Otherwise permState stays 'idle' and the modal is shown
})
</script>

<template>
    <div class="home-page">
        <!-- Location permission modal (shown on first load) -->
        <LocationPermissionModal :state="permState" @allow="handleAllowLocation" @deny="handleDenyLocation" />

        <!-- Error toast -->
        <Transition name="toast-slide">
            <div v-if="errorToastVisible" class="error-toast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" class="toast-icon">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span class="toast-msg">{{ store.error }}</span>
                <button class="toast-close" @click="errorToastVisible = false" aria-label="Dismiss">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </Transition>

        <!-- Main map area -->
        <div class="map-container">
            <EVMap ref="mapRef" @station-click="onStationClick" @map-moved="onMapMoved" @locate-click="flyToUser" />

            <!-- Map controls overlay -->
            <div class="map-controls">
                <!-- Locate me -->
                <button class="map-ctrl-btn map-ctrl-btn--locate" :class="{ 'ctrl-loading': isLocating }"
                    @click="flyToUser" aria-label="Go to my location">
                    <svg v-if="!isLocating" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                    </svg>
                    <svg v-else class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>{{ isLocating ? 'Locating…' : 'My Location' }}</span>
                </button>

                <!-- Station count badge -->
                <div class="count-badge" v-if="!store.isLoading">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    {{ store.stations.length }} stations
                </div>
                <div class="count-badge loading-badge" v-else>
                    <svg class="spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="3">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Loading...
                </div>
            </div>

            <!-- Station detail panel (overlays bottom of map) -->
            <StationDetail v-if="store.selectedStation" :station="store.selectedStation" :show="store.isDetailOpen"
                @close="store.closeDetail()" />
        </div>

        <!-- Bottom drawer: station list -->
        <div class="list-drawer" :class="{ 'list-drawer--expanded': isListExpanded }">
            <!-- Drag handle / header -->
            <button class="drawer-header" @click="isListExpanded = !isListExpanded">
                <div class="drawer-handle" />
                <div class="drawer-title-row">
                    <span class="drawer-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Nearby Stations
                    </span>
                    <svg class="drawer-chevron" :class="{ 'drawer-chevron--up': isListExpanded }" width="16" height="16"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 15l-6-6-6 6" />
                    </svg>
                </div>
            </button>

            <!-- List body -->
            <div class="drawer-body">
                <StationList @station-click="onStationClick" />
            </div>
        </div>

        <!-- Desktop sidebar layout overlay -->
        <div class="desktop-sidebar">
            <div class="desktop-sidebar-inner">
                <div class="sidebar-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Nearby Stations
                </div>
                <StationList @station-click="onStationClick" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.home-page {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    height: calc(100dvh - var(--header-height) - var(--nav-height));
    overflow: hidden;
}

/* ---- Map Container ---- */
.map-container {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

/* ---- Map controls ---- */
.map-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.map-ctrl-btn {
    height: 36px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: all var(--transition-fast);
    padding: 0 14px;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
}

.map-ctrl-btn--locate {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-color: transparent;
    color: #fff;
    box-shadow: var(--shadow-glow);
}

.map-ctrl-btn--locate:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: var(--shadow-glow);
}

.map-ctrl-btn:hover {
    background: var(--bg-card-2);
    border-color: var(--border-active);
    color: var(--primary);
}

.ctrl-loading {
    opacity: 0.85;
}

.count-badge,
.loading-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary);
    box-shadow: var(--shadow-sm);
}

.loading-badge {
    color: var(--text-secondary);
}

.spin {
    animation: spin 0.8s linear infinite;
}

/* ---- Error toast ---- */
.error-toast {
    position: fixed;
    top: calc(var(--header-height) + 12px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 9997;
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(18, 18, 30, 0.96);
    border: 1px solid rgba(255, 71, 87, 0.45);
    border-left: 3px solid #ff4757;
    color: #ff8a96;
    font-size: 13px;
    font-weight: 500;
    padding: 11px 14px;
    border-radius: var(--radius-md);
    max-width: calc(100vw - 32px);
    width: max-content;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 71, 87, 0.1);
    backdrop-filter: blur(12px);
    line-height: 1.4;
}

.toast-icon {
    flex-shrink: 0;
    color: #ff4757;
}

.toast-msg {
    flex: 1;
    color: #ffb3ba;
}

.toast-close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: rgba(255, 135, 150, 0.6);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: color var(--transition-fast);
}

.toast-close:hover {
    color: #ff4757;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
    transition: all 0.28s cubic-bezier(0.34, 1.2, 0.64, 1);
}

.toast-slide-enter-from,
.toast-slide-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
}

/* ---- Bottom Drawer (mobile/tablet) ---- */
.list-drawer {
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    max-height: 38%;
    transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    flex-shrink: 0;
}

.list-drawer--expanded {
    max-height: 60%;
}

.drawer-header {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 16px 4px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    color: var(--text-primary);
}

.drawer-handle {
    width: 36px;
    height: 3px;
    background: var(--bg-surface);
    border-radius: 2px;
}

.drawer-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.drawer-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
}

.drawer-chevron {
    color: var(--text-muted);
    transition: transform var(--transition-base);
}

.drawer-chevron--up {
    transform: rotate(180deg);
}

.drawer-locate-row {
    padding: 0 12px 6px;
    flex-shrink: 0;
}

.drawer-locate-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px;
    background: rgba(0, 200, 150, 0.08);
    border: 1px solid rgba(0, 200, 150, 0.25);
    border-radius: var(--radius-full);
    color: var(--primary);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
}

.drawer-locate-btn:hover:not(:disabled) {
    background: rgba(0, 200, 150, 0.15);
    border-color: var(--primary);
}

.drawer-locate-btn--loading,
.drawer-locate-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.drawer-body {
    flex: 1;
    overflow: hidden;
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
}

/* ---- Desktop Sidebar ---- */
.desktop-sidebar {
    display: none;
}

@media (min-width: 1024px) {
    .home-page {
        flex-direction: row;
        height: calc(100dvh - var(--header-height));
    }

    .map-container {
        flex: 1;
        margin-left: 72px;
        /* side nav width */
    }

    .list-drawer {
        display: none;
    }

    .desktop-sidebar {
        display: flex;
        position: fixed;
        left: 72px;
        top: var(--header-height);
        bottom: 0;
        width: var(--sidebar-width);
        z-index: 10;
        background: var(--bg-card);
        border-right: 1px solid var(--border);
        flex-direction: column;
    }

    .desktop-sidebar-inner {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 16px;
        gap: 12px;
    }

    .sidebar-header {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-secondary);
        letter-spacing: 0.5px;
        text-transform: uppercase;
        padding-bottom: 4px;
    }

    /* Adjust map to accommodate sidebar */
    .map-container {
        margin-left: calc(72px + var(--sidebar-width));
    }
}
</style>
