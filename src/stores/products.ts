import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'
import type { Product, CategoryInfo, CreateProductInput, UpdateProductInput, NutritionEstimate, BarcodeProductResult } from '@/types'

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const categories = ref<CategoryInfo[]>([])
  const loading = ref<boolean>(false)
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('all')

  const filteredProducts = computed(() => {
    return products.value.filter((p) => {
      const matchesCategory =
        selectedCategory.value === 'all' ||
        p.category.toLowerCase() === selectedCategory.value.toLowerCase()

      const query = searchQuery.value.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.notes && p.notes.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  })

  const stats = computed(() => {
    let expiringSoon = 0
    let expired = 0

    products.value.forEach((p) => {
      if (p.status === 'expired') {
        expired++
      } else if (p.status === 'warning') {
        expiringSoon++
      }
    })

    return {
      total: products.value.length,
      expiringSoon,
      expired,
    }
  })

  async function fetchCategories() {
    try {
      const data = await api.get<CategoryInfo[]>('/products/categories')
      categories.value = data
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  async function fetchProducts() {
    loading.value = true
    try {
      const data = await api.get<Product[]>('/products')
      products.value = data || []
    } catch (err) {
      console.error('Failed to fetch products:', err)
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function addProduct(input: CreateProductInput): Promise<Product> {
    const created = await api.post<Product>('/products', input)
    products.value.unshift(created)
    return created
  }

  async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const updated = await api.put<Product>(`/products/${id}`, input)
    const idx = products.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      products.value[idx] = updated
    }
    return updated
  }

  async function consumeProduct(id: string, amount: number = 1, unit?: string) {
    const res = await api.post<Product>(`/products/${id}/consume`, { amount, unit })
    const idx = products.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      if (res.quantity <= 0) {
        products.value.splice(idx, 1)
      } else {
        products.value[idx] = res
      }
    }
  }

  async function deleteProduct(id: string) {
    await api.delete(`/products/${id}`)
    products.value = products.value.filter((p) => p.id !== id)
  }

  async function clearFridge() {
    await api.delete('/products')
    products.value = []
  }

  async function estimateNutrition(name: string, unit?: string, quantity?: number): Promise<NutritionEstimate> {
    return api.post<NutritionEstimate>('/products/estimate-nutrition', { name, unit, quantity })
  }

  async function lookupBarcode(barcode: string): Promise<BarcodeProductResult> {
    return api.get<BarcodeProductResult>(`/products/barcode/${encodeURIComponent(barcode)}`)
  }

  return {
    products,
    categories,
    loading,
    searchQuery,
    selectedCategory,
    filteredProducts,
    stats,
    fetchCategories,
    fetchProducts,
    addProduct,
    updateProduct,
    consumeProduct,
    deleteProduct,
    clearFridge,
    estimateNutrition,
    lookupBarcode,
  }
})
