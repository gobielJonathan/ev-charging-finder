<script setup lang="ts">
import { ref, watch } from 'vue'

interface NominatimResult {
    place_id: number
    display_name: string
    lat: string
    lon: string
    type: string
    class: string
}

const emit = defineEmits<{
    (e: 'locationSelect', lat: number, lng: number, label: string): void
}>()

const query = ref('')
const results = ref<NominatimResult[]>([])
const isSearching = ref(false)
const isFocused = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)
let searchDebounce: ReturnType<typeof setTimeout> | null = null
let isSelecting = false // suppresses watcher re-search when selectResult writes to query

async function search(q: string) {
    if (q.trim().length < 2) {
        results.value = []
        return
    }
    isSearching.value = true
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=0`
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'en' },
        })
        results.value = (await res.json()) as NominatimResult[]
    } catch {
        results.value = []
    } finally {
        isSearching.value = false
    }
}

watch(query, (val) => {
    if (isSelecting) return // selection in progress — skip re-search
    if (searchDebounce) clearTimeout(searchDebounce)
    if (val.trim().length < 2) {
        results.value = []
        return
    }
    searchDebounce = setTimeout(() => search(val), 400)
})

function selectResult(result: NominatimResult) {
    isSelecting = true
    if (searchDebounce) clearTimeout(searchDebounce)
    query.value = result.display_name
    results.value = []
    isSearching.value = false
    isFocused.value = false
    inputEl.value?.blur()
    emit('locationSelect', parseFloat(result.lat), parseFloat(result.lon), result.display_name)
    // Reset flag after Vue's watcher tick
    setTimeout(() => { isSelecting = false }, 0)
}

function clearSearch() {
    query.value = ''
    results.value = []
    inputEl.value?.focus()
}

function onBlur() {
    // Delay so click on a result registers first
    setTimeout(() => {
        isFocused.value = false
        if (!query.value) results.value = []
    }, 180)
}

function getIcon(type: string, cls: string): string {
    if (cls === 'highway' || type === 'road') return '🛣️'
    if (cls === 'amenity' || type === 'fuel') return '🏪'
    if (type === 'city' || type === 'town' || type === 'village') return '🏙️'
    if (cls === 'natural') return '🌿'
    if (cls === 'tourism') return '🏛️'
    return '📍'
}
</script>

<template>
    <div class="map-search" :class="{ 'map-search--active': isFocused || results.length > 0 }">
        <!-- Input row -->
        <div class="search-input-wrap">
            <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <input ref="inputEl" v-model="query" type="text" class="search-input"
                placeholder="Search location or place…" autocomplete="off" autocorrect="off" spellcheck="false"
                @focus="isFocused = true" @blur="onBlur" @keydown.escape="clearSearch" />
            <!-- Spinner / clear button -->
            <button v-if="query" class="search-clear" @mousedown.prevent="clearSearch" aria-label="Clear search">
                <svg v-if="isSearching" class="spin" width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>

        <!-- Dropdown results -->
        <Transition name="dropdown">
            <ul v-if="results.length > 0" class="search-results" role="listbox">
                <li v-for="result in results" :key="result.place_id" class="search-result-item" role="option"
                    @mousedown.prevent="selectResult(result)">
                    <span class="result-icon">{{ getIcon(result.type, result.class) }}</span>
                    <span class="result-label">{{ result.display_name }}</span>
                </li>
            </ul>
        </Transition>

        <!-- No results hint -->
        <Transition name="dropdown">
            <div v-if="!isSearching && isFocused && query.trim().length >= 2 && results.length === 0"
                class="search-empty">
                No places found for "{{ query }}"
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.map-search {
    position: relative;
    width: 100%;
    max-width: 360px;
    z-index: 25;
}

.search-input-wrap {
    display: flex;
    align-items: center;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-md);
    padding: 0 10px 0 12px;
    height: 38px;
    gap: 8px;
    transition: border-color 0.2s;
}

.map-search--active .search-input-wrap {
    border-color: var(--border-active);
    box-shadow: var(--shadow-md), 0 0 0 2px rgba(0, 200, 150, 0.12);
}

.search-icon {
    color: #6b7280;
    flex-shrink: 0;
}

.search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-size: 13.5px;
    font-weight: 500;
    min-width: 0;
}

.search-input::placeholder {
    color: #6b7280;
    font-weight: 400;
}

.search-clear {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.15s;
}

.search-clear:hover {
    color: var(--text-primary);
}

.search-results {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    list-style: none;
    margin: 0;
    padding: 4px 0;
    max-height: 280px;
    overflow-y: auto;
    z-index: 30;
}

.search-result-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 9px 14px;
    cursor: pointer;
    transition: background 0.12s;
}

.search-result-item:hover {
    background: var(--bg-card-2);
}

.result-icon {
    font-size: 14px;
    flex-shrink: 0;
    line-height: 1.5;
}

.result-label {
    font-size: 13px;
    color: var(--text-primary);
    line-height: 1.45;
    word-break: break-word;
}

.search-empty {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    padding: 12px 14px;
    font-size: 13px;
    color: #6b7280;
    z-index: 30;
}

/* Transition */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* Spinner animation */
.spin {
    animation: spin 0.9s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
