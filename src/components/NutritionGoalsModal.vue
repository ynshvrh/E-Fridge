<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
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
  <div class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/80">
      <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
        <h3 class="text-base font-semibold text-stone-800">Денні цілі КБЖВ</h3>
        <button @click="emit('close')" class="text-stone-400 hover:text-stone-600">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Калорії (ккал)</label>
          <input
            v-model.number="form.calorie_target"
            type="number"
            required
            class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Білки (г)</label>
          <input
            v-model.number="form.protein_target"
            type="number"
            step="0.1"
            required
            class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Жири (г)</label>
          <input
            v-model.number="form.fat_target"
            type="number"
            step="0.1"
            required
            class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Вуглеводи (г)</label>
          <input
            v-model.number="form.carbs_target"
            type="number"
            step="0.1"
            required
            class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="flex gap-2 pt-3">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            Скасувати
          </button>
          <button
            type="submit"
            class="flex-1 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            Зберегти
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
