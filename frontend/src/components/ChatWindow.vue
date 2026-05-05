<template>
  <div class="chat-window-wrapper">
    <!-- AI 浮动按钮 -->
    <div class="relative">
      <!-- 气泡提示 -->
      <Transition name="fade">
        <div
          v-if="showBubble && !isOpen"
          class="absolute -top-16 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50"
        >
          {{ bubbleMessage }}
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
            <div class="border-8 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </Transition>
      
      <button
        v-if="!isOpen"
        ref="floatBtn"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @mouseenter="isBtnHovered = true"
        @mouseleave="isBtnHovered = false"
        @mouseout="isBtnHovered = false"
        :style="btnPosition"
        :class="[
          'fixed z-50 flex items-center justify-center',
          'w-14 h-14 rounded-full',
          isDragging ? '' : 'transition-all duration-300',
          'hover:scale-110 active:scale-95',
          'p-0 m-0 border-0 bg-transparent'
        ]"
      >
        <img 
          src="/avatars/ai-avatar.png" 
          alt="小舒" 
          :class="[
            'w-full h-full rounded-full object-cover transition-all duration-200',
            isBtnHovered ? 'animate-bounce' : ''
          ]"
          @error="$event.target.style.display='none'; $event.target.nextSibling.style.display='flex'"
        />
        <span class="text-2xl hidden">🤖</span>
      </button>
    </div>

    <!-- 聊天弹窗 -->
    <Transition :name="chatTransitionName">
      <div
        v-if="isOpen"
        :class="chatWindowClass"
      >
        <div class="bg-white shadow-2xl overflow-hidden flex flex-col h-full">
          <!-- 聊天头部 -->
          <div :class="[
            'flex items-center justify-between px-4 py-3 text-white',
            isAdminMode 
              ? 'bg-gradient-to-r from-blue-700 to-blue-900' 
              : 'bg-gradient-to-r from-taobao-orange to-orange-500'
          ]">
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-full flex items-center justify-center overflow-hidden',
                isAdminMode ? 'bg-blue-500/30' : 'bg-white/20'
              ]">
                <img 
                  src="/avatars/ai-avatar.png" 
                  alt="小舒" 
                  class="w-full h-full object-cover"
                  @error="$event.target.style.display='none'; $event.target.nextSibling.style.display='flex'"
                />
                <span class="text-xl hidden">🤖</span>
              </div>
              <div>
                <h3 class="font-semibold">{{ isAdminMode ? '管理助手' : '小舒' }}</h3>
                <p class="text-xs text-white/80">{{ isAdminMode ? '帮您管理商城' : '有什么可以帮您？' }}</p>
              </div>
            </div>
            <button @click="closeChat" :class="[
              'p-2 rounded-full transition-colors',
              isAdminMode ? 'hover:bg-blue-500/30' : 'hover:bg-white/20'
            ]">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 消息列表 -->
          <div
            ref="messageContainer"
            class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="[
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
              v-if="msg.role === 'assistant'"
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
                isAdminMode ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-taobao-orange to-orange-500'
              ]"
            >
                <img
                  :key="aiAvatarKey"
                  :src="aiAvatarUrl"
                  alt="小舒"
                  class="w-full h-full object-cover"
                  @error="$event.target.style.display='none'; $event.target.nextSibling.style.display='flex'"
                />
                <span class="text-sm hidden">🤖</span>
              </div>
            <div
              :class="[
                'max-w-[75%] px-4 py-2 rounded-2xl',
                msg.role === 'user'
                  ? isAdminMode ? 'bg-blue-600 text-white rounded-br-md' : 'bg-taobao-orange text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
              ]"
            >
              <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
              <p :class="[
                'text-xs mt-1',
                msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
              ]">
                {{ formatTime(msg.timestamp) }}
              </p>
            </div>
            <div
              v-if="msg.role === 'user'"
              class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden"
            >
              <img 
                v-if="getUserAvatar()" 
                :src="getUserAvatar()" 
                alt="User" 
                class="w-full h-full object-cover"
              />
              <svg v-else class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            </div>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="flex justify-center">
              <div class="flex gap-1">
                <div :class="[
                  'w-2 h-2 rounded-full animate-bounce',
                  isAdminMode ? 'bg-blue-600' : 'bg-taobao-orange'
                ]" style="animation-delay: 0ms"></div>
                <div :class="[
                  'w-2 h-2 rounded-full animate-bounce',
                  isAdminMode ? 'bg-blue-600' : 'bg-taobao-orange'
                ]" style="animation-delay: 150ms"></div>
                <div :class="[
                  'w-2 h-2 rounded-full animate-bounce',
                  isAdminMode ? 'bg-blue-600' : 'bg-taobao-orange'
                ]" style="animation-delay: 300ms"></div>
              </div>
            </div>
          </div>

          <!-- 快捷建议 -->
          <div v-if="suggestions.length > 0 && messages.length > 0" class="px-4 py-2 bg-white border-t border-gray-100">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(suggestion, index) in suggestions"
                :key="index"
                @click="sendMessage(suggestion)"
                class="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-taobao-orange hover:text-white transition-colors"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- 输入框 -->
          <div class="p-4 bg-white border-t border-gray-100">
            <div class="flex gap-2">
              <input
                v-model="inputMessage"
                @keyup.enter="sendMessage()"
                type="text"
                placeholder="输入您的问题..."
                :class="[
                  'flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none',
                  isAdminMode 
                    ? 'focus:border-blue-600 focus:ring-2 focus:ring-blue-100' 
                    : 'focus:border-taobao-orange focus:ring-2 focus:ring-orange-100'
                ]"
              />
              <button
                @click="sendMessage"
                :disabled="!inputMessage.trim()"
                :class="[
                  'px-4 py-2 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                  isAdminMode 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-taobao-orange hover:bg-orange-600'
                ]"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast 提示 -->
    <Transition name="fade">
      <div
        v-if="showToast"
        class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 bg-black/80 text-white rounded-lg shadow-lg z-[100]"
      >
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- 修改邮箱弹窗 -->
    <Transition name="fade">
      <div v-if="showEmailModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4">修改邮箱</h3>
          <input
            v-model="editEmail"
            type="email"
            placeholder="请输入新邮箱"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-taobao-orange focus:ring-2 focus:ring-orange-200"
          />
          <div class="flex gap-2 mt-4">
            <button @click="showEmailModal = false" class="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button @click="submitEmail" class="flex-1 py-2 bg-taobao-orange text-white rounded-lg hover:bg-orange-600 transition-colors">
              确认修改
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 修改手机号弹窗 -->
    <Transition name="fade">
      <div v-if="showPhoneModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4">修改手机号</h3>
          <input
            v-model="editPhone"
            type="tel"
            placeholder="请输入新手机号"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-taobao-orange focus:ring-2 focus:ring-orange-200"
          />
          <div class="flex gap-2 mt-4">
            <button @click="showPhoneModal = false" class="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button @click="submitPhone" class="flex-1 py-2 bg-taobao-orange text-white rounded-lg hover:bg-orange-600 transition-colors">
              确认修改
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 修改密码弹窗 -->
    <Transition name="fade">
      <div v-if="showPasswordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold mb-4">修改密码</h3>
          <input
            v-model="editOldPassword"
            type="password"
            placeholder="请输入原密码"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-taobao-orange focus:ring-2 focus:ring-orange-200 mb-3"
          />
          <input
            v-model="editNewPassword"
            type="password"
            placeholder="请输入新密码"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-taobao-orange focus:ring-2 focus:ring-orange-200 mb-3"
          />
          <input
            v-model="editConfirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-taobao-orange focus:ring-2 focus:ring-orange-200"
          />
          <div class="flex gap-2 mt-4">
            <button @click="showPasswordModal = false" class="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button @click="submitPassword" :disabled="!validatePasswordForm()" class="flex-1 py-2 bg-taobao-orange text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors">
              确认修改
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useAdminStore } from '../stores/admin'
import { useCartStore } from '../stores/cart'
import request from '../utils/request'

