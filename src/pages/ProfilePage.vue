<script setup lang="ts">
import { computed } from 'vue'
import { useProfileStore } from '@/stores/profileStore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const store = useProfileStore()

function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
}

const weeklyData = computed(() => {
    const days: Record<string, number> = {}
    const labels = Array.from({ length: 7 }, (_, i) => {
        const d = dayjs().subtract(6 - i, 'day')
        return d.format('ddd')
    })
    labels.forEach((l) => (days[l] = 0))
    store.checkIns.forEach((c) => {
        const label = dayjs(c.date).format('ddd')
        if (label in days) days[label] = (days[label] ?? 0) + c.energyUsed
    })
    const values: number[] = labels.map((l) => days[l] ?? 0)
    const max = Math.max(...values, 1)
    return { labels, values, max }
})

const initials = computed(() => {
    return store.profile.name
        .split(' ')
        .map((n) => n[0] ?? '')
        .slice(0, 2)
        .join('')
        .toUpperCase()
})
</script>

<template>
    <div class="profile-page">
        <div class="page-container">

            <!-- Hero Profile Card -->
            <div class="profile-hero">
                <!-- Background glow -->
                <div class="hero-glow" />

                <div class="hero-content">
                    <div class="avatar-wrap">
                        <div class="avatar">{{ initials }}</div>
                        <div class="avatar-ring" />
                    </div>
                    <div class="hero-info">
                        <h1 class="hero-name">{{ store.profile.name }}</h1>
                        <p class="hero-email">{{ store.profile.email }}</p>
                        <div class="hero-badges">
                            <span class="hero-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M9 9h6M9 12h6M9 15h4" />
                                </svg>
                                {{ store.profile.vehicle }}
                            </span>
                            <span class="hero-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Since {{ dayjs(store.profile.memberSince).format('MMM YYYY') }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon stat-icon--green">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <div>
                        <div class="stat-value">{{ store.totalEnergy.toFixed(1) }}</div>
                        <div class="stat-label">kWh Used</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon stat-icon--blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div>
                        <div class="stat-value">{{ formatDuration(store.totalDuration) }}</div>
                        <div class="stat-label">Total Time</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon stat-icon--yellow">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                    </div>
                    <div>
                        <div class="stat-value">{{ formatCurrency(store.totalCost).replace('IDR', 'Rp') }}</div>
                        <div class="stat-label">Total Spent</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon stat-icon--purple">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    </div>
                    <div>
                        <div class="stat-value">{{ store.checkIns.length }}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                </div>
            </div>

            <!-- Weekly Energy Chart -->
            <div class="chart-card">
                <div class="card-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Weekly Energy Usage (kWh)
                </div>
                <div class="bar-chart">
                    <div v-for="(val, i) in weeklyData.values" :key="i" class="bar-col">
                        <div class="bar-label-top" v-if="val > 0">{{ val.toFixed(0) }}</div>
                        <div class="bar" :style="{ height: `${(val / weeklyData.max) * 100}%` }"
                            :class="{ 'bar--active': val > 0 }" />
                        <div class="bar-label">{{ weeklyData.labels[i] }}</div>
                    </div>
                </div>
            </div>

            <!-- Check-in History -->
            <div class="history-section">
                <h3 class="section-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Check-in History
                </h3>

                <div class="checkin-list">
                    <div v-for="(ci, i) in store.checkIns" :key="ci.id" class="checkin-item"
                        :style="{ animationDelay: `${i * 60}ms` }">
                        <div class="checkin-timeline">
                            <div class="timeline-dot" />
                            <div v-if="i < store.checkIns.length - 1" class="timeline-line" />
                        </div>
                        <div class="checkin-card">
                            <div class="checkin-top">
                                <div>
                                    <p class="checkin-station">{{ ci.stationName }}</p>
                                    <p class="checkin-address">{{ ci.address }}</p>
                                </div>
                                <div class="checkin-date">
                                    <p class="date-rel">{{ dayjs(ci.date).fromNow() }}</p>
                                    <p class="date-abs">{{ dayjs(ci.date).format('DD MMM') }}</p>
                                </div>
                            </div>
                            <div class="checkin-stats">
                                <div class="ci-stat">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                    {{ ci.energyUsed }} kWh
                                </div>
                                <div class="ci-stat">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    {{ formatDuration(ci.duration) }}
                                </div>
                                <div class="ci-stat ci-stat--cost">
                                    {{ formatCurrency(ci.cost).replace('IDR', 'Rp') }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.profile-page {
    flex: 1;
    overflow-y: auto;
    background: var(--bg);
}

.page-container {
    max-width: 640px;
    margin: 0 auto;
    padding: 16px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* ---- Hero ---- */
.profile-hero {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 24px;
    overflow: hidden;
}

.hero-glow {
    position: absolute;
    top: -40px;
    right: -40px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(0, 200, 150, 0.15) 0%, transparent 70%);
    pointer-events: none;
}

.hero-content {
    display: flex;
    gap: 16px;
    align-items: center;
    position: relative;
}

.avatar-wrap {
    position: relative;
    flex-shrink: 0;
}

.avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), #00a3ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -1px;
}

