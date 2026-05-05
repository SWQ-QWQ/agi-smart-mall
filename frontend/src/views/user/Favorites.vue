<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-800">我的收藏</h1>
      </div>

      <div v-if="isLoading" class="text-center py-12">
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="favorites.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div v-for="favorite in favorites" :key="favorite.id" class="bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden">
          <router-link :to="`/product/${favorite.product_id}`">
            <div class="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span class="text-4xl">🛍️</span>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-800 mb-1 line-clamp-2">{{ favorite.product?.title }}</h3>
              <p v-if="favorite.product?.brand" class="text-gray-500 text-xs mb-2">{{ favorite.product.brand }}</p>
              <p class="text-red-500 font-bold text-xl">¥{{ favorite.product?.price }}</p>
            </div>
          </router-link>
          <div class="px-4 pb-4">
            <button
              @click="removeFavorite(favorite)"
              class="w-full py-2 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              取消收藏
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">❤️</div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">暂无收藏</h3>
        <p class="text-gray-500 mb-6">去逛逛发现心仪的商品吧</p>
        <router-link to="/products" class="inline-block bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors">
          去逛逛
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFavorites, removeFavorite as removeFavoriteApi } from '@/api/favoriteApi'

const favorites = ref([])
const isLoading = ref(true)

const fetchFavorites = async () => {
  try {
    const response = await getFavorites()
    if (response.success) {
      favorites.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
  } finally {
    isLoading.value = false
  }
}

const removeFavoriteHandler = async (favorite) => {
  if (!confirm('确定要取消收藏吗？')) return

  try {
    await removeFavoriteApi(favorite.product_id)
    favorites.value = favorites.value.filter(f => f.id !== favorite.id)
    alert('已取消收藏')
  } catch (error) {
    console.error('Failed to remove favorite:', error)
    alert('取消收藏失败')
  }
}

onMounted(() => {
  fetchFavorites()
})
</script>