const router = useRouter()
const aiAvatarUrl = ref('/avatars/ai-avatar.png')
const aiAvatarKey = ref(0)
const isOpen = ref(false)
const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messageContainer = ref(null)
const showToast = ref(false)
const toastMessage = ref('')
const isBtnHovered = ref(false)

const userStore = useUserStore()
const adminStore = useAdminStore()
const cartStore = useCartStore()

const isAdminMode = computed(() => {
  const currentPath = window.location.pathname
  return currentPath.startsWith('/admin')
})

const adminWelcomeMessage = '你好，管理员！我是小舒管理助手，可以帮你快速查询数据、管理商品和订单。试试问"今天有多少订单？"'
const userWelcomeMessage = 'Hi！我是小舒 🛒 可以帮你找商品、加购物车、下单、查订单、管理地址... 试试说"帮我推荐蓝牙耳机"吧～'

// 拖拽相关状态
const floatBtn = ref(null)
const isDragging = ref(false)
const offsetX = ref(0)
const offsetY = ref(0)
const currentLeft = ref(window.innerWidth - 80)
const currentTop = ref(window.innerHeight - 100)
const isClicking = ref(false)
const clickStartPos = ref({ x: 0, y: 0 })
const chatWindowPosition = ref('right')

const btnPosition = ref({
  left: `${window.innerWidth - 80}px`,
  top: `${window.innerHeight - 100}px`,
  transition: ''
})

