<template>
  <div class="min-h-screen pb-20">
    <div class="max-w-5xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-xl font-bold text-gray-800">购物车</h1>
      </div>

      <div v-if="isLoading" class="text-center py-16">
        <p class="text-gray-500">加载中...</p>
      </div>
      <div v-else-if="cartStore.items.length > 0">
        <!-- Select All & Actions -->
        <div class="bg-white py-3 px-4 flex items-center justify-between mb-3 rounded-lg">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="allSelected" @change="toggleAll" class="w-4 h-4 text-taobao-orange rounded">
            <span class="text-sm text-gray-700">全选</span>
          </label>
          <button @click="removeSelected" class="text-sm text-gray-500 hover:text-taobao-red transition-colors">删除选中</button>
        </div>

        <!-- Cart Items -->
        <div class="space-y-3">
          <div v-for="item in cartStore.items" :key="item.id" class="bg-white rounded-lg p-4">
            <div class="flex items-center gap-4">
              <input
                type="checkbox"
                v-model="item.selected"
                @change="updateSelection(item)"
                class="w-4 h-4 text-taobao-orange rounded"
              >
              <div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img v-if="item.product?.image" :src="item.product.image" class="w-full h-full object-cover" />
                <span v-else class="text-3xl">🛍️</span>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-800 line-clamp-2">{{ item.product?.title || '商品' }}</h3>
                <p class="text-xs text-gray-400 mt-1">¥{{ item.product?.price }} × {{ item.quantity }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  @click="updateQuantity(item, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  class="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 disabled:opacity-50 hover:border-taobao-orange transition-colors"
                >
                  -
                </button>
                <span class="w-8 text-center text-sm">{{ item.quantity }}</span>
                <button
                  @click="updateQuantity(item, item.quantity + 1)"
                  :disabled="item.quantity >= (item.product?.stock || 1)"
                  class="w-7 h-7 border border-gray-300 rounded flex items-center justify-center text-gray-600 disabled:opacity-50 hover:border-taobao-orange transition-colors"
                >
                  +
                </button>
              </div>
              <p class="text-base font-bold text-taobao-red w-20 text-right">¥{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }}</p>
              <button @click="removeItem(item)" class="text-gray-400 hover:text-taobao-red transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
          <div class="max-w-5xl mx-auto flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="allSelected" @change="toggleAll" class="w-4 h-4 text-taobao-orange rounded">
              <span class="text-sm text-gray-700">全选</span>
            </label>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <p class="text-sm text-gray-500">合计：</p>
                <p class="text-xl font-bold text-taobao-red">¥{{ cartStore.selectedTotalPrice.toFixed(2) }}</p>
              </div>
              <button
                @click="checkout"
                :disabled="cartStore.selectedItems.length === 0"
                class="px-8 py-3 bg-taobao-orange text-white font-bold rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                去结算({{ cartStore.selectedItems.length }})
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-20 bg-white rounded-lg">
        <div class="text-6xl mb-4">🛒</div>
        <p class="text-gray-500 mb-6">购物车是空的</p>
        <router-link to="/products" class="inline-block px-8 py-2.5 bg-taobao-orange text-white font-bold rounded-full hover:bg-orange-600 transition-colors">
          去购物
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const isLoading = ref(true)

const allSelected = ref(false)

const toggleAll = () => {
  cartStore.toggleAllSelection(allSelected.value)
}

const updateSelection = (item) => {
  cartStore.toggleSelection(item.id, item.selected)
}

const updateQuantity = async (item, newQuantity) => {
  if (newQuantity < 1 || newQuantity > (item.product?.stock || 1)) return
  await cartStore.updateQuantity(item.id, newQuantity)
}

const removeItem = async (item) => {
  if (confirm('确定要删除这件商品吗？')) {
    await cartStore.removeFromCart(item.id)
  }
}

const removeSelected = async () => {
  if (confirm('确定要删除选中的商品吗？')) {
    for (const item of cartStore.selectedItems) {
      await cartStore.removeFromCart(item.id)
    }
  }
}

const checkout = () => {
  if (!userStore.isAuthenticated) {
    router.push('/login')
    return
  }
  router.push('/checkout')
}

onMounted(async () => {
  if (userStore.isAuthenticated) {
    await cartStore.fetchCart()
  }
  isLoading.value = false
})
</script>
