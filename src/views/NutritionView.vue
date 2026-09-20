<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNutritionStore } from '@/stores/nutrition'
import { useProductStore } from '@/stores/products'
import NutritionGoalsModal from '@/components/NutritionGoalsModal.vue'
import LogMealModal from '@/components/LogMealModal.vue'
import EditNutritionLogModal from '@/components/EditNutritionLogModal.vue'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Settings2,
  CheckCircle2,
  X
} from 'lucide-vue-next'
import { getLocalDateString, addDaysToLocalDateString } from '@/utils/date'
import type { Goals, NutritionLog, UpdateNutritionLogInput } from '@/types'

const nutritionStore = useNutritionStore()
const productStore = useProductStore()

const showAddLogModal = ref(false)
const showGoalsModal = ref(false)
const editingLog = ref<NutritionLog | null>(null)

const successNotice = ref<string | null>(null)
const errorNotice = ref<string | null>(null)

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

function showNotice(msg: string) {
  successNotice.value = msg
  setTimeout(() => {
    if (successNotice.value === msg) successNotice.value = null
  }, 4500)
}

function showError(msg: string) {
  errorNotice.value = msg
  setTimeout(() => {
    if (errorNotice.value === msg) errorNotice.value = null
  }, 5000)
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
  try {
    await nutritionStore.logMeal({
      date: nutritionStore.currentDate,
      ...payload,
    })
    showAddLogModal.value = false
    showNotice(`"${payload.food_name}" додано до щоденника!`)
  } catch (err: any) {
    showError(err.message || 'Помилка додавання запису')
  }
}

function openEditLogModal(log: NutritionLog) {
  editingLog.value = log
}

async function handleUpdateLog(payload: UpdateNutritionLogInput) {
  if (!editingLog.value) return
  try {
    await nutritionStore.updateMealLog(editingLog.value.id, payload)
    editingLog.value = null
    showNotice('Запис харчування успішно оновлено!')
  } catch (err: any) {
    showError(err.message || 'Помилка оновлення запису')
  }
}

async function handleDeleteLog(log: NutritionLog) {
  if (!confirm(`Видалити "${log.food_name}" зі щоденника?`)) return
  try {
    const res = await nutritionStore.deleteLog(log.id)
    if (res?.restored_to_fridge) {
      showNotice(res.message || `Запис видалено. Продукт повернено в холодильник!`)
      // Refresh fridge inventory in background
      await productStore.fetchProducts()
    } else {
      showNotice('Запис видалено')
    }
  } catch (err: any) {
    showError(err.message || 'Помилка видалення запису')
  }
}