const chatWindowClass = computed(() => {
  if (chatWindowPosition.value === 'left') {
    return 'fixed top-0 left-0 w-full md:w-[400px] h-full z-[100]'
  } else if (chatWindowPosition.value === 'center') {
    return 'fixed top-0 left-1/2 -translate-x-1/2 w-full md:w-[400px] h-full z-[100]'
  }
  return 'fixed top-0 right-0 w-full md:w-[400px] h-full z-[100]'
})

const chatTransitionName = computed(() => {
  if (chatWindowPosition.value === 'left') {
    return 'slide-left'
  } else if (chatWindowPosition.value === 'center') {
    return 'slide-center'
  }
  return 'slide-right'
})

// 弹窗状态
const showEmailModal = ref(false)
const showPhoneModal = ref(false)
const showPasswordModal = ref(false)
const editEmail = ref('')
const editPhone = ref('')
const editOldPassword = ref('')
const editNewPassword = ref('')
const editConfirmPassword = ref('')

const getUserAvatar = () => {
  const avatar = userStore.userAvatar || localStorage.getItem('userAvatar')
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar
  return `http://localhost:3000${avatar}`
}

const showBubble = ref(false)
const bubbleMessage = ref('')
let lastMessageTime = Date.now()
let bubbleTimer = null
let productViewTimer = null
let rafId = null

const userSuggestions = [
  '帮我推荐蓝牙耳机',
  '查看我的购物车',
  '有什么促销活动',
  '查看我的订单',
  '查看我的账户信息'
]

const adminSuggestions = [
  '查看今日订单统计',
  '搜索商品库存',
  '查看新增用户',
  '最近7天销售趋势',
  '查看全部订单列表'
]

const suggestions = computed(() => {
  return isAdminMode.value ? adminSuggestions : userSuggestions
})

const startDrag = (e) => {
  if (isOpen.value) return

  e.preventDefault()
  isDragging.value = true
  isClicking.value = true

  const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
  const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY

  clickStartPos.value = { x: clientX, y: clientY }

  if (floatBtn.value) {
    const rect = floatBtn.value.getBoundingClientRect()
    offsetX.value = clientX - rect.left
    offsetY.value = clientY - rect.top
  } else {
    offsetX.value = clientX - currentLeft.value
    offsetY.value = clientY - currentTop.value
  }

  btnPosition.value = {
    left: `${currentLeft.value}px`,
    top: `${currentTop.value}px`,
    transition: 'none'
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return

  e.preventDefault()

  const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
  const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY

  if (isClicking.value) {
    const distance = Math.sqrt(
      Math.pow(clientX - clickStartPos.value.x, 2) +
      Math.pow(clientY - clickStartPos.value.y, 2)
    )
    if (distance >= 5) {
      isClicking.value = false
    }
  }

  let newLeft = clientX - offsetX.value
  let newTop = clientY - offsetY.value

  const btnWidth = 56
  const btnHeight = 56

  newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - btnWidth))
  newTop = Math.max(0, Math.min(newTop, window.innerHeight - btnHeight))

  currentLeft.value = newLeft
  currentTop.value = newTop

  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  rafId = requestAnimationFrame(() => {
    btnPosition.value = {
      left: `${newLeft}px`,
      top: `${newTop}px`,
      transition: 'none'
    }
  })
}

