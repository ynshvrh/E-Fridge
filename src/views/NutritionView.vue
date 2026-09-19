<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useNutritionStore } from '@/stores/nutrition'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Flame,
  Settings2,
  X
} from 'lucide-vue-next'
import type { Goals } from '@/types'

const nutritionStore = useNutritionStore()

const showAddLogModal = ref(false)
const showGoalsModal = ref(false)

const foodName = ref('')
const foodQty = ref(100)
const foodUnit = ref('г')
const foodMealType = ref('lunch')
const foodCalories = ref<number | undefined>()
const foodProtein = ref<number | undefined>()
const foodFat = ref<number | undefined>()
const foodCarbs = ref<number | undefined>()

const editGoals = ref<Goals>({
  calorie_target: 2000,
  protein_target: 100,
  fat_target: 70,
  carbs_target: 250,
})

const mealTypes = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

onMounted(async () => {
  await nutritionStore.fetchDaily()
  if (nutritionStore.dailySummary?.goals) {
    editGoals.value = { ...nutritionStore.dailySummary.goals }
  }
})

function changeDate(days: number) {
  const current = new Date(nutritionStore.currentDate)
  current.setDate(current.getDate() + days)
  const dateStr = current.toISOString().split('T')[0]
  nutritionStore.fetchDaily(dateStr)
}

const isToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return nutritionStore.currentDate === today
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

async function handleAddLog() {
  if (!foodName.value.trim()) return
  await nutritionStore.logMeal({
    date: nutritionStore.currentDate,
    meal_type: foodMealType.value,
    food_name: foodName.value.trim(),
    quantity: Number(foodQty.value),
    unit: foodUnit.value,
    calories: foodCalories.value ? Number(foodCalories.value) : 0,
    protein: foodProtein.value ? Number(foodProtein.value) : 0,
    fat: foodFat.value ? Number(foodFat.value) : 0,
    carbs: foodCarbs.value ? Number(foodCarbs.value) : 0,
  })
  foodName.value = ''
  foodCalories.value = undefined
  foodProtein.value = undefined
  foodFat.value = undefined
  foodCarbs.value = undefined
  showAddLogModal.value = false
}

