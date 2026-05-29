<template>
  <div class="bg-gray-50 pb-12">
    <!-- 面包屑导航 -->
    <nav class="mb-6 text-sm">
      <ol class="flex items-center space-x-2 text-gray-500">
        <li>
          <router-link to="/" class="hover:text-orange-500 transition-colors">首页</router-link>
        </li>
        <li class="flex items-center">
          <span class="mx-2">/</span>
          <span v-if="categoryName" class="text-gray-800">{{ categoryName }}</span>
          <span v-else-if="route.query.keyword" class="text-gray-800">搜索：{{ route.query.keyword }}</span>
          <span v-else class="text-gray-800">全部商品</span>
        </li>
      </ol>
    </nav>

    <!-- 排序/筛选栏 -->
    <div class="bg-white rounded-2xl shadow-md mb-6 p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-gray-500 text-sm">排序：</span>
          <button
            v-for="opt in sortOptions"
            :key="opt.value"
            @click="sortBy = opt.value"
            :class="[
              'px-4 py-2 text-sm rounded-lg transition-colors',
              sortBy === opt.value
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="text-gray-500 text-sm">
          共 <span class="text-orange-500 font-bold">{{ allProducts.length }}</span> 件商品
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center py-20">
      <div class="inline-block w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="text-gray-500">加载中...</p>
    </div>

    <!-- 商品网格（每行4个） -->
    <div v-else-if="products.length > 0" class="grid grid-cols-4 gap-4">
      <router-link
        v-for="product in products"
        :key="product.id"
        :to="`/product/${product.id}`"
        class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
      >
        <ProductCard :product="product" />
      </router-link>
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-20 bg-white rounded-2xl shadow-md">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-gray-600 mb-2">暂无相关商品</p>
      <p class="text-gray-400 text-sm mb-6">换个关键词试试吧</p>
      <router-link to="/" class="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors">
        返回首页
      </router-link>
    </div>

    <!-- 分页 -->
    <div v-if="products.length > 0" class="mt-10 flex justify-center">
      <div class="flex items-center space-x-2">
        <button
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
          class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>

        <button
          v-for="pageNum in visiblePages"
          :key="pageNum"
          @click="goToPage(pageNum)"
          :class="[
            'px-4 py-2 rounded-lg text-sm transition-colors',
            currentPage === pageNum
              ? 'bg-orange-500 text-white'
              : 'border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500'
          ]"
        >
          {{ pageNum }}
        </button>

        <button
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
          class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProducts } from '@/api/productApi'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()

const sortBy = ref('default')
const isLoading = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)
const selectedCategoryId = computed(() => {
  return route.query.categoryId ? parseInt(route.query.categoryId) : null
})

const categoryTree = [
  { id: 1, name: '生活家居', children: [
    { id: 11, name: '太力' },
    { id: 12, name: '野兽派' },
    { id: 13, name: '无印良品' },
    { id: 14, name: '飞利浦' },
    { id: 15, name: '宜家' },
    { id: 16, name: 'HAY' },
    { id: 17, name: '吱音' },
    { id: 18, name: '茶花' }
  ]},
  { id: 2, name: '运动户外', children: [
    { id: 21, name: '361°' },
    { id: 22, name: '李宁' },
    { id: 23, name: '安踏' },
    { id: 24, name: '特步' },
    { id: 25, name: '匹克' },
    { id: 26, name: '斐乐' },
    { id: 27, name: 'Nike' },
    { id: 28, name: 'Adidas' }
  ]},
  { id: 3, name: '数码电子', children: [
    { id: 31, name: 'iPhone' },
    { id: 32, name: '华为' },
    { id: 33, name: '索尼' },
    { id: 34, name: '罗技' },
    { id: 35, name: 'Apple' },
    { id: 36, name: 'iPad' },
    { id: 37, name: '罗马仕' }
  ]},
  { id: 4, name: '家用电器', children: [
    { id: 41, name: '海尔' },
    { id: 42, name: '美的' },
    { id: 43, name: '格力' },
    { id: 44, name: '松下' },
    { id: 45, name: '戴森' },
    { id: 46, name: '科沃斯' },
    { id: 47, name: '格兰仕' },
    { id: 48, name: '老板' },
    { id: 49, name: '九阳' }
  ]},
  { id: 5, name: '家具家装', children: [
    { id: 51, name: '顾家家居' },
    { id: 52, name: '慕思' },
    { id: 53, name: '全友家居' },
    { id: 54, name: '曲美家居' },
    { id: 55, name: '宜家' },
    { id: 56, name: '索菲亚' },
    { id: 57, name: '欧普照明' },
    { id: 58, name: '林氏木业' }
  ]},
  { id: 6, name: '美妆个护', children: [
    { id: 61, name: '迪奥' },
    { id: 62, name: '雅诗兰黛' },
    { id: 63, name: '香奈儿' },
    { id: 64, name: 'SK-II' },
    { id: 65, name: 'Tom' },
    { id: 66, name: '兰蔻' },
    { id: 67, name: 'WHOO' },
    { id: 68, name: 'NARS' },
    { id: 69, name: '安耐晒' },
    { id: 70, name: '悦诗风吟' }
  ]},
  { id: 7, name: '餐厨水具', children: [
    { id: 71, name: '双立人' },
    { id: 72, name: '象印' },
    { id: 73, name: '乐扣乐扣' },
    { id: 74, name: '苏泊尔' },
    { id: 75, name: '王麻子' },
    { id: 76, name: '膳魔师' },
    { id: 77, name: '炊大皇' },
    { id: 78, name: '虎牌' }
  ]},
  { id: 8, name: '图书文具', children: [
    { id: 81, name: '三体' },
    { id: 82, name: 'Moleskine' },
    { id: 83, name: 'LAMY' },
    { id: 84, name: '樱花' },
    { id: 85, name: '辉柏嘉' },
    { id: 86, name: '晨光' },
    { id: 87, name: '得力' },
    { id: 88, name: '马可' }
  ]}
]

