<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePlannerStore } from '@/stores/planner'
import { useNutritionStore } from '@/stores/nutrition'
import { getLocalDateString, addDaysToLocalDateString } from '@/utils/date'
import RecipeModal from '@/components/planner/RecipeModal.vue'
import {
  CalendarDays,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Flame,
  Clock,
  Coffee,
  Sun,
  Moon,
  X
} from 'lucide-vue-next'
import type { MealPlan } from '@/types'

const plannerStore = usePlannerStore()
const nutritionStore = useNutritionStore()

// State
const selectedDate = ref<string>(getLocalDateString(new Date()))
const isGeneratingDay = ref(false)
const generatingMealSlot = ref<string | null>(null)
const errorNotice = ref<string | null>(null)
const successNotice = ref<string | null>(null)

// Modal states
const isRecipeModalOpen = ref(false)
const selectedMeal = ref<MealPlan | null>(null)
const isAddModalOpen = ref(false)

// Add manual meal form
const addMealType = ref('breakfast')
const addTitle = ref('')
const addCalories = ref<number | undefined>(undefined)
const addProtein = ref<number | undefined>(undefined)
const addFat = ref<number | undefined>(undefined)
const addCarbs = ref<number | undefined>(undefined)
const addNotes = ref('')

onMounted(async () => {
  await loadDay()
})

watch(selectedDate, async () => {
  await loadDay()
})

async function loadDay() {
  await plannerStore.fetchDayPlans(selectedDate.value)
}

function prevDay() {
  selectedDate.value = addDaysToLocalDateString(selectedDate.value, -1)
}

function nextDay() {
  selectedDate.value = addDaysToLocalDateString(selectedDate.value, 1)
}

function goToToday() {
  selectedDate.value = getLocalDateString(new Date())
}

const isToday = computed(() => selectedDate.value === getLocalDateString(new Date()))

// Formatted date string in Ukrainian
const displayDateString = computed(() => {
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const weekdays = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота']
  const months = [
    'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
    'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
  ]
  const weekday = weekdays[dateObj.getDay()]
  const day = dateObj.getDate()
  const month = months[dateObj.getMonth()]

  if (isToday.value) {
    return `Сьогодні, ${day} ${month}`
  }
  return `${weekday}, ${day} ${month}`
})

// Meals for current day
const dayMeals = computed(() => {
  return plannerStore.mealPlans.filter((m) => m.date === selectedDate.value)
})

const breakfastMeal = computed(() => dayMeals.value.find((m) => m.meal_type === 'breakfast'))
const lunchMeal = computed(() => dayMeals.value.find((m) => m.meal_type === 'lunch'))
const dinnerMeal = computed(() => dayMeals.value.find((m) => m.meal_type === 'dinner'))
const otherMeals = computed(() =>
  dayMeals.value.filter((m) => !['breakfast', 'lunch', 'dinner'].includes(m.meal_type))
)

const isDayFullyGenerated = computed(() => {
  return !!breakfastMeal.value && !!lunchMeal.value && !!dinnerMeal.value
})

// Nutrition totals for current day
const totalCalories = computed(() =>
  dayMeals.value.reduce((acc, m) => acc + (m.calories || 0), 0)
)
const totalProtein = computed(() =>
  Math.round(dayMeals.value.reduce((acc, m) => acc + (m.protein || 0), 0) * 10) / 10
)
const totalFat = computed(() =>
  Math.round(dayMeals.value.reduce((acc, m) => acc + (m.fat || 0), 0) * 10) / 10
)
const totalCarbs = computed(() =>
  Math.round(dayMeals.value.reduce((acc, m) => acc + (m.carbs || 0), 0) * 10) / 10
)
const completedCount = computed(() =>
  dayMeals.value.filter((m) => m.is_completed).length
)

function showNotice(msg: string) {
  successNotice.value = msg
  errorNotice.value = null
  setTimeout(() => {
    if (successNotice.value === msg) successNotice.value = null
  }, 4000)
}

