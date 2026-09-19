<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  Settings,
  User as UserIcon,
  Sparkles,
  Users,
  KeyRound,
  CheckCircle2,
  X,
  Trash2,
  Cpu
} from 'lucide-vue-next'

const authStore = useAuthStore()

type Tab = 'profile' | 'ai' | 'fridge' | 'security'
const activeTab = ref<Tab>('profile')

const successNotice = ref<string | null>(null)
const errorNotice = ref<string | null>(null)
const isSaving = ref(false)

// Profile Form
const name = ref(authStore.user?.name || '')
const dietaryProfile = ref(authStore.user?.dietary_preferences || '')
const cuisine = ref(authStore.user?.cuisine_preference || 'any')
const language = ref(authStore.user?.preferred_language || 'uk')
const preferredModel = ref(authStore.user?.preferred_model || '')

// Password Form
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Member Form
const inviteEmail = ref('')
const inviteRole = ref('member')

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

const models = [
  { id: '', label: 'Автоматичний розумний вибір (Рекомендовано)' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Найрозумніший кулінарний AI)' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (Швидкий та збалансований)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B Free (Безкоштовний)' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
]

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
  isSaving.value = true
  clearNotices()
  try {
    await authStore.updateProfile({
      name: name.value.trim(),
      dietary_preferences: dietaryProfile.value.trim(),
      cuisine_preference: cuisine.value,
      preferred_language: language.value,
      preferred_model: preferredModel.value,
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
  if (newPassword.value.length < 6) {
    showError('Пароль має містити щонайменше 6 символів')
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
  <div class="space-y-5">
    <!-- Header Banner -->
    <div class="bg-gradient-to-br from-stone-50 via-white to-emerald-50/40 p-5 rounded-3xl border border-stone-200/70 shadow-sm flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center shadow-xs">
          <Settings class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-stone-800">Налаштування</h2>
          <p class="text-xs text-stone-500">Керуйте персональними даними, дієтою, ШІ та спільним доступом</p>
        </div>
      </div>
    </div>

    <!-- Notices -->
    <div v-if="successNotice" class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{{ successNotice }}</span>
      </div>
      <button @click="successNotice = null"><X class="w-4 h-4" /></button>
    </div>

    <div v-if="errorNotice" class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
      <span>{{ errorNotice }}</span>
      <button @click="errorNotice = null"><X class="w-4 h-4" /></button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-stone-200/80 pb-2 overflow-x-auto scrollbar-none">
      <button
        @click="activeTab = 'profile'"
        :class="['px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all', activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60']"
      >
        <UserIcon class="w-3.5 h-3.5" />
        <span>Профіль & Дієта</span>
      </button>

      <button
        @click="activeTab = 'ai'"
        :class="['px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all', activeTab === 'ai' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60']"
      >
        <Cpu class="w-3.5 h-3.5" />
        <span>ШІ Моделі (OpenRouter)</span>
      </button>

      <button
        @click="activeTab = 'fridge'"
        :class="['px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all', activeTab === 'fridge' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60']"
      >
        <Users class="w-3.5 h-3.5" />
        <span>Холодильник & Доступ</span>
      </button>

      <button
        @click="activeTab = 'security'"
        :class="['px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all', activeTab === 'security' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/60']"
      >
        <KeyRound class="w-3.5 h-3.5" />
        <span>Безпека</span>
      </button>
    </div>

    <!-- Tab 1: Profile & Diet -->
    <div v-if="activeTab === 'profile'" class="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
      <form @submit.prevent="handleSaveProfile" class="space-y-4 text-xs">
        <div>
          <label class="block font-medium text-stone-700 mb-1">Ваше ім'я</label>
          <input v-model="name" type="text" required class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200" />
        </div>

        <div>
          <label class="block font-medium text-stone-700 mb-1.5">Дієтичні обмеження та особливості</label>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="preset in dietaryPresets"
              :key="preset"
              type="button"
              @click="toggleDietPreset(preset)"
              :class="['px-2.5 py-1 rounded-lg text-xs font-medium border transition-all', isPresetActive(preset) ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100']"
            >
              {{ preset }}
            </button>
          </div>
          <input v-model="dietaryProfile" type="text" placeholder="Або введіть власні: алергія на горіхи, без солі..." class="w-full px-3.5 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200" />
        </div>

        <div>
          <label class="block font-medium text-stone-700 mb-1">Улюблена кухня</label>
          <select v-model="cuisine" class="w-full px-3.5 py-2.5 bg-stone-50 text-xs rounded-xl border border-stone-200">
            <option v-for="c in cuisines" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </div>

        <button type="submit" :disabled="isSaving" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs font-medium transition-all">
          {{ isSaving ? 'Збереження...' : 'Зберегти зміни' }}
        </button>
      </form>
    </div>

    <!-- Tab 2: AI Multi-tier & OpenRouter -->
    <div v-if="activeTab === 'ai'" class="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
      <div class="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl text-xs space-y-2 text-teal-900">
        <div class="font-semibold flex items-center gap-1.5">
          <Sparkles class="w-4 h-4 text-teal-600" />
          <span>Дворівнева розумна архітектура моделей</span>
        </div>
        <p class="leading-relaxed text-teal-800">
          • <strong>Швидкий/Безкоштовний рівень (Fast Tier):</strong> використовується для швидких порад, чату, сортування та відповідей на кулінарні запитання.<br>
          • <strong>Глибокий рівень (Smart Tier - Claude 3.5 Sonnet):</strong> автоматично підключається для генерації авторських рецептів та тижневого збалансованого плану харчування.
        </p>
      </div>

      <form @submit.prevent="handleSaveProfile" class="space-y-4 text-xs">
        <div>
          <label class="block font-medium text-stone-700 mb-1">Бажана модель AI Шефа</label>
          <select v-model="preferredModel" class="w-full px-3.5 py-2.5 bg-stone-50 text-xs rounded-xl border border-stone-200">
            <option v-for="m in models" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </div>

        <button type="submit" :disabled="isSaving" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs font-medium transition-all">
          {{ isSaving ? 'Збереження...' : 'Застосувати налаштування ШІ' }}
        </button>
      </form>
    </div>

    <!-- Tab 3: Fridge & Members -->
    <div v-if="activeTab === 'fridge'" class="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
      <div>
        <h3 class="text-sm font-semibold text-stone-800">Поточний холодильник: {{ authStore.currentFridge?.name }}</h3>
        <p class="text-xs text-stone-400 mt-0.5">Учасники мають спільний доступ до продуктів та списку покупок</p>
      </div>

      <!-- Members List -->
      <div class="space-y-2">
        <div
          v-for="mem in authStore.currentFridge?.members || []"
          :key="mem.id"
          class="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 flex items-center justify-between text-xs"
        >
          <div>
            <div class="font-medium text-stone-800">{{ mem.name }}</div>
            <div class="text-[11px] text-stone-400">{{ mem.email }}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-medium text-[10px]">
              {{ mem.role === 'owner' ? 'Власник' : 'Учасник' }}
            </span>
            <button
              v-if="mem.role !== 'owner' && authStore.currentFridge?.role === 'owner'"
              @click="handleRemoveMember(mem.id)"
              class="p-1 text-stone-400 hover:text-rose-600 transition-colors"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Invite form -->
      <div class="pt-3 border-t border-stone-100">
        <h4 class="text-xs font-semibold text-stone-700 mb-2">Запросити учасника за email</h4>
        <form @submit.prevent="handleInviteMember" class="flex gap-2 text-xs">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="Введіть email користувача..."
            required
            class="flex-1 px-3 py-2 bg-stone-50 rounded-xl border border-stone-200"
          />
          <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-2xs">
            Запросити
          </button>
        </form>
      </div>
    </div>

    <!-- Tab 4: Security / Password -->
    <div v-if="activeTab === 'security'" class="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-5">
      <form @submit.prevent="handleChangePassword" class="space-y-3.5 text-xs max-w-sm">
        <div>
          <label class="block font-medium text-stone-700 mb-1">Поточний пароль *</label>
          <input v-model="oldPassword" type="password" required class="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200" />
        </div>

        <div>
          <label class="block font-medium text-stone-700 mb-1">Новий пароль (від 6 символів) *</label>
          <input v-model="newPassword" type="password" required class="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200" />
        </div>

        <div>
          <label class="block font-medium text-stone-700 mb-1">Підтвердження нового пароля *</label>
          <input v-model="confirmPassword" type="password" required class="w-full px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200" />
        </div>

        <button type="submit" :disabled="isSaving" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs font-medium transition-all">
          {{ isSaving ? 'Оновлення...' : 'Змінити пароль' }}
        </button>
      </form>
    </div>
  </div>
</template>
