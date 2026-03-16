<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStationStore } from '@/stores/stationStore'
import type { NewStationPayload, NewStationConnection } from '@/types/station'
import {
    CONNECTION_TYPES,
    CHARGING_LEVELS,
    USAGE_TYPES,
    STATUS_TYPES,
} from '@/types/station'

const router = useRouter()
const store = useStationStore()

// ─── Form State ──────────────────────────────────────────────────────────────

const form = reactive<{
    title: string
    addressLine1: string
    addressLine2: string
    town: string
    stateOrProvince: string
    postcode: string
    latitude: string
    longitude: string
    contactTelephone: string
    contactEmail: string
    accessComments: string
    relatedURL: string
    operatorID: string
    usageTypeID: string
    statusTypeID: string
    numberOfPoints: string
    generalComments: string
}>({
    title: '',
    addressLine1: '',
    addressLine2: '',
    town: '',
    stateOrProvince: '',
    postcode: '',
    latitude: '',
    longitude: '',
    contactTelephone: '',
    contactEmail: '',
    accessComments: '',
    relatedURL: '',
    operatorID: '',
    usageTypeID: '1',
    statusTypeID: '50',
    numberOfPoints: '',
    generalComments: '',
})

interface ConnectionRow {
    connectionTypeID: string
    levelID: string
    powerKW: string
    quantity: string
    statusTypeID: string
    currentTypeID: string
    amps: string
    voltage: string
    comments: string
}

const connections = ref<ConnectionRow[]>([
    {
        connectionTypeID: '25',
        levelID: '2',
        powerKW: '',
        quantity: '1',
        statusTypeID: '50',
        currentTypeID: '',
        amps: '',
        voltage: '',
        comments: '',
    },
])

function addConnection() {
    connections.value.push({
        connectionTypeID: '25',
        levelID: '2',
        powerKW: '',
        quantity: '1',
        statusTypeID: '50',
        currentTypeID: '',
        amps: '',
        voltage: '',
        comments: '',
    })
}

function removeConnection(index: number) {
    connections.value.splice(index, 1)
}

// ─── Geo-locate helper ───────────────────────────────────────────────────────

const isLocating = ref(false)
function useCurrentLocation() {
    if (!navigator.geolocation) return
    isLocating.value = true
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            form.latitude = pos.coords.latitude.toFixed(6)
            form.longitude = pos.coords.longitude.toFixed(6)
            isLocating.value = false
        },
        () => {
            isLocating.value = false
        },
        { timeout: 10000 },
    )
}

// ─── Validation ──────────────────────────────────────────────────────────────

const validationErrors = ref<string[]>([])

function validate(): boolean {
    const errors: string[] = []
    if (!form.title.trim()) errors.push('Station name is required.')
    if (!form.addressLine1.trim()) errors.push('Address is required.')
    if (!form.town.trim()) errors.push('City / Town is required.')
    const lat = parseFloat(form.latitude)
    const lng = parseFloat(form.longitude)
    if (isNaN(lat) || lat < -90 || lat > 90) errors.push('Valid latitude is required (−90 to 90).')
    if (isNaN(lng) || lng < -180 || lng > 180)
        errors.push('Valid longitude is required (−180 to 180).')
    if (connections.value.length === 0) errors.push('At least one connector is required.')
    connections.value.forEach((c, i) => {
        if (!c.connectionTypeID)
            errors.push(`Connector ${i + 1}: connection type is required.`)
    })
    validationErrors.value = errors
    return errors.length === 0
}

// ─── Submit ──────────────────────────────────────────────────────────────────

