import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Feedback, FeedbackForm } from '@/types/feedback'

const STORAGE_KEY = 'ev_feedbacks'

function loadFromStorage(): Feedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(feedbacks: Feedback[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbacks))
}

export const useFeedbackStore = defineStore('feedback', () => {
  const feedbacks = ref<Feedback[]>(loadFromStorage())
  const isSubmitting = ref(false)
  const submitSuccess = ref(false)

  function submitFeedback(form: FeedbackForm) {
    isSubmitting.value = true
    submitSuccess.value = false

    const newFeedback: Feedback = {
      id: `fb_${Date.now()}`,
      stationId: form.stationId,
      stationName: form.stationName,
      comment: form.comment,
      rating: form.rating,
      createdAt: new Date().toISOString(),
      userId: 'user_001',
    }

    setTimeout(() => {
      feedbacks.value.unshift(newFeedback)
      saveToStorage(feedbacks.value)
      isSubmitting.value = false
      submitSuccess.value = true
    }, 800)
  }

  function getFeedbacksByStation(stationId: number): Feedback[] {
    return feedbacks.value.filter((f) => f.stationId === stationId)
  }

  return {
    feedbacks,
    isSubmitting,
    submitSuccess,
    submitFeedback,
    getFeedbacksByStation,
  }
})