async function handleSaveGoals(goals: Goals) {
  try {
    await nutritionStore.updateGoals(goals)
    showGoalsModal.value = false
    showNotice('Цілі КБЖВ оновлено!')
  } catch (err: any) {
    showError(err.message || 'Помилка збереження цілей')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto pb-10">
    <!-- Notices -->
    <div
      v-if="successNotice"
      class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-xs transition-all"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>{{ successNotice }}</span>
      </div>
      <button @click="successNotice = null" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800">
        <X class="w-4 h-4" />
      </button>
    </div>

    <div
      v-if="errorNotice"
      class="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2 shadow-xs transition-all"
    >
      <span>{{ errorNotice }}</span>
      <button @click="errorNotice = null" class="text-rose-600 dark:text-rose-400 hover:text-rose-800">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Date Bar & Goals Action -->
    <div class="flex items-center justify-between bg-white dark:bg-[#121217] p-3 sm:p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex-wrap gap-3">
      <div class="flex items-center gap-1.5">
        <button
          @click="changeDate(-1)"
          class="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <span class="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 min-w-[120px] text-center">
          {{ isToday ? 'Сьогодні' : nutritionStore.currentDate }}
        </span>
        <button
          @click="changeDate(1)"
          class="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="showGoalsModal = true"
          title="Налаштувати денні цілі"
          class="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
        >
          <Settings2 class="w-4 h-4" />
        </button>
        <button
          @click="showAddLogModal = true"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-violet-500/20 active:scale-95 cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Додати їжу</span>
        </button>
      </div>
    </div>

    <!-- Daily Progress Cards -->
    <div class="bg-white dark:bg-[#121217] p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Спожито калорій</div>
          <div class="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-baseline gap-1 mt-0.5">
            <span>{{ summary?.total_calories || 0 }}</span>
            <span class="text-xs font-normal text-zinc-400 dark:text-zinc-500">/ {{ summary?.goals.calorie_target || 2000 }} ккал</span>
          </div>
        </div>
        <div class="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Flame class="w-5 h-5" />
        </div>
      </div>

      <!-- Main Calorie Bar -->
      <div class="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full h-3 overflow-hidden">
        <div
          class="bg-gradient-to-r from-violet-600 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-xs"
          :style="{ width: `${calPercent}%` }"
        ></div>
      </div>

      <!-- Macros Progress Rows -->
      <div class="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
        <!-- Protein -->
        <div class="space-y-1">
          <div class="text-[11px] text-zinc-400 dark:text-zinc-500">Білки</div>
          <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {{ summary?.total_protein || 0 }} / {{ summary?.goals.protein_target || 100 }}г
          </div>
          <div class="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: `${proteinPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Fat -->
        <div class="space-y-1">
          <div class="text-[11px] text-zinc-400 dark:text-zinc-500">Жири</div>
          <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {{ summary?.total_fat || 0 }} / {{ summary?.goals.fat_target || 70 }}г
          </div>
          <div class="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              :style="{ width: `${fatPercent}%` }"
            ></div>
          </div>
        </div>

        <!-- Carbs -->
        <div class="space-y-1">
          <div class="text-[11px] text-zinc-400 dark:text-zinc-500">Вуглеводи</div>
          <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {{ summary?.total_carbs || 0 }} / {{ summary?.goals.carbs_target || 250 }}г
          </div>
          <div class="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
            <div
              class="bg-violet-400 h-1.5 rounded-full transition-all duration-500"
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
        class="bg-white dark:bg-[#121217] p-4 sm:p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3"
      >
        <div class="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <h4 class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            {{ type.label }}
          </h4>
          <span class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
            {{ logsByMeal(type.id).reduce((sum, l) => sum + l.calories, 0) }} ккал
          </span>
        </div>

        <div v-if="logsByMeal(type.id).length > 0" class="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          <div
            v-for="log in logsByMeal(type.id)"
            :key="log.id"
            class="py-2.5 flex items-center justify-between text-xs gap-3"
          >
            <div class="min-w-0 flex-1">
              <div class="font-medium text-zinc-800 dark:text-zinc-100 truncate">{{ log.food_name }}</div>
              <div class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                <span class="font-semibold text-zinc-600 dark:text-zinc-300">{{ log.quantity }} {{ log.unit }}</span> · Б: {{ log.protein }}г · Ж: {{ log.fat }}г · В: {{ log.carbs }}г
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="font-medium text-zinc-700 dark:text-zinc-200">{{ log.calories }} ккал</span>
              <button
                @click="openEditLogModal(log)"
                title="Редагувати грамовку та КБЖВ"
                class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
              <button
                @click="handleDeleteLog(log)"
                title="Видалити запис (повернути продукт у холодильник, якщо взято звідти)"
                class="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-xs text-zinc-400 dark:text-zinc-500 py-1.5 italic">
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

    <EditNutritionLogModal
      v-if="editingLog"
      :log="editingLog"
      @close="editingLog = null"
      @save="handleUpdateLog"
    />

    <NutritionGoalsModal
      v-if="showGoalsModal"
      :initial-goals="summary?.goals"
      @close="showGoalsModal = false"
      @save="handleSaveGoals"
    />
  </div>
</template>
