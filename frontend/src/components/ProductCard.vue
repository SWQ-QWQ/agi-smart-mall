<template>
  <div class="flex flex-col h-full">
    <!-- 图片区域 -->
    <div class="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
      <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
      <span v-else class="text-5xl text-gray-400">🛍️</span>
      <div class="absolute top-2 left-2 flex flex-wrap gap-1">
        <span v-if="product.sales > 100" class="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">热卖</span>
        <span v-if="product.is_free_shipping" class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">包邮</span>
      </div>
      <span v-if="product.promotion" class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
        {{ product.promotion }}
      </span>
    </div>
    
    <!-- 内容区域 -->
    <div class="p-4 flex flex-col flex-1">
      <!-- 品牌 -->
      <div v-if="product.brand" class="mb-2">
        <span class="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-1 rounded">
          {{ product.brand }}
        </span>
      </div>
      
      <!-- 商品名称 -->
      <h3 class="text-sm text-gray-800 line-clamp-2 mb-3 h-10 group-hover:text-orange-500 transition-colors">
        {{ product.title }}
      </h3>
      
      <!-- 评分和销量 -->
      <div class="flex items-center justify-between mb-3">
        <span v-if="product.rating" class="text-sm">
          <span v-for="star in 5" :key="star" :class="star <= Math.floor(Number(product.rating)) ? 'text-yellow-400' : 'text-gray-300'">
            ⭐
          </span>
          {{ product.rating }}
        </span>
        <span class="text-xs text-gray-400">
          已售{{ product.sales || 0 }}件
        </span>
      </div>
      
      <!-- 价格 -->
      <div class="flex items-center justify-between mt-auto">
        <div class="flex items-baseline">
          <span class="text-2xl font-bold text-red-500">¥{{ product.price }}</span>
          <span v-if="product.originalPrice" class="text-sm text-gray-400 line-through ml-2">¥{{ product.originalPrice }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  product: {
    type: Object,
    required: true
  }
})
</script>
