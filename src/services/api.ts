import axios from 'axios'
import type { ChargingStation, MapBounds, NewStationPayload } from '@/types/station'

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
  signal?: AbortSignal,
): Promise<ChargingStation[]> {
  const { north, west, south, east } = params.bounds
  const query: Record<string, string | number> = {
    countrycode: 'id',
    boundingbox: `(${north},${west}),(${south},${east})`,
    maxresults: 50,
    compact: 'false',
    verbose: 'false',
  }

  const response = await client.get<ChargingStation[]>('/poi', { params: query, signal })
  return response.data
}

export interface SubmitStationResult {
  /** The UUID assigned to the new POI by OpenChargeMap, if returned */
  id?: string | number
}

/**
 * Submit a new EV charging station to OpenChargeMap.
 * Returns the OCM response data (may include the new POI's ID/UUID).
 */
export async function submitStation(payload: NewStationPayload): Promise<SubmitStationResult> {
  const response = await client.post('/poi/', payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  // OCM returns 200 with the created POI or a confirmation object
  return response.data ?? {}
}