const endDrag = () => {
  const wasClicking = isClicking.value
  isDragging.value = false
  isClicking.value = false

  if (rafId) {
    cancelAnimationFrame(rafId)
  }

  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)

  if (wasClicking) {
    calculateChatWindowPosition()
    openChat()
  } else {
    const btnWidth = 56
    const screenWidth = window.innerWidth
    const snapLeft = currentLeft.value < screenWidth / 2 ? 24 : screenWidth - btnWidth - 24

    btnPosition.value = {
      left: `${snapLeft}px`,
      top: `${window.innerHeight - 100}px`,
      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }

    currentLeft.value = snapLeft
    setTimeout(() => {
      btnPosition.value.transition = ''
    }, 300)
  }
}

const calculateChatWindowPosition = () => {
  const btnCenterX = currentLeft.value + 28
  const screenWidth = window.innerWidth
  const screenCenter = screenWidth / 2
  const leftZone = screenWidth * 0.3
  const rightZone = screenWidth * 0.7

  if (btnCenterX < leftZone) {
    chatWindowPosition.value = 'left'
  } else if (btnCenterX > rightZone) {
    chatWindowPosition.value = 'right'
  } else {
    chatWindowPosition.value = 'center'
  }
}

const openChat = () => {
  if (isDragging.value) return
  isOpen.value = true

  const token = isAdminMode.value 
    ? localStorage.getItem('adminToken') 
    : localStorage.getItem('token')

  if (messages.value.length === 0) {
    isLoading.value = true
    fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: '你好' }]
      })
    })
    .then(r => r.json())
    .then(res => {
      isLoading.value = false
      if (res.success && res.data.reply) {
        messages.value.push({
          role: 'assistant',
          content: stripMarkdown(res.data.reply),
          timestamp: new Date()
        })
      } else {
        messages.value.push({
          role: 'assistant',
          content: isAdminMode.value ? adminWelcomeMessage : userWelcomeMessage,
          timestamp: new Date()
        })
      }
      scrollToBottom()
    })
    .catch(error => {
      isLoading.value = false
      messages.value.push({
        role: 'assistant',
        content: isAdminMode.value ? adminWelcomeMessage : userWelcomeMessage,
        timestamp: new Date()
      })
      scrollToBottom()
    })
  } else {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const closeChat = () => {
  isOpen.value = false
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const stripMarkdown = (text) => {
  if (!text) return ''
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
}

const showToastMessage = (message) => {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const sendMessage = (text = null) => {
  const message = text || inputMessage.value.trim()
  if (!message) return

  inputMessage.value = ''
  lastMessageTime = Date.now()
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  scrollToBottom()

  isLoading.value = true

  const token = isAdminMode.value 
    ? localStorage.getItem('adminToken') 
    : localStorage.getItem('token')

  fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }]
    })
  })
  .then(r => r.json())
  .then(res => {
    isLoading.value = false
    
    if (res.success) {
      const reply = stripMarkdown(res.data.reply)
      
      if (res.data.products && res.data.products.length > 0) {
        console.log('推荐商品:', res.data.products)
      }
      
      if (res.data.actions && res.data.actions.length > 0) {
        res.data.actions.forEach(action => {
          handleAction(action)
        })
      }

      messages.value.push({
        role: 'assistant',
        content: reply,
        timestamp: new Date()
      })
    } else {
      console.error('AI 请求失败:', res.message)
      messages.value.push({
        role: 'assistant',
        content: res.message || '抱歉，我暂时无法回答你的问题。',
        timestamp: new Date()
      })
    }
    
    scrollToBottom()
  })
  .catch(error => {
    isLoading.value = false
    console.error('AI 请求失败:', error)
    messages.value.push({
      role: 'assistant',
      content: '网络错误，请稍后重试。',
      timestamp: new Date()
    })
    scrollToBottom()
  })
}

const showBubbleTip = (message) => {
  bubbleMessage.value = message
  showBubble.value = true
  setTimeout(() => {
    showBubble.value = false
  }, 5000)
}

const startIdleTimer = () => {
  if (bubbleTimer) {
    clearInterval(bubbleTimer)
  }
  bubbleTimer = setInterval(() => {
    const now = Date.now()
    const minutesIdle = (now - lastMessageTime) / 60000
    if (minutesIdle >= 10 && !isOpen.value) {
      showBubbleTip('有什么可以帮你？')
    }
  }, 60000)
}

const checkProductDetailPage = () => {
  const currentPath = window.location.pathname
  if (currentPath.startsWith('/product/') || currentPath.startsWith('/products/detail')) {
    if (productViewTimer) {
      clearTimeout(productViewTimer)
    }
    productViewTimer = setTimeout(() => {
      if (!isOpen.value) {
        showBubbleTip('这款商品不错，需要我帮你加入购物车吗？')
      }
    }, 15000)
  }
}

