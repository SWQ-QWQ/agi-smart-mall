<template>
  <div id="app">
    <router-view />
    <ChatWindow />
    
    <!-- 回到顶部按钮 -->
    <Transition name="fade">
      <button
        v-if="showBackTop"
        @click="scrollToTop"
        class="fixed bottom-24 right-6 z-40 w-12 h-12 bg-gradient-to-r from-taobao-orange to-taobao-red rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </Transition>
    
    <!-- 网络断开提示 -->
    <Transition name="slide-down">
      <div
        v-if="!isOnline"
        class="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 text-center z-50"
      >
        <span class="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          网络连接失败，请检查网络
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ChatWindow from './components/ChatWindow.vue'
import { toast } from './utils/toast'

const router = useRouter()
const showBackTop = ref(false)
const isOnline = ref(navigator.onLine)

const handleScroll = () => {
  showBackTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const updatePageTitle = (to) => {
  const titles = {
    Home: 'AGI 商城',
    Products: '全部商品 - AGI 商城',
    ProductDetail: '商品详情 - AGI 商城',
    Cart: '购物车 - AGI 商城',
    Profile: '个人中心 - AGI 商城',
    Orders: '我的订单 - AGI 商城',
    OrderDetail: '订单详情 - AGI 商城',
    Address: '收货地址 - AGI 商城',
    Addresses: '收货地址 - AGI 商城',
    Favorites: '我的收藏 - AGI 商城',
    Announcements: '公告中心 - AGI 商城',
    Promotions: '促销活动 - AGI 商城',
    Login: '登录 - AGI 商城',
    Register: '注册 - AGI 商城'
  }
  
  if (to.name && titles[to.name]) {
    document.title = titles[to.name]
  } else if (to.name === 'ProductDetail' && to.params.id) {
    document.title = `商品详情 - AGI 商城`
  } else {
    document.title = 'AGI 商城'
  }
}

const handleOnline = () => {
  isOnline.value = true
  toast.success('网络连接已恢复')
}

const handleOffline = () => {
  isOnline.value = false
}

router.afterEach((to) => {
  updatePageTitle(to)
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  updatePageTitle(router.currentRoute.value)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style>
.toast-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
