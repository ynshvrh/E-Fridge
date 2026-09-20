<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Scale, Flame, Check, Loader2 } from 'lucide-vue-next'
import type { NutritionLog, UpdateNutritionLogInput } from '@/types'

const props = defineProps<{
  log: NutritionLog
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: UpdateNutritionLogInput): void
}>()

const foodName = ref(props.log.food_name)
const mealType = ref(props.log.meal_type)
const quantity = ref(props.log.quantity)
const unit = ref(props.log.unit)
const calories = ref(props.log.calories)
const protein = ref(props.log.protein)
const fat = ref(props.log.fat)
const carbs = ref(props.log.carbs)
const isSaving = ref(false)

const mealTypes = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

const units = ['г', 'мл', 'шт', 'порц', 'кг', 'л']

// Proportional auto-scaling when quantity is changed
watch(quantity, (newQty, oldQty) => {
  if (oldQty && oldQty > 0 && newQty > 0) {
    const ratio = newQty / oldQty
    calories.value = Math.max(0, Math.round(calories.value * ratio))
    protein.value = Math.max(0, Math.round(protein.value * ratio * 10) / 10)
    fat.value = Math.max(0, Math.round(fat.value * ratio * 10) / 10)
    carbs.value = Math.max(0, Math.round(carbs.value * ratio * 10) / 10)
  }
})

function submit() {
  if (!foodName.value.trim() || quantity.value <= 0) return
  isSaving.value = true
  emit('save', {
    meal_type: mealType.value,
    food_name: foodName.value.trim(),
    quantity: Number(quantity.value),
    unit: unit.value,
    calories: Number(calories.value),
    protein: Number(protein.value),
    fat: Number(fat.value),
    carbs: Number(carbs.value),
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-white dark:bg-[#121217] rounded-3xl p-5 sm:p-6 w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-zinc-800 my-auto space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Scale class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-zinc-800 dark:text-zinc-100">Редагувати запис їжі</h3>
              <p class="text-[11px] text-zinc-400 dark:text-zinc-500">Змініть грамовку або поживну цінність</p>
            </div>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4 text-xs">
          <!-- Food Name -->
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Назва страви / продукту *</label>
            <input
              v-model="foodName"
              type="text"
              required
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <!-- Meal Type -->
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Прийом їжі</label>
            <select
              v-model="mealType"
              class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option v-for="m in mealTypes" :key="m.id" :value="m.id">{{ m.label }}</option>
            </select>
          </div>

          <!-- Quantity & Unit -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Грамовка / Кількість *</label>
              <input
                v-model.number="quantity"
                type="number"
                step="any"
                min="0.1"
                required
                class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>

            <div>
              <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Одиниця</label>
              <select
                v-model="unit"
                class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              >
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>

          <!-- Calories & Macros -->
          <div class="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <div class="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Flame class="w-3.5 h-3.5 text-amber-500" />
              <span>Поживна цінність (КБЖВ)</span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label class="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Калорії (ккал)</label>
                <input
                  v-model.number="calories"
                  type="number"
                  min="0"
                  class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-center font-medium"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Білки (г)</label>
                <input
                  v-model.number="protein"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-center font-medium"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Жири (г)</label>
                <input
                  v-model.number="fat"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-center font-medium"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Вуглеводи (г)</label>
                <input
                  v-model.number="carbs"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-center font-medium"
                />
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="flex-1 py-2.5 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              :disabled="isSaving || !foodName.trim() || quantity <= 0"
              class="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-sm shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Loader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
              <Check v-else class="w-3.5 h-3.5" />
              <span>{{ isSaving ? 'Збереження...' : 'Зберегти зміни' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
