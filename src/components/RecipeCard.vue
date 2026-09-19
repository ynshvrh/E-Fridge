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
  <div class="mt-3 p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl space-y-3">
    <!-- Header -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <h4 class="font-semibold text-stone-800 text-sm sm:text-base">
          {{ recipe.title }}
        </h4>
        <p class="text-xs text-stone-500 mt-0.5">
          {{ recipe.description }}
        </p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button
          @click="emit('save', recipe)"
          :disabled="isSaved"
          class="px-2.5 py-1 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1 shadow-2xs"
          :class="isSaved ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-stone-600 hover:text-stone-800 bg-white hover:bg-stone-50 border-stone-200'"
        >
          <Bookmark class="w-3.5 h-3.5" :class="{ 'fill-rose-500 text-rose-500': isSaved }" />
          <span>{{ isSaved ? 'Збережено' : 'Зберегти' }}</span>
        </button>
        <div class="p-1.5 bg-amber-100/70 text-amber-700 rounded-xl">
          <CookingPot class="w-4 h-4" />
        </div>
      </div>
    </div>

    <!-- Times & Macros -->
    <div class="flex flex-wrap gap-2 text-[11px] text-stone-600">
      <span class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200/60">
        <Clock class="w-3 h-3 text-stone-400" />
        {{ recipe.prep_time_mins + recipe.cook_time_mins }} хв
      </span>
      <span class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200/60 font-medium text-emerald-700">
        <Flame class="w-3 h-3 text-emerald-500" />
        {{ recipe.calories }} ккал / порц.
      </span>
      <span class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200/60">
        Б: {{ recipe.protein_grams }}г · Ж: {{ recipe.fat_grams }}г · В: {{ recipe.carbs_grams }}г
      </span>
    </div>

    <!-- Ingredients -->
    <div>
      <div class="text-xs font-semibold text-stone-700 mb-1.5">Інгредієнти:</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        <div
          v-for="(ing, iIdx) in recipe.ingredients"
          :key="iIdx"
          class="flex items-center justify-between text-xs p-1.5 bg-white rounded-lg border border-stone-200/60"
        >
          <span class="font-medium text-stone-700 truncate mr-2">{{ ing.name }}</span>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-stone-500">{{ ing.quantity }} {{ ing.unit }}</span>
            <span
              v-if="ing.in_fridge"
              title="Є в холодильнику"
              class="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
            >
              <Check class="w-2.5 h-2.5" /> є
            </span>
            <span
              v-else
              title="Потрібно докупити"
              class="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md"
            >
              купити
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recipe Steps -->
    <div>
      <div class="text-xs font-semibold text-stone-700 mb-1">Приготування:</div>
      <ol class="space-y-1 text-xs text-stone-600 pl-4 list-decimal">
        <li v-for="(step, sIdx) in recipe.steps" :key="sIdx">
          {{ step }}
        </li>
      </ol>
    </div>

    <!-- Actions -->
    <div class="pt-2 flex flex-col sm:flex-row gap-2">
      <button
        @click="emit('cook', recipe)"
        :disabled="isCooking"
        class="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
      >
        <CookingPot class="w-3.5 h-3.5" />
        <span>{{ isCooking ? 'Приготування...' : 'Приготувати та списати' }}</span>
      </button>

      <button
        v-if="recipe.ingredients.some(i => !i.in_fridge)"
        @click="emit('add-missing', recipe)"
        :disabled="isMissingAdded"
        class="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
      >
        <ShoppingCart class="w-3.5 h-3.5 text-stone-500" />
        <span>{{ isMissingAdded ? 'Вже в списку' : 'Купити відсутнє' }}</span>
      </button>
    </div>
  </div>
</template>
