import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { ShoppingItem, ShoppingSummary, CreateShoppingItemInput, Product } from '@/types'
import { useProductStore } from '@/stores/products'

export const useShoppingStore = defineStore('shopping', () => {
  const summary = ref<ShoppingSummary | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const items = computed(() => summary.value?.items || [])
  const totalCount = computed(() => summary.value?.total_count || 0)
  const boughtCount = computed(() => summary.value?.bought_count || 0)
  const leftCount = computed(() => summary.value?.left_count || 0)

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get<ShoppingSummary>('/shopping')
      summary.value = data
    } catch (err: any) {
      error.value = err?.message || 'Не вдалося завантажити список покупок'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function addItem(input: CreateShoppingItemInput): Promise<ShoppingItem> {
    const item = await api.post<ShoppingItem>('/shopping', input)
    await fetchItems()
    return item
  }

  async function batchAddItems(inputs: CreateShoppingItemInput[]): Promise<void> {
    if (!inputs.length) return
    await api.post('/shopping/batch', { items: inputs })
    await fetchItems()
  }

  async function updateItem(id: string, input: Partial<CreateShoppingItemInput>): Promise<ShoppingItem> {
    const updated = await api.put<ShoppingItem>(`/shopping/${id}`, input)
    await fetchItems()
    return updated
  }

  async function toggleBought(id: string, isBought: boolean): Promise<ShoppingItem> {
    // Optimistic update
    if (summary.value) {
      const found = summary.value.items.find((i) => i.id === id)
      if (found) {
        found.is_bought = isBought
        if (isBought) {
          summary.value.bought_count++
          summary.value.left_count = Math.max(0, summary.value.left_count - 1)
        } else {
          summary.value.bought_count = Math.max(0, summary.value.bought_count - 1)
          summary.value.left_count++
        }
      }
    }

    try {
      const updated = await api.patch<ShoppingItem>(`/shopping/${id}/toggle`, { is_bought: isBought })
      return updated
    } catch (err) {
      await fetchItems() // revert on error
      throw err
    }
  }

  async function purchaseAndMoveToFridge(id: string, expiryDays: number = 7, quantity?: number): Promise<Product> {
    const res = await api.post<{ message: string; product: Product }>(`/shopping/${id}/purchase`, {
      expiry_days: expiryDays,
      quantity,
    })

    // Refresh shopping list and products inventory
    await fetchItems()
    const productsStore = useProductStore()
    await productsStore.fetchProducts()

    return res.product
  }

  async function deleteItem(id: string): Promise<void> {
    await api.delete(`/shopping/${id}`)
    if (summary.value) {
      summary.value.items = summary.value.items.filter((i) => i.id !== id)
      summary.value.total_count = summary.value.items.length
      summary.value.bought_count = summary.value.items.filter((i) => i.is_bought).length
      summary.value.left_count = summary.value.total_count - summary.value.bought_count
    }
  }

  async function clearBought(): Promise<void> {
    await api.delete('/shopping/bought')
    await fetchItems()
  }

  async function clearAll(): Promise<void> {
    await api.delete('/shopping')
    await fetchItems()
  }

  return {
    summary,
    items,
    totalCount,
    boughtCount,
    leftCount,
    loading,
    error,
    fetchItems,
    addItem,
    batchAddItems,
    updateItem,
    toggleBought,
    purchaseAndMoveToFridge,
    deleteItem,
    clearBought,
    clearAll,
  }
})
