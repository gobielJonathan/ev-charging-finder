<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
    modelValue: number
    readonly?: boolean
    size?: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number): void
}>()

const hovered = ref(0)
const sz = computed(() => props.size ?? 28)

function setRating(v: number) {
    if (!props.readonly) emit('update:modelValue', v)
}
</script>

<template>
    <div class="star-rating" :class="{ 'star-rating--readonly': readonly }" role="group" aria-label="Rating">
        <button v-for="star in 5" :key="star" class="star-btn" :class="{
            'star-btn--filled': (hovered || modelValue) >= star,
            'star-btn--hovered': hovered >= star,
        }" :style="{ width: `${sz}px`, height: `${sz}px` }" :disabled="readonly"
            :aria-label="`${star} star${star > 1 ? 's' : ''}`" @mouseenter="!readonly && (hovered = star)"
            @mouseleave="!readonly && (hovered = 0)" @click="setRating(star)">
            <svg :width="sz - 4" :height="sz - 4" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
        </button>
    </div>
</template>

<style scoped>
.star-rating {
    display: inline-flex;
    gap: 2px;
    align-items: center;
}

.star-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bg-surface);
    transition: color var(--transition-fast), transform var(--transition-fast);
    padding: 2px;
}

.star-btn--filled {
    color: var(--accent);
}

.star-btn--hovered {
    color: var(--accent);
    transform: scale(1.15);
}

.star-btn:not(:disabled):hover {
    transform: scale(1.15);
}

.star-rating--readonly .star-btn {
    cursor: default;
}
</style>
