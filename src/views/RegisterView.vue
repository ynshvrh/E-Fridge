<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
} from 'lucide-vue-next'
import GoogleSignInButton from '@/components/GoogleSignInButton.vue'

const router = useRouter()
const authStore = useAuthStore()

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
  <div class="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-4">
        <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-sm">
          <Refrigerator class="w-7 h-7" />
        </div>
      </div>
      <h2 class="text-center text-2xl font-semibold text-stone-800 tracking-tight">
        {{ step === 'form' ? 'Створити акаунт' : 'Підтвердження пошти' }}
      </h2>
      <p class="mt-1 text-center text-sm text-stone-500">
        {{ step === 'form' ? 'Приєднуйтесь до E-Fridge та контролюйте ваші продукти' : 'Залишився один крок для активації акаунту' }}
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

        <!-- Success alert -->
        <div
          v-if="successMessage"
          class="mb-5 flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-emerald-700 text-sm"
        >
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- STEP 1: Registration Form -->
        <form v-if="step === 'form'" @submit.prevent="handleInitiateRegister" class="space-y-4">
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
                placeholder="Мінімум 8 символів"
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
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
              <Mail class="w-6 h-6" />
            </div>
            <p class="text-sm text-stone-600 leading-relaxed">
              Ми надіслали лист із 6-значним кодом на адресу:<br />
              <span class="font-semibold text-stone-800">{{ email }}</span>
            </p>
            <button
              type="button"
              @click="handleBackToForm"
              class="mt-1 text-xs text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <ArrowLeft class="w-3 h-3" />
              <span>Змінити адресу</span>
            </button>
          </div>

          <!-- Dev mode helper badge -->
          <div
            v-if="devCode"
            class="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900"
          >
            <div class="flex items-center gap-2">
              <KeyRound class="w-4 h-4 text-amber-600 shrink-0" />
              <span>Тестовий код: <strong class="tracking-widest font-mono text-sm font-bold text-amber-950">{{ devCode }}</strong></span>
            </div>
            <button
              type="button"
              @click="handlePasteDevCode"
              class="px-2 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-medium rounded-lg text-[11px] transition-colors"
            >
              Вставити
            </button>
          </div>

          <form @submit.prevent="handleConfirmCode" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-stone-600 mb-1.5 text-center">Код підтвердження</label>
              <div class="relative">
                <input
                  v-model="verificationCode"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  required
                  placeholder="123456"
                  class="w-full text-center tracking-[0.5em] font-mono text-xl py-3 px-4 bg-stone-50/60 hover:bg-stone-50 focus:bg-white text-stone-800 rounded-2xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              :disabled="authStore.loading || verificationCode.length < 6"
              class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-medium rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span v-if="authStore.loading">Підтвердження...</span>
              <template v-else>
                <span>Підтвердити та створити акаунт</span>
                <CheckCircle2 class="w-4 h-4" />
              </template>
            </button>
          </form>

          <!-- Resend section -->
          <div class="pt-2 text-center text-xs text-stone-500">
            <span v-if="resendCooldown > 0" class="text-stone-400">
              Надіслати код повторно через {{ resendCooldown }} с
            </span>
            <button
              v-else
              type="button"
              :disabled="authStore.loading"
              @click="handleResendCode"
              class="text-emerald-700 font-medium hover:underline inline-flex items-center gap-1.5"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': authStore.loading }" />
              <span>Надіслати код повторно</span>
            </button>
          </div>
        </div>

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
