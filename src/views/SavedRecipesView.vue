<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRecipesStore } from '@/stores/recipes'
import { useShoppingStore } from '@/stores/shopping'
import { useNutritionStore } from '@/stores/nutrition'
import { useProductStore } from '@/stores/products'
import {
  BookHeart,
  Clock,
  Flame,
  CookingPot,
  ShoppingCart,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-vue-next'
import type { SavedRecipe } from '@/types'

const recipesStore = useRecipesStore()
const shoppingStore = useShoppingStore()
const nutritionStore = useNutritionStore()
const productsStore = useProductStore()

const expandedRecipeId = ref<string | null>(null)
const noticeMessage = ref<string | null>(null)
const isCookingId = ref<string | null>(null)

onMounted(async () => {
  await recipesStore.fetchRecipes()
})

function toggleExpand(id: string) {
  expandedRecipeId.value = expandedRecipeId.value === id ? null : id
}

async function handleCook(recipe: SavedRecipe) {
  isCookingId.value = recipe.id
  try {
    const ingredients = recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.amount,
      unit: i.unit,
    }))

    await nutritionStore.cookRecipe({
      recipe_title: recipe.title,
      servings: recipe.servings,
      expiry_days: 4,
      ingredients,
      ignore_missing: true,
      auto_log_as_meal: true,
      meal_type: 'lunch',
    })

    await productsStore.fetchProducts()
    showNotice(`Страву "${recipe.title}" успішно приготовано та додано в щоденник!`)
  } catch (err: any) {
    alert(err.message || 'Помилка під час приготування страви')
  } finally {
    isCookingId.value = null
  }
}

async function handleAddIngredientsToShopping(recipe: SavedRecipe) {
  try {
    const items = recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.amount,
      unit: i.unit,
      category: 'other',
    }))

    await shoppingStore.batchAddItems(items)
    showNotice(`Інгредієнти рецепта додано до списку покупок!`)
  } catch (err: any) {
    alert(err.message || 'Помилка додавання інгредієнтів')
  }
}

async function handleDelete(recipe: SavedRecipe) {
  if (!confirm(`Видалити рецепт "${recipe.title}"?`)) return
  try {
    await recipesStore.deleteRecipe(recipe.id)
    showNotice(`Рецепт видалено`)
  } catch (err: any) {
    alert(err.message || 'Помилка видалення')
  }
}

function showNotice(msg: string) {
  noticeMessage.value = msg
  setTimeout(() => {
    if (noticeMessage.value === msg) {
      noticeMessage.value = null
    }
  }, 4000)
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header banner -->
    <div class="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 dark:from-[#121217] dark:via-[#121217] dark:to-zinc-900 p-5 rounded-3xl border border-violet-200/60 dark:border-zinc-800 shadow-sm flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
          <BookHeart class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-zinc-800 dark:text-zinc-100">Збережені рецепти</h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Ваша персональна кулінарна книга з улюбленими стравами</p>
        </div>
      </div>

      <div class="text-xs px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium">
        Всього: {{ recipesStore.recipes.length }}
      </div>
    </div>

    <!-- Notice banner -->
    <div
      v-if="noticeMessage"
      class="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-all"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      <span>{{ noticeMessage }}</span>
    </div>

    <!-- Empty State -->
    <div
      v-if="recipesStore.recipes.length === 0"
      class="bg-white dark:bg-[#121217] rounded-3xl p-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3"
    >
      <div class="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
        <BookHeart class="w-6 h-6" />
      </div>
      <div>
        <p class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Немає збережених рецептів</p>
        <p class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
          Коли AI Шеф пропонує вам смачну страву, натисніть "Зберегти рецепт", і вона з'явиться тут.
        </p>
      </div>
    </div>

    <!-- Recipes List -->
    <div v-else class="space-y-3">
      <div
        v-for="recipe in recipesStore.recipes"
        :key="recipe.id"
        class="bg-white dark:bg-[#121217] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
      >
        <!-- Card Header -->
        <div class="p-4 sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <h3 class="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">
                {{ recipe.title }}
              </h3>
              <p v-if="recipe.description" class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                {{ recipe.description }}
              </p>
            </div>

            <!-- Delete action -->
            <button
              @click="handleDelete(recipe)"
              title="Видалити рецепт"
              class="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Metadata Badges -->
          <div class="flex items-center gap-3 mt-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span v-if="recipe.calories > 0" class="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg">
              <Flame class="w-3.5 h-3.5" />
              {{ recipe.calories }} ккал
            </span>
            <span v-if="recipe.prep_time_mins > 0 || recipe.cook_time_mins > 0" class="flex items-center gap-1">
              <Clock class="w-3.5 h-3.5 text-zinc-400" />
              {{ (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0) }} хв
            </span>
            <span>Порцій: {{ recipe.servings }}</span>
            <span v-if="recipe.protein > 0" class="text-zinc-400">
              Б: {{ recipe.protein }}г / Ж: {{ recipe.fat }}г / В: {{ recipe.carbs }}г
            </span>
          </div>

          <!-- Action Buttons Bar -->
          <div class="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex-wrap">
            <div class="flex items-center gap-2">
              <!-- Cook & Deduct -->
              <button
                @click="handleCook(recipe)"
                :disabled="isCookingId === recipe.id"
                class="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.99] text-white text-xs font-semibold rounded-xl shadow-sm shadow-violet-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CookingPot class="w-3.5 h-3.5" />
                <span>{{ isCookingId === recipe.id ? 'Готується...' : 'Приготувати' }}</span>
              </button>

              <!-- Add to Shopping List -->
              <button
                @click="handleAddIngredientsToShopping(recipe)"
                class="px-3.5 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingCart class="w-3.5 h-3.5 text-zinc-400" />
                <span class="hidden sm:inline">Інгредієнти в список покупок</span>
                <span class="sm:hidden">В список покупок</span>
              </button>
            </div>

            <!-- Expand / Collapse details -->
            <button
              @click="toggleExpand(recipe.id)"
              class="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1 py-1 cursor-pointer"
            >
              <span>{{ expandedRecipeId === recipe.id ? 'Згорнути' : 'Деталі' }}</span>
              <component :is="expandedRecipeId === recipe.id ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Expanded Details (Ingredients & Steps) -->
        <div
          v-if="expandedRecipeId === recipe.id"
          class="bg-zinc-50/70 dark:bg-zinc-900/60 p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 space-y-4"
        >
          <!-- Ingredients -->
          <div>
            <h4 class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Інгредієнти:</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div
                v-for="(ing, idx) in recipe.ingredients"
                :key="idx"
                class="text-xs p-2 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-700 flex items-center justify-between"
              >
                <span class="font-medium text-zinc-700 dark:text-zinc-200">{{ ing.name }}</span>
                <span class="text-zinc-500 dark:text-zinc-400">{{ ing.amount }} {{ ing.unit }}</span>
              </div>
            </div>
          </div>

          <!-- Steps -->
          <div v-if="recipe.steps && recipe.steps.length">
            <h4 class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Приготування:</h4>
            <ol class="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 pl-4 list-decimal">
              <li v-for="(step, sIdx) in recipe.steps" :key="sIdx">
                {{ step }}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
