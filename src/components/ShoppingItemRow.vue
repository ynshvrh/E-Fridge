<script setup lang="ts">
import { ref } from 'vue'
import type { ShoppingItem } from '@/types'
import { Check, Trash2, PackagePlus } from 'lucide-vue-next'

const props = defineProps<{
  item: ShoppingItem
  isMoving: boolean
}>()

const emit = defineEmits<{
  (e: 'move', item: ShoppingItem): void
  (e: 'toggle', item: ShoppingItem): void
  (e: 'delete', id: string): void
}>()

// Mobile touch swipe handling
const touchStartX = ref(0)
const touchStartY = ref(0)
const swipeOffset = ref(0)
const isSwiping = ref(false)

function handleTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwiping.value = true
}

function handleTouchMove(e: TouchEvent) {
  if (!isSwiping.value) return
  const currentX = e.touches[0].clientX
  const currentY = e.touches[0].clientY
  const diffX = currentX - touchStartX.value
  const diffY = currentY - touchStartY.value

  if (Math.abs(diffX) > Math.abs(diffY)) {
    swipeOffset.value = Math.max(-80, Math.min(80, diffX))
  }
}

function handleTouchEnd() {
  if (!isSwiping.value) return
  isSwiping.value = false

  if (swipeOffset.value > 50) {
    // Swiped right -> move to fridge if to buy, or toggle
    if (!props.item.is_bought) {
      emit('move', props.item)
    } else {
      emit('toggle', props.item)
    }
  } else if (swipeOffset.value < -50) {
    // Swiped left -> delete
    emit('delete', props.item.id)
  }

  swipeOffset.value = 0
}
</script>

<template>
  <div class="relative overflow-hidden rounded-xl">
    <!-- Swipe backdrop right (Buy / Move) -->
    <div
      class="absolute inset-y-0 left-0 w-24 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-start pl-4 rounded-xl transition-opacity pointer-events-none"
      :style="{ opacity: swipeOffset > 10 ? Math.min(1, swipeOffset / 45) : 0 }"
    >
      <div class="flex items-center gap-1.5 text-xs font-semibold">
        <Check class="w-4 h-4 stroke-[3]" />
        <span>{{ item.is_bought ? 'Повернути' : 'Куплено' }}</span>
      </div>
    </div>

    <!-- Swipe backdrop left (Delete) -->
    <div
      class="absolute inset-y-0 right-0 w-24 bg-rose-600 dark:bg-rose-700 text-white flex items-center justify-end pr-4 rounded-xl transition-opacity pointer-events-none"
      :style="{ opacity: swipeOffset < -10 ? Math.min(1, Math.abs(swipeOffset) / 45) : 0 }"
    >
      <div class="flex items-center gap-1.5 text-xs font-semibold">
        <Trash2 class="w-4 h-4" />
        <span>Видалити</span>
      </div>
    </div>

    <!-- Main Row -->
    <div
      :class="[
        'group p-2.5 rounded-xl border flex items-center justify-between gap-3 select-none transition-all shadow-xs',
        item.is_bought
          ? 'bg-zinc-50/80 dark:bg-zinc-900/60 border-zinc-200/60 dark:border-zinc-800/60 opacity-75 hover:opacity-100'
          : 'bg-white dark:bg-[#121217] border-zinc-200/80 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700'
      ]"
      :style="{
        transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined,
        transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }"
      @touchstart.passive="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchEnd"
    >
      <!-- Item info -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          @click="emit('toggle', item)"
          :class="[
            'w-5 h-5 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors',
            item.is_bought
              ? 'bg-violet-600 text-white'
              : 'border-2 border-zinc-300 dark:border-zinc-700 hover:border-violet-500'
          ]"
          :title="item.is_bought ? 'Зняти відмітку' : 'Позначити як куплене'"
        >
          <Check v-if="item.is_bought" class="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <div class="truncate">
          <span
            :class="[
              'text-xs sm:text-sm font-medium truncate block',
              item.is_bought
                ? 'line-through text-zinc-400 dark:text-zinc-500 font-normal'
                : 'text-zinc-800 dark:text-zinc-100'
            ]"
          >
            {{ item.name }}
          </span>
          <span class="text-[11px] text-zinc-400 dark:text-zinc-500">
            {{ item.quantity }} {{ item.unit }}
          </span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Move to Fridge button -->
        <button
          type="button"
          @click="emit('move', item)"
          :disabled="isMoving"
          :title="item.is_bought ? 'Перенести до холодильника' : 'Позначити як куплене та перенести в холодильник'"
          :class="[
            'px-2.5 py-1.5 text-xs font-medium rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer',
            item.is_bought
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-95 text-white'
          ]"
        >
          <PackagePlus v-if="item.is_bought" class="w-3.5 h-3.5" />
          <Check v-else class="w-3.5 h-3.5" />
          <span>{{ isMoving ? 'Додаємо...' : (item.is_bought ? 'В холодильник' : 'Куплено') }}</span>
        </button>

        <!-- Delete button -->
        <button
          type="button"
          @click="emit('delete', item.id)"
          title="Видалити зі списку"
          class="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
