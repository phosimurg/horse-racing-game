<script setup lang="ts">
const { message } = defineProps<{ message: string }>();
</script>

<template>
    <div
        class="visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
    >
        {{ message }}
    </div>
</template>
