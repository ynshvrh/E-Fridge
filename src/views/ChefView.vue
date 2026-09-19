<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useChefStore } from '@/stores/chef'
import { useNutritionStore } from '@/stores/nutrition'
import { useProductStore } from '@/stores/products'
import { useShoppingStore } from '@/stores/shopping'
import { useRecipesStore } from '@/stores/recipes'
import RecipeCard from '@/components/RecipeCard.vue'
import {
  Send,
  Sparkles,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
  ShoppingCart
} from 'lucide-vue-next'
import type { Recipe, ShoppingSuggestion } from '@/types'

const chefStore = useChefStore()
const nutritionStore = useNutritionStore()
const productStore = useProductStore()
const shoppingStore = useShoppingStore()
const recipesStore = useRecipesStore()

const inputMessage = ref('')
const cookingSuccess = ref<string | null>(null)
const isCooking = ref(false)
const savedRecipeTitles = ref<Set<string>>(new Set())
const addedToShoppingTitles = ref<Set<string>>(new Set())

const quickPrompts = [
  'Що приготувати на вечерю?',
  'Легкий дієтичний сніданок',
  'Швидка страва за 15 хвилин',
]

async function send(text?: string) {
  const query = text || inputMessage.value
  if (!query.trim()) return

  inputMessage.value = ''
  cookingSuccess.value = null
  await chefStore.sendMessage(query)
  await nextTick()
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

async function handleCookFromRecipe(recipe: Recipe) {
  isCooking.value = true
  try {
    const ingredients = recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    }))

    const result = await nutritionStore.cookRecipe({
      recipe_title: recipe.title,
      servings: recipe.servings,
      expiry_days: 4,
      ingredients,
      ignore_missing: true, // Allow cooking even if optional items aren't recorded
      auto_log_as_meal: true,
      meal_type: 'lunch',
    })

    await productStore.fetchProducts()
    let msg = `Страву "${recipe.title}" успішно приготовано!`
    if (result?.deductions && result.deductions.length > 0) {
      const names = result.deductions.map((d) => `${d.product_name} (-${d.deducted_qty} ${d.unit})`).join(', ')
      msg += ` Списано з холодильника: ${names}.`
    }
    if (result?.missing && result.missing.length > 0) {
      msg += ` (Відсутні або пропущені: ${result.missing.join(', ')})`
    }
    cookingSuccess.value = msg
  } catch (err: any) {
    alert(err.message || 'Помилка приготування страви')
  } finally {
    isCooking.value = false
  }
}

async function handleSaveRecipe(recipe: Recipe) {
  try {
    await recipesStore.saveRecipe({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.map((i) => ({
        name: i.name,
        amount: i.quantity,
        unit: i.unit,
        in_fridge: i.in_fridge,
      })),
      steps: recipe.steps,
      calories: recipe.calories,
      protein: recipe.protein_grams,
      fat: recipe.fat_grams,
      carbs: recipe.carbs_grams,
      prep_time_mins: recipe.prep_time_mins,
      cook_time_mins: recipe.cook_time_mins,
      servings: recipe.servings,
    })
    savedRecipeTitles.value.add(recipe.title)
    cookingSuccess.value = `Рецепт "${recipe.title}" збережено в улюблені!`
  } catch (err: any) {
    alert(err.message || 'Помилка збереження рецепта')
  }
}

async function handleAddSuggestionsToShopping(suggestions: ShoppingSuggestion[], key: string) {
  try {
    await shoppingStore.batchAddItems(
      suggestions.map((s) => ({
        name: s.name,
        quantity: s.quantity,
        unit: s.unit,
        category: s.category || 'other',
      }))
    )
    addedToShoppingTitles.value.add(key)
    cookingSuccess.value = `Рекомендовані товари додано до списку покупок!`
  } catch (err: any) {
    alert(err.message || 'Помилка додавання до списку покупок')
  }
}

