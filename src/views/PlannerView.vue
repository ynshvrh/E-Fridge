<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import { useNutritionStore } from '@/stores/nutrition'
import { getLocalDateString, addDaysToLocalDateString } from '@/utils/date'
import {
  CalendarDays,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Utensils,
  Flame,
  X
} from 'lucide-vue-next'
import type { MealPlan } from '@/types'

const plannerStore = usePlannerStore()
const nutritionStore = useNutritionStore()

const currentWeekStart = ref<string>(getMonday(new Date()))
const isAddModalOpen = ref(false)
const isAIModalOpen = ref(false)
const isGenerating = ref(false)
const successNotice = ref<string | null>(null)

// Add Meal Form
const addDate = ref(getLocalDateString())
const addMealType = ref('breakfast')
const addTitle = ref('')
const addCalories = ref<number | undefined>(undefined)
const addNotes = ref('')

// AI Plan Form
const aiDays = ref(7)
const aiDiet = ref('')

function getMonday(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const monday = new Date(date.setDate(diff))
  return getLocalDateString(monday)
}

const weekDays = computed(() => {
  const days = []
  const ukDays = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя']
  for (let i = 0; i < 7; i++) {
    const dStr = addDaysToLocalDateString(currentWeekStart.value, i)
    days.push({
      dateStr: dStr,
      dayName: ukDays[i],
      isToday: dStr === getLocalDateString(),
    })
  }
  return days
})

const weekEnd = computed(() => addDaysToLocalDateString(currentWeekStart.value, 6))

onMounted(async () => {
  await loadWeek()
})

async function loadWeek() {
  await plannerStore.fetchPlans(currentWeekStart.value, weekEnd.value)
}

function changeWeek(direction: number) {
  currentWeekStart.value = addDaysToLocalDateString(currentWeekStart.value, direction * 7)
  loadWeek()
}

function resetToCurrentWeek() {
  currentWeekStart.value = getMonday(new Date())
  loadWeek()
}

function getMealsForDay(dateStr: string): MealPlan[] {
  return plannerStore.mealPlans.filter((m) => m.date === dateStr)
}

async function handleToggleCompleted(meal: MealPlan) {
  try {
    await plannerStore.toggleCompleted(meal.id, !meal.is_completed)
  } catch (err: any) {
    alert(err.message || 'Помилка оновлення статусу')
  }
}

async function handleDeleteMeal(id: string) {
  try {
    await plannerStore.deletePlan(id)
  } catch (err: any) {
    alert(err.message || 'Помилка видалення')
  }
}

async function handleEatMeal(meal: MealPlan) {
  try {
    await nutritionStore.logMeal({
      date: meal.date,
      meal_type: meal.meal_type,
      food_name: meal.recipe_title,
      quantity: 1,
      unit: 'порц',
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs,
    })
    await plannerStore.toggleCompleted(meal.id, true)
    showNotice(`Страву "${meal.recipe_title}" записано у щоденник харчування!`)
  } catch (err: any) {
    alert(err.message || 'Помилка запису в щоденник')
  }
}

async function handleAddSubmit() {
  if (!addTitle.value.trim()) return
  try {
    await plannerStore.addPlan({
      date: addDate.value,
      meal_type: addMealType.value,
      recipe_title: addTitle.value.trim(),
      calories: addCalories.value ? Number(addCalories.value) : undefined,
      notes: addNotes.value.trim(),
    })
    isAddModalOpen.value = false
    addTitle.value = ''
    addNotes.value = ''
    showNotice('Страву додано до плану харчування!')
  } catch (err: any) {
    alert(err.message || 'Помилка додавання страви')
  }
}

async function handleAIGenerate() {
  isGenerating.value = true
  try {
    await plannerStore.generatePlan({
      days: aiDays.value,
      start_date: currentWeekStart.value,
      dietary_preference: aiDiet.value.trim(),
    })
    isAIModalOpen.value = false
    showNotice(`AI План на ${aiDays.value} днів успішно сформовано!`)
  } catch (err: any) {
    alert(err.message || 'Помилка генерації плану')
  } finally {
    isGenerating.value = false
  }
}

async function handleClearWeek() {
  if (!confirm('Очистити всі страви для поточного тижня?')) return
  try {
    await plannerStore.clearPlans(currentWeekStart.value, weekEnd.value)
    showNotice('План на тиждень очищено!')
  } catch (err: any) {
    alert(err.message || 'Помилка очищення')
  }
}

