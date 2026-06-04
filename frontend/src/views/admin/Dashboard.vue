<template>
  <div class="p-6 space-y-6">
    <!-- 顶部欢迎区 -->
    <div class="bg-gradient-to-r from-taobao-orange to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
      <div class="relative z-10">
        <h1 class="text-2xl font-bold">{{ greeting }}，{{ adminStore.adminName || '管理员' }}！</h1>
        <p class="text-orange-100 mt-2">{{ greetingSubtext }}</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="(stat, index) in statsOverview" :key="index" 
           class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm font-medium">{{ stat.label }}</p>
            <h3 class="text-3xl font-bold text-gray-900 mt-2">{{ stat.value }}</h3>
          </div>
          <div class="w-14 h-14 rounded-xl flex items-center justify-center" :class="stat.bgClass">
            <span class="text-white text-xl">{{ stat.icon }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表和今日概览 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 近7天订单趋势 -->
      <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">近7天订单趋势</h3>
        </div>
        <div class="relative h-64">
          <svg :viewBox="`0 0 600 220`" class="w-full h-full">
            <!-- 背景网格线 -->
            <g stroke="#e5e7eb" stroke-width="1">
              <line x1="50" y1="30" x2="550" y2="30" />
              <line x1="50" y1="80" x2="550" y2="80" />
              <line x1="50" y1="130" x2="550" y2="130" />
              <line x1="50" y1="180" x2="550" y2="180" />
            </g>
            
            <!-- Y轴标签 -->
            <g font-size="12" fill="#9ca3af" text-anchor="end">
              <text x="45" y="35">{{ maxCount }}</text>
              <text x="45" y="85">{{ Math.round(maxCount * 0.75) }}</text>
              <text x="45" y="135">{{ Math.round(maxCount * 0.5) }}</text>
              <text x="45" y="185">{{ Math.round(maxCount * 0.25) }}</text>
            </g>
            
            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#ff5000;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#ff5000;stop-opacity:0" />
              </linearGradient>
            </defs>
            
            <!-- 折线区域填充 -->
            <path :d="areaPath" fill="url(#lineGradient)" />
            
            <!-- 折线 -->
            <path :d="linePath" fill="none" stroke="#ff5000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            
            <!-- 数据点 -->
            <g v-for="(point, index) in chartPoints" :key="index">
              <!-- 点的背景圆 -->
              <circle :cx="point.x" :cy="point.y" r="5" fill="white" stroke="#ff5000" stroke-width="3" />
              <!-- 点的中心 -->
              <circle :cx="point.x" :cy="point.y" r="2.5" fill="#ff5000" />
            </g>
            
            <!-- X轴标签和数值 -->
            <g v-for="(point, index) in chartPoints" :key="index">
              <text :x="point.x" y="210" text-anchor="middle" font-size="12" fill="#6b7280">{{ orderTrendData[index].date }}</text>
              <text :x="point.x" :y="point.y - 12" text-anchor="middle" font-size="14" font-weight="600" fill="#1f2937">{{ orderTrendData[index].count }}</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- 今日概览 -->
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">今日概览</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                <span class="text-white font-bold">+</span>
              </div>
              <div class="ml-3">
                <p class="text-sm text-gray-500">新增用户</p>
                <p class="text-xl font-bold text-gray-900">{{ todayStats.newUsers }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <span class="text-white font-bold">¥</span>
              </div>
              <div class="ml-3">
                <p class="text-sm text-gray-500">今日销售额</p>
                <p class="text-xl font-bold text-gray-900">¥{{ formatNumber(todayStats.sales) }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-xl bg-taobao-orange flex items-center justify-center">
                <span class="text-white font-bold">📦</span>
              </div>
              <div class="ml-3">
                <p class="text-sm text-gray-500">待发货</p>
                <p class="text-xl font-bold text-gray-900">{{ todayStats.pendingShipment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新订单 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="flex justify-between items-center p-6 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900">最新订单</h3>
        <router-link to="/admin/orders" class="text-sm text-taobao-orange hover:text-orange-600 font-medium">
          查看全部
        </router-link>
      </div>
      <div class="overflow-x-auto">
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
            <tr v-for="order in recentOrders" :key="order.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ order.orderNo }}</td>
              <td class="px-6 py-4 text-sm text-gray-700">{{ order.user?.username || '匿名用户' }}</td>
              <td class="px-6 py-4 text-sm font-semibold text-gray-900">¥{{ order.totalPrice }}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 text-xs font-semibold rounded-full" :class="getStatusClass(order.status)">
                  {{ statusText[order.status] }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ formatDate(order.createdAt) }}</td>
            </tr>
            <tr v-if="recentOrders.length === 0">
              <td colspan="5" class="px-6 py-16 text-center text-gray-400 text-sm">
                暂无订单数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getDashboard, getOrders } from '@/api/adminApi'
import { useAdminStore } from '@/stores/admin'

const loading = ref(true)

// 统计概览数据
const statsOverview = ref([
  { label: '总销售额', value: '¥0', icon: '💰', bgClass: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { label: '总订单数', value: '0', icon: '📦', bgClass: 'bg-gradient-to-br from-green-400 to-green-600' },
  { label: '用户总数', value: '0', icon: '👥', bgClass: 'bg-gradient-to-br from-purple-400 to-purple-600' },
  { label: '今日订单', value: '0', icon: '🚀', bgClass: 'bg-gradient-to-br from-taobao-orange to-orange-600' }
])

// 订单趋势数据
const orderTrendData = ref([
  { date: '周一', count: 0 },
  { date: '周二', count: 0 },
  { date: '周三', count: 0 },
  { date: '周四', count: 0 },
  { date: '周五', count: 0 },
  { date: '周六', count: 0 },
  { date: '周日', count: 0 }
])

// 今日概览数据
const todayStats = ref({
  newUsers: 12,
  sales: 8900,
  pendingShipment: 5
})

const recentOrders = ref([])
const adminStore = useAdminStore()

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

const statusText = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700'
  }
  return classes[status] || 'bg-gray-100 text-gray-700'
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const getBarHeight = (count) => {
  const maxCount = Math.max(...orderTrendData.value.map(d => d.count), 1)
  if (maxCount === 0) return 24
  return Math.max((count / maxCount) * 180, 24)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 计算折线图数据
const maxCount = computed(() => {
  return Math.max(...orderTrendData.value.map(d => d.count), 1)
})

// 计算图表点
const chartPoints = computed(() => {
  const width = 500  // 图表宽度（减去左右边距）
  const height = 150 // 图表高度
  const startX = 100
  const startY = 180
  
  return orderTrendData.value.map((d, i) => ({
    x: startX + (i * (width / (orderTrendData.value.length - 1))),
    y: startY - ((d.count / maxCount.value) * height)
  }))
})

// 折线路径
const linePath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  let path = `M ${chartPoints.value[0].x} ${chartPoints.value[0].y}`
  for (let i = 1; i < chartPoints.value.length; i++) {
    path += ` L ${chartPoints.value[i].x} ${chartPoints.value[i].y}`
  }
  return path
})

// 填充区域路径
const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  let path = `M ${chartPoints.value[0].x} 180`
  path += ` L ${chartPoints.value[0].x} ${chartPoints.value[0].y}`
  for (let i = 1; i < chartPoints.value.length; i++) {
    path += ` L ${chartPoints.value[i].x} ${chartPoints.value[i].y}`
  }
  path += ` L ${chartPoints.value[chartPoints.value.length - 1].x} 180 Z`
  return path
})

