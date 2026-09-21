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
  <div class="space-y-3 sm:space-y-4">
    <!-- Header banner -->
    <div class="bg-gradient-to-br from-violet-50/70 via-white to-emerald-50/30 dark:from-[#121217] dark:via-[#121217] dark:to-violet-950/20 p-3 sm:p-4 rounded-2xl border border-violet-100/70 dark:border-zinc-800 shadow-xs flex items-center justify-between flex-wrap gap-2.5 sm:gap-3">
      <div class="flex items-center gap-2.5 sm:gap-3">
        <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center shadow-xs shrink-0">
          <ShoppingCart class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100">Список покупок</h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">Плануйте закупи та переносьте товари прямо у холодильник</p>
        </div>
      </div>

      <!-- Stats pills -->
      <div class="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
        <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-medium border border-zinc-200/60 dark:border-zinc-700/60">
          Всього: {{ shoppingStore.totalCount }}
        </span>
        <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl font-medium border border-amber-200/60 dark:border-amber-800/60">
          Купити: {{ shoppingStore.leftCount }}
        </span>
        <span class="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 rounded-xl font-medium border border-violet-200/60 dark:border-violet-800/60">
          Куплено: {{ shoppingStore.boughtCount }}
        </span>
      </div>
    </div>

    <!-- Success notice banner -->
    <div
      v-if="successNotice"
      class="bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border border-violet-200/80 dark:border-violet-800/80 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
    >
      <CheckCircle2 class="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
      <span>{{ successNotice }}</span>
    </div>

    <!-- Quick Add Bar -->
    <div class="bg-white dark:bg-[#121217] p-2.5 sm:p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
      <form @submit.prevent="handleAddItem" class="space-y-2">
        <div class="flex flex-col sm:flex-row gap-2">
          <!-- Item Name -->
          <input
            v-model="newItemName"
            type="text"
            placeholder="Назва товару (наприклад: Вівсяне молоко, Яйця...)"
            required
            class="flex-1 px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
          />

          <div class="flex items-center gap-1.5 sm:gap-2">
            <!-- Quantity -->
            <input
              v-model.number="newItemQty"
              type="number"
              min="0.1"
              step="any"
              placeholder="К-сть"
              class="w-18 sm:w-20 px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-center"
            />

            <!-- Unit -->
            <select
              v-model="newItemUnit"
              class="px-2 py-1.5 sm:py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
            </select>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="!newItemName.trim() || isAdding"
              class="py-1.5 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Додати</span>
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Shopping Items Section -->
    <div class="space-y-3">
      <!-- Unbought Items (To Buy) -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            До покупки ({{ shoppingStore.leftCount }})
          </h3>
          <button
            v-if="shoppingStore.items.length > 0"
            type="button"
            @click="handleClearAll"
            class="text-[11px] text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            Очистити все
          </button>
        </div>

        <div v-if="shoppingStore.items.filter(i => !i.is_bought).length === 0" class="bg-white dark:bg-[#121217] rounded-2xl p-4 sm:p-5 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
          <div class="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-2">
            <ShoppingBag class="w-5 h-5" />
          </div>
          <p class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Немає товарів до покупки</p>
          <p class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">Додайте новий товар вище або запитайте в AI Шефа</p>
        </div>

        <div v-else class="space-y-1.5">
          <div
            v-for="item in shoppingStore.items.filter(i => !i.is_bought)"
            :key="item.id"
            class="group bg-white dark:bg-[#121217] p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 shadow-xs flex items-center justify-between gap-3 transition-all"
          >
            <!-- Item info -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400 shrink-0"></div>
              <div class="truncate">
                <span class="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate block">
                  {{ item.name }}
                </span>
                <span class="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {{ item.quantity }} {{ item.unit }}
                </span>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Buy & Move to Fridge -->
              <button
                type="button"
                @click="handleMoveToFridge(item)"
                :disabled="movingItemId === item.id"
                title="Позначити як куплене та перенести в холодильник"
                class="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check class="w-3.5 h-3.5" />
                <span>{{ movingItemId === item.id ? 'Додаємо...' : 'Куплено' }}</span>
              </button>

              <!-- Delete -->
              <button
                type="button"
                @click="handleDeleteItem(item.id)"
                title="Видалити"
                class="p-1.5 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
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
          <h3 class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Куплено ({{ shoppingStore.boughtCount }})
          </h3>
          <button
            type="button"
            @click="handleClearBought"
            class="text-[11px] text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            Очистити куплене
          </button>
        </div>

        <div class="space-y-1.5">
          <div
            v-for="item in shoppingStore.items.filter(i => i.is_bought)"
            :key="item.id"
            class="bg-zinc-50/80 dark:bg-zinc-900/60 p-2.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-3 opacity-75 hover:opacity-100 transition-all"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <button
                type="button"
                @click="handleToggleBought(item)"
                class="w-5 h-5 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Check class="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <div class="truncate">
                <span class="text-xs line-through text-zinc-400 dark:text-zinc-500 font-normal truncate block">
                  {{ item.name }}
                </span>
                <span class="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {{ item.quantity }} {{ item.unit }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Move to Fridge -->
              <button
                type="button"
                @click="handleMoveToFridge(item)"
                :disabled="movingItemId === item.id"
                title="Перенести в холодильник"
                class="px-2 py-1 text-[11px] font-medium bg-violet-100/80 hover:bg-violet-200/80 dark:bg-violet-950/50 dark:hover:bg-violet-900/60 text-violet-800 dark:text-violet-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <PackagePlus class="w-3 h-3" />
                <span class="hidden sm:inline">В холодильник</span>
              </button>

              <!-- Delete -->
              <button
                type="button"
                @click="handleDeleteItem(item.id)"
                class="p-1 text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
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
