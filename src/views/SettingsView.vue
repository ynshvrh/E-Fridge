<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import {
  Settings,
  User as UserIcon,
  Users,
  KeyRound,
  CheckCircle2,
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Sun,
  Moon
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, setTheme } = useTheme()

type Tab = 'profile' | 'fridge' | 'security'
const activeTab = ref<Tab>('profile')

const successNotice = ref<string | null>(null)
const errorNotice = ref<string | null>(null)
const isSaving = ref(false)

// Profile Form
const name = ref(authStore.user?.name || '')
const dietaryProfile = ref(authStore.user?.dietary_preferences || '')
const cuisine = ref(authStore.user?.cuisine_preference || 'any')
const language = ref(authStore.user?.preferred_language || 'uk')

// Password Form
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Member Form
const inviteEmail = ref('')
const inviteRole = ref('member')

// Account Deletion Modal
const showDeleteModal = ref(false)
const deleteConfirmationText = ref('')
const isDeleting = ref(false)

const dietaryPresets = [
  'Без цукру',
  'Без глютену',
  'Без лактози',
  'Вегетаріанське',
  'Веганське',
  'Кето',
  'Високобілкове',
  'Низькокалорійне',
]

const cuisines = [
  { id: 'any', label: 'Універсальна (без обмежень)' },
  { id: 'ukrainian', label: 'Українська кухня' },
  { id: 'italian', label: 'Італійська кухня' },
  { id: 'asian', label: 'Паназійська / Східна' },
  { id: 'mediterranean', label: 'Середземноморська' },
  { id: 'american', label: 'Американська' },
]

