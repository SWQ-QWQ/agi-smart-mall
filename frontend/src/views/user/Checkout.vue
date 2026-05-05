<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold mb-8">确认订单</h1>

      <div class="space-y-6">
        <!-- Address -->
        <div class="bg-white rounded-xl shadow p-6">
          <h2 class="text-xl font-bold mb-4">收货地址</h2>
          <div v-if="addresses.length > 0" class="space-y-3">
            <div
              v-for="addr in addresses"
              :key="addr.id"
              @click="selectedAddress = addr"
              :class="[
                'border rounded-xl p-4 cursor-pointer transition-all',
                selectedAddress?.id === addr.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold">
                    {{ addr.receiver_name }} <span class="text-gray-500 ml-2">{{ addr.phone }}</span>
                    <span v-if="addr.is_default" class="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">默认</span>
                  </p>
                  <p class="text-gray-500">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 text-center py-8">
            暂无收货地址，请先添加
          </div>
          <router-link to="addresses" class="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            管理收货地址
          </router-link>
        </div>

        <!-- Order Summary -->
        <div class="bg-white rounded-xl shadow p-6">
          <h2 class="text-xl font-bold mb-4">订单商品</h2>
          <div class="space-y-4">
            <div v-for="item in selectedItems" :key="item.id" class="flex items-center gap-4">
              <div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">🛍️</span>
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">{{ item.product?.title }}</h3>
                <p class="text-gray-500 text-sm">¥{{ item.product?.price }} x {{ item.quantity }}</p>
              </div>
              <p class="text-red-500 font-bold">¥{{ (item.product?.price || 0) * item.quantity }}</p>
            </div>
          </div>
          <div class="border-t mt-6 pt-4 flex items-center justify-between">
            <span class="text-gray-700">订单总额</span>
            <span class="text-red-500 text-2xl font-bold">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Submit -->
        <button
          @click="submitOrder"
          :disabled="!selectedAddress || selectedItems.length === 0 || isSubmitting"
          class="w-full bg-red-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? '提交中...' : '提交订单' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { getAddresses } from '@/api/addressApi'
import { createOrder } from '@/api/orderApi'

const router = useRouter()
const cartStore = useCartStore()

const addresses = ref([])
const selectedAddress = ref(null)
const isSubmitting = ref(false)

const selectedItems = computed(() => cartStore.selectedItems)
const totalPrice = computed(() => cartStore.selectedTotalPrice)

const fetchAddresses = async () => {
  try {
    const response = await getAddresses()
    if (response.success) {
      addresses.value = response.data
      selectedAddress.value = addresses.value.find(a => a.is_default) || addresses.value[0]
    }
  } catch (error) {
    console.error('Failed to fetch addresses:', error)
  }
}

const submitOrder = async () => {
    if (!selectedAddress.value) {
      alert('请选择收货地址')
      return
    }

    isSubmitting.value = true
    try {
      const response = await createOrder({
        addressId: selectedAddress.value.id
      })
      if (response.success) {
        await cartStore.fetchCart()
        router.push(`/payment/${response.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('创建订单失败')
    } finally {
      isSubmitting.value = false
    }
  }

onMounted(() => {
  cartStore.fetchCart()
  fetchAddresses()
})
</script>