function showNotice(msg: string) {
  successNotice.value = msg
  setTimeout(() => {
    if (successNotice.value === msg) {
      successNotice.value = null
    }
  }, 4000)
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Сніданок',
  lunch: 'Обід',
  dinner: 'Вечеря',
  snack: 'Перекус',
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header Banner -->
    <div class="bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 p-5 rounded-3xl border border-teal-100/70 shadow-sm flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center shadow-xs">
          <CalendarDays class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-stone-800">План харчування</h2>
          <p class="text-xs text-stone-500">Плануйте меню на тиждень та формуйте раціон з AI Шефом</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="isAIModalOpen = true"
          class="px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Sparkles class="w-4 h-4" />
          <span>AI План</span>
        </button>

        <button
          @click="isAddModalOpen = true"
          class="px-3 py-2 bg-white border border-stone-200/80 hover:bg-stone-50 text-stone-700 text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus class="w-4 h-4 text-stone-500" />
          <span>Додати страву</span>
        </button>
      </div>
    </div>

    <!-- Success Notice -->
    <div
      v-if="successNotice"
      class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-xs transition-all"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600" />
        <span>{{ successNotice }}</span>
      </div>
      <button @click="successNotice = null" class="text-emerald-600 hover:text-emerald-800">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Week Navigation -->
    <div class="bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-1.5">
        <button
          @click="changeWeek(-1)"
          class="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-xs font-semibold text-stone-800 px-2">
          {{ currentWeekStart }} — {{ weekEnd }}
        </span>
        <button
          @click="changeWeek(1)"
          class="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="resetToCurrentWeek"
          class="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
        >
          Поточний тиждень
        </button>
        <button
          v-if="plannerStore.mealPlans.length > 0"
          @click="handleClearWeek"
          class="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
        >
          Очистити
        </button>
      </div>
    </div>

    <!-- Day by Day Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
      <div
        v-for="day in weekDays"
        :key="day.dateStr"
        :class="[
          'bg-white rounded-3xl p-3.5 border shadow-xs flex flex-col space-y-3 transition-all',
          day.isToday ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-stone-200/70'
        ]"
      >
        <!-- Day Header -->
        <div class="flex items-center justify-between border-b border-stone-100 pb-2">
          <div>
            <span class="text-xs font-bold text-stone-800">{{ day.dayName }}</span>
            <span class="text-[11px] text-stone-400 block">{{ day.dateStr }}</span>
          </div>
          <span
            v-if="day.isToday"
            class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
          >
            Сьогодні
          </span>
        </div>

        <!-- Meals list for this day -->
        <div class="space-y-2 flex-1 min-h-[140px]">
          <div
            v-if="getMealsForDay(day.dateStr).length === 0"
            class="h-full flex flex-col items-center justify-center text-center p-3 text-stone-300 border border-dashed border-stone-100 rounded-2xl"
          >
            <Utensils class="w-4 h-4 mb-1 opacity-50" />
            <span class="text-[10px]">Не заплановано</span>
          </div>

          <div
            v-for="meal in getMealsForDay(day.dateStr)"
            :key="meal.id"
            :class="[
              'p-2.5 rounded-2xl border transition-all space-y-1.5',
              meal.is_completed
                ? 'bg-emerald-50/50 border-emerald-200/60 opacity-80'
                : 'bg-stone-50/70 border-stone-200/60 hover:border-emerald-200'
            ]"
          >
            <div class="flex items-start justify-between gap-1.5">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-md">
                {{ mealTypeLabels[meal.meal_type] || meal.meal_type }}
              </span>
              <button
                @click="handleDeleteMeal(meal.id)"
                class="text-stone-300 hover:text-rose-500 transition-colors p-0.5"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>

            <p class="text-xs font-medium text-stone-800 leading-tight">
              {{ meal.recipe_title }}
            </p>

            <!-- Macros pill -->
            <div v-if="meal.calories > 0" class="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
              <Flame class="w-3 h-3 text-amber-500" />
              <span>{{ meal.calories }} ккал</span>
            </div>

            <!-- Actions row -->
            <div class="pt-1 flex items-center justify-between border-t border-stone-100/70 gap-1">
              <button
                @click="handleToggleCompleted(meal)"
                :class="[
                  'text-[10px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors',
                  meal.is_completed ? 'text-emerald-700 bg-emerald-100' : 'text-stone-500 hover:text-stone-800'
                ]"
              >
                <CheckCircle2 class="w-3 h-3" />
                <span>{{ meal.is_completed ? 'Зроблено' : 'Виконати' }}</span>
              </button>

              <button
                v-if="!meal.is_completed"
                @click="handleEatMeal(meal)"
                title="Записати у щоденник харчування"
                class="text-[10px] font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                З'їсти
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Add for this specific day -->
        <button
          @click="addDate = day.dateStr; isAddModalOpen = true"
          class="w-full py-1 text-center text-[11px] text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-xl border border-dashed border-stone-200 transition-colors"
        >
          + Додати
        </button>
      </div>
    </div>

    <!-- Manual Add Modal -->
    <div v-if="isAddModalOpen" class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/80 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 class="text-sm font-semibold text-stone-800">Додати страву до плану</h3>
          <button @click="isAddModalOpen = false" class="text-stone-400 hover:text-stone-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleAddSubmit" class="space-y-3 text-xs">
          <div>
            <label class="block font-medium text-stone-600 mb-1">Дата</label>
            <input v-model="addDate" type="date" required class="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200" />
          </div>

          <div>
            <label class="block font-medium text-stone-600 mb-1">Прийом їжі</label>
            <select v-model="addMealType" class="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200">
              <option value="breakfast">Сніданок</option>
              <option value="lunch">Обід</option>
              <option value="dinner">Вечеря</option>
              <option value="snack">Перекус</option>
            </select>
          </div>

          <div>
            <label class="block font-medium text-stone-600 mb-1">Назва страви *</label>
            <input v-model="addTitle" type="text" placeholder="Наприклад: Вівсянка з ягодами" required class="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200" />
          </div>

          <div>
            <label class="block font-medium text-stone-600 mb-1">Орієнтовна калорійність (ккал)</label>
            <input v-model.number="addCalories" type="number" placeholder="Автоматично або введіть" class="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200" />
          </div>

          <div>
            <label class="block font-medium text-stone-600 mb-1">Нотатки</label>
            <input v-model="addNotes" type="text" placeholder="Швидко приготувати, з сиром тощо" class="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200" />
          </div>

          <div class="pt-2 flex gap-2">
            <button type="button" @click="isAddModalOpen = false" class="flex-1 py-2 text-stone-600 hover:bg-stone-100 rounded-xl">Скасувати</button>
            <button type="submit" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs font-medium">Зберегти</button>
          </div>
        </form>
      </div>
    </div>

    <!-- AI Plan Generator Modal -->
    <div v-if="isAIModalOpen" class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/80 space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-stone-100">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-teal-600" />
            <h3 class="text-sm font-semibold text-stone-800">AI Скласти план меню</h3>
          </div>
          <button @click="isAIModalOpen = false" class="text-stone-400 hover:text-stone-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleAIGenerate" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-medium text-stone-600 mb-1">Кількість днів</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="aiDays = 3"
                :class="['py-2 rounded-xl border text-center font-medium transition-all', aiDays === 3 ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-stone-50 border-stone-200 text-stone-600']"
              >
                3 дні
              </button>
              <button
                type="button"
                @click="aiDays = 7"
                :class="['py-2 rounded-xl border text-center font-medium transition-all', aiDays === 7 ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-stone-50 border-stone-200 text-stone-600']"
              >
                7 днів (тиждень)
              </button>
            </div>
          </div>

          <div>
            <label class="block font-medium text-stone-600 mb-1">Дієтичні побажання</label>
            <input
              v-model="aiDiet"
              type="text"
              placeholder="Наприклад: без цукру, високобілкове, кето"
              class="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200"
            />
          </div>

          <p class="text-[11px] text-stone-400">
            AI Шеф автоматично підбере страви з урахуванням продуктів у вашому холодильнику та збалансує раціон.
          </p>

          <div class="pt-2 flex gap-2">
            <button type="button" @click="isAIModalOpen = false" :disabled="isGenerating" class="flex-1 py-2 text-stone-600 hover:bg-stone-100 rounded-xl">
              Скасувати
            </button>
            <button
              type="submit"
              :disabled="isGenerating"
              class="flex-1 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl shadow-xs font-medium flex items-center justify-center gap-1"
            >
              <Sparkles class="w-3.5 h-3.5" :class="{ 'animate-spin': isGenerating }" />
              <span>{{ isGenerating ? 'Створюємо...' : 'Згенерувати' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
