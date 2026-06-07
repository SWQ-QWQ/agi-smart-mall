<template>
  <div class="min-h-screen bg-gray-50 pb-8">
    <!-- 顶部用户信息卡片 -->
    <div class="bg-gradient-to-br from-orange-50 via-orange-100 to-white rounded-2xl shadow-sm mx-4 -mt-6 relative z-10 overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-200/50 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
      <div class="relative p-6">
        <div class="flex items-center gap-5">
          <div 
            @click="triggerFileInput"
            class="w-20 h-20 bg-white rounded-full flex items-center justify-center text-orange-500 text-2xl font-bold cursor-pointer hover:ring-4 hover:ring-orange-200 transition-all relative group shadow-md"
          >
            <img 
              v-if="userStore.userAvatar" 
              :src="getAvatarUrl(userStore.userAvatar)" 
              alt="Avatar" 
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else>{{ userStore.userName?.charAt(0)?.toUpperCase() || 'U' }}</span>
            <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            class="hidden" 
            @change="handleFileSelect" 
          />
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-800">{{ userStore.userName || '用户' }}</h2>
            <p class="text-gray-500 text-sm mt-1">{{ userStore.userPhone || userStore.userEmail || '未绑定手机号' }}</p>
            <div class="flex items-center gap-3 mt-3">
              <span class="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full">普通会员</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单状态栏 -->
    <div class="max-w-4xl mx-auto px-4 py-4">
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-800">我的订单</h3>
          <router-link to="/orders" class="text-sm text-orange-500 hover:text-orange-600 transition-colors flex items-center">
            全部订单
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <router-link to="/orders?status=pending" class="flex flex-col items-center py-4 px-2 hover:bg-orange-50 rounded-xl transition-colors">
            <div class="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center text-xl mb-2">
              <span>💰</span>
            </div>
            <span class="text-sm text-gray-700">待付款</span>
            <span v-if="orderCounts.pending > 0" class="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full mt-1 font-medium">{{ orderCounts.pending }}</span>
            <span v-else class="text-xs text-gray-400 mt-1">0</span>
          </router-link>
          <router-link to="/orders?status=paid" class="flex flex-col items-center py-4 px-2 hover:bg-orange-50 rounded-xl transition-colors">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-xl mb-2">
              <span>📦</span>
            </div>
            <span class="text-sm text-gray-700">待发货</span>
            <span v-if="orderCounts.paid > 0" class="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full mt-1 font-medium">{{ orderCounts.paid }}</span>
            <span v-else class="text-xs text-gray-400 mt-1">0</span>
          </router-link>
          <router-link to="/orders?status=shipped" class="flex flex-col items-center py-4 px-2 hover:bg-orange-50 rounded-xl transition-colors">
            <div class="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center text-xl mb-2">
              <span>🚚</span>
            </div>
            <span class="text-sm text-gray-700">待收货</span>
            <span v-if="orderCounts.shipped > 0" class="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full mt-1 font-medium">{{ orderCounts.shipped }}</span>
            <span v-else class="text-xs text-gray-400 mt-1">0</span>
          </router-link>
          <router-link to="/orders?status=completed" class="flex flex-col items-center py-4 px-2 hover:bg-orange-50 rounded-xl transition-colors">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center text-xl mb-2">
              <span>⭐</span>
            </div>
            <span class="text-sm text-gray-700">待评价</span>
            <span v-if="orderCounts.completed > 0" class="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full mt-1 font-medium">{{ orderCounts.completed }}</span>
            <span v-else class="text-xs text-gray-400 mt-1">0</span>
          </router-link>
        </div>
      </div>

      <!-- 常用功能入口 -->
      <div class="bg-white rounded-2xl shadow-sm mt-4 p-5">
        <h3 class="font-bold text-gray-800 mb-4">常用功能</h3>
        <div class="grid grid-cols-5 gap-4">
          <router-link to="/favorites" class="flex flex-col items-center py-3 hover:bg-orange-50 rounded-xl transition-colors group">
            <div class="w-14 h-14 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
              <span>❤️</span>
            </div>
            <span class="text-sm text-gray-700">我的收藏</span>
            <span v-if="favoriteCount > 0" class="text-xs text-orange-500 mt-0.5">{{ favoriteCount }}</span>
          </router-link>
          <router-link to="/address" class="flex flex-col items-center py-3 hover:bg-orange-50 rounded-xl transition-colors group">
            <div class="w-14 h-14 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
              <span>📍</span>
            </div>
            <span class="text-sm text-gray-700">收货地址</span>
          </router-link>
          <button @click="showPasswordModal = true" class="flex flex-col items-center py-3 hover:bg-orange-50 rounded-xl transition-colors group">
            <div class="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
              <span>🔐</span>
            </div>
            <span class="text-sm text-gray-700">修改密码</span>
          </button>
          <button @click="showEmailModal = true" class="flex flex-col items-center py-3 hover:bg-orange-50 rounded-xl transition-colors group">
            <div class="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
              <span>📧</span>
            </div>
            <span class="text-sm text-gray-700">修改邮箱</span>
          </button>
          <button @click="showPhoneModal = true" class="flex flex-col items-center py-3 hover:bg-orange-50 rounded-xl transition-colors group">
            <div class="w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
              <span>📱</span>
            </div>
            <span class="text-sm text-gray-700">修改手机</span>
          </button>
          <div class="flex flex-col items-center py-3 hover:bg-orange-50 rounded-xl transition-colors group cursor-pointer">
            <div class="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
              <span>👀</span>
            </div>
            <span class="text-sm text-gray-700">浏览足迹</span>
          </div>
          <div class="flex flex-col items-center py-3 hover:bg-orange-50 rounded-xl transition-colors group cursor-pointer" @click="scrollToBottom">
            <div class="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center text-2xl mb-2 group-hover:scale-110 transition-transform">
              <span>💬</span>
            </div>
            <span class="text-sm text-gray-700">联系客服</span>
          </div>
        </div>
      </div>

      <!-- 退出登录按钮 -->
      <button
        @click="handleLogout"
        class="w-full mt-4 border-2 border-orange-500 text-orange-500 py-4 rounded-xl font-medium hover:bg-orange-50 transition-all"
      >
        退出登录
      </button>
    </div>

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showPasswordModal = false">
      <div class="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div class="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
          <h3 class="text-white font-bold text-lg">修改密码</h3>
        </div>
        <form @submit.prevent="handleUpdatePassword" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">原密码</label>
            <input
              v-model="passwordForm.oldPassword"
              type="password"
              required
              placeholder="请输入原密码"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              required
              placeholder="请输入新密码"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">确认新密码</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              placeholder="请再次输入新密码"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            >
          </div>
          <div v-if="passwordError" class="text-red-500 text-sm text-center">{{ passwordError }}</div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showPasswordModal = false"
              class="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {{ isSubmitting ? '提交中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Email Modal -->
    <div v-if="showEmailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showEmailModal = false">
      <div class="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <h3 class="text-white font-bold text-lg">修改邮箱</h3>
        </div>
        <form @submit.prevent="handleUpdateEmail" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">新邮箱</label>
            <input
              v-model="emailForm.email"
              type="email"
              required
              placeholder="请输入新邮箱地址"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all"
            >
          </div>
          <div v-if="emailError" class="text-red-500 text-sm text-center">{{ emailError }}</div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showEmailModal = false"
              class="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {{ isSubmitting ? '提交中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Phone Modal -->
    <div v-if="showPhoneModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showPhoneModal = false">
      <div class="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div class="bg-gradient-to-r from-cyan-500 to-cyan-600 px-6 py-4">
          <h3 class="text-white font-bold text-lg">修改手机号</h3>
        </div>
        <form @submit.prevent="handleUpdatePhone" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">新手机号</label>
            <input
              v-model="phoneForm.phone"
              type="tel"
              required
              placeholder="请输入新手机号"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
            >
          </div>
          <div v-if="phoneError" class="text-red-500 text-sm text-center">{{ phoneError }}</div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="showPhoneModal = false"
              class="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {{ isSubmitting ? '提交中...' : '确认修改' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { changePassword as updatePassword } from '@/api/userApi'
