<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'

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
  <div class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/80">
      <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
        <h3 class="text-base font-semibold text-stone-800">Додати прийом їжі</h3>
        <button @click="emit('close')" class="text-stone-400 hover:text-stone-600">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Прийом їжі</label>
          <select
            v-model="foodMealType"
            class="w-full px-3 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
          >
            <option v-for="m in mealTypes" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Назва страви / продукту</label>
          <input
            v-model="foodName"
            type="text"
            required
            placeholder="Наприклад: Вівсянка з медом"
            class="w-full px-3 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Кількість</label>
            <input
              v-model.number="foodQty"
              type="number"
              min="1"
              required
              class="w-full px-3 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Одиниця</label>
            <input
              v-model="foodUnit"
              type="text"
              class="w-full px-3 py-2 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
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
            @click="emit('close')"
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
</template>
