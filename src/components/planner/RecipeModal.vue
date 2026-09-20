<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MealPlan } from '@/types'
import { useShoppingStore } from '@/stores/shopping'
import {
  X,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  AlertCircle,
  ShoppingCart,
  ChefHat,
  Utensils,
  Check
} from 'lucide-vue-next'

const props = defineProps<{
  meal: MealPlan | null
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggleCompleted', meal: MealPlan): void
}>()

const shoppingStore = useShoppingStore()
const isAddingToShopping = ref(false)
const shoppingAddedMessage = ref<string | null>(null)

const mealTypeLabels: Record<string, { label: string; class: string }> = {
  breakfast: { label: 'Сніданок', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  lunch: { label: 'Обід', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  dinner: { label: 'Вечеря', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  snack: { label: 'Перекус', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
}

const mealTypeInfo = computed(() => {
  if (!props.meal) return { label: 'Страва', class: 'bg-slate-100 text-slate-800' }
  return mealTypeLabels[props.meal.meal_type] || { label: props.meal.meal_type, class: 'bg-slate-100 text-slate-800' }
})

const ingredients = computed(() => {
  return props.meal?.recipe_data?.ingredients || []
})

const instructions = computed(() => {
  return props.meal?.recipe_data?.instructions || []
})

const prepTime = computed(() => {
  return props.meal?.recipe_data?.prep_time_minutes || 20
})

const missingIngredients = computed(() => {
  return ingredients.value.filter((i) => !i.in_fridge)
})

async function handleAddMissingToShopping() {
  if (!missingIngredients.value.length || isAddingToShopping.value) return
  isAddingToShopping.value = true
  shoppingAddedMessage.value = null

  try {
    const items = missingIngredients.value.map((ing) => ({
      name: ing.name,
      quantity: ing.amount || 1,
      unit: ing.unit || 'шт',
      category: 'other',
    }))

    await shoppingStore.batchAddItems(items)
    shoppingAddedMessage.value = `Додано ${items.length} прод. до списку покупок!`
    setTimeout(() => {
      shoppingAddedMessage.value = null
    }, 4000)
  } catch (err: any) {
    alert(err?.message || 'Не вдалося додати продукти до списку покупок')
  } finally {
    isAddingToShopping.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen && meal"
    class="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    @click.self="emit('close')"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5 flex-wrap">
            <span :class="['px-2.5 py-0.5 rounded-full text-xs font-semibold', mealTypeInfo.class]">
              {{ mealTypeInfo.label }}
            </span>
            <span class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              <Clock class="w-3.5 h-3.5" />
              {{ prepTime }} хв
            </span>
            <span
              v-if="meal.is_completed"
              class="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium"
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              Виконано
            </span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            {{ meal.recipe_title }}
          </h2>
        </div>
        <button
          @click="emit('close')"
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body Scrollable -->
      <div class="px-6 py-5 overflow-y-auto space-y-6 flex-1">
        <!-- Description if available -->
        <p v-if="meal.recipe_data?.description" class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
          "{{ meal.recipe_data.description }}"
        </p>

        <!-- Macros Grid (КБЖВ) -->
        <div class="grid grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
          <div class="text-center">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5 flex items-center justify-center gap-1">
              <Flame class="w-3.5 h-3.5 text-amber-500" /> Калорії
            </div>
            <div class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {{ meal.calories }} <span class="text-xs font-normal text-slate-500">ккал</span>
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Білки</div>
            <div class="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {{ meal.protein }} <span class="text-xs font-normal text-slate-500">г</span>
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Жири</div>
            <div class="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400">
              {{ meal.fat }} <span class="text-xs font-normal text-slate-500">г</span>
            </div>
          </div>
          <div class="text-center">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Вуглеводи</div>
            <div class="text-base sm:text-lg font-bold text-sky-600 dark:text-sky-400">
              {{ meal.carbs }} <span class="text-xs font-normal text-slate-500">г</span>
            </div>
          </div>
        </div>

        <!-- Ingredients Section -->
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Utensils class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Інгредієнти
            </h3>
            <span class="text-xs text-slate-500">
              {{ ingredients.length }} позицій
            </span>
          </div>

          <div v-if="ingredients.length === 0" class="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            Список інгредієнтів не вказано.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(ing, idx) in ingredients"
              :key="idx"
              class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 text-sm"
            >
              <div class="flex items-center gap-2.5">
                <span
                  :class="[
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0',
                    ing.in_fridge
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  ]"
                >
                  <Check v-if="ing.in_fridge" class="w-3 h-3" />
                  <AlertCircle v-else class="w-3 h-3" />
                </span>
                <span class="font-medium text-slate-800 dark:text-slate-200">
                  {{ ing.name }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-slate-600 dark:text-slate-400 font-medium">
                  {{ ing.amount }} {{ ing.unit }}
                </span>
                <span
                  v-if="ing.in_fridge"
                  class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hidden sm:inline"
                >
                  Є в холодильнику
                </span>
                <span
                  v-else
                  class="text-[11px] font-medium text-amber-600 dark:text-amber-400 hidden sm:inline"
                >
                  Відсутній
                </span>
              </div>
            </div>
          </div>

          <!-- Add missing button if there are missing ingredients -->
          <div v-if="missingIngredients.length > 0" class="mt-3 flex items-center justify-between gap-3">
            <button
              @click="handleAddMissingToShopping"
              :disabled="isAddingToShopping"
              class="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition disabled:opacity-50"
            >
              <ShoppingCart class="w-3.5 h-3.5" />
              {{ isAddingToShopping ? 'Додаємо...' : `Додати відсутні (${missingIngredients.length}) до списку покупок` }}
            </button>
            <span v-if="shoppingAddedMessage" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
              ✓ {{ shoppingAddedMessage }}
            </span>
          </div>
        </div>

        <!-- Recipe Instructions Section -->
        <div>
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <ChefHat class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Покроковий рецепт
          </h3>

          <div v-if="instructions.length === 0" class="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            Детальних інструкцій приготування не надано.
          </div>

          <ol v-else class="space-y-3">
            <li
              v-for="(step, idx) in instructions"
              :key="idx"
              class="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {{ idx + 1 }}
              </span>
              <span class="pt-0.5">{{ step }}</span>
            </li>
          </ol>
        </div>

        <!-- Chef Notes -->
        <div v-if="meal.notes" class="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
          <div class="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
            <ChefHat class="w-3.5 h-3.5" /> Шеф-порада
          </div>
          <p class="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            {{ meal.notes }}
          </p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <button
          @click="emit('toggleCompleted', meal)"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border"
          :class="[
            meal.is_completed
              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          ]"
        >
          <CheckCircle2 v-if="meal.is_completed" class="w-4 h-4" />
          <Circle v-else class="w-4 h-4" />
          {{ meal.is_completed ? 'Виконано' : "Позначити як з'їдено" }}
        </button>

        <button
          @click="emit('close')"
          class="px-4 py-2 rounded-xl text-sm font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
        >
          Закрити
        </button>
      </div>
    </div>
  </div>
</template>
