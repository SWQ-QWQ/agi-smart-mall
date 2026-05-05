<template>
  <div class="space-y-6">
    <!-- 页面标题和操作栏 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">订单管理</h2>
        <p class="text-sm text-gray-500 mt-1">管理平台所有订单</p>
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
            placeholder="搜索订单号或用户名..."
            class="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
            @keyup.enter="handleSearch"
          />
        </div>
        
        <!-- 状态筛选 -->
        <select
          v-model="filterStatus"
          @change="handleSearch"
          class="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-sm min-w-[140px]"
        >
          <option value="">全部状态</option>
          <option value="pending">待付款</option>
          <option value="paid">已付款</option>
          <option value="shipped">已发货</option>
          <option value="completed">已完成</option>
          <option value="cancelled">已取消</option>
        </select>

        <!-- 搜索按钮 -->
        <button
          @click="handleSearch"
          class="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all text-sm whitespace-nowrap"
        >
          搜索
        </button>
      </div>
    </div>

    <!-- 订单表格 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gradient-to-r from-slate-800 to-slate-700">
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">订单号</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">用户</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">商品</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">金额</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">状态</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">时间</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(order, index) in orders"
              :key="order.id"
              class="transition-colors duration-200"
              :class="index % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50/50 hover:bg-orange-50'"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2.5 py-1.5 rounded-lg">#{{ order.orderNo }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex items-center">
                  <div class="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                    {{ (order.user?.username || '匿').charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <span class="text-sm font-medium text-gray-900 block">{{ order.user?.username || '匿名用户' }}</span>
                    <p class="text-xs text-gray-400">{{ order.user?.email || '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <span class="font-medium">{{ order.items?.length || 0 }}</span> 件
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                ¥{{ formatPrice(order.totalPrice) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-yellow-100 text-yellow-800 border border-yellow-200': order.status === 'pending',
                    'bg-blue-100 text-blue-800 border border-blue-200': order.status === 'paid',
                    'bg-purple-100 text-purple-800 border border-purple-200': order.status === 'shipped',
                    'bg-green-100 text-green-800 border border-green-200': order.status === 'completed',
                    'bg-gray-100 text-gray-800 border border-gray-200': order.status === 'cancelled'
                  }"
                  class="px-3 py-1 text-xs font-semibold rounded-full"
                >
                  {{ statusText[order.status] }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(order.createdAt) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center space-x-2">
                  <button
                    @click="openOrderDetail(order)"
                    class="px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-500 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-300 hover:border-blue-500"
                  >
                    详情
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- 空状态 -->
            <tr v-if="orders.length === 0">
              <td colspan="7" class="px-6 py-16 text-center">
                <svg class="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p class="text-gray-400 text-sm">暂无订单数据</p>
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

    <!-- 订单详情弹窗 -->
    <Transition name="modal">
      <div
        v-if="showDetail"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showDetail = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
          <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-white flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              订单详情
            </h3>
            <button @click="showDetail = false" class="text-gray-300 hover:text-white">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="currentOrder" class="p-6 space-y-5">
            <!-- 基本信息 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">订单号</label>
                <p class="text-sm font-mono font-medium text-gray-900 mt-1">#{{ currentOrder.orderNo }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">订单状态</label>
                <p class="mt-1">
                  <span
                    :class="{
                      'bg-yellow-100 text-yellow-800': currentOrder.status === 'pending',
                      'bg-blue-100 text-blue-800': currentOrder.status === 'paid',
                      'bg-purple-100 text-purple-800': currentOrder.status === 'shipped',
                      'bg-green-100 text-green-800': currentOrder.status === 'completed',
                      'bg-gray-100 text-gray-800': currentOrder.status === 'cancelled'
                    }"
                    class="px-3 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ statusText[currentOrder.status] }}
                  </span>
                </p>
              </div>
            </div>
            
            <!-- 用户信息 -->
            <div class="bg-gray-50 rounded-xl p-4">
              <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">用户信息</label>
              <div class="mt-2 flex items-center">
                <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                  {{ (currentOrder.user?.username || '匿').charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ currentOrder.user?.username || '匿名用户' }}</p>
                  <p class="text-xs text-gray-500">{{ currentOrder.user?.email || '-' }}</p>
                </div>
              </div>
            </div>
            
            <!-- 下单时间 -->
            <div class="bg-gray-50 rounded-xl p-4">
              <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">下单时间</label>
              <p class="text-sm font-medium text-gray-900 mt-1">{{ formatDate(currentOrder.createdAt) }}</p>
            </div>
            
            <!-- 物流单号编辑 -->
            <div class="bg-orange-50 rounded-xl p-4">
              <label class="text-xs text-orange-700 uppercase tracking-wider font-medium">物流信息</label>
              <div class="mt-2 space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">物流单号</label>
                  <input
                    v-model="editForm.trackingNo"
                    type="text"
                    placeholder="请输入物流单号"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">订单状态</label>
                  <select
                    v-model="editForm.status"
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white text-sm"
                  >
                    <option value="pending">待付款</option>
                    <option value="paid">已付款</option>
                    <option value="shipped">已发货</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
                <button
                  @click="handleUpdateOrder"
                  :disabled="updating"
                  class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm disabled:opacity-50"
                >
                  {{ updating ? '保存中...' : '更新订单' }}
                </button>
              </div>
            </div>
            
            <!-- 商品列表 -->
            <div class="border-t border-gray-100 pt-5">
              <p class="text-sm font-medium text-gray-700 mb-4">商品列表</p>
              <div class="space-y-3">
                <div
                  v-for="item in currentOrder.items"
                  :key="item.id"
                  class="flex justify-between items-center bg-gray-50 rounded-xl p-4"
                >
                  <div class="flex items-center">
                    <div class="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mr-4 overflow-hidden flex-shrink-0">
                      <img v-if="item.product?.image" :src="item.product.image" class="w-full h-full object-cover" />
                      <svg v-else class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900">{{ item.product?.title || '商品已下架' }}</p>
                      <p class="text-xs text-gray-500">数量: {{ item.quantity }}</p>
                    </div>
                  </div>
                  <span class="text-sm font-medium text-orange-600">¥{{ formatPrice(item.subtotal) }}</span>
                </div>
              </div>
            </div>
            
            <!-- 订单总价 -->
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 flex justify-between items-center">
              <span class="text-base font-medium text-gray-700">订单总价</span>
              <span class="text-2xl font-bold text-orange-600">¥{{ formatPrice(currentOrder.totalPrice) }}</span>
            </div>
          </div>
          
          <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
            <button
              @click="showDetail = false"
              class="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors font-medium text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrders, getOrderById, updateOrder } from '@/api/adminApi'
import { toast } from '@/utils/toast'

const orders = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const showDetail = ref(false)
const currentOrder = ref(null)
const updating = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
})

const editForm = ref({
  status: '',
  trackingNo: ''
})

const statusText = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
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
  return new Date(date).toLocaleDateString('zh-CN') + ' ' + new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatPrice = (price) => {
  const num = Number(price)
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
}

const fetchOrders = async () => {
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const response = await getOrders(params)
    if (response.success) {
      orders.value = response.data.orders || response.data
      pagination.value.total = response.data.total || orders.value.length
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    toast.error('获取订单列表失败')
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchOrders()
}

const openOrderDetail = async (order) => {
  try {
    const response = await getOrderById(order.id)
    if (response.success) {
      currentOrder.value = response.data
      editForm.value = {
        status: response.data.status,
        trackingNo: response.data.trackingNo || ''
      }
      showDetail.value = true
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    toast.error('获取订单详情失败')
  }
}

const handleUpdateOrder = async () => {
  updating.value = true
  try {
    await updateOrder(currentOrder.value.id, editForm.value)
    toast.success('订单更新成功')
    await fetchOrders()
    showDetail.value = false
  } catch (error) {
    console.error('更新订单失败:', error)
    toast.error('更新订单失败')
  } finally {
    updating.value = false
  }
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  pagination.value.page = newPage
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
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
