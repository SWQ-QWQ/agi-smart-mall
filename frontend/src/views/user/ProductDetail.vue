<template>
  <div class="min-h-screen pb-20">
    <div v-if="isLoading" class="text-center py-20">
      <div class="inline-block w-10 h-10 border-4 border-taobao-orange border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-500 mt-4">加载中...</p>
    </div>
    <div v-else-if="product">
      <!-- Product Image Gallery -->
      <div class="relative bg-gradient-to-br from-gray-100 to-gray-200">
        <div
          class="h-80 flex items-center justify-center cursor-zoom-in"
          @click="openLightbox"
        >
          <img v-if="product.image" :src="product.image" :alt="product.title" class="max-h-full max-w-full object-contain" />
          <span v-else class="text-8xl">🛍️</span>
        </div>

        <!-- Dot Indicators -->
        <div v-if="productImages.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          <button
            v-for="(img, index) in productImages"
            :key="index"
            @click="currentImageIndex = index"
            :class="[
              'w-2.5 h-2.5 rounded-full transition-all',
              currentImageIndex === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
            ]"
          ></button>
        </div>
      </div>

      <!-- Product Info -->
      <div class="bg-white px-4 py-5">
        <!-- Price -->
        <div class="flex items-baseline mb-4">
          <span class="text-3xl font-bold text-taobao-red">¥{{ product.price }}</span>
          <span v-if="product.originalPrice" class="text-base text-gray-400 line-through ml-3">¥{{ product.originalPrice }}</span>
        </div>

        <!-- Title -->
        <h1 class="text-lg font-bold text-gray-800 mb-3">{{ product.title }}</h1>

        <!-- Meta Info -->
        <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <span v-if="product.brand">品牌：{{ product.brand }}</span>
          <span>库存：{{ product.stock }}件</span>
          <span>销量：{{ product.sales || 0 }}件</span>
        </div>
      </div>

      <!-- Spec Selection -->
      <div class="bg-white mt-3 px-4 py-5">
        <h3 class="text-sm font-bold text-gray-700 mb-3">规格选择</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="spec in specs"
            :key="spec"
            class="px-4 py-2 border border-gray-300 rounded text-sm hover:border-taobao-orange hover:text-taobao-orange transition-colors"
            :class="selectedSpec === spec ? 'border-taobao-orange bg-orange-50 text-taobao-orange' : ''"
            @click="selectedSpec = spec"
          >
            {{ spec }}
          </button>
        </div>
      </div>

      <!-- Quantity -->
      <div class="bg-white mt-3 px-4 py-5">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-gray-700">数量</span>
          <div class="flex items-center space-x-3">
            <button @click="decreaseQuantity" class="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:border-taobao-orange hover:text-taobao-orange transition-colors">-</button>
            <input v-model.number="quantity" type="number" min="1" :max="product.stock" class="w-16 h-8 border border-gray-300 rounded text-center" />
            <button @click="increaseQuantity" class="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-gray-600 hover:border-taobao-orange hover:text-taobao-orange transition-colors">+</button>
          </div>
        </div>
      </div>

      <!-- Product Details -->
      <div class="bg-white mt-3 px-4 py-5">
        <h3 class="text-sm font-bold text-gray-700 mb-3 flex items-center justify-between" @click="showDetails = !showDetails">
          <span>商品详情</span>
          <span class="text-gray-400">{{ showDetails ? '▲' : '▼' }}</span>
        </h3>
        <div v-if="showDetails" class="text-sm text-gray-600 leading-relaxed">
          <p>{{ product.description || '暂无商品详情描述' }}</p>
        </div>
      </div>

      <!-- Fixed Bottom Bar -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between z-40">
        <div class="flex items-center space-x-6">
          <button @click="handleFavorite" class="flex flex-col items-center transition-colors" :class="isFavorite ? 'text-taobao-red' : 'text-gray-500 hover:text-taobao-orange'">
            <svg class="w-6 h-6" :fill="isFavorite ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span class="text-xs mt-1">{{ isFavorite ? '已收藏' : '收藏' }}</span>
          </button>
          <router-link to="/cart" class="flex flex-col items-center text-gray-500 hover:text-taobao-orange transition-colors relative">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8m0 0l4 4m4-4l4 4"/>
            </svg>
            <span class="text-xs mt-1">购物车</span>
          </router-link>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="addToCart"
            class="px-8 py-3 bg-taobao-orange text-white font-bold rounded-full hover:bg-orange-600 transition-colors"
          >
            加入购物车
          </button>
          <button
            @click="buyNow"
            class="px-8 py-3 bg-taobao-red text-white font-bold rounded-full hover:bg-red-600 transition-colors"
          >
            立即购买
          </button>
        </div>
      </div>
    </div>

    <!-- Image Lightbox -->
    <Transition name="fade">
      <div
        v-if="showLightbox"
        class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
        @click="closeLightbox"
      >
        <button
          @click="closeLightbox"
          class="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          v-if="productImages.length > 1"
          @click.stop="prevImage"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          class="max-w-full max-h-full p-8"
          @click.stop
          @wheel="handleZoom"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <img
            :src="currentImage"
            :alt="product?.title"
            class="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
            :style="{ transform: `scale(${zoomScale})` }"
            @dblclick="resetZoom"
          />
        </div>

        <button
          v-if="productImages.length > 1"
          @click.stop="nextImage"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
        >
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2">
          <button
            v-for="(img, index) in productImages"
            :key="index"
            @click.stop="currentImageIndex = index"
            :class="[
              'w-3 h-3 rounded-full transition-all',
              currentImageIndex === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
            ]"
          ></button>
        </div>

        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          双指缩放 / 滚轮缩放 | 双击重置
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductDetail } from '@/api/productApi'
import { addFavorite, removeFavorite, checkFavorite } from '@/api/favoriteApi'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { toast } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const product = ref(null)
const quantity = ref(1)
const selectedSpec = ref('红色')
const isFavorite = ref(false)
const showDetails = ref(false)
const isLoading = ref(true)
const currentImageIndex = ref(0)
const showLightbox = ref(false)
const zoomScale = ref(1)
const touchStartDistance = ref(0)