async function handleSubmit() {
    store.resetSubmitState()
    if (!validate()) return

    const payload: NewStationPayload = {
        AddressInfo: {
            Title: form.title.trim(),
            AddressLine1: form.addressLine1.trim(),
            AddressLine2: form.addressLine2.trim() || null,
            Town: form.town.trim(),
            StateOrProvince: form.stateOrProvince.trim() || null,
            Postcode: form.postcode.trim() || null,
            CountryID: 134, // Indonesia
            Latitude: parseFloat(form.latitude),
            Longitude: parseFloat(form.longitude),
            ContactTelephone1: form.contactTelephone.trim() || null,
            ContactEmail: form.contactEmail.trim() || null,
            AccessComments: form.accessComments.trim() || null,
            RelatedURL: form.relatedURL.trim() || null,
        },
        Connections: connections.value.map(
            (c): NewStationConnection => ({
                ConnectionTypeID: parseInt(c.connectionTypeID),
                LevelID: c.levelID ? parseInt(c.levelID) : null,
                PowerKW: c.powerKW ? parseFloat(c.powerKW) : null,
                Quantity: c.quantity ? parseInt(c.quantity) : null,
                StatusTypeID: c.statusTypeID ? parseInt(c.statusTypeID) : null,
                CurrentTypeID: c.currentTypeID ? parseInt(c.currentTypeID) : null,
                Amps: c.amps ? parseFloat(c.amps) : null,
                Voltage: c.voltage ? parseFloat(c.voltage) : null,
                Comments: c.comments.trim() || null,
            }),
        ),
        OperatorID: form.operatorID ? parseInt(form.operatorID) : null,
        UsageTypeID: form.usageTypeID ? parseInt(form.usageTypeID) : null,
        StatusTypeID: parseInt(form.statusTypeID),
        NumberOfPoints: form.numberOfPoints ? parseInt(form.numberOfPoints) : null,
        GeneralComments: form.generalComments.trim() || null,
    }

    const ok = await store.addStation(payload)
    if (ok) {
        // Scroll to top so user sees the success banner
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

function goHome() {
    store.resetSubmitState()
    router.push('/')
}
</script>

<template>
    <div class="add-station-page">
        <!-- Header -->
        <div class="page-header glass">
            <button class="back-btn" @click="goHome" aria-label="Go back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5M5 12l7 7M5 12l7-7" />
                </svg>
            </button>
            <h1 class="page-title">Add Charging Station</h1>
        </div>

        <div class="page-body">
            <!-- Success banner -->
            <transition name="fade">
                <div v-if="store.submitSuccess" class="alert alert--success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <div>
                        <strong>Station submitted successfully!</strong>
                        <p>Your submission is pending review by OpenChargeMap moderators.</p>
                    </div>
                    <button class="alert-close" @click="store.resetSubmitState(); router.push('/')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </transition>

            <!-- API error -->
            <transition name="fade">
                <div v-if="store.submitError" class="alert alert--error">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{{ store.submitError }}</span>
                    <button class="alert-close" @click="store.resetSubmitState()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </transition>

            <!-- Validation errors -->
            <transition name="fade">
                <div v-if="validationErrors.length" class="alert alert--warning">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <ul class="validation-list">
                        <li v-for="err in validationErrors" :key="err">{{ err }}</li>
                    </ul>
                </div>
            </transition>

            <form @submit.prevent="handleSubmit" class="station-form" novalidate>

                <!-- ── Section: Location Info ── -->
                <section class="form-section card">
                    <h2 class="section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        Location
                    </h2>

                    <div class="form-group">
                        <label class="form-label required">Station Name</label>
                        <input v-model="form.title" type="text" class="form-control"
                            placeholder="e.g. SPKLU Pertamina Sudirman" required />
                    </div>

                    <div class="form-group">
                        <label class="form-label required">Address Line 1</label>
                        <input v-model="form.addressLine1" type="text" class="form-control" placeholder="Street address"
                            required />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Address Line 2</label>
                        <input v-model="form.addressLine2" type="text" class="form-control"
                            placeholder="Apartment, suite, etc." />
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">City / Town</label>
                            <input v-model="form.town" type="text" class="form-control" placeholder="Jakarta"
                                required />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Province / State</label>
                            <input v-model="form.stateOrProvince" type="text" class="form-control"
                                placeholder="DKI Jakarta" />
                        </div>
                        <div class="form-group form-group--sm">
                            <label class="form-label">Postcode</label>
                            <input v-model="form.postcode" type="text" class="form-control" placeholder="10220" />
                        </div>
                    </div>

                    <!-- Coordinates -->
                    <div class="coords-row">
                        <div class="form-group">
                            <label class="form-label required">Latitude</label>
                            <input v-model="form.latitude" type="number" step="any" class="form-control"
                                placeholder="-6.2088" required />
                        </div>
                        <div class="form-group">
                            <label class="form-label required">Longitude</label>
                            <input v-model="form.longitude" type="number" step="any" class="form-control"
                                placeholder="106.8456" required />
                        </div>
                        <button type="button" class="locate-btn" :disabled="isLocating" @click="useCurrentLocation"
                            title="Use my current location">
                            <svg v-if="!isLocating" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            <span v-else class="spinner" />
                        </button>
                    </div>
                </section>

                <!-- ── Section: Contact ── -->
                <section class="form-section card">
                    <h2 class="section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M22 16.92V19a2 2 0 01-2.18 2A19.79 19.79 0 013 4.18 2 2 0 015 2h2.09a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91A16 16 0 0015.91 17.9l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        Contact (optional)
                    </h2>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Phone</label>
                            <input v-model="form.contactTelephone" type="tel" class="form-control"
                                placeholder="+62 21 000 0000" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input v-model="form.contactEmail" type="email" class="form-control"
                                placeholder="contact@example.com" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Related URL</label>
                        <input v-model="form.relatedURL" type="url" class="form-control" placeholder="https://..." />
                    </div>

                    <div class="form-group">
                        <label class="form-label">Access Comments</label>
                        <textarea v-model="form.accessComments" class="form-control" rows="2"
                            placeholder="e.g. accessible 24/7, inside parking lot B1" />
                    </div>
                </section>

                <!-- ── Section: Station Details ── -->
                <section class="form-section card">
                    <h2 class="section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        Station Details
                    </h2>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Usage Type</label>
                            <select v-model="form.usageTypeID" class="form-control">
                                <option v-for="u in USAGE_TYPES" :key="u.id" :value="String(u.id)">
                                    {{ u.label }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select v-model="form.statusTypeID" class="form-control">
                                <option v-for="s in STATUS_TYPES" :key="s.id" :value="String(s.id)">
                                    {{ s.label }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group form-group--sm">
                        <label class="form-label">Number of Bays / Points</label>
                        <input v-model="form.numberOfPoints" type="number" min="1" class="form-control"
                            placeholder="e.g. 4" />
                    </div>

                    <div class="form-group">
                        <label class="form-label">General Comments</label>
                        <textarea v-model="form.generalComments" class="form-control" rows="2"
                            placeholder="Additional info about this station…" />
                    </div>
                </section>

                <!-- ── Section: Connectors ── -->
                <section class="form-section card">
                    <div class="section-header">
                        <h2 class="section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                            </svg>
                            Connectors
                        </h2>
                        <button type="button" class="btn-add-connector" @click="addConnection">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Connector
                        </button>
                    </div>

                    <div v-for="(conn, index) in connections" :key="index" class="connector-row">
                        <div class="connector-index">{{ index + 1 }}</div>

                        <div class="connector-fields">
                            <div class="form-row form-row--wrap">
                                <div class="form-group">
                                    <label class="form-label required">Type</label>
                                    <select v-model="conn.connectionTypeID" class="form-control">
                                        <option v-for="ct in CONNECTION_TYPES" :key="ct.id" :value="String(ct.id)">
                                            {{ ct.label }}
                                        </option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Level</label>
                                    <select v-model="conn.levelID" class="form-control">
                                        <option value="">— Select —</option>
                                        <option v-for="l in CHARGING_LEVELS" :key="l.id" :value="String(l.id)">
                                            {{ l.label }}
                                        </option>
                                    </select>
                                </div>

                                <div class="form-group form-group--sm">
                                    <label class="form-label">Power (kW)</label>
                                    <input v-model="conn.powerKW" type="number" min="0" step="any" class="form-control"
                                        placeholder="e.g. 22" />
                                </div>

                                <div class="form-group form-group--sm">
                                    <label class="form-label">Qty</label>
                                    <input v-model="conn.quantity" type="number" min="1" class="form-control"
                                        placeholder="1" />
                                </div>

                                <div class="form-group form-group--sm">
                                    <label class="form-label">Amps</label>
                                    <input v-model="conn.amps" type="number" min="0" class="form-control"
                                        placeholder="e.g. 32" />
                                </div>

                                <div class="form-group form-group--sm">
                                    <label class="form-label">Voltage</label>
                                    <input v-model="conn.voltage" type="number" min="0" class="form-control"
                                        placeholder="e.g. 230" />
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Notes (optional)</label>
                                <input v-model="conn.comments" type="text" class="form-control"
                                    placeholder="e.g. cable tethered, pay per kWh" />
                            </div>
                        </div>

                        <button v-if="connections.length > 1" type="button" class="connector-remove"
                            @click="removeConnection(index)" aria-label="Remove connector">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2.5">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </section>

                <!-- ── Submit ── -->
                <div class="form-actions">
                    <button type="button" class="btn btn--secondary" @click="goHome">Cancel</button>
                    <button type="submit" class="btn btn--primary" :disabled="store.isSubmitting">
                        <span v-if="store.isSubmitting" class="spinner" />
                        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 19-7z" />
                        </svg>
                        {{ store.isSubmitting ? 'Submitting…' : 'Submit to OpenChargeMap' }}
                    </button>
                </div>

            </form>
        </div>
    </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────────── */
.add-station-page {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    background: var(--bg);
}

.page-header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    height: var(--header-height);
}

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    background: var(--bg-card-2);
    border: 1px solid var(--border);
    color: var(--text-primary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background var(--transition-fast);
}

.back-btn:hover {
    background: var(--bg-surface);
}

.page-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.page-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 120px;
    max-width: 720px;
    margin: 0 auto;
    width: 100%;
}

/* ── Alerts ─────────────────────────────────────────────────────────────────── */
.alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 0.9rem;
}

.alert--success {
    background: rgba(46, 213, 115, 0.12);
    border: 1px solid rgba(46, 213, 115, 0.3);
    color: #2ed573;
}

.alert--success strong {
    display: block;
    margin-bottom: 2px;
}

.alert--success p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.alert--error {
    background: rgba(255, 71, 87, 0.12);
    border: 1px solid rgba(255, 71, 87, 0.3);
    color: #ff4757;
}

.alert--warning {
    background: rgba(255, 165, 2, 0.12);
    border: 1px solid rgba(255, 165, 2, 0.3);
    color: var(--warning);
}

.alert-close {
    margin-left: auto;
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    padding: 2px;
}

.alert-close:hover {
    opacity: 1;
}

.validation-list {
    list-style: disc;
    padding-left: 16px;
    margin: 0;
    color: var(--warning);
}

/* ── Form Sections ───────────────────────────────────────────────────────────── */
.station-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-section {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--primary);
    margin: 0;
}

