import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import FeedbackPage from '@/pages/FeedbackPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import AddStationPage from '@/pages/AddStationPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/add-station',
      name: 'add-station',
      component: AddStationPage,
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: FeedbackPage,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
    },
  ],
})

export default router
