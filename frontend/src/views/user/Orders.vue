<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-8">我的订单</h1>

      <!-- Filter -->
      <div class="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-4">
        <span class="text-gray-500">订单状态：</span>
        <button
          v-for="status in statusOptions"
          :key="status.value"
          @click="filterStatus = status.value"
          :class="[
            'px-4 py-1 rounded-full text-sm transition-colors',
            filterStatus === status.value ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          {{ status.label }}
        </button>
      </div>

      <!-- Orders List -->
      <div v-if="isLoading" class="text-center py-12">
        <p class="text-gray-500">加载中...</p>
      </div>
      <div v-else-if="orders.length > 0" class="space-y-4">
        <div v-for="order in filteredOrders" :key="order.id" class="bg-white rounded-xl shadow overflow-hidden">
          <!-- Order Header -->
          <div class="p-4 border-b flex items-center justify-between">
            <div>
              <span class="text-gray-500 text-sm">订单号：</span>
              <span class="font-mono">{{ order.order_no }}</span>
            </div>
            <span
              :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              ]"
            >
              {{ statusText[order.status] }}
            </span>
          </div>

          <!-- Order Items -->
          <div class="p-4 border-b">
            <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4 mb-2">
              <div class="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center flex-shrink-0">
                <span class="text-xl">🛍️</span>
              </div>
              <div class="flex-1">
                <h3 class="text-gray-800">{{ item.product?.title }}</h3>
                <p class="text-gray-500 text-sm">x{{ item.quantity }}</p>
              </div>
            </div>
          </div>

          <!-- Order Footer -->
          <div class="p-4 flex items-center justify-between">
            <div>
              <span class="text-gray-500 text-sm">下单时间：</span>
              <span class="text-gray-700 text-sm">{{ new Date(order.created_at).toLocaleString() }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span>实付 <span class="text-red-500 font-bold text-lg">¥{{ order.total_price }}</span></span>
              <router-link
                :to="`/order/${order.id}`"
                class="text-blue-600 hover:text-blue-700"
              >
                查看详情
              </router-link>
              <router-link
                v-if="order.status === 'pending'"
                :to="`/payment/${order.id}`"
                class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-colors"
              >
                去支付
              </router-link>
              <button
                v-if="order.status === 'paid'"
                @click="cancelOrder(order)"
                class="text-gray-500 hover:text-red-500"
              >
                取消订单
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">📦</div>
        <p class="text-gray-500 mb-6">暂无订单</p>
        <router-link to="/products" class="inline-block bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors">
          去购物
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrders } from '@/api/orderApi'

const orders = ref([])
const filterStatus = ref('')
const isLoading = ref(true)

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待付款' },
  { value: 'paid', label: '已付款' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

const statusText = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

const filteredOrders = computed(() => {
  if (!filterStatus.value) return orders.value
  return orders.value.filter(o => o.status === filterStatus.value)
})

const fetchOrders = async () => {
  try {
    const response = await getOrders()
    if (response.success) {
      orders.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch orders:', error)
  } finally {
    isLoading.value = false
  }
}

const cancelOrder = async (order) => {
  if (confirm('确定要取消这个订单吗？')) {
    try {
      const { cancelOrder } = await import('@/api/orderApi')
      const response = await cancelOrder(order.id)
      if (response.success) {
        alert('订单已取消')
        await fetchOrders()
      }
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert('取消订单失败')
    }
  }
}

onMounted(() => {
  fetchOrders()
})
</script>
