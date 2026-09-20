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
  (e: 'consume', id: string, amount: number, unit?: string): void
  (e: 'eat', product: Product): void
  (e: 'edit', product: Product): void
  (e: 'delete', id: string): void
}>()

const quickAmount = computed(() => {
  const u = (props.product.unit || '').toLowerCase().trim()
  if (u === 'г' || u === 'g') {
    return props.product.quantity > 50 ? 50 : props.product.quantity
  }
  if (u === 'мл' || u === 'ml') {
    return props.product.quantity > 100 ? 100 : props.product.quantity
  }
  return 1
})

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
    class="group relative bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 rounded-2xl p-4 transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 flex flex-col justify-between gap-3"
  >
    <!-- Top Row: Name, Category & Actions -->
    <div>
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-medium text-stone-800 dark:text-stone-100 text-base leading-snug">
            {{ product.name }}
          </h3>
          <p v-if="product.notes" class="text-xs text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-1">
            {{ product.notes }}
          </p>
        </div>

        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            @click="emit('edit', product)"
            title="Редагувати"
            class="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            @click="emit('delete', product.id)"
            title="Видалити"
            class="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
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

        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
          {{ product.category }}
        </span>
      </div>
    </div>

    <!-- Macros preview if available -->
    <div v-if="hasMacros" class="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50/70 dark:bg-stone-800/60 px-2.5 py-1.5 rounded-xl">
      <span v-if="product.calories" class="font-medium text-stone-700 dark:text-stone-200">{{ product.calories }} ккал</span>
      <span v-if="product.protein">Б: {{ product.protein }}г</span>
      <span v-if="product.fat">Ж: {{ product.fat }}г</span>
      <span v-if="product.carbs">В: {{ product.carbs }}г</span>
    </div>

    <!-- Bottom Row: Quantity & Quick Consume -->
    <div class="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
      <div class="text-sm">
        <span class="text-xs text-stone-400 dark:text-stone-500">Кількість:</span>
        <span class="ml-1.5 font-semibold text-stone-800 dark:text-stone-100">
          {{ product.quantity }} {{ product.unit }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          @click="emit('eat', product)"
          title="З'їсти порцію (записати в щоденник)"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 font-medium transition-colors cursor-pointer"
        >
          <Utensils class="w-3 h-3" />
          <span>З'їсти</span>
        </button>

        <button
          @click="emit('consume', product.id, quickAmount, product.unit)"
          :title="`Списати ${quickAmount} ${product.unit}`"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-medium transition-colors cursor-pointer"
        >
          <span>-{{ quickAmount }} {{ product.unit }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
