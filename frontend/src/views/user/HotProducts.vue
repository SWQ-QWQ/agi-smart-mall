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
          <h1 class="text-xl font-bold text-gray-900">热门推荐</h1>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="i in 8" :key="i" class="bg-white rounded-xl p-4 animate-pulse">
          <div class="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="products.length === 0" class="text-center py-16 bg-white rounded-xl">
        <div class="text-5xl mb-4">💔</div>
        <p class="text-gray-500 mb-4">暂无热门商品</p>
        <router-link to="/" class="inline-flex items-center px-6 py-2 bg-taobao-orange text-white rounded-full hover:bg-orange-600 transition-colors">
          去首页看看
        </router-link>
      </div>

      <!-- Products Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <router-link
          v-for="(product, index) in products"
          :key="product.id"
          :to="`/product/${product.id}`"
          class="bg-white rounded-xl overflow-hidden shadow hover:shadow-xl transition-all duration-300 group relative"
        >
          <!-- Rank Badge -->
          <div v-if="index < 3" class="absolute top-3 left-3 z-10" :class="{
            'bg-yellow-400 text-yellow-900': index === 0,
            'bg-gray-300 text-gray-900': index === 1,
            'bg-orange-300 text-orange-900': index === 2
          }">
            <span class="px-2 py-1 text-xs font-bold rounded-full">
              {{ index + 1 }}
            </span>
          </div>

          <!-- Product Image -->
          <div class="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
            <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            <span v-else class="text-5xl">🛍️</span>
          </div>

          <div class="p-4">
            <h3 class="text-sm font-medium text-gray-800 line-clamp-2 mb-2 h-10 group-hover:text-taobao-orange transition-colors">{{ product.title }}</h3>
            <div class="flex items-center justify-between">
              <div>
                <span class="text-lg font-bold text-taobao-red">¥{{ product.price }}</span>
                <div class="flex items-center mt-1">
                  <span class="text-xs text-gray-400">已售 {{ product.sales || 0 }}</span>
                  <span v-if="product.sales > 100" class="ml-2 text-xs text-taobao-orange bg-orange-50 px-1.5 py-0.5 rounded-full">热卖</span>
                </div>
              </div>
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
    const response = await getProducts({ page: page.value, limit: 12 })
    if (response.success && response.data) {
      const productsData = response.data.products || response.data
      const sortedProducts = [...productsData].sort((a, b) => (b.sales || 0) - (a.sales || 0))
      if (page.value === 1) {
        products.value = sortedProducts
      } else {
        products.value = [...products.value, ...sortedProducts]
      }
      if (productsData.length < 12) {
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
  document.title = '热门推荐 - AGI商城'
  fetchProducts()
})
</script>