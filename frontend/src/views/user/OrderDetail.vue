<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="mb-6">
        <button @click="$router.back()" class="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          返回
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-12">
        <p class="text-gray-500">加载中...</p>
      </div>
      <div v-else-if="order" class="bg-white rounded-xl shadow overflow-hidden">
        <!-- Order Header -->
        <div class="p-6 border-b">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-gray-500 text-sm">订单号</p>
              <p class="font-mono font-semibold">{{ order.order_no }}</p>
            </div>
            <span
              :class="[
                'px-4 py-2 rounded-full font-medium',
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
        </div>

        <!-- Shipping Address -->
        <div class="p-6 border-b">
          <h3 class="font-bold mb-3">收货地址</h3>
          <p class="text-gray-800">
            {{ order.shippingAddress?.receiver_name }} <span class="text-gray-500">{{ order.shippingAddress?.phone }}</span>
          </p>
          <p class="text-gray-500">
            {{ order.shippingAddress?.province }}{{ order.shippingAddress?.city }}{{ order.shippingAddress?.district }}{{ order.shippingAddress?.detail }}
          </p>
        </div>

        <!-- Order Items -->
        <div class="p-6 border-b">
          <h3 class="font-bold mb-4">商品清单</h3>
          <div class="space-y-4">
            <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img v-if="item.product?.image" :src="item.product.image" :alt="item.product?.title" class="w-full h-full object-cover" />
                <span v-else class="text-2xl">🛍️</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">{{ item.product?.title }}</h3>
                <p class="text-gray-500">¥{{ item.price }} x {{ item.quantity }}</p>
              </div>
              <p class="text-gray-800 font-semibold">¥{{ item.subtotal }}</p>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="p-6 border-b">
          <div class="flex justify-between mb-2">
            <span class="text-gray-500">商品总额</span>
            <span>¥{{ order.total_price }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">实付金额</span>
            <span class="text-red-500 font-bold text-lg">¥{{ order.total_price }}</span>
          </div>
        </div>

        <!-- Order Info -->
        <div class="p-6">
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">下单时间</span>
              <span>{{ formatTime(getCreatedAt(order)) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="order.status === 'pending' || order.status === 'paid'" class="p-6 border-t bg-gray-50">
          <div class="flex gap-3">
            <button
              v-if="order.status === 'pending'"
              @click="goToPayment"
              class="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-colors shadow-lg"
            >
              立即支付
            </button>
            <button
              v-if="order.status === 'paid'"
              @click="cancelOrder"
              class="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              取消订单
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderDetail, cancelOrder as cancelOrderApi } from '@/api/orderApi'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const isLoading = ref(true)

const formatTime = (dateValue) => {
  if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) return '未知时间'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return '未知时间'
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (e) {
    return '未知时间'
  }
}

const getCreatedAt = (order) => {
  return order.createdAt || order.created_at
}

const statusText = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

const fetchOrderDetail = async () => {
  try {
    const response = await getOrderDetail(route.params.id)
    if (response.success) {
      order.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch order detail:', error)
  } finally {
    isLoading.value = false
  }
}

const cancelOrder = async () => {
  if (confirm('确定要取消这个订单吗？')) {
    try {
      const response = await cancelOrderApi(order.value.id)
      if (response.success) {
        alert('订单已取消')
        await fetchOrderDetail()
      }
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert('取消订单失败')
    }
  }
}

const goToPayment = () => {
  router.push(`/payment/${order.value.id}`)
}

onMounted(() => {
  fetchOrderDetail()
})
</script>
