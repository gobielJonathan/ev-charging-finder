export interface CheckInRecord {
  id: string
  stationId: number
  stationName: string
  address: string
  date: string
  duration: number // minutes
  energyUsed: number // kWh
  cost: number // IDR
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  vehicle: string
  memberSince: string
  totalSessions: number
  totalEnergy: number // kWh
  totalCost: number
  favoriteStations: number[]
}
