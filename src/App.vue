<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.fetchMe()
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f8faf9] text-stone-800">
    <router-view />
  </div>
</template>