import { toast } from '@/utils/toast'

const router = useRouter()
const userStore = useUserStore()

const showPasswordModal = ref(false)
const isSubmitting = ref(false)
const passwordError = ref('')
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showEmailModal = ref(false)
const showPhoneModal = ref(false)
const emailForm = ref({
  email: ''
})
const phoneForm = ref({
  phone: ''
})
const emailError = ref('')
const phoneError = ref('')
const fileInput = ref(null)
const favoriteCount = ref(0)

const orderCounts = ref({
  pending: 0,
  paid: 0,
  shipped: 0,
  completed: 0
})

const getAvatarUrl = (avatar) => {
  if (avatar && avatar.startsWith('http')) {
    return avatar
  }
  return `http://localhost:3000${avatar}`
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const response = await fetch('http://localhost:3000/api/upload/avatar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })

    const result = await response.json()
    if (result.success) {
      const avatarUrl = result.data.url
      
      const updateResponse = await fetch('http://localhost:3000/api/auth/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ avatar: avatarUrl })
      })

      const updateResult = await updateResponse.json()
      if (updateResult.success) {
        userStore.updateAvatar(avatarUrl)
        toast.success('头像上传成功')
      } else {
        toast.error('头像更新失败')
      }
    } else {
      toast.error(result.message || '头像上传失败')
    }
  } catch (error) {
    console.error('Avatar upload failed:', error)
    toast.error('头像上传失败，请稍后重试')
  }

  event.target.value = ''
}