const specs = ['红色', '蓝色', '黑色', '白色']

const productImages = computed(() => {
  if (!product.value?.image) return []
  return [product.value.image]
})

const currentImage = computed(() => {
  return productImages.value[currentImageIndex.value] || ''
})

const fetchProduct = async () => {
  try {
    const response = await getProductDetail(route.params.id)
    if (response.success) {
      product.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch product:', error)
  } finally {
    isLoading.value = false
  }
}

const checkIsFavorite = async () => {
  if (!userStore.isAuthenticated) return
  try {
    const response = await checkFavorite(route.params.id)
    if (response.success) {
      isFavorite.value = response.data.is_favorite
    }
  } catch (error) {
    console.error('Failed to check favorite:', error)
  }
}

const handleFavorite = async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (isFavorite.value) {
    await removeFavorite(route.params.id)
    isFavorite.value = false
    toast.success('已取消收藏')
  } else {
    await addFavorite({ product_id: route.params.id })
    isFavorite.value = true
    toast.success('已添加收藏')
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const increaseQuantity = () => {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  }
}

const addToCart = async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  const success = await cartStore.addToCart(product.value.id, quantity.value)
  if (success) {
    toast.success('已添加到购物车')
  }
}

const buyNow = async () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }

  await cartStore.addToCart(product.value.id, quantity.value)
  router.push('/cart')
}

const openLightbox = () => {
  showLightbox.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  showLightbox.value = false
  document.body.style.overflow = ''
  resetZoom()
}

const prevImage = () => {
  currentImageIndex.value = (currentImageIndex.value - 1 + productImages.value.length) % productImages.value.length
  resetZoom()
}

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % productImages.value.length
  resetZoom()
}

const handleZoom = (e) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoomScale.value = Math.max(0.5, Math.min(3, zoomScale.value + delta))
}

const resetZoom = () => {
  zoomScale.value = 1
}

const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    touchStartDistance.value = Math.sqrt(dx * dx + dy * dy)
  }
}

const handleTouchMove = (e) => {
  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const scale = distance / touchStartDistance.value
    zoomScale.value = Math.max(0.5, Math.min(3, scale))
  }
}

const handleTouchEnd = () => {
  touchStartDistance.value = 0
}

onMounted(() => {
  fetchProduct()
  checkIsFavorite()
})
</script>
