<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">分类管理</h2>
        <p class="text-sm text-gray-500 mt-1">管理商品分类，支持层级和排序</p>
      </div>
      <button
        @click="openModal('create')"
        class="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm"
      >
        <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        添加分类
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gradient-to-r from-slate-800 to-slate-700">
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">ID</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">分类名称</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">层级</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">排序</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">首页导航</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="(category, index) in categories"
              :key="category.id"
              class="transition-colors duration-200"
              :class="index % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50/50 hover:bg-orange-50'"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{{ category.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span v-if="category.level === 2" class="mr-3 text-gray-400">└</span>
                  <span class="text-sm font-medium text-gray-900">{{ category.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-3 py-1 text-xs font-semibold rounded-full"
                  :class="category.level === 1 ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-green-100 text-green-800 border border-green-200'">
                  {{ category.level === 1 ? '一级' : '二级' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center space-x-2">
                  <button
                    @click="moveCategory(category.id, 'up')"
                    :disabled="index === 0"
                    class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="上移"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span class="px-2 bg-gray-100 rounded-lg text-gray-700">{{ category.sortOrder }}</span>
                  <button
                    @click="moveCategory(category.id, 'down')"
                    :disabled="index === categories.length - 1"
                    class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="下移"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="toggleShowInNav(category)"
                  :class="category.showInNav ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                  class="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                >
                  {{ category.showInNav ? '显示' : '隐藏' }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <div class="flex items-center space-x-2">
                  <button
                    @click="openModal('edit', category)"
                    class="px-3 py-1.5 text-blue-600 hover:text-white hover:bg-blue-500 rounded-lg text-xs font-medium transition-all duration-200 border border-blue-300 hover:border-blue-500"
                  >
                    编辑
                  </button>
                  <button
                    v-if="category.level === 1"
                    @click="openModal('createChild', category)"
                    class="px-3 py-1.5 text-green-600 hover:text-white hover:bg-green-500 rounded-lg text-xs font-medium transition-all duration-200 border border-green-300 hover:border-green-500"
                  >
                    子分类
                  </button>
                  <button
                    @click="deleteCategory(category)"
                    class="px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-500 rounded-lg text-xs font-medium transition-all duration-200 border border-red-300 hover:border-red-500"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="categories.length === 0">
              <td colspan="6" class="px-6 py-16 text-center">
                <svg class="w-20 h-20 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <p class="text-gray-400 text-sm">暂无分类数据</p>
                <p class="text-gray-300 text-xs mt-1">点击"添加分类"创建新分类</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Transition name="modal">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
          <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700">
            <h3 class="text-lg font-semibold text-white flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ modalMode === 'create' ? '添加分类' : modalMode === 'createChild' ? '添加子分类' : '编辑分类' }}
            </h3>
          </div>
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">分类名称</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 text-sm"
                placeholder="请输入分类名称"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">排序</label>
              <input
                v-model.number="form.sortOrder"
                type="number"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 text-sm"
                placeholder="数字越小越靠前"
              />
            </div>
            <div class="flex items-center">
              <input
                v-model="form.showInNav"
                type="checkbox"
                id="showInNav"
                class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <label for="showInNav" class="ml-2 block text-sm font-medium text-gray-700">显示在首页导航</label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 resize-none text-sm"
                placeholder="请输入分类描述..."
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory as apiDeleteCategory, moveCategory as apiMoveCategory } from '@/api/adminApi'
import { toast } from '@/utils/toast'

const categories = ref([])
const showModal = ref(false)
const modalMode = ref('create')
const editingCategory = ref(null)
const parentCategory = ref(null)
const submitting = ref(false)

const form = ref({
  name: '',
  sortOrder: 0,
  showInNav: true,
  description: ''
})

const fetchCategories = async () => {
  try {
    const response = await getCategories()
    if (response.success) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    toast.error('获取分类列表失败')
  }
}

const openModal = (mode, category = null) => {
  modalMode.value = mode
  if (mode === 'edit' && category) {
    editingCategory.value = category
    parentCategory.value = null
    form.value = {
      name: category.name,
      sortOrder: category.sortOrder,
      showInNav: category.showInNav !== false,
      description: category.description || ''
    }
  } else if (mode === 'createChild' && category) {
    editingCategory.value = null
    parentCategory.value = category
    form.value = { name: '', sortOrder: 0, showInNav: true, description: '' }
  } else {
    editingCategory.value = null
    parentCategory.value = null
    form.value = { name: '', sortOrder: 0, showInNav: true, description: '' }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    const data = {
      ...form.value,
      parentId: parentCategory.value?.id || null,
      level: parentCategory.value ? parentCategory.value.level + 1 : 1
    }
    if (modalMode.value === 'edit') {
      await updateCategory(editingCategory.value.id, data)
      toast.success('分类更新成功')
    } else {
      await createCategory(data)
      toast.success('分类创建成功')
    }
    closeModal()
    await fetchCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
    toast.error('保存分类失败')
  } finally {
    submitting.value = false
  }
}

const deleteCategory = async (category) => {
  if (!confirm(`确定要删除分类"${category.name}"吗？`)) return
  try {
    await apiDeleteCategory(category.id)
    toast.success('分类删除成功')
    await fetchCategories()
  } catch (error) {
    console.error('删除分类失败:', error)
    toast.error('删除分类失败')
  }
}

const moveCategory = async (id, direction) => {
  try {
    await apiMoveCategory(id, { direction })
    toast.success('排序更新成功')
    await fetchCategories()
  } catch (error) {
    console.error('移动分类失败:', error)
    toast.error('移动分类失败')
  }
}

const toggleShowInNav = async (category) => {
  try {
    await updateCategory(category.id, { showInNav: !category.showInNav })
    toast.success('更新成功')
    await fetchCategories()
  } catch (error) {
    console.error('更新失败:', error)
    toast.error('更新失败')
  }
}

onMounted(() => {
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
