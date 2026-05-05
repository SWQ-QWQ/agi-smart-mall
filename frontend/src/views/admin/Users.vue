<template>
  <div class="space-y-6">
    <!-- 页面标题和操作栏 -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">用户管理</h2>
        <p class="text-sm text-gray-500 mt-1">管理平台所有用户账户</p>
      </div>
      <!-- 批量操作栏 -->
      <div v-if="selectedUserIds.length > 0" class="flex items-center gap-2">
        <span class="text-sm text-gray-500">已选择 {{ selectedUserIds.length }} 个用户</span>
        <button
          @click="handleBatchAction('active')"
          class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all"
        >
          批量启用
        </button>
        <button
          @click="handleBatchAction('banned')"
          class="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all"
        >
          批量封禁
        </button>
        <button
          @click="selectedUserIds = []"
          class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
        >
          取消选择
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
            placeholder="搜索用户名、邮箱..."
            class="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
            @keyup.enter="handleSearch"
          />
        </div>
        
        <!-- 状态筛选 -->
        <select
          v-model="filterStatus"
          @change="fetchUsers"
          class="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white text-sm min-w-[140px]"
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="inactive">未激活</option>
          <option value="banned">已封禁</option>
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

    <!-- 用户表格 -->
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
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">用户信息</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">邮箱</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">角色</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">状态</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">注册时间</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(user, index) in users"
              :key="user.id"
              class="transition-colors duration-200"
              :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  v-if="user.role !== 'admin'"
                  type="checkbox"
                  :value="user.id"
                  v-model="selectedUserIds"
                  class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">#{{ user.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 shadow-sm">
                    {{ user.username?.charAt(0).toUpperCase() || 'U' }}
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-900">{{ user.username }}</span>
                    <p v-if="user.phone" class="text-xs text-gray-400">{{ user.phone }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ user.email || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'"
                  class="px-3 py-1 text-xs font-semibold rounded-full"
                >
                  {{ user.role === 'admin' ? '管理员' : '用户' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-green-100 text-green-700 border border-green-200': user.status === 'active',
                    'bg-yellow-100 text-yellow-700 border border-yellow-200': user.status === 'inactive',
                    'bg-red-100 text-red-700 border border-red-200': user.status === 'banned'
                  }"
                  class="px-3 py-1 text-xs font-semibold rounded-full"
                >
                  {{ statusText[user.status] || '未知' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(user.createdAt) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <button
                    @click="openUserDetail(user)"
                    class="px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-500 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-300 hover:border-blue-500"
                  >
                    详情
                  </button>
                  <button
                    v-if="user.role !== 'admin'"
                    @click="toggleUserStatus(user)"
                    :class="user.status === 'banned' 
                      ? 'text-green-600 hover:text-white hover:bg-green-500 border border-green-300 hover:border-green-500' 
                      : 'text-red-600 hover:text-white hover:bg-red-500 border border-red-300 hover:border-red-500'"
                    class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  >
                    {{ user.status === 'banned' ? '启用' : '封禁' }}
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- 空状态 -->
            <tr v-if="users.length === 0">
              <td colspan="8" class="px-6 py-16 text-center">
                <svg class="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p class="text-gray-400 text-sm">暂无用户数据</p>
                <p class="text-gray-300 text-xs mt-1">尝试调整搜索条件</p>
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

    <!-- 用户详情弹窗 -->
    <Transition name="modal">
      <div
        v-if="showUserDetail"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showUserDetail = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
          <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-white">用户详情</h3>
            <button @click="showUserDetail = false" class="text-gray-300 hover:text-white">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div v-if="selectedUser" class="p-6">
            <div class="flex items-center mb-6">
              <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl font-semibold mr-4 shadow-md">
                {{ selectedUser.username?.charAt(0).toUpperCase() || 'U' }}
              </div>
              <div>
                <h4 class="text-xl font-bold text-gray-900">{{ selectedUser.username }}</h4>
                <p class="text-sm text-gray-500 mt-1">
                  <span class="px-2 py-1 rounded-full mr-2" :class="selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                    {{ selectedUser.role === 'admin' ? '管理员' : '用户' }}
                  </span>
                  <span class="px-2 py-1 rounded-full" :class="{
                    'bg-green-100 text-green-700': selectedUser.status === 'active',
                    'bg-yellow-100 text-yellow-700': selectedUser.status === 'inactive',
                    'bg-red-100 text-red-700': selectedUser.status === 'banned'
                  }">
                    {{ statusText[selectedUser.status] }}
                  </span>
                </p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">邮箱</label>
                <p class="text-sm text-gray-900 mt-1">{{ selectedUser.email || '-' }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">手机</label>
                <p class="text-sm text-gray-900 mt-1">{{ selectedUser.phone || '-' }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">注册时间</label>
                <p class="text-sm text-gray-900 mt-1">{{ formatDate(selectedUser.createdAt) }}</p>
              </div>
              <div class="bg-gray-50 rounded-xl p-4">
                <label class="text-xs text-gray-500 uppercase tracking-wider font-medium">用户ID</label>
                <p class="text-sm text-gray-900 mt-1">#{{ selectedUser.id }}</p>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button
                @click="showUserDetail = false"
                class="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                关闭
              </button>
              <button
                v-if="selectedUser.role !== 'admin'"
                @click="toggleUserStatus(selectedUser); showUserDetail = false"
                :class="selectedUser.status === 'banned' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/30' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30'"
                class="px-5 py-2.5 text-white rounded-xl transition-all font-medium text-sm"
              >
                {{ selectedUser.status === 'banned' ? '启用' : '封禁' }}
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
import { getUsers, toggleUserStatus as apiToggleUserStatus, batchUpdateUsersStatus } from '@/api/adminApi'
import { toast } from '@/utils/toast'

const users = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const loading = ref(false)
const selectedUserIds = ref([])
const selectAll = ref(false)
const showUserDetail = ref(false)
const selectedUser = ref(null)
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
})

const statusText = {
  active: '正常',
  inactive: '未激活',
  banned: '已封禁'
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

const handleSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

const handleSelectAll = () => {
  if (selectAll.value) {
    selectedUserIds.value = users.value.filter(u => u.role !== 'admin').map(u => u.id)
  } else {
    selectedUserIds.value = []
  }
}

const fetchUsers = async () => {
  loading.value = true
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
    const response = await getUsers(params)
    if (response.success) {
      users.value = response.data.users || []
      pagination.value.total = response.data.total || 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    toast.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 'banned' ? 'active' : 'banned'
  const actionText = newStatus === 'banned' ? '封禁' : '启用'
  try {
    await apiToggleUserStatus(user.id, { status: newStatus })
    toast.success(`用户 ${user.username} 已${actionText}`)
    await fetchUsers()
  } catch (error) {
    console.error('更新用户状态失败:', error)
    toast.error('更新用户状态失败')
  }
}

const handleBatchAction = async (status) => {
  try {
    await batchUpdateUsersStatus({ ids: selectedUserIds.value, status })
    toast.success(`批量更新成功`)
    selectedUserIds.value = []
    selectAll.value = false
    await fetchUsers()
  } catch (error) {
    console.error('批量更新失败:', error)
    toast.error('批量更新失败')
  }
}

const openUserDetail = (user) => {
  selectedUser.value = user
  showUserDetail.value = true
}

const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  pagination.value.page = newPage
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
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
