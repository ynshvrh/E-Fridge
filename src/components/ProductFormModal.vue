<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { X, ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { Product, CategoryInfo, CreateProductInput, UpdateProductInput } from '@/types'

const props = defineProps<{
  initialData?: Product | null
  categories: CategoryInfo[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: CreateProductInput | UpdateProductInput): void
}>()

const isEditing = computed(() => !!props.initialData)

const name = ref('')
const category = ref('other')
const quantity = ref(1)
const unit = ref('шт')
const expiryDate = ref('')
const calories = ref<number | undefined>(undefined)
const protein = ref<number | undefined>(undefined)
const fat = ref<number | undefined>(undefined)
const carbs = ref<number | undefined>(undefined)
const notes = ref('')

const showNutrition = ref(false)

const units = ['шт', 'г', 'кг', 'мл', 'л', 'уп']

onMounted(() => {
  if (props.initialData) {
    name.value = props.initialData.name
    category.value = props.initialData.category || 'other'
    quantity.value = props.initialData.quantity
    unit.value = props.initialData.unit || 'шт'
    expiryDate.value = props.initialData.expiry_date || ''
    calories.value = props.initialData.calories || undefined
    protein.value = props.initialData.protein || undefined
    fat.value = props.initialData.fat || undefined
    carbs.value = props.initialData.carbs || undefined
    notes.value = props.initialData.notes || ''

    if (calories.value || protein.value || fat.value || carbs.value) {
      showNutrition.value = true
    }
  }
})

function save() {
  if (!name.value.trim() || quantity.value <= 0) return

  const payload: CreateProductInput = {
    name: name.value.trim(),
    category: category.value,
    quantity: Number(quantity.value),
    unit: unit.value,
    expiry_date: expiryDate.value ? expiryDate.value : undefined,
    calories: calories.value ? Number(calories.value) : 0,
    protein: protein.value ? Number(protein.value) : 0,
    fat: fat.value ? Number(fat.value) : 0,
    carbs: carbs.value ? Number(carbs.value) : 0,
    notes: notes.value.trim(),
  }

  emit('submit', payload)
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-stone-200/80 my-8">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
        <h3 class="text-base font-semibold text-stone-800">
          {{ isEditing ? 'Редагувати продукт' : 'Додати новий продукт' }}
        </h3>
        <button
          @click="emit('close')"
          class="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="save" class="space-y-3.5">
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Назва продукту *</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Наприклад: Сир Моцарела"
            class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Категорія</label>
            <select
              v-model="category"
              class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Термін придатності</label>
            <input
              v-model="expiryDate"
              type="date"
              class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Кількість *</label>
            <input
              v-model.number="quantity"
              type="number"
              step="any"
              min="0.01"
              required
              class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-stone-600 mb-1">Одиниця</label>
            <select
              v-model="unit"
              class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option v-for="u in units" :key="u" :value="u">
                {{ u }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1">Нотатки / Опис</label>
          <input
            v-model="notes"
            type="text"
            placeholder="Нижня полиця, відкрита упаковка тощо"
            class="w-full px-3.5 py-2 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <!-- Optional Nutrition Section -->
        <div class="pt-2 border-t border-stone-100">
          <button
            type="button"
            @click="showNutrition = !showNutrition"
            class="flex items-center justify-between w-full text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors py-1"
          >
            <span>Поживна цінність (КБЖВ на 100г/порцію)</span>
            <component :is="showNutrition ? ChevronUp : ChevronDown" class="w-4 h-4" />
          </button>

          <div v-if="showNutrition" class="grid grid-cols-4 gap-2 mt-2 pt-2">
            <div>
              <label class="block text-[11px] text-stone-500 mb-0.5">Ккал</label>
              <input
                v-model.number="calories"
                type="number"
                placeholder="0"
                class="w-full px-2 py-1.5 bg-stone-50 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] text-stone-500 mb-0.5">Білки (г)</label>
              <input
                v-model.number="protein"
                type="number"
                step="0.1"
                placeholder="0"
                class="w-full px-2 py-1.5 bg-stone-50 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] text-stone-500 mb-0.5">Жири (г)</label>
              <input
                v-model.number="fat"
                type="number"
                step="0.1"
                placeholder="0"
                class="w-full px-2 py-1.5 bg-stone-50 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] text-stone-500 mb-0.5">Вуглев. (г)</label>
              <input
                v-model.number="carbs"
                type="number"
                step="0.1"
                placeholder="0"
                class="w-full px-2 py-1.5 bg-stone-50 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div class="flex gap-2.5 pt-4">
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
            {{ isEditing ? 'Зберегти зміни' : 'Додати продукт' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
