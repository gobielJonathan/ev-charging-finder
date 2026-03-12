<script setup lang="ts">
defineProps<{
    state: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
}>()

const emit = defineEmits<{
    (e: 'allow'): void
    (e: 'deny'): void
}>()
</script>

<template>
    <Transition name="modal-fade">
        <div v-if="state === 'idle' || state === 'requesting'" class="modal-overlay">
            <div class="modal-card">
                <!-- Icon -->
                <div class="modal-icon">
                    <div class="icon-pulse" />
                    <div class="icon-inner">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                        </svg>
                    </div>
                </div>

                <!-- Text -->
                <h2 class="modal-title">Enable Location</h2>
                <p class="modal-desc">
                    ChargeNow needs your location to find EV charging stations nearby. Your location is used
                    only while the app is open and is never stored.
                </p>

                <!-- Features -->
                <ul class="feature-list">
                    <li>
                        <span class="feat-icon feat-icon--green">⚡</span>
                        Find stations within 10 km of you
                    </li>
                    <li>
                        <span class="feat-icon feat-icon--blue">🧭</span>
                        See distance to each station
                    </li>
                    <li>
                        <span class="feat-icon feat-icon--yellow">🗺️</span>
                        Get directions to any station
                    </li>
                </ul>

                <!-- Actions -->
                <div class="modal-actions">
                    <button class="btn-allow" :class="{ 'btn-allow--loading': state === 'requesting' }"
                        :disabled="state === 'requesting'" @click="emit('allow')">
                        <svg v-if="state !== 'requesting'" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
                        </svg>
                        <svg v-else class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        {{ state === 'requesting' ? 'Locating…' : 'Allow Location' }}
                    </button>
                    <button class="btn-deny" @click="emit('deny')">
                        Use Jakarta instead
                    </button>
                </div>
            </div>
        </div>
    </Transition>

    <!-- Denied / Unavailable banner -->
    <Transition name="banner-slide">
        <div v-if="state === 'denied'" class="denied-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Location denied — showing stations near <strong>Jakarta</strong>. Enable location in your browser
                settings for accurate results.</span>
        </div>
    </Transition>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0 0 env(safe-area-inset-bottom);
}

@media (min-width: 480px) {
    .modal-overlay {
        align-items: center;
        padding: 16px;
    }
}

.modal-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: 28px 24px 32px;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
    animation: slideUp 0.35s cubic-bezier(0.34, 1.3, 0.64, 1);
}

@media (min-width: 480px) {
    .modal-card {
        border-radius: var(--radius-xl);
    }
}

/* Icon */
.modal-icon {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 200, 150, 0.15);
    animation: pulse 2.5s ease-in-out infinite;
}

.icon-inner {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: var(--shadow-glow);
    position: relative;
    z-index: 1;
}

/* Text */
.modal-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.4px;
}

.modal-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    max-width: 340px;
}

/* Features */
.feature-list {
    list-style: none;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: var(--bg-card-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 14px 16px;
    text-align: left;
}

.feature-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-secondary);
}

.feat-icon {
    font-size: 16px;
    flex-shrink: 0;
}

/* Buttons */
.modal-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}

.btn-allow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-glow);
    transition: filter var(--transition-fast), transform var(--transition-fast);
}

.btn-allow:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
}

.btn-allow:disabled {
    opacity: 0.75;
    cursor: not-allowed;
}

.btn-allow--loading {
    background: var(--bg-surface);
    color: var(--text-secondary);
    box-shadow: none;
}

.btn-deny {
    width: 100%;
    padding: 12px;
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.btn-deny:hover {
    background: var(--bg-surface);
    color: var(--text-secondary);
}

/* Denied banner */
.denied-banner {
    position: fixed;
    top: calc(var(--header-height) + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: rgba(255, 71, 87, 0.12);
    border: 1px solid rgba(255, 71, 87, 0.3);
    color: #ff8a96;
    font-size: 12px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    max-width: calc(100vw - 32px);
    width: max-content;
    box-shadow: var(--shadow-md);
    line-height: 1.5;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.banner-slide-enter-active,
.banner-slide-leave-active {
    transition: all 0.3s ease;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px);
}

.spin {
    animation: spin 0.8s linear infinite;
}
</style>