watch(
  () => authStore.user,
  (u) => {
    if (u) {
      if (!name.value) name.value = u.name || ''
      if (!dietaryProfile.value) dietaryProfile.value = u.dietary_preferences || ''
      if (cuisine.value === 'any' && u.cuisine_preference) cuisine.value = u.cuisine_preference
      if (language.value === 'uk' && u.preferred_language) language.value = u.preferred_language
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (authStore.currentFridgeId) {
    await authStore.fetchFridgeDetails(authStore.currentFridgeId)
  }
})

function toggleDietPreset(preset: string) {
  const items = dietaryProfile.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const idx = items.indexOf(preset)
  if (idx >= 0) {
    items.splice(idx, 1)
  } else {
    items.push(preset)
  }
  dietaryProfile.value = items.join(', ')
}

function isPresetActive(preset: string): boolean {
  return dietaryProfile.value.toLowerCase().includes(preset.toLowerCase())
}

async function handleSaveProfile() {
  if (!name.value.trim()) {
    showError("Ім'я не може бути порожнім")
    return
  }
  isSaving.value = true
  clearNotices()
  try {
    await authStore.updateProfile({
      name: name.value.trim(),
      dietary_preferences: dietaryProfile.value.trim(),
      cuisine_preference: cuisine.value,
      preferred_language: language.value,
    })
    showNotice('Профіль успішно оновлено!')
  } catch (err: any) {
    showError(err.message || 'Помилка оновлення профілю')
  } finally {
    isSaving.value = false
  }
}

async function handleChangePassword() {
  if (newPassword.value !== confirmPassword.value) {
    showError('Нові паролі не збігаються!')
    return
  }
  if (newPassword.value.length < 8) {
    showError('Пароль має містити щонайменше 8 символів')
    return
  }

  isSaving.value = true
  clearNotices()
  try {
    await authStore.updatePassword(oldPassword.value, newPassword.value)
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showNotice('Пароль успішно змінено!')
  } catch (err: any) {
    showError(err.message || 'Помилка зміни пароля')
  } finally {
    isSaving.value = false
  }
}

async function handleInviteMember() {
  if (!inviteEmail.value.trim() || !authStore.currentFridgeId) return
  clearNotices()
  try {
    await authStore.addFridgeMember(authStore.currentFridgeId, inviteEmail.value.trim(), inviteRole.value)
    inviteEmail.value = ''
    showNotice('Учасника успішно додано до холодильника!')
  } catch (err: any) {
    showError(err.message || 'Помилка додавання учасника')
  }
}

async function handleRemoveMember(userId: string) {
  if (!authStore.currentFridgeId || !confirm('Вилучити цього учасника?')) return
  clearNotices()
  try {
    await authStore.removeFridgeMember(authStore.currentFridgeId, userId)
    showNotice('Учасника вилучено')
  } catch (err: any) {
    showError(err.message || 'Помилка вилучення')
  }
}

async function handleDeleteAccount() {
  if (deleteConfirmationText.value.trim().toUpperCase() !== 'ВИДАЛИТИ') {
    showError('Введіть слово ВИДАЛИТИ для підтвердження')
    return
  }

  isDeleting.value = true
  clearNotices()
  try {
    await authStore.deleteAccount()
    showDeleteModal.value = false
    router.push('/register')
  } catch (err: any) {
    showError(err.message || 'Не вдалося видалити акаунт')
  } finally {
    isDeleting.value = false
  }
}

function showNotice(msg: string) {
  successNotice.value = msg
  setTimeout(() => {
    if (successNotice.value === msg) successNotice.value = null
  }, 4000)
}

function showError(msg: string) {
  errorNotice.value = msg
  setTimeout(() => {
    if (errorNotice.value === msg) errorNotice.value = null
  }, 5000)
}

function clearNotices() {
  successNotice.value = null
  errorNotice.value = null
}
</script>

<template>
  <div class="space-y-3.5 sm:space-y-5 max-w-4xl mx-auto pb-6 sm:pb-10">
    <!-- Header Banner -->
    <div
      class="bg-gradient-to-br from-violet-50/70 via-white to-emerald-50/30 dark:from-[#121217] dark:via-[#121217] dark:to-violet-950/20 p-3.5 sm:p-5 rounded-3xl border border-violet-100/70 dark:border-zinc-800 shadow-xs flex items-center justify-between flex-wrap gap-2.5 sm:gap-3"
    >
      <div class="flex items-center gap-2.5 sm:gap-3">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center shadow-xs shrink-0">
          <Settings class="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 class="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">Налаштування профілю</h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Керуйте персональними даними, дієтою, темою інтерфейсу та доступом</p>
        </div>
      </div>
    </div>

    <!-- Notices -->
    <div
      v-if="successNotice"
      class="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 text-xs flex items-center justify-between shadow-xs transition-all"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
        <span>{{ successNotice }}</span>
      </div>
      <button type="button" @click="successNotice = null" class="cursor-pointer"><X class="w-4 h-4" /></button>
    </div>

    <div
      v-if="errorNotice"
      class="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs transition-all"
    >
      <span>{{ errorNotice }}</span>
      <button type="button" @click="errorNotice = null" class="cursor-pointer"><X class="w-4 h-4" /></button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-zinc-200/80 dark:border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
      <button
        type="button"
        @click="activeTab = 'profile'"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'profile'
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs'
            : 'bg-white dark:bg-[#121217] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800',
        ]"
      >
        <UserIcon class="w-3.5 h-3.5" />
        <span>Профіль & Дієта</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'fridge'"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'fridge'
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs'
            : 'bg-white dark:bg-[#121217] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800',
        ]"
      >
        <Users class="w-3.5 h-3.5" />
        <span>Холодильник & Доступ</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'security'"
        :class="[
          'px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer',
          activeTab === 'security'
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs'
            : 'bg-white dark:bg-[#121217] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800',
        ]"
      >
        <KeyRound class="w-3.5 h-3.5" />
        <span>Безпека & Акаунт</span>
      </button>
    </div>

    <!-- Tab 1: Profile & Diet -->
    <div v-if="activeTab === 'profile'" class="bg-white dark:bg-[#121217] p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
      <!-- Theme Switcher in Profile -->
      <div>
        <label class="block font-medium text-zinc-700 dark:text-zinc-300 text-xs mb-2">Тема інтерфейсу</label>
        <div class="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            @click="setTheme('light')"
            :class="[
              'p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left cursor-pointer',
              !isDark
                ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 ring-2 ring-violet-500/20 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
            ]"
          >
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Sun class="w-4 h-4" />
            </div>
            <div>
              <div class="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Світла</div>
              <div class="text-[10px] text-zinc-400">Денний режим</div>
            </div>
          </button>

          <button
            type="button"
            @click="setTheme('dark')"
            :class="[
              'p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left cursor-pointer',
              isDark
                ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 ring-2 ring-violet-500/20 shadow-xs'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
            ]"
          >
            <div class="w-8 h-8 rounded-xl bg-violet-950/80 text-violet-400 flex items-center justify-center shrink-0">
              <Moon class="w-4 h-4" />
            </div>
            <div>
              <div class="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Темна</div>
              <div class="text-[10px] text-zinc-400">Нічний режим</div>
            </div>
          </button>
        </div>
      </div>

      <div class="border-t border-zinc-100 dark:border-zinc-800"></div>

      <form @submit.prevent="handleSaveProfile" class="space-y-4 text-xs">
        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ваше ім'я *</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Введіть ваше ім'я"
            class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Дієтичні обмеження та особливості</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="preset in dietaryPresets"
              :key="preset"
              type="button"
              @click="toggleDietPreset(preset)"
              :class="[
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                isPresetActive(preset)
                  ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-500 text-violet-800 dark:text-violet-300'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700',
              ]"
            >
              {{ preset }}
            </button>
          </div>
          <input
            v-model="dietaryProfile"
            type="text"
            placeholder="Або введіть власні: алергія на горіхи, без солі..."
            class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        <div>
          <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Улюблена кухня</label>
          <select
            v-model="cuisine"
            class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          >
            <option v-for="c in cuisines" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </div>

        <div class="pt-2">
          <button
            type="submit"
            :disabled="isSaving"
            class="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-xs font-medium transition-all cursor-pointer flex items-center gap-2"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <span>{{ isSaving ? 'Збереження...' : 'Зберегти зміни' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Tab 2: Fridge & Members -->
    <div v-if="activeTab === 'fridge'" class="bg-white dark:bg-[#121217] p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5">
      <div>
        <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Поточний холодильник: {{ authStore.currentFridge?.name }}</h3>
        <p class="text-xs text-zinc-400 mt-0.5">Учасники мають спільний доступ до продуктів та списку покупок</p>
      </div>

      <!-- Members List -->
      <div class="space-y-2">
        <div
          v-for="mem in authStore.currentFridge?.members || []"
          :key="mem.id"
          class="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/70 dark:border-zinc-700 flex items-center justify-between text-xs"
        >
          <div>
            <div class="font-medium text-zinc-800 dark:text-zinc-100">{{ mem.name }}</div>
            <div class="text-[11px] text-zinc-400">{{ mem.email }}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 rounded-md font-medium text-[10px]">
              {{ mem.role === 'owner' ? 'Власник' : 'Учасник' }}
            </span>
            <button
              v-if="mem.role !== 'owner' && authStore.currentFridge?.role === 'owner'"
              type="button"
              @click="handleRemoveMember(mem.id)"
              class="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Invite form -->
      <div class="pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <h4 class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Запросити учасника за email</h4>
        <form @submit.prevent="handleInviteMember" class="flex flex-col sm:flex-row gap-2 text-xs">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="Введіть email користувача..."
            required
            class="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-xs cursor-pointer"
          >
            Запросити
          </button>
        </form>
      </div>
    </div>

    <!-- Tab 3: Security & Danger Zone -->
    <div v-if="activeTab === 'security'" class="space-y-6">
      <!-- Change Password -->
      <div class="bg-white dark:bg-[#121217] p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
        <div>
          <h3 class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Зміна пароля</h3>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Оновіть свій пароль для безпеки облікового запису</p>
        </div>

        <form @submit.prevent="handleChangePassword" class="space-y-3.5 text-xs max-w-sm">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Поточний пароль *</label>
            <input
              v-model="oldPassword"
              type="password"
              required
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Новий пароль (від 8 символів) *</label>
            <input
              v-model="newPassword"
              type="password"
              required
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Підтвердження нового пароля *</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            :disabled="isSaving"
            class="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-xs font-medium transition-all cursor-pointer"
          >
            {{ isSaving ? 'Оновлення...' : 'Змінити пароль' }}
          </button>
        </form>
      </div>

      <!-- Danger Zone: Delete Account -->
      <div class="bg-rose-50/50 dark:bg-rose-950/20 p-6 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-rose-900 dark:text-rose-200">Небезпечна зона</h3>
            <p class="text-xs text-rose-700 dark:text-rose-400">Видалення вашого профілю та пов'язаних даних</p>
          </div>
        </div>

        <p class="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Після видалення профілю будуть назавжди видалені всі ваші створені холодильники, списки продуктів, щоденник калорій, плани харчування та історія діалогів із шефом. Цю дію неможливо скасувати.
        </p>

        <div>
          <button
            type="button"
            @click="showDeleteModal = true; deleteConfirmationText = ''"
            class="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Trash2 class="w-4 h-4" />
            <span>Видалити акаунт назавжди</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Delete Account Confirmation -->
    <Teleport to="body">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div
          class="bg-white dark:bg-[#121217] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5 animate-in zoom-in-95 duration-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100">Видалити акаунт?</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">Цю дію неможливо скасувати</p>
            </div>
          </div>

          <p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Ви впевнені, що хочете видалити свій профіль? Усі збережені продукти, плани харчування та налаштування буде безповоротно втрачено.
          </p>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Введіть слово <span class="font-bold text-rose-600 dark:text-rose-400 tracking-wider">ВИДАЛИТИ</span> для підтвердження:
            </label>
            <input
              v-model="deleteConfirmationText"
              type="text"
              placeholder="ВИДАЛИТИ"
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-xl border border-rose-300 dark:border-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              @click="showDeleteModal = false"
              class="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="button"
              :disabled="deleteConfirmationText.trim().toUpperCase() !== 'ВИДАЛИТИ' || isDeleting"
              @click="handleDeleteAccount"
              class="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Loader2 v-if="isDeleting" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isDeleting ? 'Видалення...' : 'Так, видалити назавжди' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
