import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchNearbyStations } from '@/services/api'
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

  const operationalStations = computed(() =>
    stations.value.filter((s) => s.StatusType?.IsOperational !== false),
  )

  async function loadStation(lat: number, lng: number, bounds?: MapBounds) {
    isLoading.value = true
    error.value = null
    try {
      const incoming = await fetchNearbyStations({ latitude: lat, longitude: lng, bounds })
      // Merge: keep existing stations + add new ones, deduplicate by ID
      const existingById = new Map(stations.value.map((s) => [s.ID, s]))
      for (const s of incoming) {
        existingById.set(s.ID, s) // overwrite with fresher data if same ID
      }
      stations.value = Array.from(existingById.values())
    } catch (e) {
      error.value = 'Failed to load charging stations. Please try again.'
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  function clearStations() {
    stations.value = []
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
    operationalStations,
    loadStation,
    clearStations,
    setUserLocation,
    selectStation,
    closeDetail,
  }
})
