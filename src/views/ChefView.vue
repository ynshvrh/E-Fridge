<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useChefStore } from '@/stores/chef'
import { useNutritionStore } from '@/stores/nutrition'
import { useProductStore } from '@/stores/products'
import {
  Send,
  Sparkles,
  CookingPot,
  Clock,
  Flame,
  Check,
  PlusCircle,
  RotateCcw,
  CheckCircle2
} from 'lucide-vue-next'
import type { Recipe } from '@/types'

const chefStore = useChefStore()
const nutritionStore = useNutritionStore()
const productStore = useProductStore()

const inputMessage = ref('')
const cookingSuccess = ref<string | null>(null)
const isCooking = ref(false)

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

    await nutritionStore.cookRecipe({
      recipe_title: recipe.title,
      servings: recipe.servings,
      expiry_days: 4,
      ingredients,
      ignore_missing: true, // Allow cooking even if optional items aren't recorded
      auto_log_as_meal: true,
      meal_type: 'lunch',
    })

    await productStore.fetchProducts()
    cookingSuccess.value = `Страву "${recipe.title}" успішно приготовано! Списано інгредієнти та записано 1 порцію у щоденник.`
  } catch (err: any) {
    alert(err.message || 'Помилка приготування страви')
  } finally {
    isCooking.value = false
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
          <div
            v-if="msg.recipe"
            class="bg-stone-50/80 border border-stone-200/70 rounded-2xl p-4 space-y-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-semibold text-stone-800 text-sm sm:text-base">
                  {{ msg.recipe.title }}
                </h4>
                <p class="text-xs text-stone-500 mt-0.5">
                  {{ msg.recipe.description }}
                </p>
              </div>
              <div class="shrink-0 p-2 bg-amber-100/70 text-amber-700 rounded-xl">
                <CookingPot class="w-4 h-4" />
              </div>
            </div>

            <!-- Times & Macros -->
            <div class="flex flex-wrap gap-2 text-[11px] text-stone-600">
              <span class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200/60">
                <Clock class="w-3 h-3 text-stone-400" />
                {{ msg.recipe.prep_time_mins + msg.recipe.cook_time_mins }} хв
              </span>
              <span class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200/60 font-medium text-emerald-700">
                <Flame class="w-3 h-3 text-emerald-500" />
                {{ msg.recipe.calories }} ккал / порц.
              </span>
              <span class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-stone-200/60">
                Б: {{ msg.recipe.protein_grams }}г · Ж: {{ msg.recipe.fat_grams }}г · В: {{ msg.recipe.carbs_grams }}г
              </span>
            </div>

            <!-- Ingredients -->
            <div>
              <div class="text-xs font-semibold text-stone-700 mb-1.5">Інгредієнти:</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div
                  v-for="(ing, iIdx) in msg.recipe.ingredients"
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
                <li v-for="(step, sIdx) in msg.recipe.steps" :key="sIdx">
                  {{ step }}
                </li>
              </ol>
            </div>

            <!-- Cook Action -->
            <div class="pt-2">
              <button
                @click="handleCookFromRecipe(msg.recipe)"
                :disabled="isCooking"
                class="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <CookingPot class="w-3.5 h-3.5" />
                <span>{{ isCooking ? 'Приготування...' : 'Приготувати та списати інгредієнти' }}</span>
              </button>
            </div>
          </div>

          <!-- Shopping Suggestions (if any) -->
          <div
            v-if="msg.shopping_suggestions && msg.shopping_suggestions.length > 0"
            class="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 space-y-1.5"
          >
            <div class="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
              <PlusCircle class="w-3.5 h-3.5 text-emerald-600" />
              <span>Рекомендовано докупити:</span>
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
