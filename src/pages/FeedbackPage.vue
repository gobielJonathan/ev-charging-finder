<script setup lang="ts">
// Coming soon
</script>

<template>
    <div class="coming-soon-page">
        <div class="coming-soon-content">
            <div class="icon-wrapper">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </div>
            <h1>Feedback</h1>
            <p class="subtitle">Coming Soon</p>
            <p class="description">We are working on a way for you to share your experience and help improve EV charging
                stations. Stay tuned!</p>
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
