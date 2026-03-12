import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, CheckInRecord } from '@/types/profile'

const CHECKIN_KEY = 'ev_checkins'

function loadCheckIns(): CheckInRecord[] {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY)
    return raw ? JSON.parse(raw) : generateMockCheckIns()
  } catch {
    return generateMockCheckIns()
  }
}

function generateMockCheckIns(): CheckInRecord[] {
  return [
    {
      id: 'ci_001',
      stationId: 1,
      stationName: 'SPKLU PLN Sudirman',
      address: 'Jl. Sudirman No. 1, Jakarta Pusat',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 45,
      energyUsed: 12.5,
      cost: 25000,
    },
    {
      id: 'ci_002',
      stationId: 2,
      stationName: 'EVolt Kemang Station',
      address: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      energyUsed: 18.0,
      cost: 36000,
    },
    {
      id: 'ci_003',
      stationId: 3,
      stationName: 'Starvo SCBD',
      address: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 30,
      energyUsed: 8.4,
      cost: 16800,
    },
    {
      id: 'ci_004',
      stationId: 1,
      stationName: 'SPKLU PLN Sudirman',
      address: 'Jl. Sudirman No. 1, Jakarta Pusat',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 55,
      energyUsed: 15.2,
      cost: 30400,
    },
    {
      id: 'ci_005',
      stationId: 4,
      stationName: 'BPPT Charging Hub',
      address: 'Jl. M.H. Thamrin No. 8, Jakarta Pusat',
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      duration: 40,
      energyUsed: 11.0,
      cost: 22000,
    },
  ]
}

export const useProfileStore = defineStore('profile', () => {
  const checkIns = ref<CheckInRecord[]>(loadCheckIns())

  const profile = ref<UserProfile>({
    id: 'user_001',
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    avatar: '',
    vehicle: 'Hyundai Ioniq 5',
    memberSince: '2024-01-15',
    totalSessions: checkIns.value.length,
    totalEnergy: 0,
    totalCost: 0,
    favoriteStations: [1, 2],
  })

  const totalEnergy = computed(() => checkIns.value.reduce((sum, c) => sum + c.energyUsed, 0))
  const totalCost = computed(() => checkIns.value.reduce((sum, c) => sum + c.cost, 0))
  const totalDuration = computed(() => checkIns.value.reduce((sum, c) => sum + c.duration, 0))
  const avgSessionEnergy = computed(() =>
    checkIns.value.length ? totalEnergy.value / checkIns.value.length : 0,
  )

  return {
    profile,
    checkIns,
    totalEnergy,
    totalCost,
    totalDuration,
    avgSessionEnergy,
  }
})
