<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import type { ChargingStation } from '@/types/station'
import { useStationStore } from '@/stores/stationStore'

const emit = defineEmits<{
    (e: 'stationClick', station: ChargingStation): void
    (e: 'mapMoved', bounds: { north: number; south: number; east: number; west: number }, center: { lat: number; lng: number }): void
    (e: 'locateClick'): void
}>()

const store = useStationStore()
const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let markersLayer: L.LayerGroup | null = null
let userMarker: L.Marker | null = null

// Create custom EV station pin — uses inline styles to guarantee rendering
function createStationIcon(station: ChargingStation, isSelected = false): L.DivIcon {
    const isOp = station.StatusType?.IsOperational !== false
    const maxKw = Math.max(...(station.Connections?.map((c) => c.PowerKW ?? 0).filter((v) => v > 0) ?? [0]))
    const speed = maxKw >= 50 ? 'fast' : maxKw >= 22 ? 'medium' : 'slow'
    const colorMap = { fast: '#00c896', medium: '#f5a623', slow: '#1e90ff' }
    const color = isOp ? colorMap[speed] : '#6b7280'
    const size = isSelected ? 44 : 36
    const pinH = size + 16

    const html = `
        <div style="
            position:relative;
            width:${size}px;
            height:${pinH}px;
            display:flex;
            flex-direction:column;
            align-items:center;
            filter:drop-shadow(0 4px 8px rgba(0,0,0,0.45));
        ">
            ${isSelected ? `<div style="
                position:absolute;
                top:0; left:0;
                width:${size}px;height:${size}px;
                border-radius:50%;
                background:${color};
                opacity:0.25;
                animation:ripple 1.6s ease-out infinite;
            "></div>` : ''}
            <div style="
                width:${size}px;
                height:${size}px;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                background:${color};
                display:flex;
                align-items:center;
                justify-content:center;
                box-shadow:0 2px 8px rgba(0,0,0,0.3);
                border:2px solid rgba(255,255,255,0.25);
                flex-shrink:0;
            ">
                <span style="transform:rotate(45deg);font-size:${isSelected ? 24 : 20}px;line-height:1;">⚡</span>
            </div>
            <div style="
                width:3px;
                height:10px;
                background:${color};
                border-radius:0 0 2px 2px;
            "></div>
            <div style="
                width:8px;
                height:4px;
                background:rgba(0,0,0,0.15);
                border-radius:50%;
            "></div>
        </div>`

    return L.divIcon({
        html,
        className: 'ev-marker-pin',
        iconSize: [size, pinH],
        iconAnchor: [size / 2, pinH],
        popupAnchor: [0, -pinH],
    })
}

function createUserIcon(): L.DivIcon {
    return L.divIcon({
        html: `
      <div class="user-marker-wrapper">
        <div class="user-marker-pulse"></div>
        <div class="user-marker-dot">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>
      </div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    })
}

function renderMarkers(stations: ChargingStation[]) {
    if (!markersLayer) return
    markersLayer.clearLayers()

    stations.forEach((station) => {
        const { Latitude, Longitude } = station.AddressInfo
        if (Latitude == null || Longitude == null) return

        const icon = createStationIcon(station, store.selectedStation?.ID === station.ID)
        const marker = L.marker([Latitude, Longitude], { icon })

        marker.on('click', () => {
            emit('stationClick', station)
            // Update selected marker icon
            markersLayer?.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    const st = stations.find(
                        (s) =>
                            s.AddressInfo.Latitude === layer.getLatLng().lat &&
                            s.AddressInfo.Longitude === layer.getLatLng().lng,
                    )
                    if (st) layer.setIcon(createStationIcon(st, st.ID === station.ID))
                }
            })
        })

        markersLayer!.addLayer(marker)
    })
}

function initMap() {
    if (!mapEl.value) return

    map = L.map(mapEl.value, {
        center: [store.userLat, store.userLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: false,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    markersLayer = L.layerGroup().addTo(map)

    // User location marker
    if (store.hasUserLocation) {
        userMarker = L.marker([store.userLat, store.userLng], { icon: createUserIcon() })
        userMarker.addTo(map)
    }

    map.on('moveend', () => {
        if (!map) return
        const bounds = map.getBounds()
        const center = map.getCenter()
        emit('mapMoved', {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
        }, { lat: center.lat, lng: center.lng })
    })
}

function flyToUser() {
    if (!map || !store.hasUserLocation) return
    map.flyTo([store.userLat, store.userLng], 14, { duration: 1.2 })
}

defineExpose({ flyToUser })

watch(
    () => store.stations,
    (stations) => { renderMarkers(stations) },
    { deep: false },
)

watch(
    () => store.selectedStation,
    (station) => {
        if (!station || !map) return
        const { Latitude, Longitude } = station.AddressInfo
        map.flyTo([Latitude, Longitude], 15, { duration: 0.8 })
    },
)

watch(
    () => [store.userLat, store.userLng, store.hasUserLocation] as const,
    ([lat, lng, has]) => {
        if (!map || !has) return
        if (userMarker) {
            userMarker.setLatLng([lat, lng])
        } else {
            userMarker = L.marker([lat, lng], { icon: createUserIcon() }).addTo(map)
        }
    },
)

onMounted(() => {
    initMap()
})

onUnmounted(() => {
    map?.remove()
    map = null
})
</script>

<template>
    <div ref="mapEl" class="ev-map">
        <!-- Locate-me button — sits below the Leaflet zoom control (bottomright) -->
        <button class="map-locate-btn" title="Focus on my location" @click.stop="emit('locateClick')">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
        </button>
    </div>
</template>

<style>
.ev-map {
    width: 100%;
    height: 100%;
    min-height: 300px;
    position: relative;
}

/* Locate button overlaid at bottom-right, below zoom controls */
.map-locate-btn {
    position: absolute;
    bottom: 116px;
    /* zoom control is ~80px tall; add 10px gap */
    right: 10px;
    z-index: 800;
    /* inside Leaflet's pane stack but above tiles */
    width: 34px;
    height: 34px;
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25);
    transition: background 0.15s ease, color 0.15s ease;
    padding: 0;
}

.map-locate-btn:hover {
    background: #f4f4f4;
    color: #00c896;
}

.ev-marker-pin {
    background: transparent !important;
    border: none !important;
    cursor: pointer;
    transition: filter 0.2s ease;
}

.ev-marker-pin:hover {
    filter: drop-shadow(0 6px 14px rgba(0, 200, 150, 0.6)) !important;
}

.user-marker-wrapper {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-marker-pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(30, 144, 255, 0.3);
    animation: ripple 2s ease-out infinite;
}

.user-marker-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #1e90ff;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    position: relative;
}
</style>
