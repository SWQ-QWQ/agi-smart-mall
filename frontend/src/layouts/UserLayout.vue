<template>
  <div class="min-h-screen bg-gray-50">

    <!-- 主导航栏 -->
    <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-nowrap items-center py-1.5 overflow-x-auto scrollbar-hide">
          <router-link to="/" class="flex items-center mr-3 flex-shrink-0">
            <div class="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-xs mr-1">
              智
            </div>
            <span class="text-sm font-bold text-gray-800">智享商城</span>
          </router-link>

          <!-- 顶部横向分类导航（仅非首页显示） -->
          <nav v-if="!isHomePage" class="flex flex-nowrap items-center gap-3 mr-3 flex-shrink-0">
            <template v-for="(cat, index) in categories.slice(0, 5)" :key="index">
              <router-link
                :to="cat.path"
                :class="[
                  'text-sm font-medium transition-colors whitespace-nowrap',
                  (index === 0 && route.path === '/') || (route.query.categoryId == cat.categoryId)
                    ? 'text-orange-500'
                    : 'text-gray-600 hover:text-orange-500'
                ]"
              >
                {{ cat.name }}
              </router-link>
            </template>
            
            <!-- 更多分类下拉 -->
            <div class="relative" ref="moreMenuRef">
              <button
                @click.stop="showMore = !showMore"
                :class="[
                  'text-sm font-medium transition-colors whitespace-nowrap',
                  showMore ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'
                ]"
              >
                {{ showMore ? '收起 ▲' : '更多 ▼' }}
              </button>
              <div
                v-if="showMore"
                class="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-lg py-2 min-w-[140px]"
                @click.stop
              >
                <router-link
                  v-for="(cat, index) in categories.slice(5)"
                  :key="index"
                  :to="cat.path"
                  @click="showMore = false"
                  class="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-all"
                >
                  {{ cat.name }}
                </router-link>
              </div>
            </div>
          </nav>

          <!-- 搜索框（仅非首页显示） -->
          <div v-if="!isHomePage" class="ml-auto flex items-center relative w-[240px] flex-shrink-0">
            <div class="relative flex-1">
              <input
                v-model="searchQuery"
                @keyup.enter="handleSearch"
                @input="handleSearchInput"
                @focus="showSearchHistory = true"
                type="text"
                placeholder="搜索..."
                class="w-full px-3 py-1.5 border-2 border-gray-200 rounded-l-full text-sm focus:border-orange-500 outline-none"
              />
              <div v-if="showSearchHistory && searchSuggestions.length > 0" class="absolute top-full left-0 right-0 bg-white shadow-xl rounded-lg mt-1 z-[100]">
                <div class="p-2">
                  <router-link
                    v-for="item in searchSuggestions.slice(0, 5)"
                    :key="item"
                    :to="{ name: 'Products', query: { keyword: item } }"
                    @click="handleSuggestionClick(item)"
                    class="block px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded"
                  >
                    {{ item }}
                  </router-link>
                </div>
                <div v-if="searchHistoryItems.length > 0" class="border-t border-gray-100 p-2">
                  <p class="text-xs text-gray-400 px-3 py-1">搜索历史</p>
                  <div class="flex flex-wrap gap-2">
                    <router-link
                      v-for="item in searchHistoryItems"
                      :key="item"
                      :to="{ name: 'Products', query: { keyword: item } }"
                      @click="handleSuggestionClick(item)"
                      class="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-orange-50"
                    >
                      {{ item }}
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
            <button
              @click="handleSearch"
              class="bg-orange-500 text-white px-3 py-1.5 rounded-r-full hover:bg-orange-600 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 70 11-14 0 7 70 0114 0z"></path>
              </svg>
            </button>
          </div>
          
          <!-- 右侧功能按钮 -->
          <div class="ml-3 flex items-center gap-3 flex-shrink-0">
            <!-- 用户头像/登录 -->
            <router-link v-if="userStore.isAuthenticated" to="/profile" class="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <div class="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                <img 
                  v-if="getUserAvatar()" 
                  :src="getUserAvatar()" 
                  alt="头像" 
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ userStore.userName?.charAt(0)?.toUpperCase() || 'U' }}</span>
              </div>
              <span class="text-sm text-gray-700">{{ userStore.userName }}</span>
            </router-link>
            <router-link v-else to="/login" class="text-sm text-gray-600 hover:text-orange-500 transition-colors">
              登录
            </router-link>
            
            <!-- 我的订单 -->
            <router-link to="/orders" class="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-500 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>订单</span>
            </router-link>
            
            <!-- 购物车 -->
            <router-link to="/cart" class="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-500 transition-colors relative">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>购物车</span>
              <span v-if="cartStore.totalCount > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-medium">
                {{ cartStore.totalCount > 99 ? '99+' : cartStore.totalCount }}
              </span>
            </router-link>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 flex">
      <!-- 左侧固定分类栏（仅首页显示） -->
      <aside v-if="isHomePage" class="w-48 flex-shrink-0 relative z-[9999]">
        <div class="bg-white rounded-2xl shadow-md sticky top-24">
          <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3">
            <h3 class="font-bold text-lg">商品分类</h3>
          </div>
          <nav class="p-3">
            <ul class="space-y-1">
              <li>
                <router-link
                  :to="{ name: 'Products', query: {} }"
                  :class="[
                    'block w-full text-left px-4 py-3 rounded-xl text-sm transition-all',
                    !selectedCategoryId
                      ? 'bg-orange-100 text-orange-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-orange-500'
                  ]"
                >
                  <span>全部分类</span>
                </router-link>
              </li>
              <li v-for="cat in navCategories" :key="cat.id" class="relative z-[9999]">
                <div
                  :class="[
                    'block w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer',
                    isCategoryActive(cat.id)
                      ? 'bg-orange-100 text-orange-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-orange-500'
                  ]"
                  @mouseenter="handleCategoryEnter(cat.id)"
                  @mouseleave="handleCategoryLeave"
                >
                  <router-link
                    :to="cat.to"
                    class="flex-1"
                  >
                    <span>{{ cat.name }}</span>
                  </router-link>
                  <span v-if="cat.children && cat.children.length > 0" class="text-xs">›</span>
                </div>
                
                <!-- 子分类菜单（向右展开） -->
                <div
                  v-if="cat.children && cat.children.length > 0"
                  v-show="hoverCategoryId === cat.id"
                  class="absolute left-full top-0 bg-white rounded-xl shadow-2xl z-[9999] min-w-[200px] border border-gray-100"
                  style="margin-left: -4px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);"
                  @mouseenter="handleCategoryEnter(cat.id)"
                  @mouseleave="handleCategoryLeave"
                >
                  <div class="p-3">
                    <div class="text-xs text-gray-400 mb-2 pb-2 border-b border-gray-100">{{ cat.name }}</div>
                    <div class="grid grid-cols-2 gap-2">
                      <router-link
                        v-for="subCat in cat.children"
                        :key="subCat.id"
                        :to="{ name: 'Products', query: { categoryId: cat.id } }"
                        class="px-3 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all whitespace-nowrap"
                        @click="hoverCategoryId = null"
                      >
                        {{ subCat.name }}
                      </router-link>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 min-h-[calc(100vh-200px)]" :class="isHomePage ? 'ml-6' : ''">
        <router-view />
      </main>
    </div>

    <div class="fixed right-2.5 top-1/2 -translate-y-1/3 flex flex-col space-y-3 z-30">
      <div class="relative group">
        <button
          @mouseenter="showWechat = true"
          @mouseleave="showWechat = false"
          class="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.036 2.96c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
          </svg>
        </button>
        <Transition name="fade">
          <div
            v-if="showWechat"
            class="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-3 z-50"
          >
            <div class="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span class="text-xs text-gray-400">微信二维码</span>
            </div>
            <p class="text-xs text-gray-500 text-center mt-2">扫码关注公众号</p>
          </div>
        </Transition>
      </div>

      <router-link
        to="/cart"
        class="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors relative"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span v-if="cartStore.totalCount > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
          {{ cartStore.totalCount > 99 ? '99+' : cartStore.totalCount }}
        </span>
      </router-link>

      <button
        v-show="showBackToTop"
        @click="scrollToTop"
        class="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>

    <!-- 底部版权栏 -->
    <footer class="bg-white border-t border-gray-200 mt-12">
      <div class="max-w-7xl mx-auto px-4 py-10">
        <div class="grid grid-cols-5 gap-8">
          <div>
            <h4 class="font-bold text-gray-800 mb-4">关于我们</h4>
            <ul class="text-sm text-gray-600 space-y-2">
              <li><a href="#" class="hover:text-orange-500">公司介绍</a></li>
              <li><a href="#" class="hover:text-orange-500">联系我们</a></li>
              <li><a href="#" class="hover:text-orange-500">招聘信息</a></li>
              <li><a href="#" class="hover:text-orange-500">商家入驻</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-gray-800 mb-4">购物指南</h4>
            <ul class="text-sm text-gray-600 space-y-2">
              <li><a href="#" class="hover:text-orange-500">购物流程</a></li>
              <li><a href="#" class="hover:text-orange-500">会员介绍</a></li>
              <li><a href="#" class="hover:text-orange-500">常见问题</a></li>
              <li><a href="#" class="hover:text-orange-500">联系客服</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-gray-800 mb-4">配送方式</h4>
            <ul class="text-sm text-gray-600 space-y-2">
              <li><a href="#" class="hover:text-orange-500">上门自提</a></li>
              <li><a href="#" class="hover:text-orange-500">211限时达</a></li>
              <li><a href="#" class="hover:text-orange-500">配送服务查询</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-gray-800 mb-4">支付方式</h4>
            <ul class="text-sm text-gray-600 space-y-2">
              <li><a href="#" class="hover:text-orange-500">货到付款</a></li>
              <li><a href="#" class="hover:text-orange-500">在线支付</a></li>
              <li><a href="#" class="hover:text-orange-500">分期付款</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-gray-800 mb-4">售后服务</h4>
            <ul class="text-sm text-gray-600 space-y-2">
              <li><a href="#" class="hover:text-orange-500">售后政策</a></li>
              <li><a href="#" class="hover:text-orange-500">价格保护</a></li>
              <li><a href="#" class="hover:text-orange-500">退款说明</a></li>
            </ul>
          </div>
          <div class="col-span-1 flex flex-col items-center">
            <div class="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <div class="text-center text-gray-500 text-sm">
                <p>扫码关注</p>
                <p>公众号</p>
              </div>
            </div>
            <p class="text-gray-500 text-sm">关注领取优惠</p>
          </div>
        </div>
        <div class="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>© 2026 智享商城 版权所有</p>
          <p class="mt-2">ICP备案号：京ICP备12345678号</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { getProducts } from '@/api/productApi'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()

