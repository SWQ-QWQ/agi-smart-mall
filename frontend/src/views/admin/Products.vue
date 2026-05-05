<template>
  <div class="space-y-6">
    <!-- 页面标题和操作栏 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">商品管理</h2>
        <p class="text-sm text-gray-500 mt-1">管理平台所有商品信息</p>
      </div>
      <!-- 批量操作栏 -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div v-if="selectedProductIds.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-gray-500">已选择 {{ selectedProductIds.length }} 个商品</span>
          <button
            @click="handleBatchAction('active')"
            class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all"
          >
            批量上架
          </button>
          <button
            @click="handleBatchAction('inactive')"
            class="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
          >
            批量下架
          </button>
          <button
            @click="selectedProductIds = []"
            class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
          >
            取消选择
          </button>
        </div>
        <button
          @click="openModal('create')"
          class="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm"
        >
          <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加商品
        </button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- 搜索框 -->
        <div class="flex-1 relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索商品名称..."
            class="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
            @keyup.enter="handleSearch"
          />
        </div>
        
        <!-- 分类筛选 -->
        <select
          v-model="filterCategory"
          @change="handleSearch"
          class="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-sm min-w-[140px]"
        >
          <option value="">全部分类</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>

        <!-- 价格区间筛选 -->
        <div class="flex items-center gap-2">
          <input
            v-model.number="filterMinPrice"
            type="number"
            step="0.01"
            placeholder="最低价"
            class="w-24 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
          />
          <span class="text-gray-400">-</span>
          <input
            v-model.number="filterMaxPrice"
            type="number"
            step="0.01"
            placeholder="最高价"
            class="w-24 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
          />
        </div>

        <!-- 搜索按钮 -->
        <button
          @click="handleSearch"
          class="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all text-sm whitespace-nowrap"
        >
          搜索
        </button>
      </div>
    </div>

    <!-- 商品表格 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gradient-to-r from-slate-800 to-slate-700">
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                <input
                  type="checkbox"
                  v-model="selectAll"
                  @change="handleSelectAll"
                  class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">ID</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">商品信息</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">分类</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">价格</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">库存</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">状态</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(product, index) in products"
              :key="product.id"
              class="transition-colors duration-200"
              :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  :value="product.id"
                  v-model="selectedProductIds"
                  class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">#{{ product.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mr-3 overflow-hidden flex-shrink-0">
                    <img v-if="product.image" :src="product.image" class="w-full h-full object-cover" :alt="product.title" />
                    <svg v-else class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <span class="text-sm font-medium text-gray-900 block truncate">{{ product.title }}</span>
                    <p v-if="product.description" class="text-xs text-gray-400 truncate max-w-[200px]">{{ product.description }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {{ product.category?.name || '-' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-bold text-orange-600">¥{{ product.price }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span
                    :class="product.stock < 10 ? 'text-red-600 bg-red-50' : 'text-gray-700'"
                    class="px-2.5 py-1 rounded-lg text-sm font-medium inline-flex items-center"
                  >
                    <span v-if="product.stock < 10" class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                    {{ product.stock }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-green-100 text-green-700 border border-green-200': product.status === 'active',
                    'bg-yellow-100 text-yellow-700 border border-yellow-200': product.status === 'inactive'
                  }"
                  class="px-3 py-1 text-xs font-semibold rounded-full"
                >
                  {{ statusText[product.status] || '未知' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <button
                    @click="openProductDetail(product)"
                    class="px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-500 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-300 hover:border-blue-500"
                  >
                    详情
                  </button>
                  <button
                    @click="openModal('edit', product)"
                    class="px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-500 rounded-lg transition-all duration-200 text-xs font-medium border border-blue-300 hover:border-blue-500"
                  >
                    编辑
                  </button>
                  <button
                    @click="handleDelete(product)"
                    class="px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-500 rounded-lg transition-all duration-200 text-xs font-medium border border-red-300 hover:border-red-500"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- 空状态 -->
            <tr v-if="products.length === 0">
              <td colspan="8" class="px-6 py-16 text-center">
                <svg class="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p class="text-gray-400 text-sm">暂无商品数据</p>
                <p class="text-gray-300 text-xs mt-1">点击"添加商品"创建新商品</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页栏 -->
      <div class="px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-t border-gray-100 bg-gray-50/50">
        <div class="text-sm text-gray-500 mb-3 sm:mb-0">
          共 <span class="font-medium text-gray-700">{{ pagination.total }}</span> 条记录
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="changePage(pagination.page - 1)"
            :disabled="pagination.page <= 1"
            class="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors bg-white"
          >
            上一页
          </button>
          
          <!-- 页码按钮 -->
          <div class="hidden sm:flex items-center space-x-1">
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="[
                'w-10 h-10 rounded-xl text-sm font-medium transition-all',
                page === pagination.page
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              ]"
            >
              {{ page }}
            </button>
          </div>
          
          <span class="sm:hidden px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">
            {{ pagination.page }} / {{ totalPages || 1 }}
          </span>
          
          <button
            @click="changePage(pagination.page + 1)"
            :disabled="pagination.page >= totalPages"
            class="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors bg-white"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑商品弹窗 -->
    <Transition name="modal">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
          <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700">
            <h3 class="text-lg font-semibold text-white flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ modalMode === 'create' ? '添加商品' : '编辑商品' }}
            </h3>
          </div>
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">商品名称 <span class="text-red-500">*</span></label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 text-sm"
                placeholder="请输入商品名称"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">商品分类</label>
              <select
                v-model="form.categoryId"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-sm"
              >
                <option value="">请选择分类</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">价格 (¥) <span class="text-red-500">*</span></label>
                <input
                  v-model.number="form.price"
                  type="number"
                  step="0.01"
                  required
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">库存 <span class="text-red-500">*</span></label>
                <input
                  v-model.number="form.stock"
                  type="number"
                  required
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">商品描述</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 resize-none text-sm"
                placeholder="请输入商品描述..."
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                @click="closeModal"
                class="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm disabled:opacity-50"
              >
                {{ submitting ? '保存中...' : '确定保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- 商品详情弹窗 -->
    <Transition name="modal">
      <div
        v-if="showProductDetail"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showProductDetail = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
          <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-white">商品详情</h3>
            <button @click="showProductDetail = false" class="text-gray-300 hover:text-white">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div v-if="selectedProduct" class="p-6">
            <div class="flex items-center mb-6">
              <div class="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center mr-6 overflow-hidden flex-shrink-0">
                <img v-if="selectedProduct.image" :src="selectedProduct.image" class="w-full h-full object-cover" :alt="selectedProduct.title" />
                <svg v-else class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 class="text-xl font-bold text-gray-900">{{ selectedProduct.title }}</h4>
                <p class="text-sm text-gray-500 mt-1">
                  <span class="px-2 py-1 rounded-full mr-2" :class="selectedProduct.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                    {{ statusText[selectedProduct.status] }}
                  </span>
                  <span class="text-xl font-bold text-orange-600">¥{{ selectedProduct.price }}</span>
                </p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">分类</label>
                <p class="text-sm text-gray-900 mt-1">{{ selectedProduct.category?.name || '-' }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">库存</label>
                <p class="text-sm text-gray-900 mt-1">{{ selectedProduct.stock }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">创建时间</label>
                <p class="text-sm text-gray-900 mt-1">{{ formatDate(selectedProduct.createdAt) }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">商品ID</label>
                <p class="text-sm text-gray-900 mt-1">#{{ selectedProduct.id }}</p>
              </div>
            </div>
            
            <div class="mb-6">
              <label class="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-2">商品描述</label>
              <p class="text-sm text-gray-700">{{ selectedProduct.description || '暂无描述' }}</p>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button
                @click="showProductDetail = false"
                class="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                关闭
              </button>
              <button
                @click="openModal('edit', selectedProduct); showProductDetail = false"
                class="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/30 text-white rounded-xl transition-all font-medium text-sm"
              >
                编辑商品
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getCategories, 
  batchUpdateProductsStatus 
} from '@/api/adminApi'
import { toast } from '@/utils/toast'

const products = ref([])
const categories = ref([])
const showModal = ref(false)
const showProductDetail = ref(false)
const modalMode = ref('create')
const editingProduct = ref(null)
const selectedProduct = ref(null)
const searchKeyword = ref('')
const filterCategory = ref('')
const filterMinPrice = ref(null)
const filterMaxPrice = ref(null)
const submitting = ref(false)
const selectedProductIds = ref([])
const selectAll = ref(false)

const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
})

const form = ref({
  title: '',
  categoryId: '',
  price: 0,
  stock: 0,
  description: ''
})

const statusText = {
  active: '上架中',
  inactive: '已下架'
}

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit) || 1)

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = pagination.value.page
  
  let start = Math.max(1, current - 2)
  let end = Math.min(total, current + 2)
  
  if (end - start < 4) {
    if (start === 1) {
      end = Math.min(total, start + 4)
    } else if (end === total) {
      start = Math.max(1, end - 4)
    }
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const fetchProducts = async () => {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (filterCategory.value) {
      params.categoryId = filterCategory.value
    }
    if (filterMinPrice.value) {
      params.minPrice = filterMinPrice.value
    }
    if (filterMaxPrice.value) {
      params.maxPrice = filterMaxPrice.value
    }
    const response = await getProducts(params)
    if (response.success) {
      products.value = response.data.products || response.data
      pagination.value.total = response.data.total || products.value.length
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    toast.error('获取商品列表失败')
  }
}

const fetchCategories = async () => {
  try {
    const response = await getCategories()
    if (response.success) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchProducts()
}

const handleSelectAll = () => {
  if (selectAll.value) {
    selectedProductIds.value = products.value.map(p => p.id)
  } else {
    selectedProductIds.value = []
  }
}

const openModal = (mode, product = null) => {
  modalMode.value = mode
  if (mode === 'edit' && product) {
    editingProduct.value = product
    form.value = {
      title: product.title,
      categoryId: product.categoryId || product.category_id,
      price: product.price,
      stock: product.stock,
      description: product.description || ''
    }
  } else {
    editingProduct.value = null
    form.value = { title: '', categoryId: '', price: 0, stock: 0, description: '' }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const openProductDetail = (product) => {
  selectedProduct.value = product
  showProductDetail.value = true
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (modalMode.value === 'create') {
      await createProduct(form.value)
      toast.success('商品添加成功')
    } else {
      await updateProduct(editingProduct.value.id, form.value)
      toast.success('商品更新成功')
    }
    closeModal()
    fetchProducts()
  } catch (error) {
    console.error('保存商品失败:', error)
    toast.error('保存商品失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (product) => {
  if (!confirm(`确定要删除商品"${product.title}"吗？`)) return
  
  try {
    await deleteProduct(product.id)
    toast.success('商品删除成功')
    fetchProducts()
  } catch (error) {
    console.error('删除商品失败:', error)
    toast.error('删除商品失败')
  }
}

const handleBatchAction = async (status) => {
  try {
    await batchUpdateProductsStatus({ ids: selectedProductIds.value, status })
    toast.success('批量更新成功')
    selectedProductIds.value = []
    selectAll.value = false
    await fetchProducts()
  } catch (error) {
    console.error('批量更新失败:', error)
    toast.error('批量更新失败')
  }
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  pagination.value.page = newPage
  fetchProducts()
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
