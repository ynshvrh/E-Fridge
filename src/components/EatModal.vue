<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Utensils, Flame, Minus, Plus, AlertCircle, Scale, Check } from 'lucide-vue-next'
import type { Product } from '@/types'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { amount: number; unit: string; mealType: string }): void
}>()

interface UnitOption {
  id: string
  label: string
  step: number
  defaultAmount: number
}

const normUnit = computed(() => (props.product.unit || '').toLowerCase().trim())

function getPackageGrams(name: string): number {
  const clean = (name || '').toLowerCase().trim()
  const m = clean.match(/(?:^|[^\d])(\d+(?:[.,]\d+)?)\s*(?:г|g|мл|ml|грам|грамм)/i)
  if (m && m[1]) {
    const val = parseFloat(m[1].replace(',', '.'))
    if (val > 0) return val
  }
  const packages: Record<string, number> = {
    nutella: 350,
    нутелла: 350,
    майонез: 380,
    кетчуп: 300,
    соус: 250,
    моцарела: 150,
    моцарелла: 150,
    масло: 200,
    'вершкове масло': 200,
    сметана: 350,
    сир: 200,
    'твердий сир': 200,
    пармезан: 150,
    фета: 200,
    сулугуні: 250,
    творог: 300,
    кисломолочний: 300,
    йогурт: 300,
    молоко: 1000,
    кефір: 900,
    сосиски: 350,
    сардельки: 400,
    ковбаса: 400,
    хліб: 450,
    батон: 400,
    лаваш: 200,
    яйце: 55,
    яйця: 55,
  }
  for (const [k, v] of Object.entries(packages)) {
    if (clean.includes(k)) return v
  }
  return 100
}

const availableUnits = computed<UnitOption[]>(() => {
  const u = normUnit.value
  if (['кг', 'г', 'kg', 'g'].includes(u)) {
    return [
      { id: 'г', label: 'г', step: 25, defaultAmount: u === 'г' ? Math.min(props.product.quantity, 100) : 150 },
      { id: 'кг', label: 'кг', step: 0.05, defaultAmount: u === 'кг' ? Math.min(props.product.quantity, 0.2) : 0.2 },
    ]
  }
  if (['л', 'мл', 'l', 'ml'].includes(u)) {
    return [
      { id: 'мл', label: 'мл', step: 50, defaultAmount: u === 'мл' ? Math.min(props.product.quantity, 200) : 250 },
      { id: 'л', label: 'л', step: 0.1, defaultAmount: u === 'л' ? Math.min(props.product.quantity, 0.5) : 0.5 },
    ]
  }
  if (['шт', 'pcs', 'уп'].includes(u)) {
    return [
      { id: 'г', label: 'г', step: 25, defaultAmount: 50 },
      { id: 'шт', label: 'шт', step: 1, defaultAmount: 1 },
    ]
  }
  if (['порц', 'порція'].includes(u) || props.product.category === 'prepared-meals') {
    return [
      { id: 'порц', label: 'порц', step: 0.5, defaultAmount: 1 },
      { id: 'г', label: 'г', step: 50, defaultAmount: 300 },
    ]
  }
  return [
    { id: props.product.unit, label: props.product.unit, step: 1, defaultAmount: 1 },
    { id: 'г', label: 'г', step: 25, defaultAmount: 50 },
  ]
})

const selectedUnit = ref<string>(availableUnits.value[0]?.id || 'г')
const amount = ref<number>(availableUnits.value[0]?.defaultAmount || 1)

function selectUnit(u: UnitOption) {
  selectedUnit.value = u.id
  amount.value = u.defaultAmount
}

function getDefaultMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'breakfast'
  if (hour >= 11 && hour < 16) return 'lunch'
  if (hour >= 16 && hour < 21) return 'dinner'
  return 'snack'
}

const mealType = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>(getDefaultMealType())

const mealTypes = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

// Preset chips based on selected unit
const currentPresets = computed(() => {
  const u = selectedUnit.value
  if (u === 'г') return [50, 100, 150, 200, 250]
  if (u === 'кг') return [0.1, 0.2, 0.3, 0.5]
  if (u === 'мл') return [100, 150, 200, 250, 500]
  if (u === 'л') return [0.2, 0.25, 0.5, 1.0]
  if (u === 'шт') return [0.5, 1, 2, 3]
  if (u === 'порц') return [0.5, 1, 1.5, 2]
  return [1, 2, 3]
})

