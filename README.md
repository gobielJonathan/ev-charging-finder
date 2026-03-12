# ChargeNow — EV Charging Finder

A mobile-first web app for finding Electric Vehicle (EV) charging stations in Indonesia. Built with Vue 3, TypeScript, Vite, Pinia, and Leaflet.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
  - [Routing](#routing)
  - [State Management (Pinia Stores)](#state-management-pinia-stores)
  - [API Layer](#api-layer)
  - [Type System](#type-system)
- [Pages](#pages)
- [Components](#components)
- [Key Features & Implementation Details](#key-features--implementation-details)
  - [Map & Station Markers](#map--station-markers)
  - [Location Permission Flow](#location-permission-flow)
  - [Request Cancellation](#request-cancellation)
  - [Station Filtering](#station-filtering)
  - [Station Detail Panel](#station-detail-panel)
  - [Connector Speed Tiers](#connector-speed-tiers)
  - [PWA Support (Prepared)](#pwa-support-prepared)
- [Data Models](#data-models)
- [Scripts](#scripts)

---

## Overview

**ChargeNow** lets users discover EV charging stations near their current location on an interactive map. Tapping a marker or list card opens a detail panel with connector types, power levels, address, operator info, and a link to Google Maps directions.

The app is scoped to **Indonesia** (country code `id`) and defaults to **Jakarta** (`-6.2244, 106.8224`) when geolocation is unavailable or denied.

---

## Tech Stack

| Layer            | Library / Tool                                   |
| ---------------- | ------------------------------------------------ |
| Framework        | Vue 3 (Composition API, `<script setup>`)        |
| Language         | TypeScript 5.9                                   |
| Build tool       | Vite 7                                           |
| State management | Pinia 3                                          |
| Routing          | Vue Router 5                                     |
| Map              | Leaflet 1.9 + OpenStreetMap tiles                |
| HTTP client      | Axios 1.13                                       |
| Date utilities   | Day.js 1.11                                      |
| Package manager  | pnpm                                             |
| Node requirement | `^20.19.0 \|\| >=22.12.0`                        |
| PWA              | vite-plugin-pwa (configured, currently disabled) |

---

## Project Structure

```
src/
├── main.ts                  # App entry point — mounts Vue, Pinia, Router
├── App.vue                  # Root shell: AppHeader + RouterView with page transitions
├── assets/
│   ├── main.css             # Global styles, CSS variables, design tokens
│   └── references.json      # Static reference data
├── components/
│   ├── common/
│   │   └── StarRating.vue   # Reusable star rating widget
│   ├── layout/
│   │   ├── AppHeader.vue    # Fixed top header with brand + dynamic page title
│   │   └── BottomNav.vue    # Bottom navigation (currently commented out)
│   ├── map/
│   │   ├── EVMap.vue        # Leaflet map with custom EV markers
│   │   └── LocationPermissionModal.vue  # First-visit location consent modal
│   └── station/
│       ├── StationCard.vue  # List card for a single charging station
│       ├── StationDetail.vue # Slide-up detail panel (swipe-to-close)
│       └── StationList.vue  # Filtered, scrollable list of StationCards
├── pages/
│   ├── HomePage.vue         # Main view: map + list + detail panel
│   ├── FeedbackPage.vue     # Feedback page (Coming Soon placeholder)
│   └── ProfilePage.vue      # Profile page (Coming Soon placeholder)
├── router/
│   └── index.ts             # Vue Router configuration
├── services/
│   └── api.ts               # Axios client + OpenChargeMap API calls
├── stores/
│   ├── stationStore.ts      # Stations, user location, selection state
│   ├── feedbackStore.ts     # User feedback (persisted to localStorage)
│   └── profileStore.ts      # User profile + check-in history (localStorage)
└── types/
    ├── station.ts           # Full OpenChargeMap API response types
    ├── feedback.ts          # Feedback and FeedbackForm interfaces
    └── profile.ts           # UserProfile and CheckInRecord interfaces
```

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Type-check + production build
pnpm build

# Preview production build
pnpm preview

# Format source files
pnpm format
```

---

## Architecture

### Routing

Three top-level routes are defined in `src/router/index.ts` using `createWebHistory`:

| Path        | Name       | Component          |
| ----------- | ---------- | ------------------ |
| `/`         | `home`     | `HomePage.vue`     |
| `/feedback` | `feedback` | `FeedbackPage.vue` |
| `/profile`  | `profile`  | `ProfilePage.vue`  |

Page transitions are handled in `App.vue` using Vue's `<Transition>` component with a subtle `opacity + translateY` animation.

### State Management (Pinia Stores)

#### `stationStore` (`src/stores/stationStore.ts`)

The central store for the map experience.

| State               | Type                      | Description                                      |
| ------------------- | ------------------------- | ------------------------------------------------ |
| `stations`          | `ChargingStation[]`       | All stations returned by the last fetch          |
| `selectedStation`   | `ChargingStation \| null` | Currently selected station                       |
| `isLoading`         | `boolean`                 | Whether a fetch is in progress                   |
| `error`             | `string \| null`          | Last fetch error message                         |
| `userLat / userLng` | `number`                  | User's current coordinates (defaults to Jakarta) |
| `hasUserLocation`   | `boolean`                 | Whether real GPS has been obtained               |
| `isDetailOpen`      | `boolean`                 | Controls the detail panel visibility             |
| `lastFetchedBounds` | `MapBounds \| null`       | The last bounding box used for fetching          |

**Key actions:**

- `loadStations(bounds)` — Fetches stations for the given map bounds. Automatically cancels the previous in-flight request via `AbortController`.
- `setUserLocation(lat, lng)` — Stores GPS coordinates and sets `hasUserLocation = true`.
- `selectStation(station)` — Opens the detail panel for a station.
- `closeDetail()` — Closes the detail panel with a 300 ms delay before clearing the station (allows exit animation to complete).

**Computed:**

- `operationalStations` — Filters out stations where `StatusType.IsOperational === false`.

#### `feedbackStore` (`src/stores/feedbackStore.ts`)

Manages user-submitted feedback, persisted to `localStorage` under the key `ev_feedbacks`.

| State           | Description                                         |
| --------------- | --------------------------------------------------- |
| `feedbacks`     | All submitted `Feedback` records                    |
| `isSubmitting`  | Loading flag during simulated async submit (800 ms) |
| `submitSuccess` | Flag set after successful submission                |

**Actions:**

- `submitFeedback(form)` — Creates a new `Feedback` record with a generated `id` and timestamp, prepends it to the list, and saves to `localStorage`.
- `getFeedbacksByStation(stationId)` — Returns all feedback for a given station.

#### `profileStore` (`src/stores/profileStore.ts`)

Manages the logged-in user's profile and charging session history. Check-in records are persisted under `ev_checkins`. A set of mock Jakarta-based check-ins is generated on first load.

**Computed stats:**

- `totalEnergy` — Sum of all `energyUsed` across check-ins (kWh)
- `totalCost` — Sum of all `cost` across check-ins (IDR)
- `totalDuration` — Sum of all `duration` across check-ins (minutes)
- `avgSessionEnergy` — Average energy per session (kWh)

The mock profile represents a user named **Budi Santoso** driving a **Hyundai Ioniq 5**.

### API Layer

`src/services/api.ts` wraps the **OpenChargeMap API v3** (`https://api.openchargemap.io/v3`).

```typescript
fetchStationsByBounds({ bounds }, signal?)
```

- Sends a `GET /poi` request scoped to `countrycode: 'id'` with a bounding box.
- Returns up to **50** stations per request (`maxresults: 50`).
- Accepts an optional `AbortSignal` for cancellation.

### Type System

#### `station.ts`

Full TypeScript interfaces mirroring the OpenChargeMap API response:

- `ChargingStation` — Top-level station object
- `AddressInfo` — Location, coordinates, contact info
- `Connection` — Individual connector with type, power level, status
- `ConnectionType` — Connector standard (e.g., CCS, CHAdeMO, Type 2)
- `StatusType` — Operational status
- `UsageType` — Access model (pay-at-location, membership, etc.)
- `OperatorInfo` — Network operator details
- `MapBounds` — `{ north, south, east, west }` bounding box

#### `feedback.ts`

- `Feedback` — Stored feedback record with `id`, `stationId`, `rating`, `comment`, `createdAt`
- `FeedbackForm` — Input shape for new submissions

#### `profile.ts`

- `UserProfile` — User identity, vehicle, stats, favourite stations
- `CheckInRecord` — Individual charging session: station, date, `duration`, `energyUsed`, `cost`

---

## Pages

### `HomePage.vue` (main page)

The core user experience. Composes the map, list, and detail panel.

**Layout:**

- Full-screen `EVMap` underneath
- Collapsible `StationList` drawer (slides up from the bottom)
- `StationDetail` slide-up panel on station selection
- `LocationPermissionModal` on first visit
- Locate-me FAB with spinner feedback
- Error toast (auto-dismisses after 6 s)

**Initialization flow (`onMounted`):**

1. Check `localStorage` for `chargenow_location_perm`.
2. If `'granted'` → silently call geolocation, skip modal.
3. If `'denied'` → immediately use Jakarta, skip modal.
4. Otherwise → show the `LocationPermissionModal`.

**Map interaction:**

- `moveend` events are debounced by **600 ms** before triggering `store.loadStations(bounds)`.
- Clicking a marker → `store.selectStation()` + collapse the list.

### `FeedbackPage.vue`

Placeholder "Coming Soon" page. The full feedback form (with `FeedbackForm`, `useFeedbackStore`, and `StarRating`) is prepared in the data layer but the UI is not yet implemented.

### `ProfilePage.vue`

Placeholder "Coming Soon" page. The data layer (`profileStore`, `UserProfile`, `CheckInRecord`) is fully implemented and ready for the UI build-out.

---

## Components

### `AppHeader.vue`

Fixed glassmorphism header. Dynamically shows "ChargeNow" + tagline on the home route and the page title ("Feedback", "Profile") on other routes. Provides an `actions` slot for additional controls.

### `EVMap.vue`

Wraps a **Leaflet** map instance.

- Tile layer: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Manages a `LayerGroup` for station markers and a separate user-location marker.
- **Exposes** `flyToUser()` so the parent (`HomePage`) can programmatically pan the map.
- Watches `store.stations` to re-render all markers on data changes.
- Watches `store.selectedStation` to `flyTo` the station at zoom 15.

### `LocationPermissionModal.vue`

Accepts a `state` prop (`'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'`). Visible only when state is `'idle'` or `'requesting'`. Features:

- Animated location icon with pulse ring
- Bullet-point feature list
- "Allow Location" button (shows spinner while `'requesting'`)
- "Use Jakarta instead" fallback button

A separate banner slides in when `state === 'denied'`.

### `StationList.vue`

Scrollable list with:

- Three **filter chips**: All / Online / Fast (≥50 kW)
- **Loading skeletons** (4 cards) while fetching
- **Empty state** when no stations match
- Animated card entrance with staggered `animationDelay` (35 ms per item)
- Auto-scrolls to the selected station card when `selectedStation` changes

### `StationCard.vue`

Single-station card with:

- Colored left-edge status strip (green = online, gray = offline)
- Station name, abbreviated address
- Distance badge (shows `m` or `km`)
- Online/Offline status badge
- Power chip (kW) with speed label color-coded by tier
- Connector count chip
- "Directions" link (opens Google Maps — stops click propagation to avoid triggering the card)

### `StationDetail.vue`

Full slide-up bottom panel with:

- **Swipe-to-close gesture** — tracks `touchstart` / `touchmove` / `touchend`; closes when drag distance exceeds 100 px
- Station name, operational status pill, max kW pill
- Full address and operator info
- Connector list (deduplicated by `ConnectionType.Title`) with power-level color coding
- "Get Directions" button → Google Maps deep link
- "Leave Feedback" button → navigates to `/feedback` with `?id=&name=` query params

### `StarRating.vue`

Generic reusable star rating component.

---

## Key Features & Implementation Details

### Map & Station Markers

Custom **DivIcon** markers are rendered with inline SVG / CSS to guarantee cross-browser rendering without external assets. Each marker is a pin shape (circle + rotated square + drop shadow) coloured by charging speed:

| Speed   | Condition       | Color                  |
| ------- | --------------- | ---------------------- |
| Fast    | ≥ 50 kW         | `#00c896` (teal-green) |
| Medium  | ≥ 22 kW         | `#f5a623` (orange)     |
| Slow    | < 22 kW         | `#1e90ff` (blue)       |
| Offline | Not operational | `#6b7280` (gray)       |

The selected marker is 44 px (vs. 36 px default) and has a CSS `ripple` pulsing ring animation.

### Location Permission Flow

Permission state is a discriminated union: `'idle' | 'requesting' | 'granted' | 'denied'`.

The user's choice is persisted to `localStorage` under `chargenow_location_perm`:

- `'granted'` → silently re-locate on every app load without showing the modal.
- `'denied'` → use Jakarta silently; never show the modal again.
- No entry → show the consent modal.

Geolocation failures during the silent flow fall back to Jakarta **without** overwriting a previously granted permission in `localStorage`.

### Request Cancellation

`stationStore.loadStations()` creates a new `AbortController` on every call and cancels the previous one, ensuring that only the **most recent** fetch's result is applied to state. This prevents stale data from overwriting fresh results when the user pans quickly.

`axios.isCancel` and `DOMException('AbortError')` are both handled silently.

### Station Filtering

`StationList` provides three client-side filters applied to `store.stations`:

| Filter | Predicate                            |
| ------ | ------------------------------------ |
| All    | No filter                            |
| Online | `StatusType.IsOperational !== false` |
| Fast   | `max(Connection.PowerKW) >= 50`      |

### Station Detail Panel

`StationDetail` is a slide-up bottom sheet driven by a CSS `slide-panel` transition. The `show` prop controls visibility. Parent (`HomePage`) calls `store.closeDetail()` which sets `isDetailOpen = false` immediately (triggering exit animation) and clears `selectedStation` after 300 ms.

### Connector Speed Tiers

Used in both `StationCard` and `EVMap` markers:

| Label      | Condition |
| ---------- | --------- |
| Ultra Fast | ≥ 100 kW  |
| Fast       | ≥ 50 kW   |
| Medium     | ≥ 22 kW   |
| Slow       | < 22 kW   |

### PWA Support (Prepared)

`vite-plugin-pwa` is installed and fully configured in `vite.config.ts` but **currently commented out**. The planned manifest includes:

- App name: `ChargeNow — EV Charging Finder`
- Theme color: `#00c896`
- Background: `#0d0d1a`
- Display: `standalone`, portrait-primary orientation

Workbox runtime caching strategies are also designed:

- **OSM tiles** → `CacheFirst`, 7-day expiry, up to 300 entries
- **OpenChargeMap API** → `NetworkFirst`, 10 s timeout, 5-minute cache

The `useRegisterSW` update banner UI is also scaffolded in `App.vue` (commented out).

---

## Data Models

```typescript
// Core station data (mirrors OpenChargeMap API)
interface ChargingStation {
  ID: number
  AddressInfo: AddressInfo // lat/lng, address, contact
  Connections: Connection[] // connectors with type, power, status
  StatusType: StatusType | null // IsOperational flag
  OperatorInfo: OperatorInfo | null
  UsageType: UsageType | null
  // ...plus data provider, media items, etc.
}

// User feedback (localStorage)
interface Feedback {
  id: string // "fb_<timestamp>"
  stationId: number
  stationName: string
  comment: string
  rating: number // 1–5
  createdAt: string // ISO 8601
  userId: string
}

// Charging session record (localStorage)
interface CheckInRecord {
  id: string
  stationId: number
  stationName: string
  address: string
  date: string // ISO 8601
  duration: number // minutes
  energyUsed: number // kWh
  cost: number // IDR
}
```

---

## Scripts

| Script       | Command                         | Description                            |
| ------------ | ------------------------------- | -------------------------------------- |
| `dev`        | `vite`                          | Start development server with HMR      |
| `build`      | `vue-tsc --build && vite build` | Type-check + production build          |
| `build-only` | `vite build`                    | Production build without type checking |
| `type-check` | `vue-tsc --build`               | TypeScript type checking only          |
| `preview`    | `vite preview`                  | Preview the production build locally   |
| `format`     | `prettier --write src/`         | Format source files with Prettier      |
