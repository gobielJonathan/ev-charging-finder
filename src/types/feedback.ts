export interface Feedback {
  id: string
  stationId: number
  stationName: string
  comment: string
  rating: number
  createdAt: string
  userId: string
}

export interface FeedbackForm {
  stationId: number
  stationName: string
  comment: string
  rating: number
}
