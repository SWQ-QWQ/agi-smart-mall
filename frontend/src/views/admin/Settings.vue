<template>
  <div class="max-w-5xl mx-auto py-8 px-4">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 flex items-center">
        <svg class="w-8 h-8 mr-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        系统设置
      </h1>
      <p class="text-gray-500 mt-2 text-lg">管理系统全局配置，让系统更符合您的使用习惯</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- AI助手设置卡片 -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <!-- 卡片标题 -->
        <div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-orange-100/50">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-bold text-gray-900">AI助手设置</h3>
              <p class="text-sm text-gray-500">配置您的智能助手</p>
            </div>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="p-6 space-y-6">
          <!-- 助手名称 -->
          <div class="space-y-3">
            <label class="block text-sm font-bold text-gray-700">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                助手名称
              </span>
            </label>
            <input
              v-model="aiSettings.name"
              type="text"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all text-sm"
              placeholder="请输入助手名称"
            />
          </div>

          <!-- 头像上传 -->
          <div class="space-y-3">
            <label class="block text-sm font-bold text-gray-700">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                助手头像
              </span>
            </label>
            <div class="flex flex-col items-center space-y-4">
              <!-- 头像预览 -->
              <div class="relative">
                <div class="w-28 h-28 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center shadow-lg overflow-hidden">
                  <template v-if="aiSettings.avatar">
                    <img :src="aiSettings.avatar" alt="助手头像" class="w-full h-full object-cover" />
                  </template>
                  <template v-else>
                    <span class="text-white text-4xl font-bold">
                      {{ aiSettings.name ? aiSettings.name.charAt(0).toUpperCase() : 'A' }}
                    </span>
                  </template>
                </div>
                <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <!-- 上传按钮 -->
              <div class="text-center">
                <input
                  type="file"
                  ref="avatarInput"
                  accept="image/*"
                  @change="handleAvatarUpload"
                  class="hidden"
                />
                <button
                  @click="$refs.avatarInput.click()"
                  class="px-5 py-2.5 border-2 border-orange-500 text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-all"
                >
                  上传头像
                </button>
                <p class="text-xs text-gray-400 mt-2">支持 JPG、PNG 格式，建议 200x200</p>
              </div>
            </div>
          </div>

          <!-- 保存按钮 -->
          <div class="pt-2">
            <button
              @click="saveAISettings"
              :disabled="savingAI"
              class="w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ savingAI ? '保存中...' : '保存设置' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 修改密码卡片 -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <!-- 卡片标题 -->
        <div class="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-slate-100/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-bold text-gray-900">修改密码</h3>
                <p class="text-sm text-gray-500">保护您的账户安全</p>
              </div>
            </div>
            <!-- 折叠按钮 -->
            <button
              @click="passwordCollapsed = !passwordCollapsed"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                class="w-5 h-5 text-gray-500 transition-transform"
                :class="{ 'rotate-180': passwordCollapsed }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 卡片内容（可折叠） -->
        <div v-show="!passwordCollapsed" class="p-6 space-y-6">
          <!-- 当前密码 -->
          <div class="space-y-3">
            <label class="block text-sm font-bold text-gray-700">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                当前密码
              </span>
            </label>
            <input
              v-model="passwordForm.current"
              type="password"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all text-sm"
              placeholder="请输入当前密码"
            />
          </div>

          <!-- 新密码 -->
          <div class="space-y-3">
            <label class="block text-sm font-bold text-gray-700">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                新密码
              </span>
            </label>
            <input
              v-model="passwordForm.new"
              type="password"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all text-sm"
              placeholder="请输入新密码（至少6位）"
            />
          </div>

          <!-- 确认密码 -->
          <div class="space-y-3">
            <label class="block text-sm font-bold text-gray-700">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                确认新密码
              </span>
            </label>
            <input
              v-model="passwordForm.confirm"
              type="password"
              class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all text-sm"
              placeholder="请再次输入新密码"
            />
          </div>

          <!-- 修改按钮 -->
          <div class="pt-2">
            <button
              @click="changePassword"
              :disabled="savingPassword"
              class="w-full px-6 py-3.5 border-2 border-orange-500 text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 7z" />
              </svg>
              <span>{{ savingPassword ? '修改中...' : '修改密码' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { toast } from '@/utils/toast'

const savingAI = ref(false)
const savingPassword = ref(false)
const passwordCollapsed = ref(false)

const aiSettings = ref({
  name: '小舒',
  avatar: ''
})

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const loadSettings = () => {
  const savedAI = localStorage.getItem('aiSettings')
  
  if (savedAI) {
    aiSettings.value = JSON.parse(savedAI)
  }
}

const saveAISettings = async () => {
  if (!aiSettings.value.name.trim()) {
    toast.error('请输入助手名称')
    return
  }
  
  savingAI.value = true
  try {
    localStorage.setItem('aiSettings', JSON.stringify(aiSettings.value))
    toast.success('AI设置保存成功')
  } catch (error) {
    toast.error('保存失败')
  } finally {
    savingAI.value = false
  }
}

const handleAvatarUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      aiSettings.value.avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const changePassword = async () => {
  if (!passwordForm.value.current) {
    toast.error('请输入当前密码')
    return
  }
  if (!passwordForm.value.new) {
    toast.error('请输入新密码')
    return
  }
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    toast.error('两次输入的密码不一致')
    return
  }
  if (passwordForm.value.new.length < 6) {
    toast.error('新密码长度至少为6位')
    return
  }
  
  savingPassword.value = true
  try {
    // 这里应该调用后端API
    toast.success('密码修改成功')
    passwordForm.value = { current: '', new: '', confirm: '' }
  } catch (error) {
    toast.error('密码修改失败')
  } finally {
    savingPassword.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>
