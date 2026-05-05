<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">公告列表</h1>

      <div v-if="isLoading" class="text-center py-12">
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="announcements.length > 0" class="space-y-4">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow"
        >
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-800">{{ announcement.title }}</h3>
            <span class="text-gray-500 text-sm">{{ formatDate(announcement.created_at) }}</span>
          </div>
          <p class="text-gray-600 whitespace-pre-wrap">{{ announcement.content }}</p>
        </div>
      </div>

      <div v-else class="text-center py-12 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">📢</div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">暂无公告</h3>
        <p class="text-gray-500">稍后再来查看吧</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAnnouncements } from '@/api/announcementApi'

const announcements = ref([])
const isLoading = ref(true)

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const fetchAnnouncements = async () => {
  try {
    const response = await getAnnouncements()
    if (response.success) {
      announcements.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAnnouncements()
})
</script>
