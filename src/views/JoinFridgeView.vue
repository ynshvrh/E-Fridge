<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Refrigerator, Users, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = route.params.token as string
const loading = ref(true)
const joining = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const inviteInfo = ref<{
  fridge_id: string
  fridge_name: string
  token: string
  expires_at: string
} | null>(null)

onMounted(async () => {
  if (!token) {
    error.value = 'Недійсне посилання-запрошення'
    loading.value = false
    return
  }

  try {
    const details = await authStore.getFridgeInvite(token)
    inviteInfo.value = details
  } catch (err: any) {
    error.value = err.message || 'Термін дії посилання вичерпано або воно недійсне'
  } finally {
    loading.value = false
  }
})

async function handleJoin() {
  if (!token) return
  joining.value = true
  error.value = null
  try {
    await authStore.joinFridge(token)
    success.value = true
    setTimeout(() => {
      router.push('/')
    }, 1200)
  } catch (err: any) {
    error.value = err.message || 'Не вдалося приєднатися до холодильника'
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-black font-sans">
    <div class="w-full max-w-md bg-white dark:bg-[#121217] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-8 shadow-xl text-center space-y-6">
      
      <!-- Icon header -->
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
        <Refrigerator class="w-8 h-8" />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-8 space-y-3">
        <Loader2 class="w-8 h-8 animate-spin mx-auto text-violet-600" />
        <p class="text-sm text-zinc-500 dark:text-zinc-400">Перевірка посилання-запрошення...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="space-y-4">
        <div class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3 text-left">
          <AlertCircle class="w-5 h-5 shrink-0 text-rose-500" />
          <span>{{ error }}</span>
        </div>
        <button
          type="button"
          @click="router.push('/')"
          class="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-medium text-xs transition-colors cursor-pointer"
        >
          Повернутися на головну
        </button>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="space-y-4 py-4">
        <div class="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <h3 class="text-base font-semibold text-zinc-800 dark:text-zinc-100">Ви успішно приєдналися!</h3>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">Переходимо до спільного холодильника...</p>
      </div>

      <!-- Ready to join state -->
      <div v-else-if="inviteInfo" class="space-y-6">
        <div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
            <Users class="w-3.5 h-3.5" /> Спільний холодильник
          </span>
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {{ inviteInfo.fridge_name }}
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Вас запросили керувати спільними продуктами та плануванням
          </p>
        </div>

        <div v-if="authStore.isAuthenticated" class="space-y-3">
          <button
            type="button"
            :disabled="joining"
            @click="handleJoin"
            class="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium text-xs shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Loader2 v-if="joining" class="w-4 h-4 animate-spin" />
            <template v-else>
              <span>Приєднатися до холодильника</span>
              <ArrowRight class="w-4 h-4" />
            </template>
          </button>
        </div>

        <div v-else class="space-y-3">
          <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">
            Для приєднання необхідно увійти або зареєструватися
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="router.push({ name: 'login', query: { redirect: route.fullPath } })"
              class="py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Увійти
            </button>
            <button
              type="button"
              @click="router.push({ name: 'register', query: { redirect: route.fullPath } })"
              class="py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-medium text-xs transition-colors cursor-pointer"
            >
              Реєстрація
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