const handleUpdatePassword = async () => {
  passwordError.value = ''
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = '两次输入的密码不一致'
    return
  }

  isSubmitting.value = true
  try {
    const response = await updatePassword({
      old_password: passwordForm.value.oldPassword,
      new_password: passwordForm.value.newPassword
    })
    if (response.success) {
      toast.success('密码修改成功')
      showPasswordModal.value = false
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      passwordError.value = response.message || '密码修改失败'
    }
  } catch (error) {
    console.error('Failed to update password:', error)
    passwordError.value = '密码修改失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

const handleUpdateEmail = async () => {
  emailError.value = ''
  
  if (!emailForm.value.email) {
    emailError.value = '请输入邮箱地址'
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailForm.value.email)) {
    emailError.value = '请输入有效的邮箱地址'
    return
  }

  isSubmitting.value = true
  try {
    const response = await fetch('http://localhost:3000/api/users/update-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ email: emailForm.value.email })
    })
    
    const result = await response.json()
    if (result.success) {
      toast.success('邮箱修改成功')
      userStore.userEmail = emailForm.value.email
      showEmailModal.value = false
      emailForm.value.email = ''
    } else {
      emailError.value = result.message || '邮箱修改失败'
    }
  } catch (error) {
    console.error('Failed to update email:', error)
    emailError.value = '邮箱修改失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

const handleUpdatePhone = async () => {
  phoneError.value = ''
  
  if (!phoneForm.value.phone) {
    phoneError.value = '请输入手机号'
    return
  }
  
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phoneForm.value.phone)) {
    phoneError.value = '请输入有效的手机号'
    return
  }

  isSubmitting.value = true
  try {
    const response = await fetch('http://localhost:3000/api/users/update-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ phone: phoneForm.value.phone })
    })
    
    const result = await response.json()
    if (result.success) {
      toast.success('手机号修改成功')
      userStore.userPhone = phoneForm.value.phone
      showPhoneModal.value = false
      phoneForm.value.phone = ''
    } else {
      phoneError.value = result.message || '手机号修改失败'
    }
  } catch (error) {
    console.error('Failed to update phone:', error)
    phoneError.value = '手机号修改失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
}

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }
}

const scrollToBottom = () => {
  window.scrollTo({ bottom: 0, behavior: 'smooth' })
}

onMounted(() => {
  document.title = '个人中心 - 智享商城'
})
</script>