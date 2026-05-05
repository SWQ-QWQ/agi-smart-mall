<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900">系统设置</h2>
      <p class="text-sm text-gray-500 mt-1">管理系统全局配置</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- AI助手设置 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700">
          <h3 class="text-lg font-semibold text-white flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI助手设置
          </h3>
        </div>
        <div class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">助手名称</label>
            <input
              v-model="aiSettings.name"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
              placeholder="请输入助手名称"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">默认头像</label>
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl font-bold">
                {{ aiSettings.name ? aiSettings.name.charAt(0).toUpperCase() : 'A' }}
              </div>
              <div class="flex-1">
                <input
                  type="file"
                  ref="avatarInput"
                  accept="image/*"
                  @change="handleAvatarUpload"
                  class="hidden"
                />
                <button
                  @click="$refs.avatarInput.click()"
                  class="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  上传头像
                </button>
                <p class="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，建议 200x200</p>
              </div>
            </div>
          </div>
          <div class="pt-2">
            <button
              @click="saveAISettings"
              :disabled="savingAI"
              class="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm disabled:opacity-50"
            >
              {{ savingAI ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700">
          <h3 class="text-lg font-semibold text-white flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.999 3.999 0 00-1.564.317z" />
            </svg>
            公告管理
          </h3>
        </div>
        <div class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">公告内容</label>
            <textarea
              v-model="noticeSettings.content"
              rows="4"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-gray-400 resize-none text-sm"
              placeholder="请输入公告内容"
            ></textarea>
          </div>
          <div class="flex items-center">
            <input
              v-model="noticeSettings.enabled"
              type="checkbox"
              id="noticeEnabled"
              class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <label for="noticeEnabled" class="ml-2 block text-sm font-medium text-gray-700">启用公告</label>
          </div>
          <div class="pt-2">
            <button
              @click="saveNoticeSettings"
              :disabled="savingNotice"
              class="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm disabled:opacity-50"
            >
              {{ savingNotice ? '保存中...' : '保存设置' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
        <div class="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700">
          <h3 class="text-lg font-semibold text-white flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            修改密码
          </h3>
        </div>
        <div class="p-6 space-y-5 max-w-xl">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">当前密码</label>
            <input
              v-model="passwordForm.current"
              type="password"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
              placeholder="请输入当前密码"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">新密码</label>
            <input
              v-model="passwordForm.new"
              type="password"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
              placeholder="请输入新密码"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">确认新密码</label>
            <input
              v-model="passwordForm.confirm"
              type="password"
              class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm"
              placeholder="请再次输入新密码"
            />
          </div>
          <div class="pt-2">
            <button
              @click="changePassword"
              :disabled="savingPassword"
              class="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm disabled:opacity-50"
            >
              {{ savingPassword ? '修改中...' : '修改密码' }}
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
const savingNotice = ref(false)
const savingPassword = ref(false)

const aiSettings = ref({
  name: '小舒',
  avatar: ''
})

const noticeSettings = ref({
  enabled: false,
  content: ''
})

const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const loadSettings = () => {
  const savedAI = localStorage.getItem('aiSettings')
  const savedNotice = localStorage.getItem('noticeSettings')
  
  if (savedAI) {
    aiSettings.value = JSON.parse(savedAI)
  }
  if (savedNotice) {
    noticeSettings.value = JSON.parse(savedNotice)
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

const saveNoticeSettings = async () => {
  savingNotice.value = true
  try {
    localStorage.setItem('noticeSettings', JSON.stringify(noticeSettings.value))
    toast.success('公告设置保存成功')
  } catch (error) {
    toast.error('保存失败')
  } finally {
    savingNotice.value = false
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