const searchQuery = ref('')
const showSearchHistory = ref(false)
const showBackToTop = ref(false)
const showWechat = ref(false)
const searchSuggestions = ref([])
const searchHistoryItems = ref([])
const allProductNames = ref([])
const hoverCategoryId = ref(null)
const showMore = ref(false)
const moreMenuRef = ref(null)

const categories = [
  { name: '首页', path: '/' },
  { name: '⏱ 秒杀', path: '/flash-sale' },
  { name: '生活家居', path: '/products?categoryId=1', categoryId: 1 },
  { name: '运动户外', path: '/products?categoryId=2', categoryId: 2 },
  { name: '数码电子', path: '/products?categoryId=3', categoryId: 3 },
  { name: '家用电器', path: '/products?categoryId=4', categoryId: 4 },
  { name: '家具家装', path: '/products?categoryId=5', categoryId: 5 },
  { name: '美妆个护', path: '/products?categoryId=6', categoryId: 6 },
  { name: '餐厨水具', path: '/products?categoryId=7', categoryId: 7 },
  { name: '图书文具', path: '/products?categoryId=8', categoryId: 8 }
]

const isHomePage = computed(() => {
  return route.path === '/'
})

const getUserAvatar = () => {
  const avatar = userStore.userAvatar || localStorage.getItem('userAvatar')
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar
  return `http://localhost:3000${avatar}`
}

