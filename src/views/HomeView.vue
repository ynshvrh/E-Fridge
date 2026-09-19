<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import {
  Refrigerator,
  LogOut,
  Plus,
  CheckCircle2,
  PackageOpen,
  CookingPot,
  Sparkles,
  ChevronDown
} from 'lucide-vue-next'
import type { Fridge } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const isCreatingFridge = ref(false)
const newFridgeName = ref('')
const isFridgeMenuOpen = ref(false)

async function createFridge() {
  if (!newFridgeName.value.trim()) return
  try {
    const created = await api.post<Fridge>('/fridges', { name: newFridgeName.value.trim() })
    authStore.fridges.push(created)
    authStore.selectFridge(created.id)
    newFridgeName.value = ''
    isCreatingFridge.value = false
    isFridgeMenuOpen.value = false
  } catch (err: any) {
    alert(err.message || 'Не вдалося створити холодильник')
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-full pb-12">
    <!-- Navigation / Top Bar -->
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-stone-200/60">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Refrigerator class="w-5 h-5" />
          </div>
          <div>
            <h1 class="font-semibold text-base text-stone-800 leading-none">E-Fridge</h1>
            <span class="text-[11px] text-stone-400">Розумна кухня</span>
          </div>
        </div>

        <!-- User & Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Fridge Switcher Dropdown -->
          <div class="relative">
            <button
              @click="isFridgeMenuOpen = !isFridgeMenuOpen"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100/80 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <span class="truncate max-w-[120px]">{{ authStore.currentFridge?.name || 'Холодильник' }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-stone-400" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isFridgeMenuOpen"
              class="absolute right-0 mt-2 w-56 bg-white border border-stone-200/80 rounded-2xl shadow-lg py-1.5 z-30"
            >
              <div class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Ваші холодильники
              </div>
              <button
                v-for="fridge in authStore.fridges"
                :key="fridge.id"
                @click="authStore.selectFridge(fridge.id); isFridgeMenuOpen = false"
                class="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-emerald-50/70 hover:text-emerald-800 flex items-center justify-between"
              >
                <span>{{ fridge.name }}</span>
                <CheckCircle2
                  v-if="authStore.currentFridgeId === fridge.id"
                  class="w-3.5 h-3.5 text-emerald-600"
                />
              </button>

              <div class="border-t border-stone-100 my-1"></div>

              <button
                @click="isCreatingFridge = true; isFridgeMenuOpen = false"
                class="w-full text-left px-3 py-2 text-xs text-emerald-700 font-medium hover:bg-emerald-50/70 flex items-center gap-1.5"
              >
                <Plus class="w-3.5 h-3.5" />
                Додати новий
              </button>
            </div>
          </div>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            title="Вийти"
            class="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100/60 rounded-xl transition-colors"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content: Centered & Soft -->
    <main class="max-w-2xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      <!-- Welcome Greeting Card -->
      <div class="bg-gradient-to-br from-emerald-50/60 via-white to-stone-50/50 p-6 rounded-3xl border border-emerald-100/60 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-stone-800">
              Привіт, {{ authStore.user?.name }}! 👋
            </h2>
            <p class="text-xs text-stone-500 mt-0.5">
              Активний простір: <span class="font-medium text-emerald-700">{{ authStore.currentFridge?.name }}</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-full bg-emerald-100/80 flex items-center justify-center text-emerald-800 text-sm font-semibold">
            {{ authStore.user?.name.charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>

      <!-- Quick Action / Status cards -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white p-4 rounded-2xl border border-stone-200/60 text-center shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <PackageOpen class="w-4 h-4" />
          </div>
          <div class="text-xs text-stone-500">Продукти</div>
          <div class="text-base font-semibold text-stone-800 mt-0.5">0</div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-stone-200/60 text-center shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <CookingPot class="w-4 h-4" />
          </div>
          <div class="text-xs text-stone-500">Готові страви</div>
          <div class="text-base font-semibold text-stone-800 mt-0.5">0</div>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-stone-200/60 text-center shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
            <Sparkles class="w-4 h-4" />
          </div>
          <div class="text-xs text-stone-500">AI Шеф</div>
          <div class="text-base font-semibold text-stone-800 mt-0.5">Готовий</div>
        </div>
      </div>

      <!-- Placeholder for Next Module -->
      <div class="bg-white p-6 rounded-3xl border border-stone-200/60 text-center shadow-sm space-y-3">
        <div class="inline-flex p-3 rounded-2xl bg-stone-50 border border-stone-100 text-stone-400">
          <PackageOpen class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-medium text-stone-800 text-sm">Модуль продуктів на черзі</h3>
          <p class="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Авторизацію та керування холодильниками успішно налаштовано. Наступним кроком буде додавання та трекінг продуктів.
          </p>
        </div>
      </div>
    </main>

    <!-- Modal Create Fridge -->
    <div
      v-if="isCreatingFridge"
      class="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/60">
        <h3 class="text-base font-semibold text-stone-800 mb-2">Новий холодильник</h3>
        <p class="text-xs text-stone-500 mb-4">Вкажіть назву для нового простору зберігання продуктів.</p>

        <input
          v-model="newFridgeName"
          type="text"
          placeholder="Наприклад: Дача або Офіс"
          class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mb-4"
          @keyup.enter="createFridge"
        />

        <div class="flex gap-2">
          <button
            @click="isCreatingFridge = false"
            class="flex-1 py-2 px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Скасувати
          </button>
          <button
            @click="createFridge"
            class="flex-1 py-2 px-3 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
          >
            Створити
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
