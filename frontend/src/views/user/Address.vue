<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold">收货地址</h1>
        <button @click="openModal('create')" class="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors">
          添加地址
        </button>
      </div>

      <div v-if="isLoading" class="text-center py-12">
        <p class="text-gray-500">加载中...</p>
      </div>
      <div v-else-if="addresses.length > 0" class="space-y-4">
        <div v-for="addr in addresses" :key="addr.id" class="bg-white rounded-xl shadow p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <p class="font-semibold text-gray-800">
                {{ addr.receiver_name }} <span class="text-gray-500 ml-2">{{ addr.phone }}</span>
                <span v-if="addr.is_default" class="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">默认</span>
              </p>
              <p class="text-gray-500 mt-1">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                v-if="!addr.is_default"
                @click="setDefault(addr)"
                class="text-blue-600 hover:text-blue-700"
              >
                设为默认
              </button>
              <button
                @click="openModal('edit', addr)"
                class="text-gray-600 hover:text-blue-600"
              >
                编辑
              </button>
              <button
                @click="deleteAddress(addr)"
                class="text-gray-600 hover:text-red-500"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">🏠</div>
        <p class="text-gray-500 mb-6">暂无收货地址</p>
        <button @click="openModal('create')" class="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors">
          添加地址
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-bold mb-6">{{ modalMode === 'create' ? '添加地址' : '编辑地址' }}</h3>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">收货人姓名</label>
            <input
              v-model="form.receiverName"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">手机号码</label>
            <input
              v-model="form.phone"
              type="tel"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">省份</label>
              <input
                v-model="form.province"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">城市</label>
              <input
                v-model="form.city"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">区县</label>
              <input
                v-model="form.district"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">详细地址</label>
            <textarea
              v-model="form.detail"
              rows="2"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            ></textarea>
          </div>
          <label class="flex items-center gap-2">
            <input v-model="form.isDefault" type="checkbox" class="w-4 h-4 text-blue-600 rounded">
            <span class="text-gray-700">设为默认地址</span>
          </label>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {{ isSubmitting ? '提交中...' : '确定' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAddresses, createAddress, updateAddress, deleteAddress as deleteAddressApi, setDefaultAddress } from '@/api/addressApi'

const addresses = ref([])
const showModal = ref(false)
const modalMode = ref('create')
const editingAddress = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

const form = ref({
  receiverName: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

const fetchAddresses = async () => {
  try {
    const response = await getAddresses()
    if (response.success) {
      addresses.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch addresses:', error)
  } finally {
    isLoading.value = false
  }
}

const openModal = (mode, addr = null) => {
  modalMode.value = mode
  if (mode === 'edit' && addr) {
    editingAddress.value = addr
    form.value = {
      receiverName: addr.receiver_name,
      phone: addr.phone,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      detail: addr.detail,
      isDefault: addr.is_default
    }
  } else {
    editingAddress.value = null
    form.value = {
      receiverName: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const submitForm = async () => {
  isSubmitting.value = true
  try {
    if (modalMode.value === 'create') {
      await createAddress(form.value)
    } else {
      await updateAddress(editingAddress.value.id, form.value)
    }
    closeModal()
    await fetchAddresses()
  } catch (error) {
    console.error('Failed to save address:', error)
    alert('保存失败')
  } finally {
    isSubmitting.value = false
  }
}

const setDefault = async (addr) => {
  try {
    await setDefaultAddress(addr.id)
    await fetchAddresses()
  } catch (error) {
    console.error('Failed to set default:', error)
    alert('设置失败')
  }
}

const deleteAddress = async (addr) => {
  if (confirm('确定要删除这个地址吗？')) {
    try {
      await deleteAddressApi(addr.id)
      await fetchAddresses()
    } catch (error) {
      console.error('Failed to delete address:', error)
      alert('删除失败')
    }
  }
}

onMounted(() => {
  fetchAddresses()
})
</script>
