<script setup lang="ts">
import { ref } from 'vue'
import { X, Target } from 'lucide-vue-next'
import type { Goals } from '@/types'

const props = defineProps<{
  initialGoals?: Goals
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', goals: Goals): void
}>()

const form = ref<Goals>({
  calorie_target: props.initialGoals?.calorie_target || 2000,
  protein_target: props.initialGoals?.protein_target || 100,
  fat_target: props.initialGoals?.fat_target || 70,
  carbs_target: props.initialGoals?.carbs_target || 250,
})

function handleSubmit() {
  emit('save', { ...form.value })
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="bg-white dark:bg-[#121217] rounded-3xl p-5 sm:p-6 w-full max-w-sm max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-zinc-800 my-auto space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Target class="w-4 h-4" />
            </div>
            <h3 class="text-base font-semibold text-zinc-800 dark:text-zinc-100">Денні цілі КБЖВ</h3>
          </div>
          <button @click="emit('close')" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Калорії (ккал)</label>
            <input
              v-model.number="form.calorie_target"
              type="number"
              required
              class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Білки (г)</label>
            <input
              v-model.number="form.protein_target"
              type="number"
              step="0.1"
              required
              class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Жири (г)</label>
            <input
              v-model.number="form.fat_target"
              type="number"
              step="0.1"
              required
              class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
          <div>
            <label class="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">Вуглеводи (г)</label>
            <input
              v-model.number="form.carbs_target"
              type="number"
              step="0.1"
              required
              class="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              @click="emit('close')"
              class="flex-1 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              class="flex-1 py-2 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl shadow-sm shadow-violet-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
