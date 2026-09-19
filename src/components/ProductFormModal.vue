<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  X,
  ChevronDown,
  ChevronUp,
  Barcode,
  Search,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import { useProductStore } from '@/stores/products'
import type { Product, CategoryInfo, CreateProductInput, UpdateProductInput, BarcodeProductResult } from '@/types'

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
type ModalMode = 'barcode' | 'ai' | 'manual'
const activeMode = ref<ModalMode>('barcode')

// Product fields
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

// Barcode mode state
const barcodeInput = ref('')
const isLookingUpBarcode = ref(false)
const barcodeResolved = ref<BarcodeProductResult | null>(null)
const barcodeError = ref<string | null>(null)

// AI mode state
const aiPrompt = ref('')
const isEstimatingAI = ref(false)
const aiResolved = ref(false)
const aiError = ref<string | null>(null)

// Manual mode inline estimation
const isEstimatingManual = ref(false)

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
    activeMode.value = 'manual'
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

// Barcode Lookup
async function handleBarcodeLookup() {
  const code = barcodeInput.value.trim()
  if (!code) return

  isLookingUpBarcode.value = true
  barcodeError.value = null
  barcodeResolved.value = null

  try {
    const res = await productStore.lookupBarcode(code)
    barcodeResolved.value = res
    name.value = res.name
    category.value = res.category || 'other'
    quantity.value = res.quantity || 1
    unit.value = res.unit || 'шт'
    calories.value = res.calories || undefined
    protein.value = res.protein ? Math.round(res.protein * 10) / 10 : undefined
    fat.value = res.fat ? Math.round(res.fat * 10) / 10 : undefined
    carbs.value = res.carbs ? Math.round(res.carbs * 10) / 10 : undefined
    showNutrition.value = true
  } catch (err: any) {
    barcodeError.value = err.message || 'Товар за цим штрих-кодом не знайдено в базі OpenFoodFacts'
  } finally {
    isLookingUpBarcode.value = false
  }
}

// AI Parse & Estimate
function extractQuantityAndUnit(text: string): { qty: number; unit: string; cleanName: string } {
  const match = text.match(/(.*?)(?:^|\s+)(\d+(?:[.,]\d+)?)\s*(кг|г|л|мл|шт|уп)\b(.*)/i)
  if (match) {
    const clean = (match[1] + ' ' + (match[4] || '')).trim()
    const q = parseFloat(match[2].replace(',', '.'))
    return {
      qty: isNaN(q) ? 1 : q,
      unit: match[3].toLowerCase(),
      cleanName: clean || text
    }
  }
  return { qty: 1, unit: 'шт', cleanName: text }
}

async function handleAIEstimate() {
  const raw = aiPrompt.value.trim()
  if (!raw) return

  isEstimatingAI.value = true
  aiError.value = null
  aiResolved.value = false

  const parsed = extractQuantityAndUnit(raw)

  try {
    const est = await productStore.estimateNutrition(parsed.cleanName, parsed.unit, parsed.qty)
    name.value = est.name || parsed.cleanName
    category.value = est.category || 'other'
    quantity.value = parsed.qty
    unit.value = parsed.unit || est.standard_unit || 'шт'
    calories.value = est.calories
    protein.value = Math.round(est.protein * 10) / 10
    fat.value = Math.round(est.fat * 10) / 10
    carbs.value = Math.round(est.carbs * 10) / 10
    showNutrition.value = true
    aiResolved.value = true
  } catch (err: any) {
    aiError.value = err.message || 'Не вдалося розпізнати продукт'
  } finally {
    isEstimatingAI.value = false
  }
}

