<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { Refrigerator, ArrowRight, Lock, Mail, AlertCircle, Sun, Moon } from 'lucide-vue-next'
import GoogleSignInButton from '@/components/GoogleSignInButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  if (!email.value || !password.value) {
    errorMessage.value = 'Будь ласка, заповніть усі поля'
    return
  }

  try {
    await authStore.login(email.value, password.value)
    router.push({ name: 'home' })
  } catch (err: any) {
    errorMessage.value = err.message || 'Невірний email або пароль'
  }
}
</script>

<template>
  <div class="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 relative">
    <!-- Top-Right Theme Switcher -->
    <div class="fixed top-4 right-4 z-20">
      <button
        type="button"
        @click="toggleTheme"
        class="p-2.5 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800 shadow-sm transition cursor-pointer flex items-center justify-center active:scale-95"
        :title="isDark ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему'"
        aria-label="Перемикач теми"
      >
        <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
      </button>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Brand Header -->
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-violet-500/20">
          <Refrigerator class="w-7 h-7" />
        </div>
      </div>
      <h2 class="text-center text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
        Вхід до E-Fridge
      </h2>
      <p class="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Ваш розумний простір для продуктів та рецептів
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-[#121217] py-8 px-6 sm:px-8 shadow-sm border border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
        <!-- Error alert -->
        <div
          v-if="errorMessage"
          class="mb-5 flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Email</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Mail class="w-4 h-4" />
              </div>
              <input
                v-model="email"
                type="email"
                required
                placeholder="name@example.com"
                class="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Пароль</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-sm shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <span v-if="authStore.loading">Вхід...</span>
              <template v-else>
                <span>Увійти</span>
                <ArrowRight class="w-4 h-4" />
              </template>
            </button>
          </div>
        </form>

        <GoogleSignInButton mode="login" />

        <div class="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Ще не маєте акаунту?
          <router-link
            :to="{ name: 'register' }"
            class="text-violet-600 dark:text-violet-400 font-semibold hover:underline ml-1"
          >
            Зареєструватися
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
