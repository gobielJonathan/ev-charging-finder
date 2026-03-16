/**
 * Unified geolocation service.
 *
 * On native (Android / iOS via Capacitor) it uses @capacitor/geolocation which:
 *   - requests system permissions before the first call
 *   - uses GPS / network provider
 *
 * On web (browser) it falls back to the standard navigator.geolocation API.
 *
 * Both paths return the same `GeoPosition` shape so callers are platform-agnostic.
 */

import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export interface GeoPosition {
  latitude: number
  longitude: number
  accuracy: number
}

export interface GeoOptions {
  /** Max milliseconds to wait for a fix. Default 10000. */
  timeout?: number
  /** Max age (ms) of a cached position to accept. Default 60000. */
  maximumAge?: number
  /** Request high-accuracy (GPS) fix. Default true. */
  enableHighAccuracy?: boolean
}

const DEFAULT_OPTIONS: Required<GeoOptions> = {
  timeout: 10000,
  maximumAge: 60000,
  enableHighAccuracy: true,
}

/** Returns true when running inside a Capacitor native shell (Android / iOS). */
function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Request the necessary location permission on native platforms.
 * On web this is a no-op (browser handles permission via getCurrentPosition).
 * Returns true if permission is granted/already-granted, false if denied.
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isNative()) return true // web handles this inline

  try {
    const status = await Geolocation.requestPermissions({ permissions: ['location'] })
    return status.location === 'granted'
  } catch {
    return false
  }
}

/**
 * Check current permission state without triggering a prompt.
 * Returns 'granted' | 'denied' | 'prompt' on native.
 * Always returns 'prompt' on web (we can't check without asking).
 */
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!isNative()) return 'prompt'

  try {
    const status = await Geolocation.checkPermissions()
    if (status.location === 'granted') return 'granted'
    if (status.location === 'denied') return 'denied'
    return 'prompt'
  } catch {
    return 'prompt'
  }
}

/**
 * Get the device's current position.
 * Throws if permission is denied or location cannot be determined.
 */
export async function getCurrentPosition(opts: GeoOptions = {}): Promise<GeoPosition> {
  const options = { ...DEFAULT_OPTIONS, ...opts }

  if (isNative()) {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options.enableHighAccuracy,
      timeout: options.timeout,
      maximumAge: options.maximumAge,
    })
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    }
  }

  // ── Web API fallback ──────────────────────────────────────────────────────
  return new Promise<GeoPosition>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      reject,
      {
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge,
      },
    )
  })
}
