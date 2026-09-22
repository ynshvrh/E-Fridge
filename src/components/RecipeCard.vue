<script setup lang="ts">
import {
  CookingPot,
  Clock,
  Flame,
  Check,
  Bookmark,
  ShoppingCart
} from 'lucide-vue-next'
import type { Recipe } from '@/types'

defineProps<{
  recipe: Recipe
  isSaved?: boolean
  isCooking?: boolean
  isMissingAdded?: boolean
}>()

const emit = defineEmits<{
  (e: 'cook', recipe: Recipe): void
  (e: 'save', recipe: Recipe): void
  (e: 'add-missing', recipe: Recipe): void
}>()
</script>

<template>
  <div class="mt-3 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl space-y-3">
    <!-- Header -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <h4 class="font-semibold text-zinc-800 dark:text-zinc-100 text-sm sm:text-base">
          {{ recipe.title }}
        </h4>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {{ recipe.description }}
        </p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <div class="p-1.5 bg-amber-100/70 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-xl">
          <CookingPot class="w-4 h-4" />
        </div>
      </div>
    </div>

    <!-- Times & Macros -->
    <div class="flex flex-wrap gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
      <span class="inline-flex items-center gap-1 bg-white dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700">
        <Clock class="w-3 h-3 text-zinc-400" />
        {{ recipe.prep_time_mins + recipe.cook_time_mins }} хв
      </span>
      <span class="inline-flex items-center gap-1 bg-white dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700 font-medium text-violet-700 dark:text-violet-400">
        <Flame class="w-3 h-3 text-violet-500" />
        {{ recipe.calories }} ккал / порц.
      </span>
      <span class="inline-flex items-center gap-1 bg-white dark:bg-zinc-800/80 px-2.5 py-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700">
        Б: {{ recipe.protein_grams }}г · Ж: {{ recipe.fat_grams }}г · В: {{ recipe.carbs_grams }}г
      </span>
    </div>

    <!-- Ingredients -->
    <div>
      <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Інгредієнти:</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <div
          v-for="(ing, iIdx) in recipe.ingredients"
          :key="iIdx"
          class="flex items-center justify-between text-xs p-2 bg-white dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700"
        >
          <span class="font-medium text-zinc-700 dark:text-zinc-200 truncate mr-2">{{ ing.name }}</span>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-zinc-500 dark:text-zinc-400">{{ ing.quantity }} {{ ing.unit }}</span>
            <span
              v-if="ing.in_fridge"
              title="Є в холодильнику"
              class="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
            >
              <Check class="w-2.5 h-2.5" /> є
            </span>
            <span
              v-else
              title="Потрібно докупити"
              class="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md"
            >
              купити
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recipe Steps -->
    <div>
      <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Приготування:</div>
      <ol class="space-y-1 text-xs text-zinc-600 dark:text-zinc-300 pl-4 list-decimal">
        <li v-for="(step, sIdx) in recipe.steps" :key="sIdx">
          {{ step }}
        </li>
      </ol>
    </div>

    <!-- Actions: Compact and Grouped Together -->
    <div class="pt-2 flex flex-wrap items-center gap-1.5 border-t border-amber-200/50 dark:border-amber-900/30 mt-1">
      <button
        @click="emit('cook', recipe)"
        :disabled="isCooking || (recipe.ingredients.length > 0 && recipe.ingredients.every(i => !i.in_fridge))"
        :title="recipe.ingredients.length > 0 && recipe.ingredients.every(i => !i.in_fridge) ? 'Усі інгредієнти відсутні в холодильнику' : 'Приготувати страву та списати продукти з холодильника'"
        class="py-1.5 px-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-2xs shadow-violet-500/20 transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 whitespace-nowrap"
      >
        <CookingPot class="w-3.5 h-3.5" />
        <span>{{ isCooking ? 'Готується...' : (recipe.ingredients.length > 0 && recipe.ingredients.every(i => !i.in_fridge) ? 'Немає продуктів' : 'Приготувати') }}</span>
      </button>

      <button
        v-if="recipe.ingredients.some(i => !i.in_fridge)"
        @click="emit('add-missing', recipe)"
        :disabled="isMissingAdded"
        title="Додати відсутні інгредієнти до списку покупок"
        class="py-1.5 px-2.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
      >
        <ShoppingCart class="w-3.5 h-3.5 text-zinc-400" />
        <span>{{ isMissingAdded ? 'В списку' : 'Купити відсутнє' }}</span>
      </button>

      <button
        @click="emit('save', recipe)"
        :disabled="isSaved"
        title="Зберегти рецепт"
        class="py-1.5 px-2.5 rounded-xl border text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
        :class="isSaved ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900' : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700'"
      >
        <Bookmark class="w-3.5 h-3.5" :class="{ 'fill-rose-500 text-rose-500': isSaved }" />
        <span>{{ isSaved ? 'Збережено' : 'Зберегти' }}</span>
      </button>
    </div>
  </div>
</template>
