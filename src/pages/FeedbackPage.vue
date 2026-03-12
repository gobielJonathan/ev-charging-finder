<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import StarRating from '@/components/common/StarRating.vue'
import { useFeedbackStore } from '@/stores/feedbackStore'
import { useStationStore } from '@/stores/stationStore'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const route = useRoute()
const feedbackStore = useFeedbackStore()
const stationStore = useStationStore()

const stationId = ref<number | null>(null)
const stationName = ref('')
const comment = ref('')
const rating = ref(0)
const selectedStationId = ref<number | null>(null)

const errors = ref<Record<string, string>>({})
const showSuccess = ref(false)

// Pre-fill from query params (coming from StationDetail)
onMounted(() => {
    if (route.query.id) {
        stationId.value = Number(route.query.id)
        stationName.value = String(route.query.name ?? '')
        selectedStationId.value = stationId.value
    }
})

watch(() => feedbackStore.submitSuccess, (val) => {
    if (val) {
        showSuccess.value = true
        comment.value = ''
        rating.value = 0
        stationId.value = null
        stationName.value = ''
        selectedStationId.value = null
        setTimeout(() => {
            showSuccess.value = false
            feedbackStore.submitSuccess = false
        }, 3000)
    }
})

function validate() {
    errors.value = {}
    if (!selectedStationId.value && !stationId.value) {
        errors.value.station = 'Please select a station'
    }
    if (rating.value === 0) {
        errors.value.rating = 'Please give a rating'
    }
    if (!comment.value.trim() || comment.value.trim().length < 10) {
        errors.value.comment = 'Comment must be at least 10 characters'
    }
    return Object.keys(errors.value).length === 0
}

function submit() {
    if (!validate()) return
    const sid = stationId.value ?? selectedStationId.value!
    const sname = (stationName.value || stationStore.stations.find((s) => s.ID === sid)?.AddressInfo.Title) ?? `Station #${sid}`
    feedbackStore.submitFeedback({
        stationId: sid,
        stationName: sname,
        comment: comment.value.trim(),
        rating: rating.value,
    })
}

function selectStation(id: number, name: string) {
    stationId.value = id
    stationName.value = name
    selectedStationId.value = id
    errors.value.station = ''
}

const recentFeedbacks = computed(() => feedbackStore.feedbacks.slice(0, 10))

const ratingLabel = computed(() => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!']
    return labels[rating.value] ?? ''
})
</script>

<template>
    <div class="feedback-page">
        <div class="page-container">
            <!-- Form section -->
            <section class="feedback-form-section">
                <div class="section-header">
                    <div class="section-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 class="section-title">Leave Feedback</h2>
                        <p class="section-sub">Help the community by sharing your experience</p>
                    </div>
                </div>

                <!-- Success toast -->
                <Transition name="toast">
                    <div v-if="showSuccess" class="success-toast">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Feedback submitted successfully!
                    </div>
                </Transition>

                <form @submit.prevent="submit" class="form-card" novalidate>
                    <!-- Station selector -->
                    <div class="form-field">
                        <label class="form-label">
                            Charging Station
                            <span class="required">*</span>
                        </label>

                        <div v-if="stationName" class="selected-station">
                            <div class="selected-icon">⚡</div>
                            <span>{{ stationName }}</span>
                            <button type="button" class="clear-station"
                                @click="stationId = null; stationName = ''; selectedStationId = null">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div v-else class="station-picker">
                            <p class="picker-hint">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="16" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                                Select from nearby stations or tap a station on the map
                            </p>
                            <div v-if="stationStore.stations.length" class="picker-list">
                                <button v-for="s in stationStore.stations.slice(0, 6)" :key="s.ID" type="button"
                                    class="picker-item" :class="{ 'picker-item--selected': selectedStationId === s.ID }"
                                    @click="selectStation(s.ID, s.AddressInfo.Title)">
                                    <div class="picker-dot"
                                        :class="s.StatusType?.IsOperational !== false ? 'dot--ok' : 'dot--off'" />
                                    <span class="picker-name">{{ s.AddressInfo.Title }}</span>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2.5">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                            <p v-else class="picker-empty">No nearby stations loaded. Visit the map first.</p>
                        </div>
                        <p v-if="errors.station" class="form-error">{{ errors.station }}</p>
                    </div>

                    <!-- Rating -->
                    <div class="form-field">
                        <label class="form-label">
                            Rating
                            <span class="required">*</span>
                        </label>
                        <div class="rating-row">
                            <StarRating v-model="rating" :size="36" />
                            <Transition name="fade">
                                <span v-if="rating" class="rating-label" :class="`label--${rating}`">
                                    {{ ratingLabel }}
                                </span>
                            </Transition>
                        </div>
                        <p v-if="errors.rating" class="form-error">{{ errors.rating }}</p>
                    </div>

                    <!-- Comment -->
                    <div class="form-field">
                        <label class="form-label" for="comment">
                            Comment
                            <span class="required">*</span>
                        </label>
                        <div class="textarea-wrap">
                            <textarea id="comment" v-model="comment" class="form-textarea"
                                :class="{ 'input-error': errors.comment }"
                                placeholder="Share your experience...  Was it easy to find? How was the charging speed? Any issues?"
                                rows="4" maxlength="500" />
                            <span class="char-count">{{ comment.length }}/500</span>
                        </div>
                        <p v-if="errors.comment" class="form-error">{{ errors.comment }}</p>
                    </div>

                    <!-- Submit -->
                    <button type="submit" class="submit-btn"
                        :class="{ 'submit-btn--loading': feedbackStore.isSubmitting }"
                        :disabled="feedbackStore.isSubmitting">
                        <svg v-if="!feedbackStore.isSubmitting" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        <svg v-else class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2.5">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        {{ feedbackStore.isSubmitting ? 'Submitting...' : 'Submit Feedback' }}
                    </button>
                </form>
            </section>

            <!-- Recent feedbacks -->
            <section v-if="recentFeedbacks.length" class="recent-section">
                <h3 class="recent-title">Recent Feedbacks</h3>
                <div class="feedback-list">
                    <div v-for="fb in recentFeedbacks" :key="fb.id" class="feedback-item">
                        <div class="fb-avatar">{{ fb.stationName.charAt(0) }}</div>
                        <div class="fb-body">
                            <div class="fb-top">
                                <span class="fb-station">{{ fb.stationName }}</span>
                                <span class="fb-time">{{ dayjs(fb.createdAt).fromNow() }}</span>
                            </div>
                            <StarRating :model-value="fb.rating" :size="14" :readonly="true" />
                            <p class="fb-comment">{{ fb.comment }}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.feedback-page {
    flex: 1;
    overflow-y: auto;
    background: var(--bg);
}

