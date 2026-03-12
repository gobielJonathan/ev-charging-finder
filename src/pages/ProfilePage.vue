<script setup lang="ts">
// Coming soon
</script>

<template>
  <div class="coming-soon-page">
    <div class="coming-soon-content">
      <div class="icon-wrapper">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h1>Profile</h1>
      <p class="subtitle">Coming Soon</p>
      <p class="description">Your personal charging dashboard with session history, stats, and preferences is on the way!</p>
    </div>
  </div>
</template>

<style scoped>
.coming-soon-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 2rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%);
}
.coming-soon-content {
  text-align: center;
  max-width: 380px;
}
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(0, 200, 150, 0.1);
  color: #00c896;
  margin-bottom: 1.5rem;
}
h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 0.25rem;
}
.subtitle {
  font-size: 1.1rem;
  font-weight: 600;
  color: #00c896;
  margin: 0 0 1rem;
}
.description {
  font-size: 0.95rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}
</style>
