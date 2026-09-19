<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Refrigerator, ArrowRight, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  if (!name.value || !email.value || !password.value) {
    errorMessage.value = "Будь ласка, заповніть всі обов'язкові поля"
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Пароль має містити щонайменше 6 символів'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Паролі не співпадають'
    return
  }

  try {
    await authStore.register(email.value, name.value, password.value)
    router.push({ name: 'home' })
  } catch (err: any) {
    errorMessage.value = err.message || 'Помилка під час реєстрації'
  }
}
</script>

<template>
  <div class="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-sm">
          <Refrigerator class="w-7 h-7" />
        </div>
      </div>
      <h2 class="text-center text-2xl font-semibold text-stone-800 tracking-tight">
        Створити акаунт
      </h2>
      <p class="mt-1 text-center text-sm text-stone-500">
        Приєднуйтесь до E-Fridge та контролюйте ваші продукти
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 sm:px-8 shadow-sm border border-stone-200/60 rounded-3xl">
        <!-- Error alert -->
        <div
          v-if="errorMessage"
          class="mb-5 flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-700 text-sm"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1.5 ml-1">Ім'я</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <UserIcon class="w-4 h-4" />
              </div>
              <input
                v-model="name"
                type="text"
                required
                placeholder="Ваше ім'я"
                class="w-full pl-10 pr-4 py-2.5 bg-stone-50/60 hover:bg-stone-50 focus:bg-white text-stone-800 text-sm rounded-2xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1.5 ml-1">Email</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail class="w-4 h-4" />
              </div>
              <input
                v-model="email"
                type="email"
                required
                placeholder="name@example.com"
                class="w-full pl-10 pr-4 py-2.5 bg-stone-50/60 hover:bg-stone-50 focus:bg-white text-stone-800 text-sm rounded-2xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1.5 ml-1">Пароль</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="password"
                type="password"
                required
                placeholder="Мінімум 6 символів"
                class="w-full pl-10 pr-4 py-2.5 bg-stone-50/60 hover:bg-stone-50 focus:bg-white text-stone-800 text-sm rounded-2xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1.5 ml-1">Підтвердження паролю</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="confirmPassword"
                type="password"
                required
                placeholder="Повторіть пароль"
                class="w-full pl-10 pr-4 py-2.5 bg-stone-50/60 hover:bg-stone-50 focus:bg-white text-stone-800 text-sm rounded-2xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-medium rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span v-if="authStore.loading">Створення акаунту...</span>
              <template v-else>
                <span>Зареєструватися</span>
                <ArrowRight class="w-4 h-4" />
              </template>
            </button>
          </div>
        </form>

        <div class="mt-6 text-center text-xs text-stone-500">
          Вже маєте акаунт?
          <router-link
            :to="{ name: 'login' }"
            class="text-emerald-700 font-medium hover:underline ml-1"
          >
            Увійти
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
