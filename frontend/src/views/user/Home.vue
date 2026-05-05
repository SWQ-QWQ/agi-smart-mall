<template>
  <div class="bg-gray-50 pb-12">
    <!-- 搜索栏区 -->
    <section class="bg-white shadow-sm py-6 mb-6">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-center space-x-4 mb-4">
          <div class="flex items-center space-x-2">
            <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              智
            </div>
            <span class="text-2xl font-bold text-gray-800">智享商城</span>
          </div>
        </div>
        <div class="max-w-3xl mx-auto">
          <div class="relative flex">
            <input
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              type="text"
              placeholder="搜索你想要的商品"
              class="flex-1 px-6 py-3 border-2 border-gray-200 rounded-l-full text-sm focus:border-orange-500 outline-none focus:ring-2 focus:ring-orange-50 focus:ring-offset-0"
            />
            <button
              @click="handleSearch"
              class="bg-orange-500 text-white px-8 py-3 rounded-r-full hover:bg-orange-600 transition-colors flex items-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 70 11-14 0 7 70 0114 0z"></path>
              </svg>
              <span>搜索</span>
            </button>
          </div>
          <div class="flex items-center space-x-4 mt-4 px-2">
            <span class="text-xs text-gray-400">热门搜索：</span>
            <router-link
              v-for="keyword in hotKeywords"
              :key="keyword"
              :to="{ name: 'Products', query: { keyword } }"
              class="text-xs text-gray-600 hover:text-orange-500 transition-colors"
            >
              {{ keyword }}
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 超级品牌日横幅 -->
    <section class="mb-8">
      <div class="max-w-7xl mx-auto px-4">
        <div class="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 rounded-2xl p-8 relative overflow-hidden">
          <div class="absolute left-0 top-0 w-32 h-full opacity-10">
            <div class="absolute left-12 top-8 text-6xl">🎁</div>
            <div class="absolute left-4 bottom-12 text-4xl">🎊</div>
          </div>
          <div class="flex items-center justify-between relative z-10">
            <div class="text-white">
              <p class="text-4xl font-bold mb-2">超级品牌日</p>
              <p class="text-xl opacity-90 mb-6">精选大牌好物 全场5折起</p>
              <div class="flex space-x-4">
                <button class="px-8 py-3 bg-white text-orange-500 rounded-full font-medium hover:bg-gray-100 transition-all shadow-lg">
                  立即抢购
                </button>
              </div>
            </div>
            <div class="flex space-x-4">
              <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center text-white min-w-[120px]">
                <div class="text-3xl mb-1">📱</div>
                <p class="text-sm">数码狂欢</p>
              </div>
              <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center text-white min-w-[120px]">
                <div class="text-3xl mb-1">👟</div>
                <p class="text-sm">运动专场</p>
              </div>
              <div class="bg-white/20 backdrop-blur rounded-xl p-4 text-center text-white min-w-[120px]">
                <div class="text-3xl mb-1">💄</div>
                <p class="text-sm">美妆特惠</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 限时秒杀区 -->
    <section class="mb-8">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between mb-6 bg-white rounded-2xl shadow-sm p-4">
          <div class="flex items-center space-x-6">
            <h2 class="text-2xl font-bold text-gray-800 flex items-center">
              <span class="text-2xl mr-2">⏱</span>
              限时秒杀
            </h2>
            <div class="flex items-center space-x-2">
              <span v-if="isFlashSaleActive" class="text-orange-500 font-medium">距本场结束</span>
              <span v-else class="text-gray-500 font-medium">下一场 {{ nextFlashSaleTime }} 开始</span>
              <div v-if="isFlashSaleActive" class="flex items-center space-x-1">
                <span class="bg-gray-800 text-white w-10 h-10 flex items-center justify-center rounded-lg text-base font-bold">{{ countdown.hours }}</span>
                <span class="text-gray-800 font-bold text-xl">:</span>
                <span class="bg-gray-800 text-white w-10 h-10 flex items-center justify-center rounded-lg text-base font-bold">{{ countdown.minutes }}</span>
                <span class="text-gray-800 font-bold text-xl">:</span>
                <span class="bg-gray-800 text-white w-10 h-10 flex items-center justify-center rounded-lg text-base font-bold">{{ countdown.seconds }}</span>
              </div>
            </div>
          </div>
          <router-link to="/flash-sale" class="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center">
            更多秒杀
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </router-link>
        </div>
        <div v-if="isFlashSaleActive" class="grid grid-cols-6 gap-4">
          <router-link
            v-for="product in flashSaleProducts"
            :key="product.id"
            :to="`/product/${product.id}`"
            class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <div class="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
              <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              <span v-else class="text-6xl text-gray-300">🛍️</span>
              <span class="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                秒杀
              </span>
            </div>
            <div class="p-4">
              <div class="flex items-baseline space-x-2 mb-2">
                <span class="text-2xl font-bold text-red-500">¥{{ product.seckillPrice }}</span>
                <span class="text-sm text-gray-400 line-through">¥{{ product.price }}</span>
              </div>
              <div class="relative h-3 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div class="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500" :style="{ width: `${product.soldPercent}%` }"></div>
              </div>
              <p class="text-xs text-gray-500 text-center">已抢{{ product.soldPercent }}%</p>
            </div>
          </router-link>
        </div>
        <div v-else class="bg-white rounded-2xl p-16 text-center shadow-sm">
          <p class="text-5xl mb-4">⏰</p>
          <p class="text-gray-600 text-lg">下一场 {{ nextFlashSaleTime }} 开始</p>
          <p class="text-gray-400 text-sm mt-2">敬请期待更多惊喜</p>
        </div>
      </div>
    </section>

    <!-- 热门商品区 -->
    <section class="mb-8">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center">
            <span class="w-1 h-7 bg-gradient-to-b from-orange-500 to-red-500 rounded mr-3"></span>
            🔥 热门商品
          </h2>
          <router-link to="/products?sort=sales" class="text-gray-500 hover:text-orange-500 text-sm font-medium flex items-center">
            更多
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </router-link>
        </div>
        <div class="grid grid-cols-4 gap-5">
          <router-link
            v-for="product in hotProducts"
            :key="product.id"
            :to="`/product/${product.id}`"
            class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <div class="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
              <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              <span v-else class="text-6xl text-gray-300">🛍️</span>
              <span v-if="product.promotion" class="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {{ product.promotion }}
              </span>
            </div>
            <div class="p-4">
              <h3 class="text-sm text-gray-800 font-medium mb-2 line-clamp-2">{{ product.title }}</h3>
              <div class="flex items-center text-xs text-gray-400 mb-2">
                <span>⭐ {{ product.rating }}</span>
                <span class="mx-2">|</span>
                <span>已售 {{ product.sales }}+</span>
              </div>
              <div class="flex items-baseline space-x-2">
                <span class="text-lg font-bold text-red-500">¥{{ product.price }}</span>
                <span v-if="product.originalPrice" class="text-xs text-gray-400 line-through">¥{{ product.originalPrice }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 精品推荐区 -->
    <section class="mb-8">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center">
            <span class="w-1 h-7 bg-gradient-to-b from-orange-500 to-red-500 rounded mr-3"></span>
            精品推荐
          </h2>
          <router-link to="/products" class="text-gray-500 hover:text-orange-500 text-sm font-medium flex items-center">
            更多
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </router-link>
        </div>
        <div class="grid grid-cols-4 gap-5">
          <router-link
            v-for="product in recommendedProducts"
            :key="product.id"
            :to="`/product/${product.id}`"
            class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <ProductCard :product="product" />
          </router-link>
        </div>
        
        <!-- 加载更多按钮 -->
        <div class="mt-8 text-center">
          <button
            v-if="!hasMore"
            class="px-8 py-3 border border-gray-300 text-gray-400 rounded-full text-sm cursor-not-allowed"
            disabled
          >
            没有更多了~
          </button>
          <button
            v-else-if="isLoading"
            class="px-8 py-3 border-2 border-orange-500 text-orange-500 rounded-full text-sm font-medium flex items-center mx-auto"
            disabled
          >
            <svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            加载中...
          </button>
          <button
            v-else
            @click="loadMoreProducts"
            class="px-8 py-3 border-2 border-orange-500 text-orange-500 rounded-full text-sm font-medium hover:bg-orange-50 transition-all"
          >
            加载更多
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts } from '@/api/productApi'
import ProductCard from '@/components/ProductCard.vue'

