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
  bounds: MapBounds
}

export async function fetchStationsByBounds(
  params: FetchStationsParams,
): Promise<ChargingStation[]> {
  const { north, west, south, east } = params.bounds
  const query: Record<string, string | number> = {
    countrycode: 'id',
    boundingbox: `(${north},${west}),(${south},${east})`,
    maxresults: 50,
    compact: 'false',
    verbose: 'false',
  }

  const response = await client.get<ChargingStation[]>('/poi', { params: query })
  return response.data
}
