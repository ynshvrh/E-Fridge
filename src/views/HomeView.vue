<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
  Settings
} from 'lucide-vue-next'
import type { Fridge } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

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
  <div class="min-h-full pb-20">
    <!-- Top Sticky Header -->
    <header class="sticky top-0 z-20 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/60 px-4 sm:px-6 py-3">
      <div class="max-w-3xl mx-auto flex items-center justify-between gap-3">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Refrigerator class="w-4 h-4" />
          </div>
          <span class="font-semibold text-stone-800 text-sm hidden sm:inline tracking-tight">E-Fridge</span>
        </div>

        <!-- Navigation Tabs Bar -->
        <div class="flex items-center gap-1 bg-stone-200/60 p-1 rounded-2xl overflow-x-auto max-w-[calc(100vw-180px)] sm:max-w-none">
          <button
            @click="currentTab = 'fridge'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0',
              currentTab === 'fridge'
                ? 'bg-white text-stone-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-700'
            ]"
          >
            Холодильник
          </button>
          <button
            @click="currentTab = 'nutrition'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0',
              currentTab === 'nutrition'
                ? 'bg-white text-stone-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-700'
            ]"
          >
            <Activity class="w-3.5 h-3.5 text-emerald-600" />
            <span>Щоденник</span>
          </button>
          <button
            @click="currentTab = 'chef'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0',
              currentTab === 'chef'
                ? 'bg-white text-stone-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-700'
            ]"
          >
            <Sparkles class="w-3.5 h-3.5 text-teal-600" />
            <span>AI Шеф</span>
          </button>
          <button
            @click="currentTab = 'planner'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0',
              currentTab === 'planner'
                ? 'bg-white text-stone-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-700'
            ]"
          >
            <CalendarDays class="w-3.5 h-3.5 text-indigo-600" />
            <span>План</span>
          </button>
          <button
            @click="currentTab = 'shopping'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0',
              currentTab === 'shopping'
                ? 'bg-white text-stone-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-700'
            ]"
          >
            <ShoppingCart class="w-3.5 h-3.5 text-emerald-600" />
            <span>Покупки</span>
          </button>
          <button
            @click="currentTab = 'recipes'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0',
              currentTab === 'recipes'
                ? 'bg-white text-stone-800 shadow-xs'
                : 'text-stone-500 hover:text-stone-700'
            ]"
          >
            <BookHeart class="w-3.5 h-3.5 text-rose-500" />
            <span>Рецепти</span>
          </button>
        </div>

        <!-- User & Fridge Actions -->
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

          <!-- Settings Button -->
          <button
            @click="currentTab = 'settings'"
            title="Налаштування"
            :class="[
              'p-2 rounded-xl transition-colors',
              currentTab === 'settings'
                ? 'bg-stone-200/80 text-stone-800'
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/60'
            ]"
          >
            <Settings class="w-4 h-4" />
          </button>

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

    <!-- Main Container -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
      <FridgeView v-if="currentTab === 'fridge'" @navigate="currentTab = $event" />
      <NutritionView v-else-if="currentTab === 'nutrition'" />
      <ChefView v-else-if="currentTab === 'chef'" />
      <PlannerView v-else-if="currentTab === 'planner'" />
      <ShoppingView v-else-if="currentTab === 'shopping'" />
      <SavedRecipesView v-else-if="currentTab === 'recipes'" />
      <SettingsView v-else-if="currentTab === 'settings'" />
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
