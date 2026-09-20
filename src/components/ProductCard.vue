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
      classes: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    }
  }
  if (days === 0) {
    return {
      text: 'Сьогодні останній день',
      classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    }
  }
  if (days <= 3) {
    return {
      text: `Залишилось ${days} ${days === 1 ? 'день' : 'дні'}`,
      classes: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    }
  }
  return {
    text: `До ${props.product.expiry_date}`,
    classes: 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-700',
  }
})

const hasMacros = computed(() => {
  return props.product.calories > 0 || props.product.protein > 0 || props.product.fat > 0 || props.product.carbs > 0
})
</script>

<template>
  <div
    class="group relative bg-white dark:bg-[#121217] border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 sm:p-4 transition-all hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 flex flex-col justify-between gap-2.5 sm:gap-3"
  >
    <!-- Top Row: Name, Category & Actions -->
    <div>
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-medium text-zinc-800 dark:text-zinc-100 text-base leading-snug">
            {{ product.name }}
          </h3>
          <p v-if="product.notes" class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
            {{ product.notes }}
          </p>
        </div>

        <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            @click="emit('edit', product)"
            title="Редагувати"
            class="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="emit('delete', product.id)"
            title="Видалити"
            class="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
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

        <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          {{ product.category }}
        </span>
      </div>
    </div>

    <!-- Macros preview if available -->
    <div v-if="hasMacros" class="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50/80 dark:bg-zinc-800/60 px-2.5 py-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50">
      <span v-if="product.calories" class="font-medium text-zinc-700 dark:text-zinc-200">{{ product.calories }} ккал</span>
      <span v-if="product.protein">Б: {{ product.protein }}г</span>
      <span v-if="product.fat">Ж: {{ product.fat }}г</span>
      <span v-if="product.carbs">В: {{ product.carbs }}г</span>
    </div>

    <!-- Bottom Row: Quantity & Quick Consume -->
    <div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
      <div class="text-sm">
        <span class="text-xs text-zinc-400 dark:text-zinc-500">Кількість:</span>
        <span class="ml-1.5 font-semibold text-zinc-800 dark:text-zinc-100">
          {{ product.quantity }} {{ product.unit }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="emit('eat', product)"
          title="З'їсти порцію (записати в щоденник)"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 font-medium transition-colors cursor-pointer border border-violet-200/50 dark:border-violet-800/50"
        >
          <Utensils class="w-3 h-3" />
          <span>З'їсти</span>
        </button>

        <button
          type="button"
          @click="emit('consume', product.id, quickAmount, product.unit)"
          :title="`Списати ${quickAmount} ${product.unit}`"
          class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors cursor-pointer border border-zinc-200/60 dark:border-zinc-700"
        >
          <span>-{{ quickAmount }} {{ product.unit }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
