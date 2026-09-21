<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  Clock,
  SlidersHorizontal,
  ChevronDown,
  Check
} from 'lucide-vue-next'
import type { Product, CreateProductInput, UpdateProductInput, CookRecipeInput } from '@/types'

const authStore = useAuthStore()
const productStore = useProductStore()
const nutritionStore = useNutritionStore()

// Modals state
const isProductModalOpen = ref(false)
const editingProduct = ref<Product | null>(null)
const isCookModalOpen = ref(false)
const isEatModalOpen = ref(false)
const eatingProduct = ref<Product | null>(null)

// Status filter: 'all' | 'warning' | 'expired'
const selectedStatus = ref<'all' | 'warning' | 'expired'>('all')

// Category filter dropdown state
const isFilterOpen = ref(false)
const filterDropdownRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (filterDropdownRef.value && !filterDropdownRef.value.contains(event.target as Node)) {
    isFilterOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (!productStore.categories.length) {
    await productStore.fetchCategories()
  }
  if (authStore.currentFridgeId) {
    await productStore.fetchProducts()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(
  () => authStore.currentFridgeId,
  async (newId) => {
    if (newId) {
      await productStore.fetchProducts()
    }
  }
)

function toggleStatus(status: 'all' | 'warning' | 'expired') {
  if (selectedStatus.value === status) {
    selectedStatus.value = 'all'
  } else {
    selectedStatus.value = status
  }
}

function selectCategory(catId: string) {
  productStore.selectedCategory = catId
  isFilterOpen.value = false
}

function resetFilters() {
  productStore.selectedCategory = 'all'
  productStore.searchQuery = ''
  selectedStatus.value = 'all'
}

// Category counts based on active products
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {}
  productStore.products.forEach((p) => {
    const cat = (p.category || '').toLowerCase()
    counts[cat] = (counts[cat] || 0) + 1
  })
  return counts
})

// Current category label
const selectedCategoryLabel = computed(() => {
  if (productStore.selectedCategory === 'all') {
    return 'Всі'
  }
  const cat = productStore.categories.find(
    (c) => c.id.toLowerCase() === productStore.selectedCategory.toLowerCase()
  )
  return cat ? cat.label : 'Всі'
})

