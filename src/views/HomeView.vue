<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { api } from '@/services/api'
import FridgeView from '@/views/FridgeView.vue'
import NutritionView from '@/views/NutritionView.vue'
import ChefView from '@/views/ChefView.vue'
import ShoppingView from '@/views/ShoppingView.vue'
import SavedRecipesView from '@/views/SavedRecipesView.vue'
import PlannerView from '@/views/PlannerView.vue'
import SettingsView from '@/views/SettingsView.vue'
import {
  Refrigerator,
  LogOut,
  Plus,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Activity,
  ShoppingCart,
  BookHeart,
  CalendarDays,
  Settings,
  Sun,
  Moon,
  X
} from 'lucide-vue-next'
import type { Fridge } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()

// Navigation tabs
const currentTab = ref<'fridge' | 'nutrition' | 'chef' | 'shopping' | 'recipes' | 'planner' | 'settings'>('fridge')

// New Fridge Modal
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
  <div class="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex flex-col md:flex-row">
    <!-- Desktop Sidebar Navigation (Visible on md: and up) -->
    <aside class="hidden md:flex flex-col w-64 lg:w-72 shrink-0 h-screen sticky top-0 bg-white dark:bg-[#121217] border-r border-zinc-200/80 dark:border-zinc-800 transition-colors z-30 select-none">
      <!-- Brand Logo -->
      <div class="p-5 flex items-center gap-3 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/80" @click="currentTab = 'fridge'">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
          <Refrigerator class="w-5 h-5" />
        </div>
        <div>
          <span class="font-bold text-zinc-900 dark:text-zinc-100 text-base tracking-tight block leading-tight">
            E-Fridge
          </span>
          <span class="text-[11px] text-zinc-400 font-medium">
            Смарт-помічник
          </span>
        </div>
      </div>

      <!-- Workspace / Fridge Selector -->
      <div class="px-4 pt-4 pb-2">
        <div class="relative">
          <button
            type="button"
            @click="isFridgeMenuOpen = !isFridgeMenuOpen"
            class="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 rounded-2xl transition-colors border border-zinc-200/70 dark:border-zinc-700 cursor-pointer shadow-2xs"
          >
            <div class="flex items-center gap-2 truncate">
              <span class="w-2 h-2 rounded-full bg-violet-500 shrink-0"></span>
              <span class="truncate">{{ authStore.currentFridge?.name || 'Холодильник' }}</span>
            </div>
            <ChevronDown class="w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform" :class="{ 'rotate-180': isFridgeMenuOpen }" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="isFridgeMenuOpen"
            class="absolute left-0 right-0 mt-2 bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
          >
            <div class="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Ваші простори
            </div>
            <button
              type="button"
              v-for="fridge in authStore.fridges"
              :key="fridge.id"
              @click="authStore.selectFridge(fridge.id); isFridgeMenuOpen = false"
              class="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 dark:hover:text-violet-300 flex items-center justify-between transition cursor-pointer"
            >
              <span class="truncate">{{ fridge.name }}</span>
              <CheckCircle2
                v-if="authStore.currentFridgeId === fridge.id"
                class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0"
              />
            </button>
            <div class="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>
            <button
              type="button"
              @click="isCreatingFridge = true; isFridgeMenuOpen = false"
              class="w-full text-left px-3 py-2 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/40 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              Додати новий простір
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="px-3 py-2 flex-1 overflow-y-auto space-y-1">
        <div class="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Основне
        </div>

        <button
          type="button"
          @click="currentTab = 'fridge'"
          :class="[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left',
            currentTab === 'fridge'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs shadow-violet-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <Refrigerator class="w-4 h-4 shrink-0" />
          <span>Холодильник</span>
        </button>

        <button
          type="button"
          @click="currentTab = 'nutrition'"
          :class="[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left',
            currentTab === 'nutrition'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs shadow-violet-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <Activity class="w-4 h-4 shrink-0" />
          <span>Щоденник харчування</span>
        </button>

        <button
          type="button"
          @click="currentTab = 'chef'"
          :class="[
            'w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left',
            currentTab === 'chef'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs shadow-violet-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <div class="flex items-center gap-3">
            <Sparkles class="w-4 h-4 shrink-0" :class="currentTab === 'chef' ? 'text-amber-300' : 'text-amber-500'" />
            <span>AI Шеф-кухар</span>
          </div>
          <span
            :class="[
              'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
              currentTab === 'chef' ? 'bg-white/20 text-white' : 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
            ]"
          >
            AI
          </span>
        </button>

        <button
          type="button"
          @click="currentTab = 'planner'"
          :class="[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left',
            currentTab === 'planner'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs shadow-violet-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <CalendarDays class="w-4 h-4 shrink-0" />
          <span>План харчування</span>
        </button>

        <button
          type="button"
          @click="currentTab = 'shopping'"
          :class="[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left',
            currentTab === 'shopping'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs shadow-violet-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <ShoppingCart class="w-4 h-4 shrink-0" />
          <span>Список покупок</span>
        </button>

        <button
          type="button"
          @click="currentTab = 'recipes'"
          :class="[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left',
            currentTab === 'recipes'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs shadow-violet-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <BookHeart class="w-4 h-4 shrink-0" />
          <span>Збережені рецепти</span>
        </button>

        <div class="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Керування
        </div>

        <button
          type="button"
          @click="currentTab = 'settings'"
          :class="[
            'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left',
            currentTab === 'settings'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs shadow-violet-500/25'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <Settings class="w-4 h-4 shrink-0" />
          <span>Налаштування</span>
        </button>
      </nav>

      <!-- Sidebar Footer / User Profile & Controls -->
      <div class="p-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2.5 truncate min-w-0">
          <div class="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center justify-center shrink-0">
            {{ authStore.user?.name ? authStore.user.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="truncate">
            <div class="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">
              {{ authStore.user?.name || 'Користувач' }}
            </div>
            <div class="text-[10px] text-zinc-400 truncate">
              {{ authStore.user?.email }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            @click="toggleTheme"
            class="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center"
            :title="isDark ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему'"
            aria-label="Перемикач теми"
          >
            <Sun v-if="isDark" class="w-4 h-4 text-amber-400 transition-transform duration-200" />
            <Moon v-else class="w-4 h-4 text-zinc-700 dark:text-zinc-300 transition-transform duration-200" />
          </button>

          <button
            type="button"
            @click="handleLogout"
            title="Вийти з акаунту"
            class="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Workspace Area -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen">
      <!-- Mobile Top Sticky Header (Hidden on md: and up) -->
      <header class="sticky top-0 z-30 bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 transition-colors md:hidden">
        <div class="px-4 py-2.5 flex items-center justify-between gap-3">
          <!-- Brand Logo & Name -->
          <div class="flex items-center gap-2.5 cursor-pointer select-none shrink-0" @click="currentTab = 'fridge'">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
              <Refrigerator class="w-5 h-5" />
            </div>
            <div>
              <span class="font-bold text-zinc-900 dark:text-zinc-100 text-base tracking-tight block leading-none">
                E-Fridge
              </span>
              <span class="text-[10px] text-zinc-400 font-medium">
                Смарт-помічник
              </span>
            </div>
          </div>

          <!-- Right Side Controls (Mobile) -->
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Theme Switcher Button -->
            <button
              type="button"
              @click="toggleTheme"
              class="p-2 min-w-[36px] min-h-[36px] rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center active:scale-95 border border-transparent shrink-0"
              :title="isDark ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему'"
              aria-label="Перемикач теми"
            >
              <Sun v-if="isDark" class="w-4 h-4 text-amber-400 transition-transform duration-200" />
              <Moon v-else class="w-4 h-4 text-zinc-700 dark:text-zinc-300 transition-transform duration-200" />
            </button>

            <!-- Fridge Switcher Dropdown (Mobile) -->
            <div class="relative">
              <button
                type="button"
                @click="isFridgeMenuOpen = !isFridgeMenuOpen"
                class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 rounded-xl transition-colors border border-zinc-200/70 dark:border-zinc-700 cursor-pointer"
              >
                <span class="truncate max-w-[100px]">{{ authStore.currentFridge?.name || 'Холодильник' }}</span>
                <ChevronDown class="w-3.5 h-3.5 text-zinc-400" />
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="isFridgeMenuOpen"
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-[#121217] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95"
              >
                <div class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Ваші простори
                </div>
                <button
                  type="button"
                  v-for="fridge in authStore.fridges"
                  :key="fridge.id"
                  @click="authStore.selectFridge(fridge.id); isFridgeMenuOpen = false"
                  class="w-full text-left px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 dark:hover:text-violet-300 flex items-center justify-between transition cursor-pointer"
                >
                  <span class="truncate">{{ fridge.name }}</span>
                  <CheckCircle2
                    v-if="authStore.currentFridgeId === fridge.id"
                    class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0"
                  />
                </button>

                <div class="border-t border-zinc-100 dark:border-zinc-800 my-1"></div>

                <button
                  type="button"
                  @click="isCreatingFridge = true; isFridgeMenuOpen = false"
                  class="w-full text-left px-3 py-2 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/40 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  Додати новий холодильник
                </button>
              </div>
            </div>

            <!-- Settings Button -->
            <button
              type="button"
              @click="currentTab = 'settings'"
              title="Налаштування та профіль"
              :class="[
                'p-2 rounded-xl transition-colors cursor-pointer',
                currentTab === 'settings'
                  ? 'bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              ]"
            >
              <Settings class="w-4 h-4" />
            </button>

            <!-- Logout Button -->
            <button
              type="button"
              @click="handleLogout"
              title="Вийти з акаунту"
              class="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut class="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <!-- Main Responsive Workspace Container -->
      <main class="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-24 md:pb-12 flex-1">
        <FridgeView v-if="currentTab === 'fridge'" @navigate="currentTab = $event" />
        <NutritionView v-else-if="currentTab === 'nutrition'" />
        <ChefView v-else-if="currentTab === 'chef'" />
        <PlannerView v-else-if="currentTab === 'planner'" />
        <ShoppingView v-else-if="currentTab === 'shopping'" />
        <SavedRecipesView v-else-if="currentTab === 'recipes'" />
        <SettingsView v-else-if="currentTab === 'settings'" />
      </main>
    </div>

    <!-- Mobile-First Bottom Navigation Bar (Visible only on mobile/tablets < 768px) -->
    <nav class="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 px-2 py-1.5 flex justify-around items-center md:hidden shadow-lg transition-colors">
      <button
        type="button"
        @click="currentTab = 'fridge'"
        class="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition text-[11px] cursor-pointer"
        :class="[
          currentTab === 'fridge'
            ? 'text-violet-600 dark:text-violet-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        ]"
      >
        <Refrigerator class="w-5 h-5" />
        <span>Холодильник</span>
      </button>

      <button
        type="button"
        @click="currentTab = 'nutrition'"
        class="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition text-[11px] cursor-pointer"
        :class="[
          currentTab === 'nutrition'
            ? 'text-violet-600 dark:text-violet-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        ]"
      >
        <Activity class="w-5 h-5" />
        <span>Щоденник</span>
      </button>

      <!-- Center AI Chef Action Button -->
      <button
        type="button"
        @click="currentTab = 'chef'"
        class="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition text-[11px] relative -top-2 bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 cursor-pointer"
        :class="{ 'ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-zinc-950': currentTab === 'chef' }"
      >
        <Sparkles class="w-5 h-5" />
        <span class="font-semibold">ШІ Шеф</span>
      </button>

      <button
        type="button"
        @click="currentTab = 'planner'"
        class="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition text-[11px] cursor-pointer"
        :class="[
          currentTab === 'planner'
            ? 'text-violet-600 dark:text-violet-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        ]"
      >
        <CalendarDays class="w-5 h-5" />
        <span>План</span>
      </button>

      <button
        type="button"
        @click="currentTab = 'shopping'"
        class="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition text-[11px] cursor-pointer"
        :class="[
          currentTab === 'shopping'
            ? 'text-violet-600 dark:text-violet-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        ]"
      >
        <ShoppingCart class="w-5 h-5" />
        <span>Покупки</span>
      </button>
    </nav>

    <!-- Modal Create Fridge -->
    <div
      v-if="isCreatingFridge"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="isCreatingFridge = false"
    >
      <div class="bg-white dark:bg-[#121217] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100">Новий холодильник</h3>
          <button type="button" @click="isCreatingFridge = false" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Вкажіть назву для нового простору зберігання продуктів.</p>

        <input
          v-model="newFridgeName"
          type="text"
          placeholder="Наприклад: Дім, Дача або Офіс"
          class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 mb-4"
          @keyup.enter="createFridge"
        />

        <div class="flex gap-2">
          <button
            type="button"
            @click="isCreatingFridge = false"
            class="flex-1 py-2 px-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="button"
            @click="createFridge"
            class="flex-1 py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl transition shadow-sm cursor-pointer"
          >
            Створити
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
