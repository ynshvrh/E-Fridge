<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useShoppingStore } from '@/stores/shopping'
import { useProductStore } from '@/stores/products'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  PackagePlus,
  CheckCircle2,
  ShoppingBag
} from 'lucide-vue-next'
import type { ShoppingItem } from '@/types'

const shoppingStore = useShoppingStore()
const productsStore = useProductStore()

const newItemName = ref('')
const newItemQty = ref<number>(1)
const newItemUnit = ref('шт')
const newItemCategory = ref('other')
const isAdding = ref(false)
const movingItemId = ref<string | null>(null)
const successNotice = ref<string | null>(null)

const units = ['шт', 'кг', 'г', 'л', 'мл', 'уп']

onMounted(async () => {
  await shoppingStore.fetchItems()
  if (!productsStore.categories.length) {
    await productsStore.fetchCategories()
  }
})

async function handleAddItem() {
  if (!newItemName.value.trim()) return
  isAdding.value = true
  try {
    await shoppingStore.addItem({
      name: newItemName.value.trim(),
      quantity: newItemQty.value || 1,
      unit: newItemUnit.value || 'шт',
      category: newItemCategory.value || 'other',
    })
    newItemName.value = ''
    newItemQty.value = 1
  } catch (err: any) {
    alert(err.message || 'Помилка додавання товару')
  } finally {
    isAdding.value = false
  }
}

async function handleToggleBought(item: ShoppingItem) {
  try {
    await shoppingStore.toggleBought(item.id, !item.is_bought)
  } catch (err: any) {
    alert(err.message || 'Помилка оновлення статусу')
  }
}

async function handleMoveToFridge(item: ShoppingItem) {
  movingItemId.value = item.id
  try {
    await shoppingStore.purchaseAndMoveToFridge(item.id, 7)
    showNotice(`Товар "${item.name}" додано до холодильника!`)
  } catch (err: any) {
    alert(err.message || 'Помилка перенесення до холодильника')
  } finally {
    movingItemId.value = null
  }
}

async function handleDeleteItem(id: string) {
  try {
    await shoppingStore.deleteItem(id)
  } catch (err: any) {
    alert(err.message || 'Помилка видалення')
  }
}

async function handleClearBought() {
  if (!confirm('Видалити всі куплені товари зі списку?')) return
  try {
    await shoppingStore.clearBought()
  } catch (err: any) {
    alert(err.message || 'Помилка видалення')
  }
}

async function handleClearAll() {
  if (!confirm('Очистити весь список покупок?')) return
  try {
    await shoppingStore.clearAll()
  } catch (err: any) {
    alert(err.message || 'Помилка очищення списку')
  }
}

