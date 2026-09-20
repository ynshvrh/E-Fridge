<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/products'
import { useNutritionStore } from '@/stores/nutrition'
import ProductCard from '@/components/ProductCard.vue'
import ProductFormModal from '@/components/ProductFormModal.vue'
import CookModal from '@/components/CookModal.vue'
import EatModal from '@/components/EatModal.vue'
import {
  Plus,
  PackageOpen,
  Search,
  X,
  AlertTriangle,
  CookingPot,
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-vue-next'
import type { Product, CreateProductInput, UpdateProductInput, CookRecipeInput } from '@/types'


const authStore = useAuthStore()
const productStore = useProductStore()
const nutritionStore = useNutritionStore()

onMounted(async () => {
  if (!productStore.categories.length) {
    await productStore.fetchCategories()
  }
  if (authStore.currentFridgeId) {
    await productStore.fetchProducts()
  }
})

watch(
  () => authStore.currentFridgeId,
  async (newId) => {
    if (newId) {
      await productStore.fetchProducts()
    }
  }
)

// Modals state
const isProductModalOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const isCookModalOpen = ref(false)
const isEatModalOpen = ref(false)
const eatingProduct = ref<Product | null>(null)

function openAddProductModal() {
  editingProduct.value = null
  isProductModalOpen.value = true
}

function openEditProductModal(product: Product) {
  editingProduct.value = product
  isProductModalOpen.value = true
}

function openEatModal(product: Product) {
  eatingProduct.value = product
  isEatModalOpen.value = true
}

async function handleProductSubmit(payload: CreateProductInput | UpdateProductInput) {
  try {
    if (editingProduct.value) {
      await productStore.updateProduct(editingProduct.value.id, payload)
    } else {
      await productStore.addProduct(payload as CreateProductInput)
    }
    isProductModalOpen.value = false
    editingProduct.value = null
  } catch (err: any) {
    alert(err.message || 'Помилка збереження продукту')
  }
}

async function handleConsume(id: string, amount: number, unit?: string) {
  try {
    await productStore.consumeProduct(id, amount, unit)
  } catch (err: any) {
    alert(err.message || 'Помилка списання')
  }
}

async function handleDelete(id: string) {
  if (confirm('Видалити цей продукт?')) {
    try {
      await productStore.deleteProduct(id)
    } catch (err: any) {
      alert(err.message || 'Помилка видалення')
    }
  }
}

async function handleCook(payload: CookRecipeInput) {
  try {
    await nutritionStore.cookRecipe(payload)
    await productStore.fetchProducts()
    isCookModalOpen.value = false
  } catch (err: any) {
    alert(err.message || 'Помилка приготування')
  }
}

const successNotice = ref<string | null>(null)

function showNotice(msg: string) {
  successNotice.value = msg
  setTimeout(() => {
    if (successNotice.value === msg) {
      successNotice.value = null
    }
  }, 4000)
}

async function handleEat(payload: { amount: number; unit: string; mealType: string }) {
  if (!eatingProduct.value) return
  const prodName = eatingProduct.value.name
  try {
    await nutritionStore.consumeMeal(eatingProduct.value.id, payload.amount, payload.unit, payload.mealType)
    await productStore.fetchProducts()
    isEatModalOpen.value = false
    eatingProduct.value = null
    showNotice(`З'їдено ${payload.amount} ${payload.unit} "${prodName}". Записано у щоденник харчування!`)
  } catch (err: any) {
    alert(err.message || 'Помилка при записі прийому їжі')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Greeting Card -->
    <div class="bg-gradient-to-br from-emerald-50/70 via-white to-stone-50/40 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/20 p-5 sm:p-6 rounded-3xl border border-emerald-100/60 dark:border-stone-800 shadow-sm">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 class="text-xl font-semibold text-stone-800 dark:text-stone-100">
            Привіт, {{ authStore.user?.name }}! 👋
          </h2>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Холодильник: <span class="font-medium text-emerald-700 dark:text-emerald-400">{{ authStore.currentFridge?.name }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="isCookModalOpen = true"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <CookingPot class="w-4 h-4" />
            <span>Приготувати</span>
          </button>
          <button
            @click="openAddProductModal"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Додати продукт</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success Notice Banner -->
    <div
      v-if="successNotice"
      class="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-xs transition-all"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>{{ successNotice }}</span>
      </div>
      <button @click="successNotice = null" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Quick Summary Cards (Removed 'AI Chef ready' banner as requested) -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div class="bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800 text-center shadow-xs">
        <div class="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
          <PackageOpen class="w-4 h-4" />
        </div>
        <div class="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">У наявності</div>
        <div class="text-base sm:text-lg font-semibold text-stone-800 dark:text-stone-100">{{ productStore.stats.total }}</div>
      </div>

      <div class="bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800 text-center shadow-xs">
        <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-1.5">
          <AlertTriangle class="w-4 h-4" />
        </div>
        <div class="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">Закінчуються</div>
        <div class="text-base sm:text-lg font-semibold text-amber-700 dark:text-amber-400">{{ productStore.stats.expiringSoon }}</div>
      </div>

      <div class="bg-white dark:bg-stone-900 p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 dark:border-stone-800 text-center shadow-xs col-span-2 sm:col-span-1">
        <div class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-1.5">
          <Clock class="w-4 h-4" />
        </div>
        <div class="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400">Протерміновані</div>
        <div class="text-base sm:text-lg font-semibold text-rose-700 dark:text-rose-400">{{ productStore.stats.expired }}</div>
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="space-y-3">
      <!-- Search bar -->
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <Search class="w-4 h-4" />
        </div>
        <input
          v-model="productStore.searchQuery"
          type="text"
          placeholder="Пошук продуктів..."
          class="w-full pl-10 pr-9 py-2 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 text-sm rounded-2xl border border-stone-200/80 dark:border-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
        />
        <button
          v-if="productStore.searchQuery"
          @click="productStore.searchQuery = ''"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Categories horizontal pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          @click="productStore.selectedCategory = 'all'"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
            productStore.selectedCategory === 'all'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          ]"
        >
          Всі
        </button>
        <button
          v-for="cat in productStore.categories"
          :key="cat.id"
          @click="productStore.selectedCategory = cat.id"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
            productStore.selectedCategory === cat.id
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          ]"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-if="productStore.loading" class="text-center py-12 text-stone-400 text-sm">
      Завантаження продуктів...
    </div>

    <div
      v-else-if="productStore.filteredProducts.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
    >
      <ProductCard
        v-for="prod in productStore.filteredProducts"
        :key="prod.id"
        :product="prod"
        @consume="handleConsume"
        @eat="openEatModal"
        @edit="openEditProductModal"
        @delete="handleDelete"
      />
    </div>

    <!-- Empty State: Filtered Empty vs Totally Empty -->
    <div
      v-else-if="productStore.products.length > 0 && productStore.filteredProducts.length === 0"
      class="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200/60 dark:border-stone-800 text-center shadow-sm space-y-3 my-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
        <Search class="w-6 h-6" />
      </div>
      <div>
        <h3 class="font-medium text-stone-800 dark:text-stone-100 text-sm">У цій категорії продуктів не знайдено</h3>
        <p class="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-sm mx-auto">
          У вашому холодильнику є інші продукти ({{ productStore.products.length }} шт.). Скиньте фільтр, щоб побачити їх.
        </p>
      </div>
      <button
        @click="productStore.selectedCategory = 'all'; productStore.searchQuery = ''"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium rounded-xl transition-all mt-2 cursor-pointer"
      >
        <RotateCcw class="w-4 h-4" />
        <span>Показати всі продукти</span>
      </button>
    </div>

    <!-- Empty State: Completely Empty Fridge -->
    <div
      v-else
      class="bg-white dark:bg-stone-900 p-8 rounded-3xl border border-stone-200/60 dark:border-stone-800 text-center shadow-sm space-y-3 my-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        <PackageOpen class="w-6 h-6" />
      </div>
      <div>
        <h3 class="font-medium text-stone-800 dark:text-stone-100 text-sm">Поки що немає продуктів</h3>
        <p class="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-sm mx-auto">
          Додайте перший продукт у ваш холодильник, щоб відстежувати термін придатності та готувати смачні страви.
        </p>
      </div>
      <button
        @click="openAddProductModal"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all mt-2 cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Додати продукт</span>
      </button>
    </div>

    <!-- Modals -->
    <ProductFormModal
      v-if="isProductModalOpen"
      :initial-data="editingProduct"
      :categories="productStore.categories"
      @close="isProductModalOpen = false"
      @submit="handleProductSubmit"
    />

    <CookModal
      v-if="isCookModalOpen"
      @close="isCookModalOpen = false"
      @cook="handleCook"
    />

    <EatModal
      v-if="isEatModalOpen && eatingProduct"
      :product="eatingProduct"
      @close="isEatModalOpen = false; eatingProduct = null"
      @confirm="handleEat"
    />
  </div>
</template>
