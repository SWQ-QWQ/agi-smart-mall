<template>
  <div class="min-h-screen pb-20 bg-gray-100">
    <!-- Page Header -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center">
          <button @click="$router.back()" class="mr-4 text-gray-600 hover:text-gray-900">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900">新品首发</h1>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div v-for="i in 10" :key="i" class="bg-white rounded-xl p-3 animate-pulse">
          <div class="h-36 bg-gray-200 rounded-lg mb-3"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="products.length === 0" class="text-center py-16 bg-white rounded-xl">
        <div class="text-5xl mb-4">✨</div>
        <p class="text-gray-500 mb-4">暂无新品</p>
        <router-link to="/" class="inline-flex items-center px-6 py-2 bg-taobao-orange text-white rounded-full hover:bg-orange-600 transition-colors">
          去首页看看
        </router-link>
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <router-link
          v-for="product in products"
          :key="product.id"
          :to="`/product/${product.id}`"
          class="bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300 group"
        >
          <div class="relative">
            <!-- New Badge -->
            <span class="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">新品</span>
            
            <!-- Product Image -->
            <div class="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
              <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <span v-else class="text-4xl">🛍️</span>
            </div>
          </div>

          <div class="p-3">
            <h3 class="text-xs font-medium text-gray-800 line-clamp-2 mb-2 h-8 group-hover:text-taobao-orange transition-colors">{{ product.title }}</h3>
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-taobao-orange">¥{{ product.price }}</span>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Load More -->
      <div v-if="!isLoading && products.length > 0" class="text-center mt-8">
        <button
          v-if="hasMore"
          @click="loadMore"
          :disabled="isLoadingMore"
          class="px-12 py-3 bg-white border border-gray-300 text-gray-700 rounded-full hover:border-taobao-orange hover:text-taobao-orange transition-colors disabled:opacity-50"
        >
          {{ isLoadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getProducts } from '@/api/productApi'

const isLoading = ref(true)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const products = ref([])
const page = ref(1)

const fetchProducts = async () => {
  try {
    const response = await getProducts({ page: page.value, limit: 15 })
    if (response.success && response.data) {
      const productsData = response.data.products || response.data
      const sortedProducts = [...productsData].reverse()
      if (page.value === 1) {
        products.value = sortedProducts
      } else {
        products.value = [...products.value, ...sortedProducts]
      }
      if (productsData.length < 15) {
        hasMore.value = false
      }
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  isLoadingMore.value = true
  fetchProducts()
}

onMounted(() => {
  document.title = '新品首发 - AGI商城'
  fetchProducts()
})
</script>