// Calculate maximum stock in selected unit
const maxStockInSelectedUnit = computed(() => {
  const from = normUnit.value
  const to = selectedUnit.value.toLowerCase().trim()
  const q = props.product.quantity
  const packWeight = getPackageGrams(props.product.name)

  if (from === to) return q
  if ((from === 'кг' || from === 'kg') && (to === 'г' || to === 'g')) return q * 1000
  if ((from === 'г' || from === 'g') && (to === 'кг' || to === 'kg')) return q / 1000
  if ((from === 'л' || from === 'l') && (to === 'мл' || to === 'ml')) return q * 1000
  if ((from === 'мл' || from === 'ml') && (to === 'л' || to === 'l')) return q / 1000
  if ((from === 'порц' || from === 'порція') && (to === 'г' || to === 'g')) return q * 300
  if ((from === 'г' || from === 'g') && (to === 'порц' || to === 'порція')) return q / 300
  if (['шт', 'pcs', 'уп'].includes(from) && (to === 'г' || to === 'g' || to === 'мл' || to === 'ml')) return q * packWeight
  if ((from === 'г' || from === 'g' || from === 'мл' || from === 'ml') && ['шт', 'pcs', 'уп'].includes(to)) return q / packWeight
  return q
})

function setAllAvailable() {
  amount.value = Math.round(maxStockInSelectedUnit.value * 100) / 100
}

function adjustAmount(delta: number) {
  const current = Number(amount.value) || 0
  const next = Math.max(0.1, Math.round((current + delta) * 100) / 100)
  amount.value = next
}

const currentStep = computed(() => {
  const found = availableUnits.value.find((u) => u.id === selectedUnit.value)
  return found?.step || 1
})

// Unit conversion for fridge deduction
const deductQty = computed(() => {
  const from = selectedUnit.value.toLowerCase().trim()
  const to = normUnit.value
  const qty = Number(amount.value) || 0
  const packWeight = getPackageGrams(props.product.name)

  if (from === to) return qty

  // Weight conversions
  if ((from === 'kg' || from === 'кг') && (to === 'g' || to === 'г')) return qty * 1000
  if ((from === 'g' || from === 'г') && (to === 'kg' || to === 'кг')) return qty / 1000

  // Volume conversions
  if ((from === 'l' || from === 'л') && (to === 'ml' || to === 'мл')) return qty * 1000
  if ((from === 'ml' || from === 'мл') && (to === 'l' || to === 'л')) return qty / 1000

  // Servings conversions (~300g per portion)
  if (['порц', 'порція'].includes(from) && (to === 'г' || to === 'g')) return qty * 300
  if ((from === 'г' || from === 'g') && ['порц', 'порція'].includes(to)) return qty / 300
  if (['порц', 'порція'].includes(from) && (to === 'кг' || to === 'kg')) return (qty * 300) / 1000
  if ((from === 'кг' || from === 'kg') && ['порц', 'порція'].includes(to)) return (qty * 1000) / 300

  // Pieces & Packages conversions
  if (['шт', 'pcs', 'уп'].includes(from) && (to === 'г' || to === 'g')) return qty * packWeight
  if ((from === 'г' || from === 'g') && ['шт', 'pcs', 'уп'].includes(to)) return qty / packWeight
  if (['шт', 'pcs', 'уп'].includes(from) && (to === 'кг' || to === 'kg')) return (qty * packWeight) / 1000
  if ((from === 'кг' || from === 'kg') && ['шт', 'pcs', 'уп'].includes(to)) return (qty * 1000) / packWeight

  return qty
})

