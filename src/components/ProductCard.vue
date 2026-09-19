<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types'
import {
  Calendar,
  Utensils,
  Trash2,
  Edit2
} from 'lucide-vue-next'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'consume', id: string, amount: number): void
  (e: 'eat', product: Product): void
  (e: 'edit', product: Product): void
  (e: 'delete', id: string): void
}>()

const expiryBadge = computed(() => {
  if (!props.product.expiry_date || props.product.days_left === undefined) {
    return null
  }
  const days = props.product.days_left
  if (days < 0) {
    return {
      text: 'Прострочено',
      classes: 'bg-rose-50 text-rose-700 border-rose-100',
    }
  }
  if (days === 0) {
    return {
      text: 'Сьогодні останній день',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }
  if (days <= 3) {
    return {
      text: `Залишилось ${days} ${days === 1 ? 'день' : 'дні'}`,
      classes: 'bg-amber-50 text-amber-700 border-amber-100',
    }
  }
  return {
    text: `До ${props.product.expiry_date}`,
    classes: 'bg-stone-50 text-stone-600 border-stone-100',
  }
})

const hasMacros = computed(() => {
  return props.product.calories > 0 || props.product.protein > 0 || props.product.fat > 0 || props.product.carbs > 0
})
</script>

<template>
  <div
    class="group relative bg-white border border-stone-200/70 rounded-2xl p-4 transition-all hover:shadow-md hover:border-emerald-200 flex flex-col justify-between gap-3"
  >
    <!-- Top Row: Name, Category & Actions -->
    <div>
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-medium text-stone-800 text-base leading-snug">
            {{ product.name }}
          </h3>
          <p v-if="product.notes" class="text-xs text-stone-400 mt-0.5 line-clamp-1">
            {{ product.notes }}
          </p>
        </div>

        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            @click="emit('edit', product)"
            title="Редагувати"
            class="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="emit('delete', product.id)"
            title="Видалити"
            class="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Expiry badge & Category -->
      <div class="flex flex-wrap items-center gap-2 mt-2">
        <span
          v-if="expiryBadge"
          :class="['text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1', expiryBadge.classes]"
        >
          <Calendar class="w-3 h-3" />
          {{ expiryBadge.text }}
        </span>

        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100/70 text-stone-600">
          {{ product.category }}
        </span>
      </div>
    </div>

    <!-- Macros preview if available -->
    <div v-if="hasMacros" class="flex items-center gap-2 text-[11px] text-stone-500 bg-stone-50/70 px-2.5 py-1.5 rounded-xl">
      <span v-if="product.calories" class="font-medium text-stone-700">{{ product.calories }} ккал</span>
      <span v-if="product.protein">Б: {{ product.protein }}г</span>
      <span v-if="product.fat">Ж: {{ product.fat }}г</span>
      <span v-if="product.carbs">В: {{ product.carbs }}г</span>
    </div>

    <!-- Bottom Row: Quantity & Quick Consume -->
    <div class="flex items-center justify-between pt-2 border-t border-stone-100">
      <div class="text-sm">
        <span class="text-xs text-stone-400">Кількість:</span>
        <span class="ml-1.5 font-semibold text-stone-800">
          {{ product.quantity }} {{ product.unit }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          v-if="product.category === 'prepared-meals' || product.calories > 0"
          @click="emit('eat', product)"
          title="З'їсти порцію (записати в щоденник)"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium transition-colors"
        >
          <Utensils class="w-3 h-3" />
          <span>З'їсти</span>
        </button>

        <button
          @click="emit('consume', product.id, 1)"
          title="Списати 1 одиницю"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 font-medium transition-colors"
        >
          <span>-1 {{ product.unit }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