const checkCartPage = () => {
  const currentPath = window.location.pathname
  if (currentPath === '/cart') {
    setTimeout(() => {
      const cartCount = cartStore.cartItems?.length || 0
      if (cartCount > 0 && !isOpen.value) {
        showBubbleTip(`你的购物车里有 ${cartCount} 件商品，需要我帮你下单吗？`)
      }
    }, 3000)
  }
}

const handleAction = async (action) => {
  switch (action.type) {
    case 'view_cart':
      closeChat()
      router.push('/cart')
      break
    case 'view_orders':
      closeChat()
      router.push('/orders')
      break
    case 'view_profile':
      closeChat()
      router.push('/profile')
      break
    case 'view_favorites':
      closeChat()
      router.push('/favorites')
      break
    case 'add_to_cart':
      if (action.productId) {
        await cartStore.addToCart(action.productId, 1)
        showToastMessage('已添加到购物车')
      }
      break
    case 'view_product':
      if (action.productId) {
        closeChat()
        router.push(`/product/${action.productId}`)
      }
      break
    case 'update_email':
      showEmailModal.value = true
      break
    case 'update_phone':
      showPhoneModal.value = true
      break
    case 'update_password':
      showPasswordModal.value = true
      break
    default:
      break
  }
}

const submitEmail = async () => {
  if (!editEmail.value) {
    showToastMessage('请输入邮箱')
    return
  }

  try {
    const response = await request.post('/api/users/update-email', { email: editEmail.value })
    if (response.success) {
      showToastMessage('邮箱修改成功')
      userStore.userEmail = editEmail.value
      showEmailModal.value = false
      editEmail.value = ''
    } else {
      showToastMessage(response.message || '修改失败')
    }
  } catch (error) {
    showToastMessage('修改失败')
  }
}

const submitPhone = async () => {
  if (!editPhone.value) {
    showToastMessage('请输入手机号')
    return
  }

  try {
    const response = await request.post('/api/users/update-phone', { phone: editPhone.value })
    if (response.success) {
      showToastMessage('手机号修改成功')
      userStore.userPhone = editPhone.value
      showPhoneModal.value = false
      editPhone.value = ''
    } else {
      showToastMessage(response.message || '修改失败')
    }
  } catch (error) {
    showToastMessage('修改失败')
  }
}

const validatePasswordForm = () => {
  if (!editOldPassword.value) return false
  if (!editNewPassword.value) return false
  if (editNewPassword.value !== editConfirmPassword.value) return false
  if (editNewPassword.value.length < 6) return false
  return true
}

const submitPassword = async () => {
  if (!validatePasswordForm()) {
    showToastMessage('请检查密码输入')
    return
  }

  try {
    const response = await request.post('/api/users/update-password', {
      oldPassword: editOldPassword.value,
      newPassword: editNewPassword.value
    })
    if (response.success) {
      showToastMessage('密码修改成功')
      showPasswordModal.value = false
      editOldPassword.value = ''
      editNewPassword.value = ''
      editConfirmPassword.value = ''
    } else {
      showToastMessage(response.message || '修改失败')
    }
  } catch (error) {
    showToastMessage('修改失败')
  }
}

watch(isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  window.addEventListener('resize', () => {
    const btnWidth = 56
    currentLeft.value = Math.min(currentLeft.value, window.innerWidth - btnWidth)
    btnPosition.value.left = `${currentLeft.value}px`
    btnPosition.value.top = `${window.innerHeight - 100}px`
  })

  startIdleTimer()
  checkProductDetailPage()
  checkCartPage()

  router.afterEach(() => {
    checkProductDetailPage()
    checkCartPage()
  })

  const url = '/avatars/ai-avatar.png?v=' + Math.random()
  fetch(url).then(response => {
    if (response.ok) {
      aiAvatarUrl.value = url
      aiAvatarKey.value = Math.random()
    }
  })
})

onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)

  if (bubbleTimer) {
    clearInterval(bubbleTimer)
  }
  if (productViewTimer) {
    clearTimeout(productViewTimer)
  }
})
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active,
.slide-center-enter-active,
.slide-center-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-center-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}

.slide-center-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes bounce-gentle {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.animate-bounce {
  animation: bounce-gentle 0.6s ease-in-out infinite;
}
</style>