/* ── Form Controls ───────────────────────────────────────────────────────────── */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 0;
}

.form-group--sm {
    flex: 0 0 110px;
}

.form-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.form-label.required::after {
    content: ' *';
    color: var(--danger);
}

.form-control {
    background: var(--bg-card-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: 0.9rem;
    padding: 9px 12px;
    width: 100%;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    font-family: inherit;
    outline: none;
}

.form-control::placeholder {
    color: var(--text-muted);
}

.form-control:focus {
    border-color: var(--border-active);
    box-shadow: 0 0 0 3px rgba(0, 200, 150, 0.08);
}

select.form-control {
    cursor: pointer;
}

textarea.form-control {
    resize: vertical;
}

/* ── Grid helpers ─────────────────────────────────────────────────────────── */
.form-row {
    display: flex;
    gap: 12px;
}

.form-row--wrap {
    flex-wrap: wrap;
}

.coords-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
}

/* ── Locate button ───────────────────────────────────────────────────────── */
.locate-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--primary-light);
    border: 1px solid rgba(0, 200, 150, 0.3);
    color: var(--primary);
    cursor: pointer;
    transition: background var(--transition-fast);
    margin-bottom: 0;
}

.locate-btn:hover:not(:disabled) {
    background: rgba(0, 200, 150, 0.2);
}

