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
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div class="bg-white dark:bg-[#121217] rounded-3xl p-5 sm:p-6 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200/80 dark:border-zinc-800 my-auto space-y-4 animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CookingPot class="w-4 h-4" />
            </div>
            <h3 class="text-base font-semibold text-zinc-800 dark:text-zinc-100">Приготувати страву</h3>
          </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        Інгредієнти автоматично спишуться з холодильника, а приготована страва додасться у категорію «Готові страви» з розрахованим КБЖВ.
      </p>

      <!-- Error alert -->
      <div
        v-if="errorMessage"
        class="mb-4 flex items-center gap-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Назва страви *</label>
          <input
            v-model="recipeTitle"
            type="text"
            required
            placeholder="Наприклад: Борщ домашній або Паста з куркою"
            class="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Кількість порцій</label>
            <input
              v-model.number="servings"
              type="number"
              min="1"
              max="20"
              required
              class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">Термін (днів у холодильнику)</label>
            <input
              v-model.number="expiryDays"
              type="number"
              min="1"
              max="30"
              required
              class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
        </div>

        <!-- Ingredients List -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-zinc-700 dark:text-zinc-300">Інгредієнти до списання</label>
            <button
              type="button"
              @click="addIngredient"
              class="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline cursor-pointer"
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
                class="flex-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
              <input
                v-model.number="ing.quantity"
                type="number"
                step="any"
                min="0.1"
                placeholder="К-сть"
                class="w-20 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-center"
              />
              <select
                v-model="ing.unit"
                class="w-16 px-1.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              >
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
              <button
                type="button"
                @click="removeIngredient(idx)"
                class="p-1.5 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                :disabled="ingredients.length === 1"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              v-model="autoLog"
              type="checkbox"
              class="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500"
            />
            <span class="text-xs text-zinc-600 dark:text-zinc-300">
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
                'py-1 px-2 text-[11px] font-medium rounded-lg border transition-all text-center cursor-pointer',
                mealType === item.id
                  ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-500 text-violet-800 dark:text-violet-300'
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              ]"
            >
              {{ item.label }}
            </button>
          </div>

          <label class="flex items-start gap-2.5 cursor-pointer">
            <input
              v-model="ignoreMissing"
              type="checkbox"
              class="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-violet-600 focus:ring-violet-500"
            />
            <span class="text-xs text-zinc-600 dark:text-zinc-300">
              Продовжити, навіть якщо деяких інгредієнтів немає в холодильнику
            </span>
          </label>
        </div>

        <div class="flex gap-2.5 pt-3">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 py-2.5 px-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 px-4 text-xs font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