.avatar-ring {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 2px solid rgba(0, 200, 150, 0.4);
    animation: pulse 2.5s ease-in-out infinite;
}

.hero-info {
    flex: 1;
    min-width: 0;
}

.hero-name {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.3px;
}

.hero-email {
    font-size: 13px;
    color: var(--text-muted);
    margin: 2px 0 8px;
}

.hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 9px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    color: var(--text-secondary);
}

/* ---- Stats Grid ---- */
.stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
    transition: border-color var(--transition-fast);
}

.stat-card:hover {
    border-color: var(--border-active);
}

.stat-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stat-icon--green {
    background: rgba(0, 200, 150, 0.12);
    color: var(--primary);
}

.stat-icon--blue {
    background: rgba(30, 144, 255, 0.12);
    color: var(--info);
}

.stat-icon--yellow {
    background: rgba(245, 166, 35, 0.12);
    color: var(--accent);
}

.stat-icon--purple {
    background: rgba(155, 89, 182, 0.12);
    color: #9b59b6;
}

.stat-value {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-primary);
    white-space: nowrap;
}

.stat-label {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 2px;
    font-weight: 500;
}

/* ---- Chart ---- */
.chart-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.card-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    letter-spacing: 0.3px;
}

.bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 100px;
}

.bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    height: 100%;
    position: relative;
}

.bar-label-top {
    position: absolute;
    top: -16px;
    font-size: 9px;
    color: var(--primary);
    font-weight: 600;
}

.bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    background: var(--bg-surface);
    min-height: 4px;
    transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.bar--active {
    background: linear-gradient(180deg, var(--primary) 0%, rgba(0, 200, 150, 0.4) 100%);
    box-shadow: 0 0 8px rgba(0, 200, 150, 0.3);
}

.bar-label {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 500;
}

/* ---- History ---- */
.history-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
}

.checkin-list {
    display: flex;
    flex-direction: column;
}

.checkin-item {
    display: flex;
    gap: 12px;
    animation: slideRight 0.3s ease both;
}

.checkin-timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 8px;
}

.timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--primary);
    border: 2px solid var(--bg);
    box-shadow: 0 0 0 2px rgba(0, 200, 150, 0.3);
    flex-shrink: 0;
}

.timeline-line {
    flex: 1;
    width: 2px;
    background: linear-gradient(180deg, rgba(0, 200, 150, 0.3), transparent);
    margin: 4px 0;
    min-height: 20px;
}

.checkin-card {
    flex: 1;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
    transition: border-color var(--transition-fast);
}

.checkin-card:hover {
    border-color: var(--border-active);
}

.checkin-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: flex-start;
}

.checkin-station {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}

.checkin-address {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 1px;
}

.checkin-date {
    text-align: right;
    flex-shrink: 0;
}

.date-rel {
    font-size: 11px;
    color: var(--text-muted);
}

.date-abs {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
}

.checkin-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.ci-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--bg-surface);
    padding: 3px 8px;
    border-radius: var(--radius-full);
}

.ci-stat--cost {
    color: var(--accent);
    background: rgba(245, 166, 35, 0.1);
}

@media (min-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (min-width: 1024px) {
    .page-container {
        padding: 24px 24px 40px calc(72px + 16px);
    }
}
</style>
