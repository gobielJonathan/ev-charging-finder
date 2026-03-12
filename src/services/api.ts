import axios from 'axios'
import type { ChargingStation, MapBounds } from '@/types/station'

const BASE_URL = 'https://api.openchargemap.io/v3'
const API_KEY = '3c2aaa2d-e386-4fbd-a81b-eddf25d798f0'

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': API_KEY,
  },
})

export interface FetchStationsParams {
  latitude: number
  longitude: number
  distance?: number
  bounds?: MapBounds
}

export async function fetchNearbyStations(params: FetchStationsParams): Promise<ChargingStation[]> {
  const query: Record<string, string | number> = {
    countrycode: 'id',
    distance: params.distance ?? 10,
    distanceunit: 'km',
    latitude: params.latitude,
    longitude: params.longitude,
    maxresults: 50,
    compact: 'false',
    verbose: 'false',
  }

  if (params.bounds) {
    const { north, west, south, east } = params.bounds
    query.boundingbox = `(${north},${west}),(${south},${east})`
  }

  const response = await client.get<ChargingStation[]>('/poi', { params: query })
  return response.data
}
