<script setup lang="ts">
import { ref } from 'vue'
import { X, Utensils } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: {
    meal_type: string
    food_name: string
    quantity: number
    unit: string
    calories?: number
    protein?: number
    fat?: number
    carbs?: number
  }): void
}>()

const foodName = ref('')
const foodQty = ref(100)
const foodUnit = ref('г')
const foodMealType = ref('lunch')
const foodCalories = ref<number | undefined>()
const foodProtein = ref<number | undefined>()
const foodFat = ref<number | undefined>()
const foodCarbs = ref<number | undefined>()

const mealTypes = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

const unitOptions = ['г', 'мл', 'шт', 'порц', 'кг', 'л']

function handleSubmit() {
  if (!foodName.value.trim()) return
  emit('submit', {
    meal_type: foodMealType.value,
    food_name: foodName.value.trim(),
    quantity: Number(foodQty.value),
    unit: foodUnit.value,
    calories: foodCalories.value ? Number(foodCalories.value) : 0,
    protein: foodProtein.value ? Number(foodProtein.value) : 0,
    fat: foodFat.value ? Number(foodFat.value) : 0,
    carbs: foodCarbs.value ? Number(foodCarbs.value) : 0,
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 w-full max-w-sm max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200/80 dark:border-stone-800 my-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Utensils class="w-4 h-4" />
            </div>
            <h3 class="text-base font-semibold text-stone-800 dark:text-stone-100">Додати прийом їжі</h3>
          </div>
          <button @click="emit('close')" class="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1">Прийом їжі</label>
            <select
              v-model="foodMealType"
              class="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-emerald-500"
            >
              <option v-for="m in mealTypes" :key="m.id" :value="m.id">{{ m.label }}</option>
            </select>
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1">Назва страви / продукту *</label>
            <input
              v-model="foodName"
              type="text"
              required
              placeholder="Наприклад: Вівсянка з бананом"
              class="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-emerald-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1">Кількість *</label>
              <input
                v-model.number="foodQty"
                type="number"
                min="0.1"
                step="any"
                required
                class="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-emerald-500"
              />
            </div>
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1">Одиниця</label>
              <select
                v-model="foodUnit"
                class="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-emerald-500"
              >
                <option v-for="u in unitOptions" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>

          <p class="text-[11px] text-stone-400 dark:text-stone-500 leading-relaxed">
            💡 Залиште калорії та БЖВ порожніми — система розрахує їх автоматично за назвою страви.
          </p>

          <div class="p-2.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/70 dark:border-stone-700">
            <div class="grid grid-cols-4 gap-1.5">
              <div>
                <label class="block text-[10px] text-stone-500 dark:text-stone-400 mb-0.5">Ккал</label>
                <input v-model.number="foodCalories" type="number" class="w-full px-1.5 py-1 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs text-center rounded border border-stone-200 dark:border-stone-700" />
              </div>
              <div>
                <label class="block text-[10px] text-stone-500 dark:text-stone-400 mb-0.5">Білки</label>
                <input v-model.number="foodProtein" type="number" step="0.1" class="w-full px-1.5 py-1 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs text-center rounded border border-stone-200 dark:border-stone-700" />
              </div>
              <div>
                <label class="block text-[10px] text-stone-500 dark:text-stone-400 mb-0.5">Жири</label>
                <input v-model.number="foodFat" type="number" step="0.1" class="w-full px-1.5 py-1 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs text-center rounded border border-stone-200 dark:border-stone-700" />
              </div>
              <div>
                <label class="block text-[10px] text-stone-500 dark:text-stone-400 mb-0.5">Вугл.</label>
                <input v-model.number="foodCarbs" type="number" step="0.1" class="w-full px-1.5 py-1 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs text-center rounded border border-stone-200 dark:border-stone-700" />
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="flex-1 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              class="flex-1 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Додати
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