const navCategories = [
  {
    id: 1,
    name: '生活家居',
    to: { name: 'Products', query: { categoryId: 1 } },
    children: [
      { id: 11, name: '收纳整理' },
      { id: 12, name: '香薰蜡烛' },
      { id: 13, name: '家居饰品' },
      { id: 14, name: '清洁用品' }
    ]
  },
  {
    id: 2,
    name: '运动户外',
    to: { name: 'Products', query: { categoryId: 2 } },
    children: [
      { id: 21, name: '361°' },
      { id: 22, name: '特步' },
      { id: 23, name: '匹克' },
      { id: 24, name: '安踏' },
      { id: 25, name: '斐乐' },
      { id: 26, name: '李宁' },
      { id: 27, name: '阿迪达斯' },
      { id: 28, name: '耐克' }
    ]
  },
  {
    id: 3,
    name: '数码电子',
    to: { name: 'Products', query: { categoryId: 3 } },
    children: [
      { id: 31, name: '手机数码' },
      { id: 32, name: '电脑办公' },
      { id: 33, name: '智能设备' },
      { id: 34, name: '影音娱乐' }
    ]
  },
  {
    id: 4,
    name: '家用电器',
    to: { name: 'Products', query: { categoryId: 4 } },
    children: [
      { id: 41, name: '大家电' },
      { id: 42, name: '生活电器' },
      { id: 43, name: '厨房电器' },
      { id: 44, name: '个护健康' }
    ]
  },
  {
    id: 5,
    name: '家具家装',
    to: { name: 'Products', query: { categoryId: 5 } },
    children: [
      { id: 51, name: '客厅家具' },
      { id: 52, name: '卧室家具' },
      { id: 53, name: '餐厅家具' },
      { id: 54, name: '灯具灯饰' }
    ]
  },
  {
    id: 6,
    name: '美妆个护',
    to: { name: 'Products', query: { categoryId: 6 } },
    children: [
      { id: 61, name: '面部护肤' },
      { id: 62, name: '彩妆香水' },
      { id: 63, name: '个护清洁' },
      { id: 64, name: '口腔护理' }
    ]
  },
  {
    id: 7,
    name: '餐厨水具',
    to: { name: 'Products', query: { categoryId: 7 } },
    children: [
      { id: 71, name: '餐具厨具' },
      { id: 72, name: '杯壶水具' },
      { id: 73, name: '咖啡茶具' },
      { id: 74, name: '厨房配件' }
    ]
  },
  {
    id: 8,
    name: '图书文具',
    to: { name: 'Products', query: { categoryId: 8 } },
    children: [
      { id: 81, name: '图书' },
      { id: 82, name: '文具' },
      { id: 83, name: '办公用品' },
      { id: 84, name: '数码配件' }
    ]
  }
]

