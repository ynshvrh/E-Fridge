<script setup lang="ts">
import { ref } from 'vue'
import { X, Plus, Trash2, CookingPot, AlertCircle } from 'lucide-vue-next'
import type { CookIngredient, CookRecipeInput } from '@/types'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cook', payload: CookRecipeInput): void
}>()

const recipeTitle = ref('')
const servings = ref(2)
const expiryDays = ref(4)
const autoLog = ref(true)
const mealType = ref('lunch')
const ignoreMissing = ref(false)
const errorMessage = ref('')

const ingredients = ref<CookIngredient[]>([
  { name: '', quantity: 100, unit: 'г' },
])

const units = ['г', 'кг', 'мл', 'л', 'шт', 'уп']
const mealTypes = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

function addIngredient() {
  ingredients.value.push({ name: '', quantity: 100, unit: 'г' })
}

function removeIngredient(index: number) {
  if (ingredients.value.length > 1) {
    ingredients.value.splice(index, 1)
  }
}

function submit() {
  errorMessage.value = ''
  if (!recipeTitle.value.trim()) {
    errorMessage.value = 'Введіть назву страви'
    return
  }

  const validIngredients = ingredients.value.filter((i) => i.name.trim() !== '' && i.quantity > 0)
  if (validIngredients.length === 0) {
    errorMessage.value = 'Додайте хоча б один інгредієнт'
    return
  }

  emit('cook', {
    recipe_title: recipeTitle.value.trim(),
    servings: Number(servings.value),
    expiry_days: Number(expiryDays.value),
    ingredients: validIngredients,
    ignore_missing: ignoreMissing.value,
    auto_log_as_meal: autoLog.value,
    meal_type: mealType.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200/80 dark:border-stone-800 my-auto space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CookingPot class="w-4 h-4" />
            </div>
            <h3 class="text-base font-semibold text-stone-800 dark:text-stone-100">Приготувати страву</h3>
          </div>
        <button
          @click="emit('close')"
          class="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <p class="text-xs text-stone-500 mb-4">
        Інгредієнти автоматично спишуться з холодильника, а приготована страва додасться у категорію «Готові страви» з розрахованим КБЖВ.
      </p>

      <!-- Error alert -->
      <div
        v-if="errorMessage"
        class="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Назва страви *</label>
          <input
            v-model="recipeTitle"
            type="text"
            required
            placeholder="Наприклад: Борщ домашній або Паста з куркою"
            class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Кількість порцій</label>
            <input
              v-model.number="servings"
              type="number"
              min="1"
              max="20"
              required
              class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Термін (днів у холодильнику)</label>
            <input
              v-model.number="expiryDays"
              type="number"
              min="1"
              max="30"
              required
              class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <!-- Ingredients List -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-stone-700">Інгредієнти до списання</label>
            <button
              type="button"
              @click="addIngredient"
              class="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium hover:underline"
            >
              <Plus class="w-3.5 h-3.5" />
              Додати інгредієнт
            </button>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(ing, idx) in ingredients"
              :key="idx"
              class="flex items-center gap-2"
            >
              <input
                v-model="ing.name"
                type="text"
                placeholder="Інгредієнт (напр. картопля)"
                class="flex-1 px-3 py-1.5 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
              />
              <input
                v-model.number="ing.quantity"
                type="number"
                step="any"
                min="0.1"
                placeholder="К-сть"
                class="w-20 px-2 py-1.5 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 text-center"
              />
              <select
                v-model="ing.unit"
                class="w-16 px-1.5 py-1.5 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
              >
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
              <button
                type="button"
                @click="removeIngredient(idx)"
                class="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg transition-colors"
                :disabled="ingredients.length === 1"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-2.5 pt-2 border-t border-stone-100">
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              v-model="autoLog"
              type="checkbox"
              class="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span class="text-xs text-stone-600">
              З'їсти 1 порцію зараз (записати в щоденник харчування)
            </span>
          </label>

          <div v-if="autoLog" class="pl-6 grid grid-cols-4 gap-1.5">
            <button
              v-for="item in mealTypes"
              :key="item.id"
              type="button"
              @click="mealType = item.id"
              :class="[
                'py-1 px-2 text-[11px] font-medium rounded-lg border transition-all text-center',
                mealType === item.id
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-stone-50 border-stone-200 text-stone-500'
              ]"
            >
              {{ item.label }}
            </button>
          </div>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              v-model="ignoreMissing"
              type="checkbox"
              class="mt-0.5 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span class="text-xs text-stone-600">
              Продовжити, навіть якщо деяких інгредієнтів немає в холодильнику
            </span>
          </label>
        </div>

        <div class="flex gap-2.5 pt-3">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 py-2.5 px-4 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Скасувати
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 px-4 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <CookingPot class="w-4 h-4" />
            <span>Приготувати</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  </Teleport>
</template>
