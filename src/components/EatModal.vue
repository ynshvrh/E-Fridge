<script setup lang="ts">
import { ref } from 'vue'
import { X, Utensils, Flame } from 'lucide-vue-next'
import type { Product } from '@/types'

defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', portions: number, mealType: string): void
}>()

const portions = ref(1)
const mealType = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')

const mealTypes = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

function submit() {
  if (portions.value <= 0) return
  emit('confirm', portions.value, mealType.value)
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/80">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Utensils class="w-4 h-4" />
          </div>
          <h3 class="text-base font-semibold text-stone-800">З'їсти порцію</h3>
        </div>
        <button
          @click="emit('close')"
          class="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="mb-4">
        <p class="text-sm font-medium text-stone-800">{{ product.name }}</p>
        <p class="text-xs text-stone-500 mt-0.5">
          В наявності: {{ product.quantity }} {{ product.unit }}
        </p>
        <div v-if="product.calories > 0" class="flex items-center gap-1 text-xs text-emerald-700 mt-2 bg-emerald-50/70 p-2 rounded-xl">
          <Flame class="w-3.5 h-3.5" />
          <span>{{ product.calories }} ккал / порція</span>
        </div>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1.5">Прийом їжі</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in mealTypes"
              :key="item.id"
              type="button"
              @click="mealType = item.id as any"
              :class="[
                'py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center',
                mealType === item.id
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                  : 'bg-stone-50 border-stone-200/80 text-stone-600 hover:bg-stone-100'
              ]"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1.5">Кількість ({{ product.unit }})</label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="portions"
              type="number"
              step="any"
              min="0.1"
              :max="product.quantity"
              required
              class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 py-2.5 px-4 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Скасувати
          </button>
          <button
            type="submit"
            class="flex-1 py-2.5 px-4 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
          >
            З'їсти та записати
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
