<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import AppSplashLoader from '@/components/AppSplashLoader.vue'

const authStore = useAuthStore()
const { initTheme } = useTheme()

onMounted(async () => {
  initTheme()
  if (!authStore.initialized) {
    await authStore.fetchMe()
  }
})
</script>

<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200 font-sans overflow-x-hidden">
    <AppSplashLoader v-if="!authStore.initialized" />
    <router-view v-else />
  </div>
</template>
