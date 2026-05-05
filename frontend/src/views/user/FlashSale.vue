<template>
  <div class="bg-gray-50 pb-12">
    <!-- 顶部标题区 -->
    <section class="bg-gradient-to-r from-orange-500 to-red-500 text-white py-6">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold flex items-center">
            <span class="text-3xl mr-3">⏱</span>
            限时秒杀
          </h1>
          <div v-if="isFlashSaleActive" class="flex items-center space-x-3">
            <span class="text-sm opacity-90">距本场结束</span>
            <div class="flex items-center space-x-1">
              <span class="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-xl font-bold">{{ countdown.hours }}</span>
              <span class="text-xl font-bold">:</span>
              <span class="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-xl font-bold">{{ countdown.minutes }}</span>
              <span class="text-xl font-bold">:</span>
              <span class="bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-xl font-bold">{{ countdown.seconds }}</span>
            </div>
          </div>
          <div v-else class="flex items-center">
            <span class="text-lg font-medium">下一场 {{ nextFlashSaleTime }} 开始</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 秒杀状态提示 -->
    <section v-if="!isFlashSaleActive" class="bg-white shadow-sm my-6">
      <div class="max-w-7xl mx-auto px-4 py-12 text-center">
        <p class="text-6xl mb-4">⏰</p>
        <p class="text-gray-600 text-lg mb-2">下一场秒杀 {{ nextFlashSaleTime }} 开始</p>
        <p class="text-gray-400 text-sm">敬请期待更多惊喜优惠</p>
      </div>
    </section>

    <!-- 秒杀商品列表 -->
    <section v-else class="max-w-7xl mx-auto px-4">
      <div class="grid grid-cols-4 gap-5">
        <router-link
          v-for="product in flashSaleProducts"
          :key="product.id"
          :to="`/product/${product.id}`"
          class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
        >
          <div class="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
            <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
            <span v-else class="text-6xl text-gray-300">🛍️</span>
            <span class="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              秒杀
            </span>
          </div>
          <div class="p-4">
            <h3 class="text-sm text-gray-800 font-medium mb-2 line-clamp-2">{{ product.title }}</h3>
            <div class="flex items-baseline space-x-2 mb-3">
              <span class="text-2xl font-bold text-red-500">¥{{ product.seckillPrice }}</span>
              <span class="text-sm text-gray-400 line-through">¥{{ product.price }}</span>
            </div>
            <div class="relative h-2.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div class="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500" :style="{ width: `${product.soldPercent}%` }"></div>
            </div>
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-500">已抢{{ product.soldPercent }}%</p>
              <button class="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                立即抢购
              </button>
            </div>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getProducts } from '@/api/productApi'

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

const loadProducts = async () => {
  try {
    const response = await getProducts({ limit: 50 })
    if (response.success && response.data) {
      const products = response.data.products || response.data
      
      const shuffled = products.sort(() => Math.random() - 0.5)
      const selected = shuffled.slice(0, Math.floor(Math.random() * 5) + 8)
      
      flashSaleProducts.value = selected.map(p => ({
        ...p,
        seckillPrice: (p.price * (0.4 + Math.random() * 0.3)).toFixed(2),
        soldPercent: Math.floor(20 + Math.random() * 75)
      }))
    }
  } catch (error) {
    console.error('加载秒杀商品失败', error)
  }
}

onMounted(() => {
  loadProducts()
  countdownInterval = setInterval(updateCountdown, 1000)
  updateCountdown()
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>