const selectedCategoryId = computed(() => {
  return route.query.categoryId ? parseInt(route.query.categoryId) : null
})

const isCategoryActive = (catId) => {
  return selectedCategoryId.value === catId
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: 'Products', query: { keyword: searchQuery.value.trim() } })
    saveSearchHistory(searchQuery.value.trim())
    showSearchHistory.value = false
  }
}

const handleSearchInput = () => {
  const query = searchQuery.value.toLowerCase().trim()
  if (query.length > 0) {
    searchSuggestions.value = allProductNames.value
      .filter(name => name.toLowerCase().includes(query))
      .slice(0, 8)
  } else {
    searchSuggestions.value = []
  }
}

const handleSuggestionClick = (item) => {
  saveSearchHistory(item)
  showSearchHistory.value = false
}

const saveSearchHistory = (keyword) => {
  let history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
  history = history.filter(item => item !== keyword)
  history.unshift(keyword)
  history = history.slice(0, 10)
  localStorage.setItem('searchHistory', JSON.stringify(history))
  loadSearchHistory()
}

const loadSearchHistory = () => {
  searchHistoryItems.value = JSON.parse(localStorage.getItem('searchHistory') || '[]')
}

const loadProductNames = async () => {
  try {
    const response = await getProducts({ limit: 100 })
    if (response.success && response.data) {
      const products = response.data.products || response.data
      allProductNames.value = products.map(p => p.title)
    }
  } catch (error) {
    console.error('加载商品名称失败', error)
  }
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const updatePageTitle = () => {
  const titles = {
    'Home': '智享商城 - 品质生活',
    'Products': '商品列表 - 智享商城',
    'ProductDetail': '商品详情 - 智享商城',
    'HotProducts': '热门推荐 - 智享商城',
    'Cart': '购物车 - 智享商城',
    'Checkout': '结算 - 智享商城',
    'Payment': '支付 - 智享商城',
    'Orders': '我的订单 - 智享商城',
    'Profile': '个人中心 - 智享商城',
    'Address': '收货地址 - 智享商城',
    'Favorites': '我的收藏 - 智享商城',
    'Login': '登录 - 智享商城',
    'Register': '注册 - 智享商城'
  }
  document.title = titles[route.name] || '智享商城'
}

const handleCategoryEnter = (catId) => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  hoverCategoryId.value = catId
}

let hideTimer = null

const handleCategoryLeave = () => {
  hideTimer = setTimeout(() => {
    hoverCategoryId.value = null
  }, 150)
}

const handleClickOutside = (e) => {
  if (moreMenuRef.value && !moreMenuRef.value.contains(e.target)) {
    showMore.value = false
  }
}

onMounted(() => {
  loadSearchHistory()
  loadProductNames()
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})

watch(() => route.name, () => {
  updatePageTitle()
  showMore.value = false
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>