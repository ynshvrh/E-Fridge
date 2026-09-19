<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProductStore } from '@/stores/products'
import { api } from '@/services/api'
import ProductCard from '@/components/ProductCard.vue'
import ProductFormModal from '@/components/ProductFormModal.vue'
import {
  Refrigerator,
  LogOut,
  Plus,
  CheckCircle2,
  PackageOpen,
  Sparkles,
  ChevronDown,
  Search,
  X,
  AlertTriangle
} from 'lucide-vue-next'
import type { Product, Fridge, CreateProductInput, UpdateProductInput } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const productStore = useProductStore()

const isCreatingFridge = ref(false)
const newFridgeName = ref('')
const isFridgeMenuOpen = ref(false)

// Product Modal state
const isProductModalOpen = ref(false)
const editingProduct = ref<Product | null>(null)

onMounted(async () => {
  await productStore.fetchCategories()
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

async function createFridge() {
  if (!newFridgeName.value.trim()) return
  try {
    const created = await api.post<Fridge>('/fridges', { name: newFridgeName.value.trim() })
    authStore.fridges.push(created)
    authStore.selectFridge(created.id)
    newFridgeName.value = ''
    isCreatingFridge.value = false
    isFridgeMenuOpen.value = false
  } catch (err: any) {
    alert(err.message || 'Не вдалося створити холодильник')
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}

function openAddProductModal() {
  editingProduct.value = null
  isProductModalOpen.value = true
}

function openEditProductModal(product: Product) {
  editingProduct.value = product
  isProductModalOpen.value = true
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

async function handleConsume(id: string, amount: number) {
  try {
    await productStore.consumeProduct(id, amount)
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
</script>

<template>
  <div class="min-h-full pb-20">
    <!-- Navigation / Top Bar -->
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-stone-200/60">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Refrigerator class="w-5 h-5" />
          </div>
          <div>
            <h1 class="font-semibold text-base text-stone-800 leading-none">E-Fridge</h1>
            <span class="text-[11px] text-stone-400">Розумна кухня</span>
          </div>
        </div>

        <!-- User & Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Fridge Switcher Dropdown -->
          <div class="relative">
            <button
              @click="isFridgeMenuOpen = !isFridgeMenuOpen"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100/80 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <span class="truncate max-w-[120px]">{{ authStore.currentFridge?.name || 'Холодильник' }}</span>
              <ChevronDown class="w-3.5 h-3.5 text-stone-400" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isFridgeMenuOpen"
              class="absolute right-0 mt-2 w-56 bg-white border border-stone-200/80 rounded-2xl shadow-lg py-1.5 z-30"
            >
              <div class="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Ваші холодильники
              </div>
              <button
                v-for="fridge in authStore.fridges"
                :key="fridge.id"
                @click="authStore.selectFridge(fridge.id); isFridgeMenuOpen = false"
                class="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-emerald-50/70 hover:text-emerald-800 flex items-center justify-between"
              >
                <span>{{ fridge.name }}</span>
                <CheckCircle2
                  v-if="authStore.currentFridgeId === fridge.id"
                  class="w-3.5 h-3.5 text-emerald-600"
                />
              </button>

              <div class="border-t border-stone-100 my-1"></div>

              <button
                @click="isCreatingFridge = true; isFridgeMenuOpen = false"
                class="w-full text-left px-3 py-2 text-xs text-emerald-700 font-medium hover:bg-emerald-50/70 flex items-center gap-1.5"
              >
                <Plus class="w-3.5 h-3.5" />
                Додати новий
              </button>
            </div>
          </div>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            title="Вийти"
            class="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100/60 rounded-xl transition-colors"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content: Centered & Soft -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      <!-- Welcome Greeting Card -->
      <div class="bg-gradient-to-br from-emerald-50/70 via-white to-stone-50/40 p-5 sm:p-6 rounded-3xl border border-emerald-100/60 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-stone-800">
              Привіт, {{ authStore.user?.name }}! 👋
            </h2>
            <p class="text-xs text-stone-500 mt-0.5">
              Холодильник: <span class="font-medium text-emerald-700">{{ authStore.currentFridge?.name }}</span>
            </p>
          </div>
          <button
            @click="openAddProductModal"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-2xl shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus class="w-4 h-4" />
            <span>Додати</span>
          </button>
        </div>
      </div>

      <!-- Quick Summary Cards -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 text-center shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5">
            <PackageOpen class="w-4 h-4" />
          </div>
          <div class="text-[11px] sm:text-xs text-stone-500">У наявності</div>
          <div class="text-base sm:text-lg font-semibold text-stone-800">{{ productStore.stats.total }}</div>
        </div>

        <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 text-center shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5">
            <AlertTriangle class="w-4 h-4" />
          </div>
          <div class="text-[11px] sm:text-xs text-stone-500">Закінчуються</div>
          <div class="text-base sm:text-lg font-semibold text-amber-700">{{ productStore.stats.expiringSoon }}</div>
        </div>

        <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/60 text-center shadow-sm">
          <div class="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-1.5">
            <Sparkles class="w-4 h-4" />
          </div>
          <div class="text-[11px] sm:text-xs text-stone-500">AI Шеф</div>
          <div class="text-base sm:text-lg font-semibold text-teal-700">Готовий</div>
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
            class="w-full pl-10 pr-9 py-2 bg-white text-stone-800 text-sm rounded-2xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
          <button
            v-if="productStore.searchQuery"
            @click="productStore.searchQuery = ''"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Categories horizontal pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            @click="productStore.selectedCategory = 'all'"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
              productStore.selectedCategory === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-stone-200/70 text-stone-600 hover:bg-stone-50'
            ]"
          >
            Всі
          </button>
          <button
            v-for="cat in productStore.categories"
            :key="cat.id"
            @click="productStore.selectedCategory = cat.id"
            :class="[
              'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all',
              productStore.selectedCategory === cat.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-stone-200/70 text-stone-600 hover:bg-stone-50'
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
        class="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <ProductCard
          v-for="prod in productStore.filteredProducts"
          :key="prod.id"
          :product="prod"
          @consume="handleConsume"
          @edit="openEditProductModal"
          @delete="handleDelete"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="bg-white p-8 rounded-3xl border border-stone-200/60 text-center shadow-sm space-y-3 my-4"
      >
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <PackageOpen class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-medium text-stone-800 text-sm">Поки що немає продуктів</h3>
          <p class="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
            Додайте перший продукт у ваш холодильник, щоб відстежувати термін придатності та готувати смачні страви.
          </p>
        </div>
        <button
          @click="openAddProductModal"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all mt-2"
        >
          <Plus class="w-4 h-4" />
          <span>Додати продукт</span>
        </button>
      </div>
    </main>

    <!-- Modal Create Fridge -->
    <div
      v-if="isCreatingFridge"
      class="fixed inset-0 z-50 bg-stone-900/30 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl border border-stone-200/60">
        <h3 class="text-base font-semibold text-stone-800 mb-2">Новий холодильник</h3>
        <p class="text-xs text-stone-500 mb-4">Вкажіть назву для нового простору зберігання продуктів.</p>

        <input
          v-model="newFridgeName"
          type="text"
          placeholder="Наприклад: Дача або Офіс"
          class="w-full px-3.5 py-2.5 bg-stone-50 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mb-4"
          @keyup.enter="createFridge"
        />

        <div class="flex gap-2">
          <button
            @click="isCreatingFridge = false"
            class="flex-1 py-2 px-3 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Скасувати
          </button>
          <button
            @click="createFridge"
            class="flex-1 py-2 px-3 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
          >
            Створити
          </button>
        </div>
      </div>
    </div>

    <!-- Product Form Modal (Add / Edit) -->
    <ProductFormModal
      v-if="isProductModalOpen"
      :initial-data="editingProduct"
      :categories="productStore.categories"
      @close="isProductModalOpen = false"
      @submit="handleProductSubmit"
    />
  </div>
</template>
