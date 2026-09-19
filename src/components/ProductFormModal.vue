<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  X,
  ChevronDown,
  ChevronUp,
  Barcode,
  Search,
  Loader2,
  Sparkles
} from 'lucide-vue-next'
import { useProductStore } from '@/stores/products'
import type { Product, CategoryInfo, CreateProductInput, UpdateProductInput } from '@/types'

const props = defineProps<{
  initialData?: Product | null
  categories: CategoryInfo[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: CreateProductInput | UpdateProductInput): void
}>()

const productStore = useProductStore()

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

const barcodeInput = ref('')
const isLookingUpBarcode = ref(false)
const barcodeStatusMsg = ref<string | null>(null)
const barcodeStatusType = ref<'success' | 'error' | null>(null)

const isEstimating = ref(false)
const estimationNotice = ref<string | null>(null)

const defaultCategories: CategoryInfo[] = [
  { id: 'dairy', label: 'Молочні продукти', icon: 'Milk' },
  { id: 'meat-fish', label: "М'ясо та риба", icon: 'Beef' },
  { id: 'vegetables', label: 'Овочі та зелень', icon: 'Carrot' },
  { id: 'fruits', label: 'Фрукти та ягоди', icon: 'Apple' },
  { id: 'bakery', label: 'Хліб та випічка', icon: 'Croissant' },
  { id: 'pantry', label: 'Бакалія', icon: 'Wheat' },
  { id: 'snacks', label: 'Снеки та солодощі', icon: 'Cookie' },
  { id: 'drinks', label: 'Напої', icon: 'CupSoda' },
  { id: 'alcohol', label: 'Алкоголь', icon: 'Wine' },
  { id: 'sauces', label: 'Соуси та приправи', icon: 'Salad' },
  { id: 'frozen', label: 'Заморожені продукти', icon: 'Snowflake' },
  { id: 'canned-prepared', label: 'Консервація', icon: 'Box' },
  { id: 'prepared-meals', label: 'Готові страви', icon: 'CookingPot' },
  { id: 'other', label: 'Інше', icon: 'Package' },
]

const availableCategories = computed(() => {
  return props.categories && props.categories.length > 0 ? props.categories : defaultCategories
})

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

async function handleBarcodeLookup() {
  const code = barcodeInput.value.trim()
  if (!code) return

  isLookingUpBarcode.value = true
  barcodeStatusMsg.value = null
  barcodeStatusType.value = null

  try {
    const res = await productStore.lookupBarcode(code)
    name.value = res.name
    category.value = res.category || 'other'
    quantity.value = res.quantity || 1
    unit.value = res.unit || 'шт'
    calories.value = res.calories || undefined
    protein.value = res.protein ? Math.round(res.protein * 10) / 10 : undefined
    fat.value = res.fat ? Math.round(res.fat * 10) / 10 : undefined
    carbs.value = res.carbs ? Math.round(res.carbs * 10) / 10 : undefined

    if (calories.value || protein.value || fat.value || carbs.value) {
      showNutrition.value = true
    }
    barcodeStatusMsg.value = 'Знайдено в OpenFoodFacts'
    barcodeStatusType.value = 'success'
  } catch (err: any) {
    barcodeStatusMsg.value = err.message || 'Не знайдено в базі'
    barcodeStatusType.value = 'error'
  } finally {
    isLookingUpBarcode.value = false
  }
}

async function handleEstimateNutrition() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  isEstimating.value = true
  estimationNotice.value = null

  try {
    const est = await productStore.estimateNutrition(trimmed, unit.value, quantity.value)
    calories.value = est.calories
    protein.value = Math.round(est.protein * 10) / 10
    fat.value = Math.round(est.fat * 10) / 10
    carbs.value = Math.round(est.carbs * 10) / 10

    if (category.value === 'other' && est.category) {
      category.value = est.category
    }

    showNutrition.value = true
    estimationNotice.value = 'Розраховано за допомогою ШІ'
    setTimeout(() => {
      estimationNotice.value = null
    }, 3000)
  } catch (err: any) {
    alert(err.message || 'Не вдалося розрахувати КБЖВ')
  } finally {
    isEstimating.value = false
  }
}

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
        <!-- Barcode Lookup (OpenFoodFacts) -->
        <div class="p-3 bg-stone-50 rounded-2xl border border-stone-200/60">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[11px] font-medium text-stone-600 flex items-center gap-1.5">
              <Barcode class="w-3.5 h-3.5 text-stone-500" />
              <span>Штрих-код (OpenFoodFacts)</span>
            </span>
            <span
              v-if="barcodeStatusMsg"
              :class="barcodeStatusType === 'success' ? 'text-emerald-600' : 'text-rose-500'"
              class="text-[10px] font-medium"
            >
              {{ barcodeStatusMsg }}
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="barcodeInput"
              type="text"
              placeholder="Введіть штрих-код товару (наприклад: 3017620422003)"
              class="flex-1 px-3 py-1.5 bg-white text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              @keyup.enter.prevent="handleBarcodeLookup"
            />
            <button
              type="button"
              @click="handleBarcodeLookup"
              :disabled="isLookingUpBarcode || !barcodeInput.trim()"
              class="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-1 transition-colors shrink-0"
            >
              <Loader2 v-if="isLookingUpBarcode" class="w-3.5 h-3.5 animate-spin" />
              <Search v-else class="w-3.5 h-3.5" />
              <span>Знайти</span>
            </button>
          </div>
        </div>

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
              <option v-for="cat in availableCategories" :key="cat.id" :value="cat.id">
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
          <div class="flex items-center justify-between py-1">
            <button
              type="button"
              @click="showNutrition = !showNutrition"
              class="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 transition-colors"
            >
              <span>Поживна цінність (КБЖВ на 100г)</span>
              <component :is="showNutrition ? ChevronUp : ChevronDown" class="w-3.5 h-3.5 text-stone-400" />
            </button>

            <div class="flex items-center gap-2">
              <span v-if="estimationNotice" class="text-[10px] text-teal-600 font-medium">
                {{ estimationNotice }}
              </span>
              <button
                type="button"
                @click="handleEstimateNutrition"
                :disabled="isEstimating || !name.trim()"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 disabled:opacity-40 disabled:pointer-events-none transition-all"
                title="Оцінити КБЖВ автоматично за назвою продукту"
              >
                <Loader2 v-if="isEstimating" class="w-3.5 h-3.5 animate-spin text-teal-600" />
                <Sparkles v-else class="w-3.5 h-3.5 text-teal-600" />
                <span>Оцінка ШІ</span>
              </button>
            </div>
          </div>

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
