// Toast 提示工具函数
import { ref, createApp, h } from 'vue'

const toastContainer = ref(null)
let toastId = 0
const toasts = ref([])

const createToastContainer = () => {
  if (toastContainer.value) return
  
  const container = document.createElement('div')
  container.className = 'toast-container fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2'
  document.body.appendChild(container)
  toastContainer.value = container
  
  const ToastComponent = {
    setup() {
      return () => h('div', { class: 'space-y-2' }, toasts.value.map(toast => h('div', {
        key: toast.id,
        class: [
          'px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300',
          toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
          toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' :
          'bg-gradient-to-r from-taobao-orange to-orange-500 text-white'
        ],
        style: {
          opacity: toast.visible ? 1 : 0,
          transform: toast.visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-20px)'
        }
      }, [
        toast.type === 'success' && h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M5 13l4 4L19 7' })),
        toast.type === 'error' && h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: 'h-5 w-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M6 18L18 6M6 6l12 12' })),
        h('span', { class: 'text-sm font-medium' }, toast.message)
      ])))
    }
  }
  
  createApp(ToastComponent).mount(container)
}

export const toast = {
  success(message, duration = 3000) {
    showToast(message, 'success', duration)
  },
  
  error(message, duration = 3000) {
    showToast(message, 'error', duration)
  },
  
  info(message, duration = 3000) {
    showToast(message, 'info', duration)
  },
  
  warning(message, duration = 3000) {
    showToast(message, 'warning', duration)
  }
}

const showToast = (message, type = 'info', duration = 3000) => {
  createToastContainer()
  
  const id = ++toastId
  const toastItem = { id, message, type, visible: true }
  toasts.value.push(toastItem)
  
  setTimeout(() => {
    toastItem.visible = false
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 300)
  }, duration)
}