// Manual mode quick estimate
async function handleManualEstimate() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  isEstimatingManual.value = true
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
  } catch (err: any) {
    alert(err.message || 'Не вдалося розрахувати КБЖВ')
  } finally {
    isEstimatingManual.value = false
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
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
        <div>
          <h3 class="text-base font-semibold text-stone-800">
            {{ isEditing ? 'Редагувати продукт' : 'Додати продукт у холодильник' }}
          </h3>
          <p v-if="!isEditing" class="text-xs text-stone-400 mt-0.5">Оберіть зручний спосіб додавання</p>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 3 Navigation Tabs (only for new product) -->
      <div v-if="!isEditing" class="grid grid-cols-3 gap-1.5 p-1 bg-stone-100/80 rounded-2xl mb-5">
        <button
          type="button"
          @click="activeMode = 'barcode'"
          :class="[
            'py-2 px-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all',
            activeMode === 'barcode'
              ? 'bg-white text-stone-800 shadow-xs'
              : 'text-stone-500 hover:text-stone-700'
          ]"
        >
          <Barcode class="w-3.5 h-3.5 text-stone-600" />
          <span>Штрих-код</span>
        </button>

        <button
          type="button"
          @click="activeMode = 'ai'"
          :class="[
            'py-2 px-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all',
            activeMode === 'ai'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-stone-500 hover:text-stone-700'
          ]"
        >
          <Sparkles class="w-3.5 h-3.5 text-teal-600" />
          <span>Через ШІ</span>
        </button>

        <button
          type="button"
          @click="activeMode = 'manual'"
          :class="[
            'py-2 px-2 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all',
            activeMode === 'manual'
              ? 'bg-white text-stone-800 shadow-xs'
              : 'text-stone-500 hover:text-stone-700'
          ]"
        >
          <SlidersHorizontal class="w-3.5 h-3.5 text-stone-600" />
          <span>Вручну</span>
        </button>
      </div>

      <!-- MODE 1: BARCODE -->
      <div v-if="activeMode === 'barcode' && !isEditing" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1.5">Штрих-код товару</label>
          <div class="flex gap-2">
            <input
              v-model="barcodeInput"
              type="text"
              placeholder="Введіть код з упаковки (наприклад: 3017620422003)"
              class="flex-1 px-3.5 py-2.5 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              @keyup.enter.prevent="handleBarcodeLookup"
            />
            <button
              type="button"
              @click="handleBarcodeLookup"
              :disabled="isLookingUpBarcode || !barcodeInput.trim()"
              class="px-4 py-2.5 bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Loader2 v-if="isLookingUpBarcode" class="w-3.5 h-3.5 animate-spin" />
              <Search v-else class="w-3.5 h-3.5" />
              <span>Знайти</span>
            </button>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="barcodeError" class="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs space-y-2">
          <div class="flex items-center gap-1.5 text-rose-800 font-medium">
            <AlertCircle class="w-4 h-4 shrink-0 text-rose-600" />
            <span>{{ barcodeError }}</span>
          </div>
          <p class="text-rose-600/90 text-[11px]">
            Локальні товари можуть бути відсутні у міжнародній базі OpenFoodFacts. Спробуйте розпізнати продукт через ШІ або введіть дані вручну.
          </p>
          <div class="flex gap-2 pt-1">
            <button
              type="button"
              @click="activeMode = 'ai'"
              class="px-3 py-1.5 bg-white border border-rose-200 text-teal-700 rounded-xl text-xs font-medium hover:bg-teal-50 transition-colors flex items-center gap-1"
            >
              <Sparkles class="w-3 h-3 text-teal-600" />
              <span>Спробувати через ШІ</span>
            </button>
            <button
              type="button"
              @click="activeMode = 'manual'"
              class="px-3 py-1.5 bg-white border border-rose-200 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-50 transition-colors"
            >
              Заповнити вручну
            </button>
          </div>
        </div>

        <!-- Resolved Result Card -->
        <div v-if="barcodeResolved" class="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Знайдено в OpenFoodFacts</span>
              </div>
              <h4 class="text-sm font-semibold text-stone-800 mt-1">{{ name }}</h4>
              <p v-if="barcodeResolved.brands" class="text-[11px] text-stone-500">Бренд: {{ barcodeResolved.brands }}</p>
            </div>
          </div>

          <!-- Quick editable fields for quantity and expiry -->
          <div class="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100">
            <div>
              <label class="block text-[11px] text-stone-600 mb-1">Кількість</label>
              <input
                v-model.number="quantity"
                type="number"
                step="any"
                min="0.01"
                class="w-full px-2.5 py-1.5 bg-white text-xs rounded-xl border border-stone-200"
              />
            </div>
            <div>
              <label class="block text-[11px] text-stone-600 mb-1">Одиниця</label>
              <select v-model="unit" class="w-full px-2.5 py-1.5 bg-white text-xs rounded-xl border border-stone-200">
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] text-stone-600 mb-1">Придатний до</label>
              <input
                v-model="expiryDate"
                type="date"
                class="w-full px-2.5 py-1.5 bg-white text-xs rounded-xl border border-stone-200"
              />
            </div>
          </div>

          <!-- Nutrition summary pills -->
          <div class="flex flex-wrap gap-1.5 text-[11px]">
            <span class="px-2 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-700">
              {{ calories || 0 }} ккал
            </span>
            <span class="px-2 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-700">
              Б: {{ protein || 0 }}г
            </span>
            <span class="px-2 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-700">
              Ж: {{ fat || 0 }}г
            </span>
            <span class="px-2 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-700">
              В: {{ carbs || 0 }}г
            </span>
          </div>

          <button
            type="button"
            @click="save"
            class="w-full py-2.5 px-4 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            Додати в холодильник
          </button>
        </div>
      </div>

      <!-- MODE 2: AI ASSISTANT -->
      <div v-else-if="activeMode === 'ai' && !isEditing" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1.5">Введіть продукт звичайною мовою</label>
          <div class="space-y-2">
            <input
              v-model="aiPrompt"
              type="text"
              placeholder="Наприклад: Куряче філе 500г, або Сир Маасдам 250г..."
              class="w-full px-3.5 py-2.5 bg-stone-50 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              @keyup.enter.prevent="handleAIEstimate"
            />
            <button
              type="button"
              @click="handleAIEstimate"
              :disabled="isEstimatingAI || !aiPrompt.trim()"
              class="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Loader2 v-if="isEstimatingAI" class="w-3.5 h-3.5 animate-spin" />
              <Sparkles v-else class="w-3.5 h-3.5" />
              <span>Розпізнати та розрахувати КБЖВ</span>
            </button>
          </div>
        </div>

        <div v-if="aiError" class="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-1.5">
          <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
          <span>{{ aiError }}</span>
        </div>

        <!-- AI Resolved Result Card -->
        <div v-if="aiResolved" class="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1 text-teal-700 text-xs font-semibold">
                <CheckCircle2 class="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Розпізнано за допомогою ШІ</span>
              </div>
              <h4 class="text-sm font-semibold text-stone-800 mt-1">{{ name }}</h4>
            </div>
            <span class="text-[11px] px-2 py-0.5 bg-white rounded-lg border border-teal-200 text-teal-800 font-medium">
              {{ availableCategories.find(c => c.id === category)?.label || category }}
            </span>
          </div>

          <!-- Quick tweak -->
          <div class="grid grid-cols-3 gap-2 pt-2 border-t border-teal-100">
            <div>
              <label class="block text-[11px] text-stone-600 mb-1">Кількість</label>
              <input
                v-model.number="quantity"
                type="number"
                step="any"
                min="0.01"
                class="w-full px-2.5 py-1.5 bg-white text-xs rounded-xl border border-stone-200"
              />
            </div>
            <div>
              <label class="block text-[11px] text-stone-600 mb-1">Одиниця</label>
              <select v-model="unit" class="w-full px-2.5 py-1.5 bg-white text-xs rounded-xl border border-stone-200">
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] text-stone-600 mb-1">Придатний до</label>
              <input
                v-model="expiryDate"
                type="date"
                class="w-full px-2.5 py-1.5 bg-white text-xs rounded-xl border border-stone-200"
              />
            </div>
          </div>

          <!-- Nutrition pills -->
          <div class="flex flex-wrap gap-1.5 text-[11px]">
            <span class="px-2 py-0.5 bg-white rounded-lg border border-teal-200 text-teal-900 font-medium">
              {{ calories || 0 }} ккал
            </span>
            <span class="px-2 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-700">
              Б: {{ protein || 0 }}г
            </span>
            <span class="px-2 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-700">
              Ж: {{ fat || 0 }}г
            </span>
            <span class="px-2 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-700">
              В: {{ carbs || 0 }}г
            </span>
          </div>

          <button
            type="button"
            @click="save"
            class="w-full py-2.5 px-4 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            Додати в холодильник
          </button>
        </div>
      </div>

      <!-- MODE 3: MANUAL FORM (also used when editing) -->
      <form v-else @submit.prevent="save" class="space-y-3.5">
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

            <button
              type="button"
              @click="handleManualEstimate"
              :disabled="isEstimatingManual || !name.trim()"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 disabled:opacity-40 disabled:pointer-events-none transition-all"
              title="Оцінити КБЖВ автоматично за назвою продукту"
            >
              <Loader2 v-if="isEstimatingManual" class="w-3.5 h-3.5 animate-spin text-teal-600" />
              <Sparkles v-else class="w-3.5 h-3.5 text-teal-600" />
              <span>Оцінка ШІ</span>
            </button>
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
            class="flex-1 py-2.5 px-4 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            {{ isEditing ? 'Зберегти зміни' : 'Додати продукт' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
