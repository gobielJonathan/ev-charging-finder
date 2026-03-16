import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { fetchStationsByBounds, submitStation } from '@/services/api'
import type { ChargingStation, MapBounds, NewStationPayload } from '@/types/station'

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

  // Tracks the current in-flight request so we can abort it when a newer one arrives
  let activeAbortController: AbortController | null = null

  const operationalStations = computed(() =>
    stations.value.filter((s) => s.StatusType?.IsOperational !== false),
  )

  async function loadStations(bounds: MapBounds) {
    // Cancel any previous in-flight request so only the latest one completes
    if (activeAbortController) {
      activeAbortController.abort()
    }
    const controller = new AbortController()
    activeAbortController = controller

    isLoading.value = true
    error.value = null
    try {
      const incoming = await fetchStationsByBounds({ bounds }, controller.signal)
      // Only apply the result if this controller is still the active one
      // (i.e. no newer request has replaced it)
      if (activeAbortController === controller) {
        stations.value = incoming
        lastFetchedBounds.value = bounds
      }
    } catch (e) {
      // Ignore aborted requests – they are expected when a newer call supersedes
      if (axios.isCancel(e) || (e instanceof DOMException && e.name === 'AbortError')) {
        return
      }
      error.value = 'Failed to load charging stations. Please try again.'
      console.error(e)
    } finally {
      // Only clear loading state if this is still the active request
      if (activeAbortController === controller) {
        isLoading.value = false
        activeAbortController = null
      }
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

  // ─── Add Station ──────────────────────────────────────────────────────────

  const isSubmitting = ref(false)
  const submitError = ref<string | null>(null)
  const submitSuccess = ref(false)

  async function addStation(payload: NewStationPayload): Promise<boolean> {
    isSubmitting.value = true
    submitError.value = null
    submitSuccess.value = false
    try {
      await submitStation(payload)
      submitSuccess.value = true
      return true
    } catch (e) {
      submitError.value = 'Failed to submit station. Please check your data and try again.'
      console.error(e)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  function resetSubmitState() {
    isSubmitting.value = false
    submitError.value = null
    submitSuccess.value = false
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
    isSubmitting,
    submitError,
    submitSuccess,
    addStation,
    resetSubmitState,
  }
})