function showError(msg: string) {
  errorNotice.value = msg
  successNotice.value = null
  setTimeout(() => {
    if (errorNotice.value === msg) errorNotice.value = null
  }, 5000)
}

// Generate whole day (only once per date)
async function handleGenerateDay() {
  if (isDayFullyGenerated.value) {
    showError('Раціон на цей день уже повністю згенеровано. Ви можете перегенерувати будь-яку окрему страву.')
    return
  }
  if (isGeneratingDay.value) return

  isGeneratingDay.value = true
  errorNotice.value = null
  try {
    const meals = await plannerStore.generateDay(selectedDate.value)
    showNotice(`Успішно згенеровано раціон на день (${meals.length} страви)!`)
  } catch (err: any) {
    showError(err.message || 'Не вдалося згенерувати раціон на день')
  } finally {
    isGeneratingDay.value = false
  }
}

// Generate single meal (breakfast, lunch, dinner)
async function handleGenerateSingleMeal(mealType: string) {
  if (generatingMealSlot.value) return

  generatingMealSlot.value = mealType
  errorNotice.value = null
  try {
    const meal = await plannerStore.generateMeal(selectedDate.value, mealType)
    showNotice(`Згенеровано нову страву: "${meal.recipe_title}"!`)
  } catch (err: any) {
    showError(err.message || 'Не вдалося перегенерувати страву')
  } finally {
    generatingMealSlot.value = null
  }
}

function openRecipeModal(meal: MealPlan) {
  selectedMeal.value = meal
  isRecipeModalOpen.value = true
}

async function handleToggleCompleted(meal: MealPlan) {
  try {
    const updated = await plannerStore.toggleCompleted(meal.id, !meal.is_completed)
    if (selectedMeal.value?.id === meal.id) {
      selectedMeal.value = updated
    }
  } catch (err: any) {
    showError(err.message || 'Помилка оновлення статусу')
  }
}

async function handleDeleteMeal(id: string) {
  if (!confirm('Видалити цю страву з плану?')) return
  try {
    await plannerStore.deletePlan(id)
    if (selectedMeal.value?.id === id) {
      isRecipeModalOpen.value = false
      selectedMeal.value = null
    }
    showNotice('Страву видалено з плану')
  } catch (err: any) {
    showError(err.message || 'Помилка видалення')
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
    if (selectedMeal.value?.id === meal.id) {
      selectedMeal.value.is_completed = true
    }
    showNotice(`"${meal.recipe_title}" записано у щоденник харчування!`)
  } catch (err: any) {
    showError(err.message || 'Помилка запису в щоденник')
  }
}

function openAddModal(type = 'breakfast') {
  addMealType.value = type
  addTitle.value = ''
  addCalories.value = undefined
  addProtein.value = undefined
  addFat.value = undefined
  addCarbs.value = undefined
  addNotes.value = ''
  isAddModalOpen.value = true
}

