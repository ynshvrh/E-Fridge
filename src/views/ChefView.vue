<script setup lang="ts">
import { ref, nextTick, onMounted, watch } from 'vue'
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
  ShoppingCart,
  Bot,
  User as UserIcon,
  ChefHat,
  Loader2
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
const messagesContainer = ref<HTMLDivElement | null>(null)

const quickPrompts = [
  'Що приготувати на вечерю з моїх продуктів?',
  'Легкий високобілковий сніданок',
  'Швидка страва до 20 хвилин',
  'Рецепт для продуктів, що закінчуються',
]

onMounted(async () => {
  await chefStore.fetchHistory()
  scrollToBottom()
})

watch(
  () => chefStore.messages.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

async function send(text?: string) {
  const query = text || inputMessage.value
  if (!query.trim() || chefStore.loading) return

  inputMessage.value = ''
  cookingSuccess.value = null
  await chefStore.sendMessage(query)
  await nextTick()
  scrollToBottom()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
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
      ignore_missing: true,
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
  <div class="flex flex-col h-[calc(100vh-175px)] md:h-[calc(100vh-140px)] bg-white dark:bg-[#121217] rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
    <!-- Chat Header -->
    <div class="px-3 py-2 sm:px-6 sm:py-4 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-emerald-500/10 dark:from-[#121217] dark:via-[#121217] dark:to-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2.5 sm:gap-3">
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-violet-500 text-white flex items-center justify-center shadow-xs shrink-0">
          <ChefHat class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div>
          <div class="flex items-center gap-1.5 sm:gap-2">
            <h2 class="text-xs sm:text-base font-bold text-zinc-800 dark:text-zinc-100">AI Шеф-кухар</h2>
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300">
              <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
              Готовий
            </span>
          </div>
          <p class="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">Підбирає рецепти з продуктів холодильника</p>
        </div>
      </div>

      <button
        @click="chefStore.clearMessages"
        title="Очистити історію діалогу"
        class="p-1.5 sm:p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
      >
        <RotateCcw class="w-4 h-4" />
        <span class="hidden sm:inline">Очистити</span>
      </button>
    </div>

    <!-- Cooking Success Notice -->
    <div
      v-if="cookingSuccess"
      class="mx-3 sm:mx-4 mt-2.5 sm:mt-3 p-2.5 sm:p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shrink-0"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>{{ cookingSuccess }}</span>
      </div>
      <button @click="cookingSuccess = null" class="text-emerald-600 dark:text-emerald-400">
        &times;
      </button>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3.5 sm:space-y-5 scroll-smooth"
    >

      <!-- Messages Stream -->
      <div
        v-for="(msg, index) in chefStore.messages"
        :key="index"
        :class="['flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start']"
      >
        <!-- Assistant Avatar -->
        <div
          v-if="msg.role === 'assistant'"
          class="w-8 h-8 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-1"
        >
          <Bot class="w-4 h-4" />
        </div>

        <!-- Message Body Container -->
        <div
          :class="[
            'flex flex-col max-w-[88%] sm:max-w-[80%]',
            msg.role === 'user' ? 'items-end' : 'items-start'
          ]"
        >
          <!-- User Bubble -->
          <div
            v-if="msg.role === 'user'"
            class="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs sm:text-sm px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs leading-relaxed"
          >
            {{ msg.content }}
          </div>

          <!-- Assistant Bubble -->
          <div
            v-else
            class="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 rounded-3xl rounded-tl-xs shadow-xs space-y-4 w-full"
          >
            <div class="text-xs sm:text-sm text-zinc-800 dark:text-zinc-100 leading-relaxed whitespace-pre-line">
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

            <!-- Shopping Suggestions -->
            <div
              v-if="msg.shopping_suggestions && msg.shopping_suggestions.length > 0"
              class="bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-800/60 rounded-2xl p-3.5 space-y-2.5"
            >
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="text-xs font-semibold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                  <PlusCircle class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  <span>Рекомендовано докупити:</span>
                </div>
                <button
                  @click="handleAddSuggestionsToShopping(msg.shopping_suggestions, 'sug_' + index)"
                  :disabled="addedToShoppingTitles.has('sug_' + index)"
                  class="text-[11px] font-medium text-violet-700 dark:text-violet-300 hover:text-violet-800 bg-white dark:bg-zinc-800 border border-violet-200 dark:border-zinc-700 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <ShoppingCart class="w-3 h-3" />
                  <span>{{ addedToShoppingTitles.has('sug_' + index) ? 'Додано' : 'Додати всі в список' }}</span>
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="(sug, sIdx) in msg.shopping_suggestions"
                  :key="sIdx"
                  class="text-[11px] px-2.5 py-1 bg-white dark:bg-zinc-800 border border-violet-200/60 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium"
                >
                  {{ sug.name }} ({{ sug.quantity }} {{ sug.unit }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- User Avatar -->
        <div
          v-if="msg.role === 'user'"
          class="w-8 h-8 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-1"
        >
          <UserIcon class="w-4 h-4" />
        </div>
      </div>

      <!-- Thinking indicator -->
      <div v-if="chefStore.loading" class="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-xs p-2">
        <div class="w-8 h-8 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Loader2 class="w-4 h-4 animate-spin" />
        </div>
        <div class="bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-tl-xs flex items-center gap-2">
          <span class="animate-pulse">E-Chef формує рецепт та перевіряє продукти...</span>
        </div>
      </div>
    </div>

    <!-- Quick Prompts: 4 compact buttons arranged 2x2 next to each other (No horizontal scrolling) -->
    <div class="px-3 pt-2.5 pb-2 sm:px-4 bg-zinc-50/80 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800/80 shrink-0">
      <div class="grid grid-cols-2 gap-1.5 sm:gap-2 max-w-2xl mx-auto">
        <button
          v-for="prompt in quickPrompts"
          :key="prompt"
          @click="send(prompt)"
          :disabled="chefStore.loading"
          class="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-800/90 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-violet-300 dark:hover:border-violet-700 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200 font-medium transition-all shadow-2xs cursor-pointer flex items-center justify-between text-left active:scale-98 group disabled:opacity-50"
        >
          <span class="truncate mr-1.5">{{ prompt }}</span>
          <Sparkles class="w-3.5 h-3.5 text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 shrink-0 transition-colors" />
        </button>
      </div>
    </div>

    <!-- Chat Input Footer -->
    <div class="p-3 sm:p-4 bg-white dark:bg-[#121217] border-t border-zinc-200/80 dark:border-zinc-800 shrink-0">
      <form @submit.prevent="send()" class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="Запитайте щось у Шефа (наприклад: що приготувати з яєць та помідорів?)..."
            :disabled="chefStore.loading"
            @keydown="handleKeydown"
            class="w-full pl-4 pr-10 py-3 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
        <button
          type="submit"
          :disabled="!inputMessage.trim() || chefStore.loading"
          class="p-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-2xl shadow-sm shadow-violet-500/20 active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center"
        >
          <Loader2 v-if="chefStore.loading" class="w-4 h-4 animate-spin" />
          <Send v-else class="w-4 h-4" />
        </button>
      </form>
    </div>
  </div>
</template>