// Displayed products with category, status, and search filters
const displayedProducts = computed(() => {
  return productStore.products.filter((p) => {
    const matchesCategory =
      productStore.selectedCategory === 'all' ||
      p.category.toLowerCase() === productStore.selectedCategory.toLowerCase()

    const matchesStatus =
      selectedStatus.value === 'all' ||
      (selectedStatus.value === 'warning' && p.status === 'warning') ||
      (selectedStatus.value === 'expired' && p.status === 'expired')

    const query = productStore.searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.notes && p.notes.toLowerCase().includes(query))

    return matchesCategory && matchesStatus && matchesSearch
  })
})

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
  <div class="space-y-3 sm:space-y-4">
    <!-- Welcome Greeting Card -->
    <div class="bg-gradient-to-br from-violet-50/70 via-white to-emerald-50/30 dark:from-[#121217] dark:via-[#121217] dark:to-emerald-950/10 p-3 sm:p-4 rounded-2xl border border-violet-100/60 dark:border-zinc-800 shadow-xs">
      <div class="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <div>
          <h2 class="text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            Привіт, {{ authStore.user?.name }}! 👋
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Холодильник: <span class="font-medium text-violet-700 dark:text-violet-400">{{ authStore.currentFridge?.name }}</span>
          </p>
        </div>
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            @click="isCookModalOpen = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-medium rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <CookingPot class="w-3.5 h-3.5" />
            <span>Приготувати</span>
          </button>
          <button
            type="button"
            @click="openAddProductModal"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-medium rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Додати продукт</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success Notice Banner -->
    <div
      v-if="successNotice"
      class="p-2.5 sm:p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 text-xs flex items-center justify-between gap-2 shadow-xs transition-all"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 shrink-0 text-violet-600 dark:text-violet-400" />
        <span>{{ successNotice }}</span>
      </div>
      <button type="button" @click="successNotice = null" class="text-violet-600 dark:text-violet-400 hover:text-violet-800 cursor-pointer">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Controls Toolbar: Framed Box with Search, Dedicated Category Filter Button, and Side Status Badges -->
    <div class="bg-white dark:bg-[#121217] p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-2">
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        <!-- Search Bar -->
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search class="w-4 h-4" />
          </div>
          <input
            v-model="productStore.searchQuery"
            type="text"
            placeholder="Пошук продуктів за назвою..."
            class="w-full pl-9 pr-8 py-2 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />
          <button
            v-if="productStore.searchQuery"
            type="button"
            @click="productStore.searchQuery = ''"
            class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Separate Category Filter Button with Dropdown -->
        <div class="relative" ref="filterDropdownRef">
          <button
            type="button"
            @click.stop="isFilterOpen = !isFilterOpen"
            :class="[
              'w-full md:w-auto inline-flex items-center justify-between md:justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer shadow-xs',
              productStore.selectedCategory !== 'all'
                ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700 ring-2 ring-violet-500/20'
                : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
            ]"
          >
            <div class="flex items-center gap-1.5">
              <SlidersHorizontal class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span>Категорія:</span>
              <strong class="font-semibold text-zinc-900 dark:text-zinc-100">
                {{ selectedCategoryLabel }}
              </strong>
            </div>
            <ChevronDown
              class="w-3.5 h-3.5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': isFilterOpen }"
            />
          </button>

          <!-- Clear category icon button if filter is active -->
          <button
            v-if="productStore.selectedCategory !== 'all'"
            type="button"
            @click.stop="productStore.selectedCategory = 'all'"
            title="Скинути категорію"
            class="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] shadow hover:bg-violet-700 cursor-pointer"
          >
            ✕
          </button>

          <!-- Dropdown Popover List -->
          <div
            v-if="isFilterOpen"
            class="absolute left-0 md:right-0 md:left-auto top-full mt-1.5 w-full md:w-72 bg-white dark:bg-[#18181f] border border-zinc-200/90 dark:border-zinc-700 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100"
          >
            <!-- Dropdown Header -->
            <div class="flex items-center justify-between px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <div class="flex items-center gap-1.5">
                <SlidersHorizontal class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>Оберіть категорію</span>
              </div>
              <button
                v-if="productStore.selectedCategory !== 'all'"
                type="button"
                @click="productStore.selectedCategory = 'all'; isFilterOpen = false"
                class="text-[11px] font-normal text-violet-600 dark:text-violet-400 hover:underline cursor-pointer lowercase"
              >
                Скинути
              </button>
            </div>

            <!-- Categories List -->
            <div class="max-h-64 overflow-y-auto space-y-0.5 pt-1 pr-0.5">
              <!-- All categories -->
              <button
                type="button"
                @click="selectCategory('all')"
                :class="[
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer',
                  productStore.selectedCategory === 'all'
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 font-medium'
                ]"
              >
                <div class="flex items-center gap-2">
                  <PackageOpen class="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>Всі продукти</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    {{ productStore.products.length }}
                  </span>
                  <Check v-if="productStore.selectedCategory === 'all'" class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 stroke-[3]" />
                </div>
              </button>

              <!-- Category items -->
              <button
                v-for="cat in productStore.categories"
                :key="cat.id"
                type="button"
                @click="selectCategory(cat.id)"
                :class="[
                  'w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer',
                  productStore.selectedCategory === cat.id
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 font-medium'
                ]"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="(categoryCounts[cat.id.toLowerCase()] || 0) > 0 ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'"
                  ></span>
                  <span>{{ cat.label }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                      (categoryCounts[cat.id.toLowerCase()] || 0) > 0
                        ? 'bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                    ]"
                  >
                    {{ categoryCounts[cat.id.toLowerCase()] || 0 }}
                  </span>
                  <Check v-if="productStore.selectedCategory === cat.id" class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 stroke-[3]" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Small Status Badges to the Side (Clear frames & Clickable filters) -->
        <div class="flex items-center justify-end gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
          <!-- In stock / All -->
          <button
            type="button"
            @click="toggleStatus('all')"
            :class="[
              'inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              selectedStatus === 'all'
                ? 'bg-violet-100/90 dark:bg-violet-950/70 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700 shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
            ]"
            title="Показати всі продукти в наявності"
          >
            <PackageOpen class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>У наявності: <strong class="font-semibold">{{ productStore.stats.total }}</strong></span>
          </button>

          <!-- Expiring soon -->
          <button
            type="button"
            @click="toggleStatus('warning')"
            :class="[
              'inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              selectedStatus === 'warning'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 shadow-xs'
                : productStore.stats.expiringSoon > 0
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60 hover:bg-amber-100/70'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300'
            ]"
            title="Фільтр: продукти, термін яких закінчується"
          >
            <AlertTriangle class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Закінчуються: <strong class="font-semibold">{{ productStore.stats.expiringSoon }}</strong></span>
          </button>

          <!-- Expired -->
          <button
            type="button"
            @click="toggleStatus('expired')"
            :class="[
              'inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border',
              selectedStatus === 'expired'
                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-rose-400 dark:border-rose-600 shadow-xs'
                : productStore.stats.expired > 0
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/60 hover:bg-rose-100/70'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300'
            ]"
            title="Фільтр: протерміновані продукти"
          >
            <Clock class="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Протерміновані: <strong class="font-semibold">{{ productStore.stats.expired }}</strong></span>
          </button>
        </div>
      </div>

      <!-- Active Filter Chips (Shown when any filter is active) -->
      <div
        v-if="productStore.selectedCategory !== 'all' || selectedStatus !== 'all' || productStore.searchQuery"
        class="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-zinc-100 dark:border-zinc-800 text-xs"
      >
        <span class="text-zinc-400 dark:text-zinc-500 text-[11px]">Фільтри:</span>

        <!-- Search chip -->
        <span
          v-if="productStore.searchQuery"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
        >
          <span>"{{ productStore.searchQuery }}"</span>
          <button type="button" @click="productStore.searchQuery = ''" class="hover:text-zinc-900 dark:hover:text-white cursor-pointer ml-0.5">
            <X class="w-3 h-3" />
          </button>
        </span>

        <!-- Category chip -->
        <span
          v-if="productStore.selectedCategory !== 'all'"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
        >
          <span>Категорія: {{ selectedCategoryLabel }}</span>
          <button type="button" @click="productStore.selectedCategory = 'all'" class="hover:text-violet-900 dark:hover:text-white cursor-pointer ml-0.5">
            <X class="w-3 h-3" />
          </button>
        </span>

        <!-- Status chip -->
        <span
          v-if="selectedStatus !== 'all'"
          :class="[
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border',
            selectedStatus === 'warning'
              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-700'
          ]"
        >
          <span>{{ selectedStatus === 'warning' ? 'Закінчуються' : 'Протерміновані' }}</span>
          <button type="button" @click="selectedStatus = 'all'" class="hover:opacity-80 cursor-pointer ml-0.5">
            <X class="w-3 h-3" />
          </button>
        </span>

        <!-- Reset all button -->
        <button
          type="button"
          @click="resetFilters"
          class="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline cursor-pointer ml-1"
        >
          Скинути все
        </button>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-if="productStore.loading" class="text-center py-8 text-zinc-400 text-sm">
      Завантаження продуктів...
    </div>

    <div
      v-else-if="displayedProducts.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5"
    >
      <ProductCard
        v-for="prod in displayedProducts"
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
      v-else-if="productStore.products.length > 0 && displayedProducts.length === 0"
      class="bg-white dark:bg-[#121217] p-5 sm:p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-center shadow-xs space-y-2.5 my-2"
    >
      <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
        <Search class="w-5 h-5" />
      </div>
      <div>
        <h3 class="font-medium text-zinc-800 dark:text-zinc-100 text-sm">Продуктів не знайдено</h3>
        <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-sm mx-auto">
          У вашому холодильнику є інші продукти ({{ productStore.products.length }} шт.), але жоден не відповідає обраним фільтрам.
        </p>
      </div>
      <button
        type="button"
        @click="resetFilters"
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Скинути всі фільтри</span>
      </button>
    </div>

    <!-- Empty State: Completely Empty Fridge -->
    <div
      v-else
      class="bg-white dark:bg-[#121217] p-5 sm:p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 text-center shadow-xs space-y-2.5 my-2"
    >
      <div class="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
        <PackageOpen class="w-5 h-5" />
      </div>
      <div>
        <h3 class="font-medium text-zinc-800 dark:text-zinc-100 text-sm">Поки що немає продуктів</h3>
        <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 max-w-sm mx-auto">
          Додайте перший продукт у ваш холодильник, щоб відстежувати термін придатності та готувати смачні страви.
        </p>
      </div>
      <button
        type="button"
        @click="openAddProductModal"
        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
      >
        <Plus class="w-3.5 h-3.5" />
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
