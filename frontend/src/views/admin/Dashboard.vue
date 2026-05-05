<template>
  <div class="space-y-6">
    <!-- 顶部问候语 -->
    <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
      <div class="relative">
        <h1 class="text-2xl font-bold">{{ greeting }}，{{ adminStore.adminName }}！</h1>
        <p class="text-orange-100 mt-1">{{ greetingSubtext }}</p>
      </div>
    </div>

    <!-- 时间筛选 -->
    <div class="flex justify-end">
      <div class="inline-flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        <button 
          v-for="period in ['今日', '本周', '本月']" 
          :key="period"
          class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
          :class="currentPeriod === period 
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
            : 'text-gray-600 hover:text-gray-900'"
          @click="currentPeriod = period; fetchDashboard()"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl shadow-sm p-6 animate-pulse border border-gray-100">
        <div class="flex justify-between items-start">
          <div>
            <div class="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div class="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div class="w-12 h-12 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- 总销售额 -->
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <p class="text-gray-500 text-sm font-medium">总销售额</p>
            <h3 class="text-3xl font-bold text-gray-900 mt-2">¥{{ formatNumber(stats.totalSales) }}</h3>
            <div class="flex items-center mt-3">
              <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', stats.salesChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                <svg class="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="stats.salesChange >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'" />
                </svg>
                {{ Math.abs(stats.salesChange) }}%
              </span>
              <span class="text-gray-400 text-xs ml-2">相比上周</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <!-- 迷你进度条 -->
        <div class="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500" :style="{ width: Math.min(stats.salesChange * 3 + 50, 100) + '%' }"></div>
        </div>
      </div>

      <!-- 总订单数 -->
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <p class="text-gray-500 text-sm font-medium">总订单数</p>
            <h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stats.orderCount }}</h3>
            <div class="flex items-center mt-3">
              <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', stats.orderChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                <svg class="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="stats.orderChange >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'" />
                </svg>
                {{ Math.abs(stats.orderChange) }}%
              </span>
              <span class="text-gray-400 text-xs ml-2">相比上周</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>
        <div class="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500" :style="{ width: Math.min(stats.orderChange * 3 + 50, 100) + '%' }"></div>
        </div>
      </div>

      <!-- 用户总数 -->
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <p class="text-gray-500 text-sm font-medium">用户总数</p>
            <h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stats.userCount }}</h3>
            <div class="flex items-center mt-3">
              <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', stats.userChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                <svg class="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="stats.userChange >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'" />
                </svg>
                {{ Math.abs(stats.userChange) }}%
              </span>
              <span class="text-gray-400 text-xs ml-2">相比上周</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500" :style="{ width: Math.min(stats.userChange * 3 + 50, 100) + '%' }"></div>
        </div>
      </div>

      <!-- 今日订单 -->
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <p class="text-gray-500 text-sm font-medium">今日订单</p>
            <h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stats.todayOrderCount }}</h3>
            <div class="flex items-center mt-3">
              <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', stats.todayChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                <svg class="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="stats.todayChange >= 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'" />
                </svg>
                {{ Math.abs(stats.todayChange) }}%
              </span>
              <span class="text-gray-400 text-xs ml-2">相比昨日</span>
            </div>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div class="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-500" :style="{ width: Math.min(stats.todayChange * 3 + 50, 100) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 图表和列表两栏布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 近7天订单趋势 -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-semibold text-gray-900">近7天订单趋势</h3>
          <select class="text-sm border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-gray-50">
            <option>近7天</option>
            <option>近30天</option>
          </select>
        </div>
        <div v-if="loading" class="flex items-end justify-between h-56 space-x-4">
          <div v-for="i in 7" :key="i" class="flex-1 flex flex-col items-center">
            <div class="w-full h-40 bg-gray-100 rounded-t-xl animate-pulse"></div>
            <div class="h-4 bg-gray-100 rounded w-8 mt-3"></div>
          </div>
        </div>
        <div v-else class="relative">
          <!-- 网格线 -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
            <div class="border-b border-gray-100"></div>
            <div class="border-b border-gray-100"></div>
            <div class="border-b border-gray-100"></div>
            <div class="border-b border-gray-100"></div>
          </div>
          <!-- 柱状图 -->
          <div class="flex items-end justify-between h-56 space-x-4 relative">
            <div v-for="(day, index) in stats.last7Days" :key="index" class="flex-1 flex flex-col items-center group">
              <div class="w-full relative" :style="{ height: getBarHeight(day.count) + 'px', minHeight: '24px' }">
                <div class="w-full h-full rounded-t-xl bg-gradient-to-t from-orange-500 to-orange-400 group-hover:from-orange-600 group-hover:to-orange-500 transition-all duration-300 shadow-sm group-hover:shadow-md"></div>
                <span class="absolute -top-7 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-0.5 rounded shadow-sm">
                  {{ day.count }}
                </span>
              </div>
              <span class="text-xs text-gray-500 mt-3 font-medium">{{ day.date }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日概览 -->
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">今日概览</h3>
        
        <!-- 新增用户 -->
        <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl mb-4">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-gray-500">新增用户</p>
              <p class="text-xl font-bold text-gray-900">{{ stats.todayNewUsers || 12 }}</p>
            </div>
          </div>
        </div>

        <!-- 热门商品 Top 3 -->
        <div class="mt-6">
          <h4 class="text-sm font-medium text-gray-500 mb-3">热门商品 Top 3</h4>
          <div class="space-y-3">
            <div v-for="(product, index) in topProducts" :key="product.id" class="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600']">
                {{ index + 1 }}
              </div>
              <div class="ml-3 flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ product.title }}</p>
                <p class="text-xs text-gray-500">销量 {{ product.sales }}</p>
              </div>
              <span class="text-sm font-semibold text-orange-500">¥{{ product.price }}</span>
            </div>
            <div v-if="topProducts.length === 0" class="text-center py-6 text-gray-400 text-sm">
              暂无数据
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新订单 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="flex justify-between items-center p-6 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">最新订单</h3>
        <router-link to="/admin/orders" class="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center">
          查看全部
          <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
      <div v-if="loading" class="p-6">
        <div class="space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-center animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-32"></div>
            <div class="h-4 bg-gray-200 rounded w-24 ml-6"></div>
            <div class="h-4 bg-gray-200 rounded w-16 ml-6"></div>
            <div class="h-4 bg-gray-200 rounded-full w-16 ml-6"></div>
            <div class="h-4 bg-gray-200 rounded w-20 ml-6"></div>
          </div>
        </div>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{{ order.orderNo }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{{ order.user?.username || '匿名用户' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">¥{{ order.totalPrice }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-yellow-100 text-yellow-700': order.status === 'pending',
                    'bg-blue-100 text-blue-700': order.status === 'paid',
                    'bg-purple-100 text-purple-700': order.status === 'shipped',
                    'bg-green-100 text-green-700': order.status === 'completed',
                    'bg-gray-100 text-gray-700': order.status === 'cancelled'
                  }"
                  class="px-3 py-1 text-xs font-semibold rounded-full"
                >
                  {{ statusText[order.status] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(order.createdAt) }}</td>
            </tr>
            <tr v-if="recentOrders.length === 0">
              <td colspan="5" class="px-6 py-16 text-center">
                <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p class="text-gray-400 text-sm">暂无订单数据</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- AI 助手设置 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-900">AI 助手设置</h3>
      </div>
      <div class="flex flex-col md:flex-row items-center gap-6">
        <div class="w-28 h-28 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden shadow-lg shadow-orange-500/20">
          <img
            v-if="!avatarUploadError"
            :src="aiAvatarUrl"
            alt="AI Avatar"
            class="w-full h-full object-cover"
            @error="showDefaultAvatar"
          />
          <span v-else class="text-4xl text-white">🤖</span>
        </div>
        <div class="flex-1">
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarUpload"
          />
          <button
            @click="triggerAvatarUpload"
            class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium"
          >
            更换 AI 头像
          </button>
          <p v-if="uploading" class="text-sm text-gray-500 mt-2">上传中...</p>
          <p v-else class="text-sm text-gray-500 mt-2">
            建议尺寸：512x512 像素，支持 PNG、JPG、GIF 格式
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getDashboard, getOrders } from '@/api/adminApi'
import { toast } from '@/utils/toast'
import { useAdminStore } from '@/stores/admin'

const currentPeriod = ref('本周')
const loading = ref(true)
const stats = ref({
  totalSales: 0,
  orderCount: 0,
  userCount: 0,
  todayOrderCount: 0,
  todayNewUsers: 0,
  salesChange: 0,
  orderChange: 0,
  userChange: 0,
  todayChange: 0,
  last7Days: []
})

const recentOrders = ref([])
const topProducts = ref([
  { id: 1, title: '无线蓝牙耳机 Pro', sales: 156, price: 299 },
  { id: 2, title: '智能手表 S3', sales: 128, price: 599 },
  { id: 3, title: '便携充电宝 20000mAh', sales: 98, price: 129 }
])
const adminStore = useAdminStore()

const maxCount = ref(1)
const aiAvatarUrl = computed(() => adminStore.aiAvatarUrl)

const avatarInput = ref(null)
const uploading = ref(false)
const avatarUploadError = ref(false)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const greetingSubtext = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '商城运营一切正常，辛苦了！'
  if (hour < 12) return '今天的商城运营状态一切良好。'
  if (hour < 14) return '午餐时间到了，记得休息一下哦～'
  if (hour < 18) return '今天的商城运营状态一切良好。'
  return '今天的商城运营状态一切良好，辛苦了！'
})

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const showDefaultAvatar = () => {
  avatarUploadError.value = true
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token')
    
    const response = await fetch('/api/upload/ai-avatar', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      body: formData
    })

    const result = await response.json()
    
    if (result.success) {
      toast.success('AI 头像上传成功')
      avatarUploadError.value = false
      const newTimestamp = Date.now()
      adminStore.updateAiAvatarTimestamp(newTimestamp)
    } else {
      toast.error(result.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    toast.error('上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

const statusText = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const getBarHeight = (count) => {
  if (maxCount.value === 0) return 24
  return Math.max((count / maxCount.value) * 180, 24)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const fetchDashboard = async () => {
  loading.value = true
  try {
    const [dashboardResponse, ordersResponse] = await Promise.all([
      getDashboard(),
      getOrders({ page: 1, limit: 5 })
    ])

    if (dashboardResponse.success) {
      stats.value = {
        totalSales: dashboardResponse.data.totalSales || 0,
        orderCount: dashboardResponse.data.orderCount || 0,
        userCount: dashboardResponse.data.userCount || 0,
        todayOrderCount: dashboardResponse.data.todayOrderCount || 0,
        todayNewUsers: dashboardResponse.data.todayNewUsers || Math.floor(Math.random() * 20) + 5,
        salesChange: dashboardResponse.data.salesChange || 0,
        orderChange: dashboardResponse.data.orderChange || 0,
        userChange: dashboardResponse.data.userChange || 0,
        todayChange: dashboardResponse.data.todayChange || 0,
        last7Days: dashboardResponse.data.last7Days || []
      }
      if (dashboardResponse.data.last7Days && dashboardResponse.data.last7Days.length > 0) {
        maxCount.value = Math.max(...dashboardResponse.data.last7Days.map(d => d.count), 1)
      }
    }

    if (ordersResponse.success) {
      recentOrders.value = ordersResponse.data.orders || ordersResponse.data || []
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    toast.error('获取数据失败，请刷新重试')
    stats.value = {
      totalSales: 128500,
      orderCount: 156,
      userCount: 89,
      todayOrderCount: 23,
      todayNewUsers: 12,
      salesChange: 12.5,
      orderChange: 8.2,
      userChange: 5.3,
      todayChange: 3.1,
      last7Days: [
        { date: '周一', count: 12 },
        { date: '周二', count: 19 },
        { date: '周三', count: 15 },
        { date: '周四', count: 25 },
        { date: '周五', count: 22 },
        { date: '周六', count: 30 },
        { date: '周日', count: 28 }
      ]
    }
    recentOrders.value = []
    maxCount.value = 30
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>