// Real-time stock deduction preview
const stockPreview = computed(() => {
  const from = selectedUnit.value.toLowerCase().trim()
  const to = normUnit.value
  const qty = Number(amount.value) || 0
  const packWeight = getPackageGrams(props.product.name)

  const isPiece = ['шт', 'pcs', 'уп'].includes(to)
  const isSelectedWeightOrVol = ['г', 'g', 'мл', 'ml'].includes(from)

  if (isPiece && isSelectedWeightOrVol) {
    const totalGrams = props.product.quantity * packWeight
    const rem = Math.max(0, totalGrams - qty)
    const unitLabel = ['мл', 'ml'].includes(from) ? 'мл' : 'г'
    return {
      deductedText: `-${qty} ${unitLabel}`,
      remainingText: `залишиться ${Math.round(rem * 10) / 10} ${unitLabel}`,
      willExceed: qty > totalGrams,
    }
  }

  const isStoredWeight = ['кг', 'kg', 'г', 'g'].includes(to)
  const isSelectedKgG = ['кг', 'kg', 'г', 'g'].includes(from)
  if (isStoredWeight && isSelectedKgG) {
    let totalGrams = props.product.quantity
    if (to === 'кг' || to === 'kg') totalGrams *= 1000
    let consumedGrams = qty
    if (from === 'кг' || from === 'kg') consumedGrams *= 1000
    const remGrams = Math.max(0, totalGrams - consumedGrams)
    const remLabel =
      remGrams >= 1000 && (to === 'кг' || to === 'kg')
        ? `${Math.round((remGrams / 1000) * 100) / 100} кг`
        : `${Math.round(remGrams * 10) / 10} г`
    return {
      deductedText: `-${qty} ${from}`,
      remainingText: `залишиться ${remLabel}`,
      willExceed: consumedGrams > totalGrams,
    }
  }

  const isStoredVol = ['л', 'l', 'мл', 'ml'].includes(to)
  const isSelectedLVol = ['л', 'l', 'мл', 'ml'].includes(from)
  if (isStoredVol && isSelectedLVol) {
    let totalMl = props.product.quantity
    if (to === 'л' || to === 'l') totalMl *= 1000
    let consumedMl = qty
    if (from === 'л' || from === 'l') consumedMl *= 1000
    const remMl = Math.max(0, totalMl - consumedMl)
    const remLabel =
      remMl >= 1000 && (to === 'л' || to === 'l')
        ? `${Math.round((remMl / 1000) * 100) / 100} л`
        : `${Math.round(remMl * 10) / 10} мл`
    return {
      deductedText: `-${qty} ${from}`,
      remainingText: `залишиться ${remLabel}`,
      willExceed: consumedMl > totalMl,
    }
  }

  // Fallback / same unit
  const rem = props.product.quantity - deductQty.value
  return {
    deductedText: `-${Math.round(deductQty.value * 100) / 100} ${props.product.unit}`,
    remainingText: `залишиться ${Math.max(0, Math.round(rem * 100) / 100)} ${props.product.unit}`,
    willExceed: deductQty.value > props.product.quantity,
  }
})

// Real-time Nutrition Calculation
const nutritionPreview = computed(() => {
  const qty = Number(amount.value) || 0
  const u = selectedUnit.value.toLowerCase().trim()
  const pUnit = normUnit.value

  if (!props.product.calories && !props.product.protein && !props.product.fat && !props.product.carbs) {
    return null
  }

  let ratio = 1

  if (props.product.category === 'prepared-meals' || ['порц', 'порція'].includes(pUnit)) {
    if (['порц', 'порція'].includes(u)) {
      ratio = qty
    } else if (u === 'г' || u === 'g') {
      ratio = qty / 300
    } else {
      ratio = qty
    }
  } else {
    // For all standard products (weight, volume, pieces, packs):
    // props.product.calories is per 100g/100ml
    let grams = qty
    if (u === 'кг' || u === 'kg' || u === 'л' || u === 'l') {
      grams = qty * 1000
    } else if (u === 'шт' || u === 'pcs' || u === 'уп') {
      grams = qty * getPackageGrams(props.product.name)
    }
    ratio = grams / 100
  }

  return {
    calories: Math.max(0, Math.round(props.product.calories * ratio)),
    protein: Math.max(0, Math.round(props.product.protein * ratio * 10) / 10),
    fat: Math.max(0, Math.round(props.product.fat * ratio * 10) / 10),
    carbs: Math.max(0, Math.round(props.product.carbs * ratio * 10) / 10),
  }
})

const baseUnitLabel = computed(() => {
  const u = normUnit.value
  if (['кг', 'г', 'kg', 'g'].includes(u)) return '100 г'
  if (['л', 'мл', 'l', 'ml'].includes(u)) return '100 мл'
  if (['шт', 'pcs'].includes(u)) return '1 шт'
  if (['порц', 'порція'].includes(u) || props.product.category === 'prepared-meals') return 'порцію'
  return `1 ${props.product.unit}`
})