const categoryNames = {
  1: '生活家居', 2: '运动户外', 3: '数码电子', 4: '家用电器', 5: '家具家装',
  6: '美妆个护', 7: '餐厨水具', 8: '图书文具'
}

const categoryName = computed(() => {
  const catId = parseInt(route.query.categoryId)
  return categoryNames[catId] || null
})

const sortOptions = [
  { label: '综合', value: 'default' },
  { label: '销量优先', value: 'sales' },
  { label: '价格升序', value: 'price-asc' },
  { label: '价格降序', value: 'price-desc' },
  { label: '新品优先', value: 'newest' }
]

const allProducts = ref([])
const brands = ['小米', '华为', '苹果', '三星', '索尼', '耐克', '阿迪达斯']
const promotions = ['满199减20', '满299减50', '包邮', '限时8折']

const enhanceProduct = (product) => {
  const enhanced = { ...product }
  enhanced.brand = brands[Math.floor(Math.random() * brands.length)]
  enhanced.rating = (4.0 + Math.random() * 1.0).toFixed(1)
  enhanced.originalPrice = (product.price * 1.2 + Math.random() * 50).toFixed(2)
  enhanced.is_free_shipping = Math.random() > 0.5
  enhanced.promotion = Math.random() > 0.6 ? promotions[Math.floor(Math.random() * promotions.length)] : null
  return enhanced
}

const totalPages = computed(() => {
  return Math.ceil(allProducts.value.length / pageSize.value) || 1
})

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const products = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allProducts.value.slice(start, end)
})

const fetchProducts = async () => {
  isLoading.value = true
  currentPage.value = 1
  try {
    const params = {}
    
    if (route.query.categoryId) {
      params.categoryId = parseInt(route.query.categoryId)
    }
    
    if (route.query.keyword) {
      params.keyword = route.query.keyword
    }
    
    if (route.query.brand) {
      params.brand = route.query.brand
    }
    
    const response = await getProducts({ ...params, limit: 100 })
    if (response.success) {
      let data = response.data.products || response.data
      allProducts.value = data.map(p => enhanceProduct(p))
      applySorting()
    }
  } catch (error) {
    console.error('加载商品失败', error)
  } finally {
    isLoading.value = false
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const applySorting = () => {
  let sorted = [...allProducts.value]
  
  const keyword = route.query.keyword
  
  sorted.sort((a, b) => {
    let result = 0
    
    if (keyword) {
      const aMatch = a.title?.toLowerCase().includes(keyword.toLowerCase()) ? 0 : 1
      const bMatch = b.title?.toLowerCase().includes(keyword.toLowerCase()) ? 0 : 1
      result = aMatch - bMatch
    }
    
    if (result === 0) {
      if (sortBy.value === 'price-asc') {
        result = a.price - b.price
      } else if (sortBy.value === 'price-desc') {
        result = b.price - a.price
      } else if (sortBy.value === 'sales') {
        result = (b.sales || 0) - (a.sales || 0)
      } else if (sortBy.value === 'newest') {
        result = Math.random() - 0.5
      }
    }
    
    return result
  })
  
  allProducts.value = sorted
}

watch(() => route.query, () => {
  currentPage.value = 1
  fetchProducts()
}, { immediate: true, deep: true })

watch(sortBy, () => {
  currentPage.value = 1
  applySorting()
})
</script>
