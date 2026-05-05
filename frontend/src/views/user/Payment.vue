<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-8">选择支付方式</h1>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-500 mt-4">加载订单信息...</p>
      </div>

      <!-- 错误信息 -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p class="text-red-600">{{ error }}</p>
        <router-link to="/orders" class="text-red-500 hover:text-red-600 mt-2 inline-block">返回订单列表</router-link>
      </div>

      <!-- 订单和支付页面 -->
      <div v-else>
        <!-- 订单信息 -->
        <div class="bg-white rounded-xl shadow p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">订单信息</h2>
          <div class="space-y-3 text-gray-600">
            <div class="flex justify-between">
              <span>订单编号</span>
              <span class="font-mono">{{ order?.order_no || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span>订单金额</span>
              <span class="text-red-500 font-bold text-xl">{{ formatPrice(order?.total_price) }}</span>
            </div>
            <div class="flex justify-between">
              <span>订单状态</span>
              <span class="text-yellow-600">{{ statusText || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 支付方式 -->
        <div class="bg-white rounded-xl shadow p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">支付方式</h2>
          <div class="space-y-3">
            <div
              @click="selectedPayment = 'alipay'"
              :class="[
                'border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4',
                selectedPayment === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                <span class="text-white text-2xl">💳</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">支付宝</h3>
                <p class="text-sm text-gray-500">支持花呗、余额宝、银行卡等</p>
              </div>
              <div :class="[
                'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                selectedPayment === 'alipay' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              ]">
                <svg v-if="selectedPayment === 'alipay'" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div
              @click="selectedPayment = 'wechat'"
              :class="[
                'border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-4',
                selectedPayment === 'wechat' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                <span class="text-white text-2xl">💚</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">微信支付</h3>
                <p class="text-sm text-gray-500">支持微信零钱、银行卡等</p>
              </div>
              <div :class="[
                'w-6 h-6 rounded-full border-2 flex items-center justify-center',
                selectedPayment === 'wechat' ? 'border-green-500 bg-green-500' : 'border-gray-300'
              ]">
                <svg v-if="selectedPayment === 'wechat'" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 支付按钮 -->
        <button
          @click="handlePayment"
          :disabled="!selectedPayment || isLoading || !order"
          class="w-full bg-red-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          <svg v-if="isLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? '支付中...' : `立即支付 ${formatPrice(order?.total_price)}` }}
        </button>

        <!-- 测试支付提示 -->
        <div v-if="showTestTip" class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p class="text-yellow-700 text-sm">
            💡 测试环境提示：点击下方按钮可模拟支付，无需真实支付
          </p>
          <button
            @click="handleTestPayment"
            :disabled="isLoading || !order"
            class="mt-3 w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            模拟支付（测试用）
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getOrderDetail } from '@/api/orderApi'
import { createPayment, testPayment } from '@/api/paymentApi'

const router = useRouter()
const route = useRoute()

const order = ref(null)
const selectedPayment = ref('alipay')
const isLoading = ref(false)
const loading = ref(true)
const error = ref(null)
const showTestTip = ref(true)

const formatPrice = (price) => {
  const num = Number(price)
  if (isNaN(num)) return '¥0.00'
  return `¥${num.toFixed(2)}`
}

const statusText = computed(() => {
  if (!order.value) return ''
  const statusMap = {
    pending: '待付款',
    paid: '已付款',
    shipped: '已发货',
    delivered: '已收货',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return statusMap[order.value.status] || order.value.status
})

const fetchOrder = async () => {
  loading.value = true
  error.value = null
  try {
    const orderId = route.params.id
    console.log('获取订单详情, id:', orderId)
    const response = await getOrderDetail(orderId)
    console.log('订单详情响应:', response)
    if (response.success) {
      order.value = response.data
      if (order.value.status !== 'pending') {
        console.log('订单状态不是待付款，跳转订单列表')
        router.push('/orders')
      }
    } else {
      error.value = response.message || '获取订单信息失败'
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    error.value = '获取订单信息失败，请返回重新尝试'
  } finally {
    loading.value = false
  }
}

const handlePayment = async () => {
  if (!selectedPayment.value || !order.value) {
    return
  }

  isLoading.value = true
  try {
    console.log('创建支付，订单ID:', order.value.id, '支付方式:', selectedPayment.value)
    const response = await createPayment(order.value.id, selectedPayment.value)
    console.log('创建支付响应:', response)
    if (response.success) {
      if (selectedPayment.value === 'alipay') {
        window.location.href = response.data.url
      } else if (selectedPayment.value === 'wechat') {
        alert('微信支付参数已生成，请在微信中完成支付')
        router.push('/orders')
      }
    } else {
      alert(response.message || '支付失败')
    }
  } catch (error) {
    console.error('支付失败:', error)
    alert('支付失败，请稍后重试')
  } finally {
    isLoading.value = false
  }
}

const handleTestPayment = async () => {
  if (!order.value) {
    alert('订单信息不存在')
    return
  }

  isLoading.value = true
  try {
    console.log('模拟支付，订单ID:', order.value.id, '支付方式:', selectedPayment.value)
    const response = await testPayment(order.value.id, selectedPayment.value)
    console.log('模拟支付响应:', response)
    if (response.success) {
      alert('支付成功！')
      router.push('/orders')
    } else {
      alert(response.message || '支付失败')
    }
  } catch (error) {
    console.error('模拟支付失败:', error)
    alert('支付失败，错误详情请查看控制台')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchOrder()
})
</script>