const router = useRouter()
const searchQuery = ref('')

const hotKeywords = ['无线耳机', '运动鞋', '苹果手机', '口红', '笔记本', '蓝牙音箱', '电饭煲', '净水器']

// 秒杀倒计时
const countdown = ref({ hours: '00', minutes: '00', seconds: '00' })
const isFlashSaleActive = ref(true)
const nextFlashSaleTime = ref('20:00')
let countdownInterval = null

const flashSaleTimes = [
  { hour: 10, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 20, minute: 0 }
]

const updateCountdown = () => {
  const now = new Date()
  
  for (let i = 0; i < flashSaleTimes.length; i++) {
    const time = flashSaleTimes[i]
    const startTime = new Date(now)
    startTime.setHours(time.hour, time.minute, 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + 2)
    
    if (now >= startTime && now < endTime) {
      isFlashSaleActive.value = true
      const diff = endTime - now
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      countdown.value = {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0')
      }
      
      const nextIndex = (i + 1) % flashSaleTimes.length
      nextFlashSaleTime.value = `${String(flashSaleTimes[nextIndex].hour).padStart(2, '0')}:${String(flashSaleTimes[nextIndex].minute).padStart(2, '0')}`
      
      return
    }
  }
  
  isFlashSaleActive.value = false
  
  for (let i = 0; i < flashSaleTimes.length; i++) {
    const time = flashSaleTimes[i]
    const startTime = new Date(now)
    startTime.setHours(time.hour, time.minute, 0, 0)
    
    if (now < startTime) {
      nextFlashSaleTime.value = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`
      return
    }
  }
  
  nextFlashSaleTime.value = `${String(flashSaleTimes[0].hour).padStart(2, '0')}:${String(flashSaleTimes[0].minute).padStart(2, '0')}`
}

const flashSaleProducts = ref([])
const hotProducts = ref([])
const recommendedProducts = ref([])

// 分页相关
const currentPage = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)

const brandNames = ['小米', '华为', '苹果', '三星', '索尼', '耐克', '阿迪达斯']
const promotions = ['满199减20', '满299减50', '包邮', '限时8折']

const enhanceProduct = (product) => {
  const enhanced = { ...product }
  enhanced.brand = brandNames[Math.floor(Math.random() * brandNames.length)]
  enhanced.rating = (4.0 + Math.random() * 1.0).toFixed(1)
  enhanced.originalPrice = (product.price * 1.2 + Math.random() * 50).toFixed(2)
  enhanced.is_free_shipping = Math.random() > 0.5
  enhanced.promotion = Math.random() > 0.6 ? promotions[Math.floor(Math.random() * promotions.length)] : null
  enhanced.sales = Math.floor(Math.random() * 1000) + 100
  return enhanced
}

const loadHotProducts = async () => {
  try {
    const response = await getProducts({ sort: 'sales', limit: 8 })
    if (response.success && response.data) {
      const products = response.data.products || response.data
      hotProducts.value = products.map(p => enhanceProduct(p))
    }
  } catch (error) {
    console.error('加载热门商品失败', error)
  }
}

const loadRecommendedProducts = async (page = 1) => {
  try {
    const response = await getProducts({ page, limit: 8 })
    if (response.success && response.data) {
      const products = response.data.products || response.data
      if (page === 1) {
        recommendedProducts.value = products.map(p => enhanceProduct(p))
      } else {
        if (products.length === 0) {
          hasMore.value = false
        } else {
          recommendedProducts.value.push(...products.map(p => enhanceProduct(p)))
        }
      }
    }
  } catch (error) {
    console.error('加载推荐商品失败', error)
  }
}

const loadProducts = async () => {
  try {
    const response = await getProducts({ limit: 100 })
    if (response.success && response.data) {
      const products = response.data.products || response.data
      
      flashSaleProducts.value = products.slice(0, 6).map(p => ({
        ...enhanceProduct(p),
        seckillPrice: (p.price * (0.5 + Math.random() * 0.3)).toFixed(2),
        soldPercent: Math.floor(30 + Math.random() * 65)
      }))
    }
  } catch (error) {
    console.error('加载商品失败', error)
  }
}

const loadMoreProducts = async () => {
  if (isLoading.value || !hasMore.value) return
  
  isLoading.value = true
  currentPage.value++
  
  try {
    await loadRecommendedProducts(currentPage.value)
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: 'Products', query: { keyword: searchQuery.value.trim() } })
  }
}

// 滚动加载
const handleScroll = () => {
  if (isLoading.value || !hasMore.value) return
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMoreProducts()
  }
}

onMounted(() => {
  loadProducts()
  loadHotProducts()
  loadRecommendedProducts()
  countdownInterval = setInterval(updateCountdown, 1000)
  updateCountdown()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
