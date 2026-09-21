<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import {
  Refrigerator,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Sun,
  Moon
} from 'lucide-vue-next'
import GoogleSignInButton from '@/components/GoogleSignInButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()

const step = ref<'form' | 'verification'>('form')

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const verificationCode = ref('')

const errorMessage = ref('')
const successMessage = ref('')
const devCode = ref<string | null>(null)
const resendCooldown = ref(0)
let cooldownTimer: any = null

function startCooldown(seconds = 60) {
  resendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
    } else {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

async function handleInitiateRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!name.value || !email.value || !password.value) {
    errorMessage.value = "Будь ласка, заповніть всі обов'язкові поля"
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Пароль має містити щонайменше 8 символів'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Паролі не співпадають'
    return
  }

  try {
    const res = await authStore.register(email.value, name.value, password.value)
    if (res.dev_code) {
      devCode.value = res.dev_code
    }
    step.value = 'verification'
    startCooldown(60)
  } catch (err: any) {
    errorMessage.value = err.message || 'Помилка під час реєстрації'
  }
}

async function handleConfirmCode() {
  errorMessage.value = ''
  successMessage.value = ''

  const cleanCode = verificationCode.value.trim()
  if (!cleanCode) {
    errorMessage.value = 'Будь ласка, введіть 6-значний код підтвердження'
    return
  }

  if (cleanCode.length !== 6) {
    errorMessage.value = 'Код має складатись з 6 цифр'
    return
  }

  try {
    await authStore.confirmRegistration(email.value, cleanCode)
    router.push({ name: 'home' })
  } catch (err: any) {
    errorMessage.value = err.message || 'Невірний або застарілий код підтвердження'
  }
}

async function handleResendCode() {
  if (resendCooldown.value > 0 || authStore.loading) return
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const res = await authStore.resendVerificationCode(email.value)
    if (res.dev_code) {
      devCode.value = res.dev_code
    }
    successMessage.value = 'Новий код надіслано на вашу пошту!'
    startCooldown(60)
  } catch (err: any) {
    errorMessage.value = err.message || 'Не вдалося повторно надіслати код'
  }
}

function handlePasteDevCode() {
  if (devCode.value) {
    verificationCode.value = devCode.value
  }
}

function handleBackToForm() {
  step.value = 'form'
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 relative bg-zinc-50 dark:bg-[#09090b] transition-colors duration-200 overflow-hidden">
    <!-- Ambient glow decoration -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      <div class="w-[500px] h-[500px] bg-violet-400/10 dark:bg-violet-600/15 rounded-full blur-3xl -translate-y-12"></div>
      <div class="w-[360px] h-[360px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-3xl translate-y-24 translate-x-20"></div>
    </div>

    <!-- Top-Right Theme Switcher Pill -->
    <div class="fixed top-3.5 right-3.5 sm:top-5 sm:right-5 z-20">
      <button
        type="button"
        @click="toggleTheme"
        class="px-3 py-2 rounded-2xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-violet-600 dark:hover:text-violet-400 bg-white/90 dark:bg-[#121217]/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
        :title="isDark ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему'"
        aria-label="Перемикач теми"
      >
        <Sun v-if="isDark" class="w-4 h-4 text-amber-500 shrink-0" />
        <Moon v-else class="w-4 h-4 text-violet-600 shrink-0" />
        <span class="text-xs font-semibold">{{ isDark ? 'Темна тема' : 'Світла тема' }}</span>
      </button>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-violet-500/20">
          <Refrigerator class="w-7 h-7" />
        </div>
      </div>
      <h2 class="text-center text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
        {{ step === 'form' ? 'Створити акаунт' : 'Підтвердження пошти' }}
      </h2>
      <p class="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {{ step === 'form' ? 'Приєднуйтесь до E-Fridge та контролюйте ваші продукти' : 'Залишився один крок для активації акаунту' }}
      </p>
    </div>

    <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div class="bg-white/95 dark:bg-[#121217]/95 backdrop-blur-md py-7 sm:py-8 px-5 sm:px-8 shadow-sm border border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
        <!-- Error alert -->
        <div
          v-if="errorMessage"
          class="mb-5 flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Success alert -->
        <div
          v-if="successMessage"
          class="mb-5 flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- STEP 1: Registration Form -->
        <form v-if="step === 'form'" @submit.prevent="handleInitiateRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Ім'я</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <UserIcon class="w-4 h-4" />
              </div>
              <input
                v-model="name"
                type="text"
                required
                placeholder="Ваше ім'я"
                class="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

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
                class="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
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
                placeholder="Мінімум 8 символів"
                class="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">Підтвердження паролю</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock class="w-4 h-4" />
              </div>
              <input
                v-model="confirmPassword"
                type="password"
                required
                placeholder="Повторіть пароль"
                class="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="authStore.loading"
              class="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-sm shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <span v-if="authStore.loading">Надсилання коду...</span>
              <template v-else>
                <span>Продовжити</span>
                <ArrowRight class="w-4 h-4" />
              </template>
            </button>
          </div>
        </form>

        <GoogleSignInButton v-if="step === 'form'" mode="register" />

        <!-- STEP 2: Email Verification Code -->
        <div v-else class="space-y-5">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-3 border border-violet-200/80 dark:border-violet-800">
              <Mail class="w-6 h-6" />
            </div>
            <p class="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Ми надіслали лист із 6-значним кодом на адресу:<br />
              <span class="font-semibold text-zinc-800 dark:text-zinc-100">{{ email }}</span>
            </p>
            <button
              type="button"
              @click="handleBackToForm"
              class="mt-1 text-xs text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ArrowLeft class="w-3 h-3" />
              <span>Змінити адресу</span>
            </button>
          </div>

          <!-- Dev mode helper badge -->
          <div
            v-if="devCode"
            class="p-3 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200"
          >
            <div class="flex items-center gap-2">
              <KeyRound class="w-4 h-4 text-amber-600 shrink-0" />
              <span>Тестовий код: <strong class="tracking-widest font-mono text-sm font-bold text-amber-950 dark:text-amber-100">{{ devCode }}</strong></span>
            </div>
            <button
              type="button"
              @click="handlePasteDevCode"
              class="px-2 py-1 bg-amber-200/70 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              Вставити
            </button>
          </div>

          <form @submit.prevent="handleConfirmCode" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 text-center">Код підтвердження</label>
              <div class="relative">
                <input
                  v-model="verificationCode"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  required
                  placeholder="123456"
                  class="w-full text-center tracking-[0.5em] font-mono text-xl py-3 px-4 bg-zinc-50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="authStore.loading || verificationCode.length < 6"
              class="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.99] text-white text-sm font-semibold rounded-2xl shadow-sm shadow-violet-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <span v-if="authStore.loading">Підтвердження...</span>
              <template v-else>
                <span>Підтвердити та створити акаунт</span>
                <CheckCircle2 class="w-4 h-4" />
              </template>
            </button>
          </form>

          <!-- Resend section -->
          <div class="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            <span v-if="resendCooldown > 0" class="text-zinc-400 dark:text-zinc-500">
              Надіслати код повторно через {{ resendCooldown }} с
            </span>
            <button
              v-else
              type="button"
              :disabled="authStore.loading"
              @click="handleResendCode"
              class="text-violet-600 dark:text-violet-400 font-semibold hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': authStore.loading }" />
              <span>Надіслати код повторно</span>
            </button>
          </div>
        </div>

        <div class="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Вже маєте акаунт?
          <router-link
            :to="{ name: 'login' }"
            class="text-violet-600 dark:text-violet-400 font-semibold hover:underline ml-1"
          >
            Увійти
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