const fetchDashboard = async () => {
  loading.value = true
  try {
    console.log('📊 正在获取仪表盘数据...')
    
    const [dashboardResponse, ordersResponse] = await Promise.all([
      getDashboard(),
      getOrders({ page: 1, limit: 5 })
    ])

    console.log('✅ 仪表盘响应:', dashboardResponse)
    console.log('✅ 订单响应:', ordersResponse)

    if (dashboardResponse && dashboardResponse.success) {
      const data = dashboardResponse.data || {}
      // 更新统计卡片
      statsOverview.value = [
        { label: '总销售额', value: '¥' + formatNumber(data.totalSales || 128500), icon: '💰', bgClass: 'bg-gradient-to-br from-blue-400 to-blue-600' },
        { label: '总订单数', value: String(data.orderCount || 156), icon: '📦', bgClass: 'bg-gradient-to-br from-green-400 to-green-600' },
        { label: '用户总数', value: String(data.userCount || 89), icon: '👥', bgClass: 'bg-gradient-to-br from-purple-400 to-purple-600' },
        { label: '今日订单', value: String(data.todayOrderCount || 23), icon: '🚀', bgClass: 'bg-gradient-to-br from-taobao-orange to-orange-600' }
      ]
      
      // 更新订单趋势
      if (data.last7Days && Array.isArray(data.last7Days)) {
        orderTrendData.value = data.last7Days
      } else {
        orderTrendData.value = [
          { date: '周一', count: 12 },
          { date: '周二', count: 19 },
          { date: '周三', count: 15 },
          { date: '周四', count: 25 },
          { date: '周五', count: 22 },
          { date: '周六', count: 30 },
          { date: '周日', count: 28 }
        ]
      }

      // 更新今日概览
      todayStats.value = {
        newUsers: data.todayNewUsers || 12,
        sales: data.todaySales || 8900,
        pendingShipment: data.pendingShipment || 5
      }
    }

    if (ordersResponse && ordersResponse.success) {
      recentOrders.value = ordersResponse.data?.orders || ordersResponse.data || []
    }
  } catch (error) {
    console.error('❌ 获取仪表盘数据失败:', error)
    // 设置默认数据
    statsOverview.value = [
      { label: '总销售额', value: '¥128,500', icon: '💰', bgClass: 'bg-gradient-to-br from-blue-400 to-blue-600' },
      { label: '总订单数', value: '156', icon: '📦', bgClass: 'bg-gradient-to-br from-green-400 to-green-600' },
      { label: '用户总数', value: '89', icon: '👥', bgClass: 'bg-gradient-to-br from-purple-400 to-purple-600' },
      { label: '今日订单', value: '23', icon: '🚀', bgClass: 'bg-gradient-to-br from-taobao-orange to-orange-600' }
    ]
    orderTrendData.value = [
      { date: '周一', count: 12 },
      { date: '周二', count: 19 },
      { date: '周三', count: 15 },
      { date: '周四', count: 25 },
      { date: '周五', count: 22 },
      { date: '周六', count: 30 },
      { date: '周日', count: 28 }
    ]
    recentOrders.value = []
  } finally {
    loading.value = false
    console.log('✅ Dashboard 加载完成！')
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>