async function handleAddMissingToShopping(recipe: Recipe) {
  const missing = recipe.ingredients.filter((i) => !i.in_fridge)
  if (!missing.length) return
  try {
    await shoppingStore.batchAddItems(
      missing.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        category: i.category || 'other',
      }))
    )
    addedToShoppingTitles.value.add(recipe.title)
    cookingSuccess.value = `Відсутні інгредієнти додано до списку покупок!`
  } catch (err: any) {
    alert(err.message || 'Помилка додавання інгредієнтів')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header banner -->
    <div class="bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 p-5 rounded-3xl border border-teal-100/70 shadow-sm flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-teal-100/80 text-teal-700 flex items-center justify-center shadow-xs">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-stone-800">E-Chef AI Помічник</h2>
          <p class="text-xs text-stone-500">Працює на базі OpenRouter з урахуванням ваших продуктів</p>
        </div>
      </div>
      <button
        @click="chefStore.clearMessages"
        title="Очистити чат"
        class="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
    </div>

    <!-- Quick suggestions -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="prompt in quickPrompts"
        :key="prompt"
        @click="send(prompt)"
        class="px-3 py-1.5 bg-white border border-stone-200/80 rounded-xl text-xs text-stone-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all whitespace-nowrap shadow-xs"
      >
        {{ prompt }}
      </button>
    </div>

    <!-- Success banner if cooked -->
    <div
      v-if="cookingSuccess"
      class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2"
    >
      <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600" />
      <span>{{ cookingSuccess }}</span>
    </div>

    <!-- Messages Container -->
    <div class="space-y-4 min-h-[300px]">
      <div
        v-for="(msg, index) in chefStore.messages"
        :key="index"
        :class="['flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start']"
      >
        <!-- User Bubble -->
        <div
          v-if="msg.role === 'user'"
          class="bg-emerald-600 text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] shadow-xs leading-relaxed"
        >
          {{ msg.content }}
        </div>

        <!-- Assistant Bubble -->
        <div
          v-else
          class="bg-white border border-stone-200/70 p-4 sm:p-5 rounded-3xl rounded-tl-xs max-w-full sm:max-w-[95%] shadow-sm space-y-3.5"
        >
          <div class="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
            {{ msg.content }}
          </div>

          <!-- Embedded Recipe Card -->
          <RecipeCard
            v-if="msg.recipe"
            :recipe="msg.recipe"
            :is-saved="savedRecipeTitles.has(msg.recipe.title)"
            :is-cooking="isCooking"
            :is-missing-added="addedToShoppingTitles.has(msg.recipe.title)"
            @cook="handleCookFromRecipe"
            @save="handleSaveRecipe"
            @add-missing="handleAddMissingToShopping"
          />

          <!-- Shopping Suggestions (if any) -->
          <div
            v-if="msg.shopping_suggestions && msg.shopping_suggestions.length > 0"
            class="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                <PlusCircle class="w-3.5 h-3.5 text-emerald-600" />
                <span>Рекомендовано докупити:</span>
              </div>
              <button
                @click="handleAddSuggestionsToShopping(msg.shopping_suggestions, 'sug_' + index)"
                :disabled="addedToShoppingTitles.has('sug_' + index)"
                class="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <ShoppingCart class="w-3 h-3" />
                <span>{{ addedToShoppingTitles.has('sug_' + index) ? 'Додано' : 'Додати всі в список' }}</span>
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="(sug, sIdx) in msg.shopping_suggestions"
                :key="sIdx"
                class="text-[11px] px-2 py-0.5 bg-white border border-emerald-200/60 text-stone-700 rounded-lg"
              >
                {{ sug.name }} ({{ sug.quantity }} {{ sug.unit }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="chefStore.loading" class="flex items-center gap-2 text-stone-400 text-xs p-3">
        <Sparkles class="w-4 h-4 animate-spin text-teal-600" />
        <span>E-Chef думає та готує відповідь...</span>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="sticky bottom-4 z-10 bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-stone-200/80 shadow-md">
      <form @submit.prevent="send()" class="flex items-center gap-2">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="Запитайте щось у Шефа..."
          :disabled="chefStore.loading"
          class="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <button
          type="submit"
          :disabled="!inputMessage.trim() || chefStore.loading"
          class="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-40"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>
