<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNutritionStore } from '@/stores/nutrition'
import NutritionGoalsModal from '@/components/NutritionGoalsModal.vue'
import LogMealModal from '@/components/LogMealModal.vue'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Flame,
  Settings2
} from 'lucide-vue-next'
import { getLocalDateString, addDaysToLocalDateString } from '@/utils/date'
import type { Goals } from '@/types'

const nutritionStore = useNutritionStore()

const showAddLogModal = ref(false)
const showGoalsModal = ref(false)

const mealTypes = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

onMounted(async () => {
  await nutritionStore.fetchDaily()
})

function changeDate(days: number) {
  const dateStr = addDaysToLocalDateString(nutritionStore.currentDate, days)
  nutritionStore.fetchDaily(dateStr)
}

const isToday = computed(() => {
  return nutritionStore.currentDate === getLocalDateString()
})

const summary = computed(() => nutritionStore.dailySummary)

const calPercent = computed(() => {
  if (!summary.value?.goals.calorie_target) return 0
  return Math.min(100, Math.round((summary.value.total_calories / summary.value.goals.calorie_target) * 100))
})

const proteinPercent = computed(() => {
  if (!summary.value?.goals.protein_target) return 0
  return Math.min(100, Math.round((summary.value.total_protein / summary.value.goals.protein_target) * 100))
})

const fatPercent = computed(() => {
  if (!summary.value?.goals.fat_target) return 0
  return Math.min(100, Math.round((summary.value.total_fat / summary.value.goals.fat_target) * 100))
})

const carbsPercent = computed(() => {
  if (!summary.value?.goals.carbs_target) return 0
  return Math.min(100, Math.round((summary.value.total_carbs / summary.value.goals.carbs_target) * 100))
})

function logsByMeal(type: string) {
  return (summary.value?.logs || []).filter((l) => l.meal_type === type)
}

async function handleAddLog(payload: {
  meal_type: string
  food_name: string
  quantity: number
  unit: string
  calories?: number
  protein?: number
  fat?: number
  carbs?: number
}) {
  await nutritionStore.logMeal({
    date: nutritionStore.currentDate,
    ...payload,
  })
  showAddLogModal.value = false
}

async function handleSaveGoals(goals: Goals) {
  await nutritionStore.updateGoals(goals)
  showGoalsModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Date Bar & Goals Action -->
    <div class="flex items-center justify-between bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/60 shadow-xs">
      <div class="flex items-center gap-1.5">
        <button
          @click="changeDate(-1)"
          class="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <span class="text-xs sm:text-sm font-semibold text-stone-700 min-w-[120px] text-center">
          {{ isToday ? 'Сьогодні' : nutritionStore.currentDate }}
        </span>
        <button
          @click="changeDate(1)"
          class="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="showGoalsModal = true"
          title="Налаштувати цілі"
          class="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <Settings2 class="w-4 h-4" />
        </button>
        <button
          @click="showAddLogModal = true"
          class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Додати запис</span>
        </button>
      </div>
    </div>

    <!-- Daily Progress Cards -->
    <div class="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/60 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-stone-400 font-medium">Спожито калорій</div>
          <div class="text-2xl font-bold text-stone-800 flex items-baseline gap-1 mt-0.5">
            <span>{{ summary?.total_calories || 0 }}</span>
            <span class="text-xs font-normal text-stone-400">/ {{ summary?.goals.calorie_target || 2000 }} ккал</span>
          </div>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Flame class="w-5 h-5" />
        </div>
      </div>

      <!-- Main Calorie Bar -->
      <div class="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
        <div
          class="bg-emerald-600 h-3 rounded-full transition-all duration-500"
          :style="{ width: `${calPercent}%` }"
        ></div>
      </div>

      <!-- Macros Progress Rows -->
      <div class="grid grid-cols-3 gap-3 pt-2 border-t border-stone-100 text-center">
        <!-- Protein -->
        <div class="space-y-1">
          <div class="text-[11px] text-stone-400">Білки</div>
          <div class="text-xs font-semibold text-stone-700">
            {{ summary?.total_protein || 0 }} / {{ summary?.goals.protein_target || 100 }}г
          </div>
          <div class="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: `${proteinPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Fat -->
        <div class="space-y-1">
          <div class="text-[11px] text-stone-400">Жири</div>
          <div class="text-xs font-semibold text-stone-700">
            {{ summary?.total_fat || 0 }} / {{ summary?.goals.fat_target || 70 }}г
          </div>
          <div class="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: `${fatPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Carbs -->
        <div class="space-y-1">
          <div class="text-[11px] text-stone-400">Вуглеводи</div>
          <div class="text-xs font-semibold text-stone-700">
            {{ summary?.total_carbs || 0 }} / {{ summary?.goals.carbs_target || 250 }}г
          </div>
          <div class="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: `${carbsPercent}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Meals Breakdown -->
    <div class="space-y-3">
      <div
        v-for="type in mealTypes"
        :key="type.id"
        class="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-2"
      >
        <div class="flex items-center justify-between pb-2 border-b border-stone-100">
          <h4 class="text-xs font-semibold text-stone-700 uppercase tracking-wider">
            {{ type.label }}
          </h4>
          <span class="text-xs text-stone-400">
            {{ logsByMeal(type.id).reduce((sum, l) => sum + l.calories, 0) }} ккал
          </span>
        </div>

        <div v-if="logsByMeal(type.id).length > 0" class="divide-y divide-stone-100">
          <div
            v-for="log in logsByMeal(type.id)"
            :key="log.id"
            class="py-2 flex items-center justify-between text-xs"
          >
            <div>
              <div class="font-medium text-stone-800">{{ log.food_name }}</div>
              <div class="text-[11px] text-stone-400 mt-0.5">
                {{ log.quantity }} {{ log.unit }} · Б: {{ log.protein }}г · Ж: {{ log.fat }}г · В: {{ log.carbs }}г
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-stone-700">{{ log.calories }} ккал</span>
              <button
                @click="nutritionStore.deleteLog(log.id)"
                title="Видалити запис"
                class="p-1 text-stone-300 hover:text-rose-500 rounded transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-stone-400 py-1 italic">
          Ще нічого не додано
        </div>
      </div>
    </div>

    <!-- Modals -->
    <LogMealModal
      v-if="showAddLogModal"
      @close="showAddLogModal = false"
      @submit="handleAddLog"
    />

    <NutritionGoalsModal
      v-if="showGoalsModal"
      :initial-goals="summary?.goals"
      @close="showGoalsModal = false"
      @save="handleSaveGoals"
    />
  </div>
</template>