.locate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ── Connectors ───────────────────────────────────────────────────────────── */
.btn-add-connector {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--primary);
    background: rgba(0, 200, 150, 0.1);
    border: 1px dashed rgba(0, 200, 150, 0.4);
    border-radius: var(--radius-sm);
    padding: 6px 12px;
    cursor: pointer;
    transition: background var(--transition-fast);
}

.btn-add-connector:hover {
    background: rgba(0, 200, 150, 0.18);
}

.connector-row {
    display: flex;
    gap: 10px;
    background: var(--bg-card-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 14px;
    position: relative;
}

.connector-index {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--primary);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 28px;
}

.connector-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

.connector-remove {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    background: rgba(255, 71, 87, 0.1);
    border: 1px solid rgba(255, 71, 87, 0.25);
    color: var(--danger);
    cursor: pointer;
    margin-top: 24px;
    transition: background var(--transition-fast);
}

.connector-remove:hover {
    background: rgba(255, 71, 87, 0.2);
}

/* ── Submit ───────────────────────────────────────────────────────────────── */
.form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 4px;
}

.btn {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 11px 22px;
    border-radius: var(--radius-md);
    cursor: pointer;
    border: none;
    transition: background var(--transition-fast), opacity var(--transition-fast);
    font-family: inherit;
}

.btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.btn--primary {
    background: var(--primary);
    color: #fff;
}

.btn--primary:hover:not(:disabled) {
    background: var(--primary-dark);
}

.btn--secondary {
    background: var(--bg-card-2);
    color: var(--text-secondary);
    border: 1px solid var(--border);
}

.btn--secondary:hover {
    background: var(--bg-surface);
}

/* ── Spinner ──────────────────────────────────────────────────────────────── */
.spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ── Transitions ──────────────────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 520px) {
    .form-row {
        flex-direction: column;
    }

    .form-group--sm {
        flex: 1;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .btn {
        width: 100%;
        justify-content: center;
    }

    .coords-row {
        flex-wrap: wrap;
    }

    .coords-row .locate-btn {
        margin-bottom: 0;
    }
}

/* Desktop sidebar offset */
@media (min-width: 768px) {
    .add-station-page {
        padding-left: var(--sidebar-width);
    }
}
</style>