async function handleAddMealSubmit() {
  if (!addTitle.value.trim()) return
  try {
    await plannerStore.addPlan({
      date: selectedDate.value,
      meal_type: addMealType.value,
      recipe_title: addTitle.value.trim(),
      calories: addCalories.value,
      protein: addProtein.value,
      fat: addFat.value,
      carbs: addCarbs.value,
      notes: addNotes.value.trim(),
    })
    isAddModalOpen.value = false
    showNotice('Страву додано до плану!')
  } catch (err: any) {
    showError(err.message || 'Не вдалося додати страву')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-12">
    <!-- Notices / Toasts -->
    <div
      v-if="successNotice"
      class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm animate-in fade-in"
    >
      <span>{{ successNotice }}</span>
      <button @click="successNotice = null" class="p-1 hover:bg-emerald-100 rounded">
        <X class="w-4 h-4" />
      </button>
    </div>

    <div
      v-if="errorNotice"
      class="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between shadow-sm animate-in fade-in"
    >
      <span>{{ errorNotice }}</span>
      <button @click="errorNotice = null" class="p-1 hover:bg-rose-100 rounded">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Center Date Navigation Header -->
    <div class="bg-white dark:bg-[#121217] rounded-3xl p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <!-- Left side: Today helper -->
      <div class="flex items-center gap-2">
        <button
          v-if="!isToday"
          @click="goToToday"
          class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-800 transition cursor-pointer"
        >
          Повернутися до сьогодні
        </button>
      </div>

      <!-- Center: Date Selector with Arrows -->
      <div class="flex items-center gap-3">
        <button
          @click="prevDay"
          class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
          title="Попередній день"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <div class="text-center min-w-[200px] sm:min-w-[260px]">
          <div class="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5">
            План харчування на
          </div>
          <div class="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
            <span>{{ displayDateString }}</span>
            <input
              type="date"
              v-model="selectedDate"
              class="opacity-0 absolute w-0 h-0"
              id="date-picker-input"
            />
            <label
              for="date-picker-input"
              class="cursor-pointer p-1 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
              title="Обрати дату в календарі"
            >
              <CalendarDays class="w-4 h-4" />
            </label>
          </div>
        </div>

        <button
          @click="nextDay"
          class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
          title="Наступний день"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <!-- Right: Whole Day Generate Button -->
      <div>
        <button
          v-if="!isDayFullyGenerated"
          @click="handleGenerateDay"
          :disabled="isGeneratingDay"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles class="w-4 h-4" :class="{ 'animate-spin': isGeneratingDay }" />
          {{ isGeneratingDay ? 'ШІ складає меню на день...' : 'Згенерувати раціон на день' }}
        </button>
        <div
          v-else
          class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
          title="Генерація на весь день дозволена 1 раз на день. Ви можете перегенерувати окрему страву."
        >
          <CheckCircle2 class="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span>Раціон на день згенеровано (1/1)</span>
        </div>
      </div>
    </div>

    <!-- Day КБЖВ Summary Bar -->
    <div class="bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-indigo-500/10 dark:from-[#121217] dark:to-zinc-900 rounded-3xl p-4 sm:p-5 border border-violet-200/60 dark:border-zinc-800 shadow-sm">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
            <Flame class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Загалом за день</div>
            <div class="text-xl font-bold text-zinc-900 dark:text-white">
              {{ totalCalories }} <span class="text-xs font-normal text-zinc-500">ккал</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6 sm:gap-8 text-center sm:text-right">
          <div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">Білки</div>
            <div class="text-base font-bold text-violet-600 dark:text-violet-400">{{ totalProtein }} г</div>
          </div>
          <div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">Жири</div>
            <div class="text-base font-bold text-amber-600 dark:text-amber-400">{{ totalFat }} г</div>
          </div>
          <div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">Вуглеводи</div>
            <div class="text-base font-bold text-indigo-600 dark:text-indigo-400">{{ totalCarbs }} г</div>
          </div>
        </div>

        <div class="text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-xs">
          {{ completedCount }} з {{ dayMeals.length }} страв спожито
        </div>
      </div>
    </div>

    <!-- 3 Daily Meal Slots -->
    <div class="space-y-4">
      <!-- 1. Сніданок (Breakfast) -->
      <div class="bg-white dark:bg-[#121217] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden transition hover:border-zinc-300 dark:hover:border-zinc-700">
        <div class="px-5 py-3.5 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Coffee class="w-4 h-4" />
            </span>
            <span class="font-bold text-zinc-900 dark:text-white text-base">Сніданок</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="breakfastMeal"
              @click="handleGenerateSingleMeal('breakfast')"
              :disabled="generatingMealSlot === 'breakfast'"
              class="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 px-2.5 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 hover:bg-amber-200/80 transition cursor-pointer disabled:opacity-50"
              title="Перегенерувати лише сніданок за допомогою ШІ"
            >
              <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': generatingMealSlot === 'breakfast' }" />
              {{ generatingMealSlot === 'breakfast' ? 'Генерація...' : 'Перегенерувати' }}
            </button>
            <button
              v-else
              @click="openAddModal('breakfast')"
              class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              + Вручну
            </button>
          </div>
        </div>

        <div class="p-5">
          <!-- Meal exists -->
          <div
            v-if="breakfastMeal"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            @click="openRecipeModal(breakfastMeal)"
          >
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                  {{ breakfastMeal.recipe_title }}
                </h3>
                <span class="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  <Clock class="w-3 h-3" />
                  {{ breakfastMeal.recipe_data?.prep_time_minutes || 15 }} хв
                </span>
                <span
                  v-if="breakfastMeal.is_completed"
                  class="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-medium"
                >
                  <CheckCircle2 class="w-3 h-3" /> З'їдено
                </span>
              </div>

              <div class="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span class="text-zinc-900 dark:text-white font-bold">{{ breakfastMeal.calories }} ккал</span>
                <span>• Б: {{ breakfastMeal.protein }}г</span>
                <span>• Ж: {{ breakfastMeal.fat }}г</span>
                <span>• В: {{ breakfastMeal.carbs }}г</span>
                <span v-if="breakfastMeal.recipe_data?.ingredients?.length" class="text-violet-600 dark:text-violet-400">
                  ({{ breakfastMeal.recipe_data.ingredients.length }} інгредієнтів)
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0" @click.stop>
              <button
                @click="openRecipeModal(breakfastMeal)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition cursor-pointer"
              >
                Рецепт
              </button>

              <button
                @click="handleEatMeal(breakfastMeal)"
                class="p-2 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Записати в щоденник як з'їдене"
              >
                <CheckCircle2 class="w-4 h-4" :class="{ 'text-violet-600 dark:text-violet-400': breakfastMeal.is_completed }" />
              </button>

              <button
                @click="handleDeleteMeal(breakfastMeal.id)"
                class="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Видалити"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Empty slot -->
          <div v-else class="text-center py-6 text-zinc-400 space-y-3">
            <p class="text-sm">Сніданок ще не заплановано</p>
            <div class="flex items-center justify-center gap-2">
              <button
                @click="handleGenerateSingleMeal('breakfast')"
                :disabled="generatingMealSlot === 'breakfast'"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles class="w-3.5 h-3.5" :class="{ 'animate-spin': generatingMealSlot === 'breakfast' }" />
                {{ generatingMealSlot === 'breakfast' ? 'ШІ думає...' : 'Згенерувати сніданок' }}
              </button>
              <button
                @click="openAddModal('breakfast')"
                class="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              >
                + Додати вручну
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Обід (Lunch) -->
      <div class="bg-white dark:bg-[#121217] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden transition hover:border-zinc-300 dark:hover:border-zinc-700">
        <div class="px-5 py-3.5 bg-violet-50/60 dark:bg-violet-950/20 border-b border-violet-100 dark:border-violet-900/30 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center">
              <Sun class="w-4 h-4" />
            </span>
            <span class="font-bold text-zinc-900 dark:text-white text-base">Обід</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="lunchMeal"
              @click="handleGenerateSingleMeal('lunch')"
              :disabled="generatingMealSlot === 'lunch'"
              class="inline-flex items-center gap-1.5 text-xs font-medium text-violet-800 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-200 px-2.5 py-1 rounded-lg bg-violet-100/70 dark:bg-violet-900/40 hover:bg-violet-200/80 transition cursor-pointer disabled:opacity-50"
              title="Перегенерувати лише обід за допомогою ШІ"
            >
              <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': generatingMealSlot === 'lunch' }" />
              {{ generatingMealSlot === 'lunch' ? 'Генерація...' : 'Перегенерувати' }}
            </button>
            <button
              v-else
              @click="openAddModal('lunch')"
              class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              + Вручну
            </button>
          </div>
        </div>

        <div class="p-5">
          <!-- Meal exists -->
          <div
            v-if="lunchMeal"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            @click="openRecipeModal(lunchMeal)"
          >
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                  {{ lunchMeal.recipe_title }}
                </h3>
                <span class="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  <Clock class="w-3 h-3" />
                  {{ lunchMeal.recipe_data?.prep_time_minutes || 30 }} хв
                </span>
                <span
                  v-if="lunchMeal.is_completed"
                  class="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-medium"
                >
                  <CheckCircle2 class="w-3 h-3" /> З'їдено
                </span>
              </div>

              <div class="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span class="text-zinc-900 dark:text-white font-bold">{{ lunchMeal.calories }} ккал</span>
                <span>• Б: {{ lunchMeal.protein }}г</span>
                <span>• Ж: {{ lunchMeal.fat }}г</span>
                <span>• В: {{ lunchMeal.carbs }}г</span>
                <span v-if="lunchMeal.recipe_data?.ingredients?.length" class="text-violet-600 dark:text-violet-400">
                  ({{ lunchMeal.recipe_data.ingredients.length }} інгредієнтів)
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0" @click.stop>
              <button
                @click="openRecipeModal(lunchMeal)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition cursor-pointer"
              >
                Рецепт
              </button>

              <button
                @click="handleEatMeal(lunchMeal)"
                class="p-2 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Записати в щоденник як з'їдене"
              >
                <CheckCircle2 class="w-4 h-4" :class="{ 'text-violet-600 dark:text-violet-400': lunchMeal.is_completed }" />
              </button>

              <button
                @click="handleDeleteMeal(lunchMeal.id)"
                class="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Видалити"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Empty slot -->
          <div v-else class="text-center py-6 text-zinc-400 space-y-3">
            <p class="text-sm">Обід ще не заплановано</p>
            <div class="flex items-center justify-center gap-2">
              <button
                @click="handleGenerateSingleMeal('lunch')"
                :disabled="generatingMealSlot === 'lunch'"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles class="w-3.5 h-3.5" :class="{ 'animate-spin': generatingMealSlot === 'lunch' }" />
                {{ generatingMealSlot === 'lunch' ? 'ШІ думає...' : 'Згенерувати обід' }}
              </button>
              <button
                @click="openAddModal('lunch')"
                class="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              >
                + Додати вручну
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Вечеря (Dinner) -->
      <div class="bg-white dark:bg-[#121217] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden transition hover:border-zinc-300 dark:hover:border-zinc-700">
        <div class="px-5 py-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Moon class="w-4 h-4" />
            </span>
            <span class="font-bold text-zinc-900 dark:text-white text-base">Вечеря</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="dinnerMeal"
              @click="handleGenerateSingleMeal('dinner')"
              :disabled="generatingMealSlot === 'dinner'"
              class="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-800 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-200 px-2.5 py-1 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 hover:bg-indigo-200/80 transition cursor-pointer disabled:opacity-50"
              title="Перегенерувати лише вечерю за допомогою ШІ"
            >
              <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': generatingMealSlot === 'dinner' }" />
              {{ generatingMealSlot === 'dinner' ? 'Генерація...' : 'Перегенерувати' }}
            </button>
            <button
              v-else
              @click="openAddModal('dinner')"
              class="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              + Вручну
            </button>
          </div>
        </div>

        <div class="p-5">
          <!-- Meal exists -->
          <div
            v-if="dinnerMeal"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            @click="openRecipeModal(dinnerMeal)"
          >
            <div class="space-y-1.5 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                  {{ dinnerMeal.recipe_title }}
                </h3>
                <span class="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  <Clock class="w-3 h-3" />
                  {{ dinnerMeal.recipe_data?.prep_time_minutes || 20 }} хв
                </span>
                <span
                  v-if="dinnerMeal.is_completed"
                  class="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-medium"
                >
                  <CheckCircle2 class="w-3 h-3" /> З'їдено
                </span>
              </div>

              <div class="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span class="text-zinc-900 dark:text-white font-bold">{{ dinnerMeal.calories }} ккал</span>
                <span>• Б: {{ dinnerMeal.protein }}г</span>
                <span>• Ж: {{ dinnerMeal.fat }}г</span>
                <span>• В: {{ dinnerMeal.carbs }}г</span>
                <span v-if="dinnerMeal.recipe_data?.ingredients?.length" class="text-indigo-600 dark:text-indigo-400">
                  ({{ dinnerMeal.recipe_data.ingredients.length }} інгредієнтів)
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0 pt-2 sm:pt-0" @click.stop>
              <button
                @click="openRecipeModal(dinnerMeal)"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition cursor-pointer"
              >
                Рецепт
              </button>

              <button
                @click="handleEatMeal(dinnerMeal)"
                class="p-2 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Записати в щоденник як з'їдене"
              >
                <CheckCircle2 class="w-4 h-4" :class="{ 'text-violet-600 dark:text-violet-400': dinnerMeal.is_completed }" />
              </button>

              <button
                @click="handleDeleteMeal(dinnerMeal.id)"
                class="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Видалити"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Empty slot -->
          <div v-else class="text-center py-6 text-zinc-400 space-y-3">
            <p class="text-sm">Вечеря ще не запланована</p>
            <div class="flex items-center justify-center gap-2">
              <button
                @click="handleGenerateSingleMeal('dinner')"
                :disabled="generatingMealSlot === 'dinner'"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles class="w-3.5 h-3.5" :class="{ 'animate-spin': generatingMealSlot === 'dinner' }" />
                {{ generatingMealSlot === 'dinner' ? 'ШІ думає...' : 'Згенерувати вечерю' }}
              </button>
              <button
                @click="openAddModal('dinner')"
                class="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              >
                + Додати вручну
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Other meals (e.g. snack) if any -->
      <div v-if="otherMeals.length > 0" class="space-y-3 pt-2">
        <h4 class="text-xs uppercase font-semibold text-zinc-400 tracking-wider">
          Додаткові прийоми їжі
        </h4>
        <div
          v-for="om in otherMeals"
          :key="om.id"
          class="bg-white dark:bg-[#121217] rounded-2xl p-4 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-4 cursor-pointer"
          @click="openRecipeModal(om)"
        >
          <div>
            <h5 class="font-bold text-zinc-900 dark:text-white">{{ om.recipe_title }}</h5>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ om.calories }} ккал • Б: {{ om.protein }}г • Ж: {{ om.fat }}г • В: {{ om.carbs }}г
            </div>
          </div>
          <div class="flex items-center gap-2" @click.stop>
            <button
              @click="handleEatMeal(om)"
              class="p-2 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <CheckCircle2 class="w-4 h-4" :class="{ 'text-violet-600 dark:text-violet-400': om.is_completed }" />
            </button>
            <button
              @click="handleDeleteMeal(om.id)"
              class="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recipe Detail Modal -->
    <RecipeModal
      :meal="selectedMeal"
      :isOpen="isRecipeModalOpen"
      @close="isRecipeModalOpen = false"
      @toggleCompleted="handleToggleCompleted"
    />

    <!-- Add Meal Manually Modal -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      @click.self="isAddModalOpen = false"
    >
      <div class="bg-white dark:bg-[#121217] rounded-3xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-zinc-900 dark:text-white">Додати страву до плану</h3>
          <button @click="isAddModalOpen = false" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleAddMealSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Прийом їжі
            </label>
            <select
              v-model="addMealType"
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option value="breakfast">Сніданок</option>
              <option value="lunch">Обід</option>
              <option value="dinner">Вечеря</option>
              <option value="snack">Перекус</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Назва страви
            </label>
            <input
              type="text"
              v-model="addTitle"
              required
              placeholder="Наприклад: Вівсянка з бананом"
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Калорії (ккал)
              </label>
              <input
                type="number"
                v-model.number="addCalories"
                placeholder="400"
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Білки (г)
              </label>
              <input
                type="number"
                step="0.1"
                v-model.number="addProtein"
                placeholder="20"
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Жири (г)
              </label>
              <input
                type="number"
                step="0.1"
                v-model.number="addFat"
                placeholder="15"
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Вуглеводи (г)
              </label>
              <input
                type="number"
                step="0.1"
                v-model.number="addCarbs"
                placeholder="50"
                class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Нотатки (необов'язково)
            </label>
            <textarea
              v-model="addNotes"
              rows="2"
              placeholder="Швидкі поради з приготування..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            ></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="isAddModalOpen = false"
              class="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm shadow-violet-500/20 active:scale-95 transition cursor-pointer"
            >
              Додати
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