async function handleSaveGoals() {
  await nutritionStore.updateGoals(editGoals.value)
  showGoalsModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Date Navigator -->
    <div class="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-sm">
      <button
        @click="changeDate(-1)"
        class="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-colors"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <div class="text-center">
        <span class="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
          {{ isToday ? 'Сьогодні' : 'Дата' }}
        </span>
        <input
          type="date"
          :value="nutritionStore.currentDate"
          @change="(e: any) => nutritionStore.fetchDaily(e.target.value)"
          class="text-sm font-semibold text-stone-800 bg-transparent cursor-pointer border-none focus:outline-none"
        />
      </div>

      <div class="flex items-center gap-1">
        <button
          @click="changeDate(1)"
          class="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-colors"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <button
          @click="showGoalsModal = true"
          title="Налаштувати цілі КБЖВ"
          class="p-2 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-xl transition-colors ml-1"
        >
          <Settings2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Calories Card -->
    <div class="bg-gradient-to-br from-emerald-50/60 to-white p-5 rounded-3xl border border-emerald-100/80 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Flame class="w-4 h-4" />
          </div>
          <span class="text-sm font-medium text-stone-700">Калорії</span>
        </div>
        <div class="text-xs text-stone-500">
          Ціль: <span class="font-semibold text-stone-800">{{ summary?.goals.calorie_target || 2000 }}</span> ккал
        </div>
      </div>

      <div class="flex items-baseline gap-2 mb-2">
        <span class="text-3xl font-bold text-stone-800 tracking-tight">{{ summary?.total_calories || 0 }}</span>
        <span class="text-xs text-stone-400">/ {{ summary?.goals.calorie_target || 2000 }} ккал</span>
        <span class="ml-auto text-xs font-semibold text-emerald-700">{{ calPercent }}%</span>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
        <div
          class="bg-emerald-500 h-full rounded-full transition-all duration-500"
          :style="{ width: `${calPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- Macros Grid -->
    <div class="grid grid-cols-3 gap-3">
      <!-- Protein -->
      <div class="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-sm">
        <div class="text-[11px] text-stone-500 font-medium">Білки</div>
        <div class="text-base font-semibold text-stone-800 mt-1">
          {{ summary?.total_protein || 0 }} <span class="text-xs text-stone-400">/ {{ summary?.goals.protein_target }}г</span>
        </div>
        <div class="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-2">
          <div class="bg-blue-400 h-full rounded-full" :style="{ width: `${proteinPercent}%` }"></div>
        </div>
      </div>

      <!-- Fat -->
      <div class="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-sm">
        <div class="text-[11px] text-stone-500 font-medium">Жири</div>
        <div class="text-base font-semibold text-stone-800 mt-1">
          {{ summary?.total_fat || 0 }} <span class="text-xs text-stone-400">/ {{ summary?.goals.fat_target }}г</span>
        </div>
        <div class="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-2">
          <div class="bg-amber-400 h-full rounded-full" :style="{ width: `${fatPercent}%` }"></div>
        </div>
      </div>

      <!-- Carbs -->
      <div class="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-sm">
        <div class="text-[11px] text-stone-500 font-medium">Вуглеводи</div>
        <div class="text-base font-semibold text-stone-800 mt-1">
          {{ summary?.total_carbs || 0 }} <span class="text-xs text-stone-400">/ {{ summary?.goals.carbs_target }}г</span>
        </div>
        <div class="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-2">
          <div class="bg-rose-400 h-full rounded-full" :style="{ width: `${carbsPercent}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Add manual log button -->
    <div class="flex justify-end">
      <button
        @click="showAddLogModal = true"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-medium rounded-xl transition-colors"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Додати страву вручну</span>
      </button>
    </div>

    <!-- Meals Sections -->
    <div class="space-y-4">
      <div
        v-for="type in mealTypes"
        :key="type.id"
        class="bg-white rounded-2xl border border-stone-200/70 p-4 shadow-sm"
      >
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-xs font-semibold text-stone-700 uppercase tracking-wide">
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

    <!-- Modal: Add Manual Log -->
    <div
      v-if="showAddLogModal"
      class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/80">
        <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <h3 class="text-base font-semibold text-stone-800">Додати до щоденника</h3>
          <button @click="showAddLogModal = false" class="text-stone-400 hover:text-stone-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleAddLog" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Страва / Продукт *</label>
            <input
              v-model="foodName"
              type="text"
              required
              placeholder="Наприклад: Вівсянка з бананом"
              class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Прийом їжі</label>
            <select
              v-model="foodMealType"
              class="w-full px-3 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none"
            >
              <option v-for="t in mealTypes" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium text-stone-600 mb-1">Кількість</label>
              <input
                v-model.number="foodQty"
                type="number"
                step="any"
                min="0.1"
                class="w-full px-3 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-stone-600 mb-1">Одиниця</label>
              <input
                v-model="foodUnit"
                type="text"
                placeholder="г / шт / порц"
                class="w-full px-3 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none"
              />
            </div>
          </div>

          <p class="text-[11px] text-stone-400">
            💡 Залиште калорії та БЖВ порожніми — система розрахує їх автоматично за назвою продукту.
          </p>

          <div class="grid grid-cols-4 gap-1.5 pt-1">
            <div>
              <label class="block text-[10px] text-stone-400">Ккал</label>
              <input v-model.number="foodCalories" type="number" class="w-full px-2 py-1 bg-stone-50 text-xs rounded border" />
            </div>
            <div>
              <label class="block text-[10px] text-stone-400">Білки</label>
              <input v-model.number="foodProtein" type="number" step="0.1" class="w-full px-2 py-1 bg-stone-50 text-xs rounded border" />
            </div>
            <div>
              <label class="block text-[10px] text-stone-400">Жири</label>
              <input v-model.number="foodFat" type="number" step="0.1" class="w-full px-2 py-1 bg-stone-50 text-xs rounded border" />
            </div>
            <div>
              <label class="block text-[10px] text-stone-400">Вугл.</label>
              <input v-model.number="foodCarbs" type="number" step="0.1" class="w-full px-2 py-1 bg-stone-50 text-xs rounded border" />
            </div>
          </div>

          <div class="flex gap-2 pt-3">
            <button
              type="button"
              @click="showAddLogModal = false"
              class="flex-1 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Скасувати
            </button>
            <button
              type="submit"
              class="flex-1 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              Додати
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Goals Settings -->
    <div
      v-if="showGoalsModal"
      class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/80">
        <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <h3 class="text-base font-semibold text-stone-800">Денні цілі КБЖВ</h3>
          <button @click="showGoalsModal = false" class="text-stone-400 hover:text-stone-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSaveGoals" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Калорії (ккал)</label>
            <input
              v-model.number="editGoals.calorie_target"
              type="number"
              required
              class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Білки (г)</label>
            <input
              v-model.number="editGoals.protein_target"
              type="number"
              step="0.1"
              required
              class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Жири (г)</label>
            <input
              v-model.number="editGoals.fat_target"
              type="number"
              step="0.1"
              required
              class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Вуглеводи (г)</label>
            <input
              v-model.number="editGoals.carbs_target"
              type="number"
              step="0.1"
              required
              class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex gap-2 pt-3">
            <button
              type="button"
              @click="showGoalsModal = false"
              class="flex-1 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Скасувати
            </button>
            <button
              type="submit"
              class="flex-1 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