.page-container {
    max-width: 640px;
    margin: 0 auto;
    padding: 20px 16px 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* ---- Section header ---- */
.section-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 16px;
}

.section-icon {
    width: 44px;
    height: 44px;
    background: rgba(0, 200, 150, 0.12);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    flex-shrink: 0;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.section-sub {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 2px;
}

/* ---- Success toast ---- */
.success-toast {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(46, 213, 115, 0.12);
    border: 1px solid rgba(46, 213, 115, 0.3);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--success);
    margin-bottom: 16px;
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

/* ---- Form ---- */
.form-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: 0.3px;
}

.required {
    color: var(--danger);
    margin-left: 3px;
}

/* Selected station */
.selected-station {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 200, 150, 0.08);
    border: 1px solid rgba(0, 200, 150, 0.2);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
}

.selected-icon {
    font-size: 16px;
}

.clear-station {
    margin-left: auto;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    transition: color var(--transition-fast);
}

.clear-station:hover {
    color: var(--danger);
}

/* Station picker */
.station-picker {
    background: var(--bg-card-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.picker-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
}

.picker-list {
    max-height: 200px;
    overflow-y: auto;
}

.picker-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    text-align: left;
    color: var(--text-primary);
    transition: background var(--transition-fast);
}

.picker-item:last-child {
    border-bottom: none;
}

.picker-item:hover {
    background: var(--bg-surface);
}

.picker-item--selected {
    background: rgba(0, 200, 150, 0.08);
    color: var(--primary);
}

.picker-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.dot--ok {
    background: var(--success);
}

.dot--off {
    background: var(--text-muted);
}

.picker-name {
    flex: 1;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.picker-empty {
    padding: 16px 14px;
    font-size: 12px;
    color: var(--text-muted);
}

/* Rating row */
.rating-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.rating-label {
    font-size: 13px;
    font-weight: 700;
    animation: fadeIn 0.2s ease;
}

.label--1 {
    color: var(--danger);
}

.label--2 {
    color: var(--warning);
}

.label--3 {
    color: var(--accent);
}

.label--4 {
    color: var(--primary);
}

.label--5 {
    color: var(--success);
}

/* Textarea */
.textarea-wrap {
    position: relative;
}

.form-textarea {
    width: 100%;
    background: var(--bg-card-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 14px;
    font-family: inherit;
    padding: 12px 14px 28px;
    resize: none;
    transition: border-color var(--transition-fast);
    line-height: 1.6;
}

.form-textarea:focus {
    outline: none;
    border-color: var(--border-active);
    background: var(--bg-card-2);
}

.form-textarea::placeholder {
    color: var(--text-muted);
}

.input-error {
    border-color: var(--danger) !important;
}

.char-count {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 10px;
    color: var(--text-muted);
}

.form-error {
    font-size: 12px;
    color: var(--danger);
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Submit */
.submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: #fff;
    border: none;
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-glow);
    transition: all var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
    transform: scale(0.98);
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.spin {
    animation: spin 0.8s linear infinite;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ---- Recent Feedbacks ---- */
.recent-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.recent-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
}

.feedback-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.feedback-item {
    display: flex;
    gap: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 14px;
    animation: slideUp 0.3s ease;
}

.fb-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
}

.fb-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.fb-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
}

.fb-station {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fb-time {
    font-size: 11px;
    color: var(--text-muted);
    flex-shrink: 0;
}

.fb-comment {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
}

@media (min-width: 1024px) {
    .page-container {
        padding: 24px 24px 40px calc(72px + 16px);
    }
}
</style>
