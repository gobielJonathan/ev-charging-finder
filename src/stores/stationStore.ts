import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchStationsByBounds } from '@/services/api'
import type { ChargingStation, MapBounds } from '@/types/station'

export const useStationStore = defineStore('station', () => {
  const stations = ref<ChargingStation[]>([])
  const selectedStation = ref<ChargingStation | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const userLat = ref(-6.2244)
  const userLng = ref(106.8224)
  const hasUserLocation = ref(false)
  const isDetailOpen = ref(false)
  const lastFetchedBounds = ref<MapBounds | null>(null)

  const operationalStations = computed(() =>
    stations.value.filter((s) => s.StatusType?.IsOperational !== false),
  )

  async function loadStations(bounds: MapBounds) {
    isLoading.value = true
    error.value = null
    try {
      const incoming = await fetchStationsByBounds({ bounds })
      stations.value = incoming
      // Record the bounds that were actually fetched so callers can
      // avoid redundant requests when the viewport hasn't moved outside this area.
      lastFetchedBounds.value = bounds
    } catch (e) {
      error.value = 'Failed to load charging stations. Please try again.'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  function clearStations() {
    stations.value = []
    lastFetchedBounds.value = null
  }

  function setUserLocation(lat: number, lng: number) {
    userLat.value = lat
    userLng.value = lng
    hasUserLocation.value = true
  }

  function selectStation(station: ChargingStation | null) {
    selectedStation.value = station
    isDetailOpen.value = station !== null
  }

  function closeDetail() {
    isDetailOpen.value = false
    setTimeout(() => {
      selectedStation.value = null
    }, 300)
  }

  return {
    stations,
    selectedStation,
    isLoading,
    error,
    userLat,
    userLng,
    hasUserLocation,
    isDetailOpen,
    lastFetchedBounds,
    operationalStations,
    loadStations,
    clearStations,
    setUserLocation,
    selectStation,
    closeDetail,
  }
})
