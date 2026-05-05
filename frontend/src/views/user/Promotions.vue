<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">促销活动</h1>

      <div v-if="isLoading" class="text-center py-12">
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="promotions.length > 0" class="space-y-6">
        <div
          v-for="promotion in promotions"
          :key="promotion.id"
          class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow overflow-hidden"
        >
          <div class="p-8">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-2xl font-bold text-gray-800">{{ promotion.title }}</h3>
              <div class="flex items-center gap-2 px-4 py-1 bg-orange-500 text-white rounded-full text-sm">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                活动中
              </div>
            </div>
            <p class="text-gray-600 text-lg mb-6">{{ promotion.description }}</p>
            <div class="flex items-center gap-6 text-gray-500">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                开始时间：{{ formatDate(promotion.start_time) }}
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                结束时间：{{ formatDate(promotion.end_time) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">暂无促销</h3>
        <p class="text-gray-500">敬请期待更多活动</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPromotions } from '@/api/promotionApi'

const promotions = ref([])
const isLoading = ref(true)

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const fetchPromotions = async () => {
  try {
    const response = await getPromotions()
    if (response.success) {
      promotions.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch promotions:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPromotions()
})
</script>