function submit() {
  if (amount.value <= 0) return
  emit('confirm', {
    amount: Number(amount.value),
    unit: selectedUnit.value,
    mealType: mealType.value,
  })
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-stone-200/80">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Utensils class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-stone-800">З'їсти продукт</h3>
            <p class="text-[11px] text-stone-400">Оберіть кількість та одиницю виміру</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Product Brief Info -->
      <div class="p-3 bg-stone-50/80 rounded-2xl border border-stone-100 mb-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-semibold text-stone-800 leading-snug">{{ product.name }}</p>
            <div class="flex items-center gap-2 mt-1 text-xs text-stone-500">
              <span class="inline-flex items-center gap-1">
                <Scale class="w-3.5 h-3.5 text-stone-400" />
                В наявності: <strong class="text-stone-700 font-medium">{{ product.quantity }} {{ product.unit }}</strong>
              </span>
            </div>
          </div>
          <span
            v-if="product.calories > 0"
            class="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/60 whitespace-nowrap"
          >
            {{ product.calories }} ккал / {{ baseUnitLabel }}
          </span>
        </div>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <!-- Meal Type Selector -->
        <div>
          <label class="block text-xs font-medium text-stone-600 mb-1.5">Прийом їжі</label>
          <div class="grid grid-cols-4 gap-1.5">
            <button
              v-for="item in mealTypes"
              :key="item.id"
              type="button"
              @click="mealType = item.id as any"
              :class="[
                'py-2 px-1 text-xs font-medium rounded-xl border transition-all text-center',
                mealType === item.id
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                  : 'bg-stone-50 border-stone-200/80 text-stone-600 hover:bg-stone-100'
              ]"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- Quantity & Unit Selection -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block text-xs font-medium text-stone-600">Скільки з'їдено</label>
            <!-- Unit Switcher Tabs -->
            <div class="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/60">
              <button
                v-for="u in availableUnits"
                :key="u.id"
                type="button"
                @click="selectUnit(u)"
                :class="[
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                  selectedUnit === u.id
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                ]"
              >
                {{ u.label }}
              </button>
            </div>
          </div>

          <!-- Input with Increment/Decrement -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="adjustAmount(-currentStep)"
              class="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95 transition-all"
            >
              <Minus class="w-4 h-4" />
            </button>
            <div class="relative flex-1">
              <input
                v-model.number="amount"
                type="number"
                step="any"
                min="0.01"
                required
                class="w-full text-center font-semibold text-stone-800 py-2 bg-stone-50 text-base rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400">
                {{ selectedUnit }}
              </span>
            </div>
            <button
              type="button"
              @click="adjustAmount(currentStep)"
              class="w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-100 active:scale-95 transition-all"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>

          <!-- Quick Presets Chips -->
          <div class="flex flex-wrap items-center gap-1.5 mt-2">
            <button
              v-for="preset in currentPresets"
              :key="preset"
              type="button"
              @click="amount = preset"
              :class="[
                'px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all',
                amount === preset
                  ? 'bg-emerald-100/70 text-emerald-800 border-emerald-300'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              ]"
            >
              {{ preset }} {{ selectedUnit }}
            </button>
            <button
              type="button"
              @click="setAllAvailable"
              class="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all ml-auto"
            >
              Все що є ({{ Math.round(maxStockInSelectedUnit * 100) / 100 }} {{ selectedUnit }})
            </button>
          </div>
        </div>

        <!-- Real-time Nutrition & Fridge Impact Preview -->
        <div class="space-y-2 pt-1">
          <!-- Nutrition Breakdown Card -->
          <div
            v-if="nutritionPreview"
            class="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/60 border border-emerald-100/80 flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Flame class="w-4 h-4" />
              </div>
              <div>
                <p class="text-xs font-bold text-emerald-900 leading-tight">
                  +{{ nutritionPreview.calories }} ккал
                </p>
                <p class="text-[10px] text-emerald-700/80">до щоденника харчування</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-stone-600 font-medium">
              <span>Б: <strong class="text-stone-800">{{ nutritionPreview.protein }}г</strong></span>
              <span>Ж: <strong class="text-stone-800">{{ nutritionPreview.fat }}г</strong></span>
              <span>В: <strong class="text-stone-800">{{ nutritionPreview.carbs }}г</strong></span>
            </div>
          </div>

          <!-- Stock deduction note -->
          <div class="text-[11px] px-2 py-1">
            <div v-if="stockPreview.willExceed" class="flex items-center gap-1.5 text-amber-700 bg-amber-50/80 p-2 rounded-xl border border-amber-200/60">
              <AlertCircle class="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Кількість перевищує запас ({{ product.quantity }} {{ product.unit }}). Продукт буде списано повністю.
              </span>
            </div>
            <div v-else class="text-stone-500 flex items-center justify-between">
              <span>Списання з полиці:</span>
              <span class="font-medium text-stone-700">
                {{ stockPreview.deductedText }} ({{ stockPreview.remainingText }})
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
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
            class="flex-1 py-2.5 px-4 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Check class="w-4 h-4" />
            <span>З'їсти та записати</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
