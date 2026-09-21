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

// Structured slots for simple rendering
const mealSlots = computed(() => [
  {
    type: 'breakfast',
    label: 'Сніданок',
    icon: Coffee,
    meal: breakfastMeal.value,
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    type: 'lunch',
    label: 'Обід',
    icon: Sun,
    meal: lunchMeal.value,
    badgeColor: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40',
  },
  {
    type: 'dinner',
    label: 'Вечеря',
    icon: Moon,
    meal: dinnerMeal.value,
    badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40',
  },
])

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

// Generate whole day
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
    showNotice(`"${meal.recipe_title}" записано у трекер харчування!`)
  } catch (err: any) {
    showError(err.message || 'Помилка запису в трекер')
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
  <div class="space-y-2.5 sm:space-y-3.5">
    <!-- Notices / Toasts -->
    <div
      v-if="successNotice"
      class="p-2.5 sm:p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs transition-all"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{{ successNotice }}</span>
      </div>
      <button @click="successNotice = null" class="p-1 hover:bg-emerald-100 rounded cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <div
      v-if="errorNotice"
      class="p-2.5 sm:p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between shadow-xs transition-all"
    >
      <span>{{ errorNotice }}</span>
      <button @click="errorNotice = null" class="p-1 hover:bg-rose-100 rounded cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Date Navigation Header (Minimalist & Compact, like Tracker) -->
    <div class="bg-white dark:bg-[#121217] p-2 sm:p-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between flex-wrap gap-2">
      <!-- Date Switcher -->
      <div class="flex items-center gap-1 sm:gap-1.5">
        <button
          @click="prevDay"
          class="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          title="Попередній день"
        >
          <ChevronLeft class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div class="relative flex items-center gap-1 cursor-pointer">
          <CalendarDays class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span class="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 min-w-[110px] sm:min-w-[140px] text-center">
            {{ displayDateString }}
          </span>
          <input
            type="date"
            v-model="selectedDate"
            class="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            id="date-picker-input"
          />
        </div>

        <button
          @click="nextDay"
          class="p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          title="Наступний день"
        >
          <ChevronRight class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          v-if="!isToday"
          @click="goToToday"
          class="ml-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
        >
          Сьогодні
        </button>
      </div>

      <!-- Action: AI Generate Whole Day -->
      <div class="flex items-center gap-1.5">
        <button
          v-if="!isDayFullyGenerated"
          @click="handleGenerateDay"
          :disabled="isGeneratingDay"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <Sparkles class="w-3.5 h-3.5" :class="{ 'animate-spin': isGeneratingDay }" />
          <span>{{ isGeneratingDay ? 'ШІ складає меню...' : 'Згенерувати раціон' }}</span>
        </button>
        <div
          v-else
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 rounded-xl"
        >
          <CheckCircle2 class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span>Раціон готовий</span>
        </div>
      </div>
    </div>

    <!-- Day Summary Card (Compact & Minimalist) -->
    <div class="bg-white dark:bg-[#121217] p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Flame class="w-4 h-4" />
        </div>
        <div>
          <span class="text-zinc-400 dark:text-zinc-500 text-[11px] block leading-tight">Разом за день:</span>
          <span class="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            {{ totalCalories }} <span class="text-xs font-normal text-zinc-400">ккал</span>
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3 sm:gap-4 font-medium">
        <div>
          <span class="text-[10px] text-zinc-400 block uppercase">Білки</span>
          <span class="text-zinc-800 dark:text-zinc-200 font-semibold">{{ totalProtein }}г</span>
        </div>
        <div>
          <span class="text-[10px] text-zinc-400 block uppercase">Жири</span>
          <span class="text-zinc-800 dark:text-zinc-200 font-semibold">{{ totalFat }}г</span>
        </div>
        <div>
          <span class="text-[10px] text-zinc-400 block uppercase">Вуглеводи</span>
          <span class="text-zinc-800 dark:text-zinc-200 font-semibold">{{ totalCarbs }}г</span>
        </div>
      </div>

      <div class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg">
        {{ completedCount }} / {{ dayMeals.length }} спожито
      </div>
    </div>

    <!-- 3 Daily Meal Slots -->
    <div class="space-y-2 sm:space-y-2.5">
      <div
        v-for="slot in mealSlots"
        :key="slot.type"
        class="bg-white dark:bg-[#121217] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
      >
        <!-- Slot Header -->
        <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div class="flex items-center gap-2">
            <span :class="['w-6 h-6 rounded-lg flex items-center justify-center', slot.badgeColor]">
              <component :is="slot.icon" class="w-3.5 h-3.5" />
            </span>
            <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              {{ slot.label }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <span v-if="slot.meal" class="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1">
              {{ slot.meal.calories }} ккал
            </span>
            <button
              v-if="slot.meal"
              @click="handleGenerateSingleMeal(slot.type)"
              :disabled="generatingMealSlot === slot.type"
              class="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 px-2 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
              title="Перегенерувати страву за допомогою ШІ"
            >
              <RotateCcw class="w-3 h-3" :class="{ 'animate-spin': generatingMealSlot === slot.type }" />
              <span>{{ generatingMealSlot === slot.type ? 'ШІ...' : 'Змінити' }}</span>
            </button>
            <button
              v-else
              @click="openAddModal(slot.type)"
              class="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              + Вручну
            </button>
          </div>
        </div>

        <!-- Slot Body -->
        <div class="p-3 sm:p-3.5">
          <!-- Meal Planned -->
          <div
            v-if="slot.meal"
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer group"
            @click="openRecipeModal(slot.meal)"
          >
            <div class="space-y-1 flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition truncate">
                  {{ slot.meal.recipe_title }}
                </h3>
                <span class="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  <Clock class="w-3 h-3" />
                  {{ slot.meal.recipe_data?.prep_time_minutes || 20 }} хв
                </span>
                <span
                  v-if="slot.meal.is_completed"
                  class="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-medium"
                >
                  <CheckCircle2 class="w-3 h-3" /> З'їдено
                </span>
              </div>

              <div class="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span class="font-medium text-zinc-700 dark:text-zinc-200">{{ slot.meal.calories }} ккал</span>
                <span>Б: {{ slot.meal.protein }}г</span>
                <span>Ж: {{ slot.meal.fat }}г</span>
                <span>В: {{ slot.meal.carbs }}г</span>
                <span v-if="slot.meal.recipe_data?.ingredients?.length" class="text-violet-600 dark:text-violet-400 text-[11px]">
                  ({{ slot.meal.recipe_data.ingredients.length }} інгр.)
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0" @click.stop>
              <button
                @click="openRecipeModal(slot.meal)"
                class="px-2.5 py-1 rounded-xl text-xs font-medium bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition cursor-pointer"
              >
                Рецепт
              </button>

              <button
                @click="handleEatMeal(slot.meal)"
                :title="slot.meal.is_completed ? 'Позначено як з\'їдене' : 'Записати в трекер як з\'їдене'"
                class="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <CheckCircle2 class="w-4 h-4" :class="{ 'text-emerald-600 dark:text-emerald-400': slot.meal.is_completed }" />
              </button>

              <button
                @click="handleDeleteMeal(slot.meal.id)"
                title="Видалити"
                class="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Empty Meal Slot (Minimalist) -->
          <div v-else class="flex flex-col sm:flex-row items-center justify-between gap-2 py-1.5 text-zinc-400 text-xs">
            <span>{{ slot.label }} ще не заплановано</span>
            <div class="flex items-center gap-1.5">
              <button
                @click="handleGenerateSingleMeal(slot.type)"
                :disabled="generatingMealSlot === slot.type"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles class="w-3 h-3" :class="{ 'animate-spin': generatingMealSlot === slot.type }" />
                <span>{{ generatingMealSlot === slot.type ? 'ШІ думає...' : 'Згенерувати ШІ' }}</span>
              </button>
              <button
                @click="openAddModal(slot.type)"
                class="px-2.5 py-1 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              >
                + Вручну
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Meals (e.g. snack) if any -->
      <div v-if="otherMeals.length > 0" class="space-y-2 pt-1">
        <div class="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider px-1">
          Додаткові прийоми їжі
        </div>
        <div
          v-for="om in otherMeals"
          :key="om.id"
          class="bg-white dark:bg-[#121217] rounded-2xl p-3 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-3 cursor-pointer"
          @click="openRecipeModal(om)"
        >
          <div class="min-w-0">
            <h5 class="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{{ om.recipe_title }}</h5>
            <div class="text-[11px] text-zinc-400 mt-0.5">
              {{ om.calories }} ккал · Б: {{ om.protein }}г · Ж: {{ om.fat }}г · В: {{ om.carbs }}г
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0" @click.stop>
            <button
              @click="handleEatMeal(om)"
              class="p-1.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <CheckCircle2 class="w-4 h-4" :class="{ 'text-emerald-600 dark:text-emerald-400': om.is_completed }" />
            </button>
            <button
              @click="handleDeleteMeal(om.id)"
              class="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
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

    <!-- Add Meal Manually Modal (Compact) -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      @click.self="isAddModalOpen = false"
    >
      <div class="bg-white dark:bg-[#121217] rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Додати страву до плану</h3>
          <button @click="isAddModalOpen = false" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleAddMealSubmit" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Прийом їжі
            </label>
            <select
              v-model="addMealType"
              class="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option value="breakfast">Сніданок</option>
              <option value="lunch">Обід</option>
              <option value="dinner">Вечеря</option>
              <option value="snack">Перекус</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Назва страви
            </label>
            <input
              type="text"
              v-model="addTitle"
              required
              placeholder="Наприклад: Вівсянка з ягодами"
              class="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Калорії (ккал)
              </label>
              <input
                type="number"
                v-model.number="addCalories"
                placeholder="400"
                class="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Білки (г)
              </label>
              <input
                type="number"
                step="0.1"
                v-model.number="addProtein"
                placeholder="20"
                class="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Жири (г)
              </label>
              <input
                type="number"
                step="0.1"
                v-model.number="addFat"
                placeholder="15"
                class="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Вуглеводи (г)
              </label>
              <input
                type="number"
                step="0.1"
                v-model.number="addCarbs"
                placeholder="50"
                class="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Нотатки (необов'язково)
            </label>
            <textarea
              v-model="addNotes"
              rows="2"
              placeholder="Швидкі поради з приготування..."
              class="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            ></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="isAddModalOpen = false"
              class="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-xs active:scale-95 transition cursor-pointer"
            >
              Додати
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