function showNotice(msg: string) {
  successNotice.value = msg
  setTimeout(() => {
    if (successNotice.value === msg) {
      successNotice.value = null
    }
  }, 4000)
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header banner -->
    <div class="bg-gradient-to-br from-emerald-50/80 via-white to-stone-50/50 p-5 rounded-3xl border border-emerald-100/70 shadow-sm flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-xs">
          <ShoppingCart class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-stone-800">Список покупок</h2>
          <p class="text-xs text-stone-500">Плануйте закупи та переносьте товари прямо у холодильник</p>
        </div>
      </div>

      <!-- Stats pills -->
      <div class="flex items-center gap-2 text-xs">
        <span class="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-xl font-medium">
          Всього: {{ shoppingStore.totalCount }}
        </span>
        <span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-xl font-medium">
          Купити: {{ shoppingStore.leftCount }}
        </span>
        <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-medium">
          Куплено: {{ shoppingStore.boughtCount }}
        </span>
      </div>
    </div>

    <!-- Success notice banner -->
    <div
      v-if="successNotice"
      class="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-all"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
      <span>{{ successNotice }}</span>
    </div>

    <!-- Quick Add Bar -->
    <div class="bg-white p-4 rounded-3xl border border-stone-200/70 shadow-xs">
      <form @submit.prevent="handleAddItem" class="space-y-3">
        <div class="flex flex-col sm:flex-row gap-2">
          <!-- Item Name -->
          <input
            v-model="newItemName"
            type="text"
            placeholder="Назва товару (наприклад: Вівсяне молоко, Яйця...)"
            required
            class="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 transition-all"
          />

          <div class="flex items-center gap-2">
            <!-- Quantity -->
            <input
              v-model.number="newItemQty"
              type="number"
              min="0.1"
              step="any"
              placeholder="К-сть"
              class="w-20 px-3 py-2 text-xs sm:text-sm bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500 text-center"
            />

            <!-- Unit -->
            <select
              v-model="newItemUnit"
              class="px-2.5 py-2 text-xs sm:text-sm bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:border-emerald-500"
            >
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="!newItemName.trim() || isAdding"
              class="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Додати</span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Shopping Items Section -->
    <div class="space-y-4">
      <!-- Unbought Items (To Buy) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            До покупки ({{ shoppingStore.leftCount }})
          </h3>
          <button
            v-if="shoppingStore.items.length > 0"
            @click="handleClearAll"
            class="text-[11px] text-stone-400 hover:text-rose-600 transition-colors"
          >
            Очистити все
          </button>
        </div>

        <div v-if="shoppingStore.items.filter(i => !i.is_bought).length === 0" class="bg-white rounded-3xl p-8 text-center border border-dashed border-stone-200">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag class="w-6 h-6" />
          </div>
          <p class="text-xs text-stone-600 font-medium">Немає товарів до покупки</p>
          <p class="text-[11px] text-stone-400 mt-0.5">Додайте новий товар вище або запитайте в AI Шефа</p>
        </div>

        <div v-else class="space-y-1.5">
          <div
            v-for="item in shoppingStore.items.filter(i => !i.is_bought)"
            :key="item.id"
            class="group bg-white p-3 rounded-2xl border border-stone-200/70 hover:border-emerald-200/80 shadow-xs flex items-center justify-between gap-3 transition-all"
          >
            <!-- Item info -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
              <div class="truncate">
                <span class="text-xs sm:text-sm font-medium text-stone-800 truncate block">
                  {{ item.name }}
                </span>
                <span class="text-[11px] text-stone-400">
                  {{ item.quantity }} {{ item.unit }}
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Buy & Move to Fridge -->
              <button
                @click="handleMoveToFridge(item)"
                :disabled="movingItemId === item.id"
                title="Позначити як куплене та перенести в холодильник"
                class="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check class="w-3.5 h-3.5" />
                <span>{{ movingItemId === item.id ? 'Додаємо...' : 'Куплено' }}</span>
              </button>

              <!-- Delete -->
              <button
                @click="handleDeleteItem(item.id)"
                title="Видалити"
                class="p-1.5 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bought Items (Checked) -->
      <div v-if="shoppingStore.items.filter(i => i.is_bought).length > 0" class="pt-3 space-y-2">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Куплено ({{ shoppingStore.boughtCount }})
          </h3>
          <button
            @click="handleClearBought"
            class="text-[11px] text-stone-400 hover:text-rose-600 transition-colors"
          >
            Очистити куплене
          </button>
        </div>

        <div class="space-y-1.5">
          <div
            v-for="item in shoppingStore.items.filter(i => i.is_bought)"
            :key="item.id"
            class="bg-stone-50/70 p-2.5 rounded-2xl border border-stone-200/50 flex items-center justify-between gap-3 opacity-75 hover:opacity-100 transition-all"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <button
                @click="handleToggleBought(item)"
                class="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"
              >
                <Check class="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <div class="truncate">
                <span class="text-xs line-through text-stone-400 font-normal truncate block">
                  {{ item.name }}
                </span>
                <span class="text-[10px] text-stone-400">
                  {{ item.quantity }} {{ item.unit }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Move to Fridge -->
              <button
                @click="handleMoveToFridge(item)"
                :disabled="movingItemId === item.id"
                title="Перенести в холодильник"
                class="px-2 py-1 text-[11px] font-medium bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-800 rounded-lg transition-colors flex items-center gap-1"
              >
                <PackagePlus class="w-3 h-3" />
                <span class="hidden sm:inline">В холодильник</span>
              </button>

              <!-- Delete -->
              <button
                @click="handleDeleteItem(item.id)"
                class="p-1 text-stone-300 hover:text-rose-500 rounded-md transition-colors"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
