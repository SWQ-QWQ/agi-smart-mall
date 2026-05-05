// 确认弹窗工具函数
import { ref, createApp, h } from 'vue'

const confirmContainer = ref(null)

const createConfirmContainer = () => {
  if (confirmContainer.value) return
  
  const container = document.createElement('div')
  container.className = 'confirm-container fixed inset-0 z-50'
  document.body.appendChild(container)
  confirmContainer.value = container
}

export const confirm = (options) => {
  return new Promise((resolve) => {
    createConfirmContainer()
    
    const defaultOptions = {
      title: '确认操作',
      message: '确定要执行此操作吗？',
      confirmText: '确定',
      cancelText: '取消',
      type: 'warning'
    }
    
    const opts = { ...defaultOptions, ...options }
    
    const ConfirmComponent = {
      setup() {
        const visible = ref(true)
        
        const handleConfirm = () => {
          visible.value = false
          setTimeout(() => {
            resolve(true)
          }, 300)
        }
        
        const handleCancel = () => {
          visible.value = false
          setTimeout(() => {
            resolve(false)
          }, 300)
        }
        
        return () => h('Transition', { name: 'fade' }, h('div', {
          vShow: visible,
          class: 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'
        }, h('div', {
          class: 'bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all duration-300',
          style: visible ? 'opacity: 1; scale: 1' : 'opacity: 0; scale: 0.95'
        }, [
          h('div', { class: 'bg-gradient-to-r from-taobao-orange to-taobao-red p-4 text-white' }, h('h3', { class: 'font-bold text-lg' }, opts.title)),
          h('div', { class: 'p-4' }, [
            h('p', { class: 'text-gray-600 mb-4' }, opts.message),
            h('div', { class: 'flex gap-3' }, [
              h('button', {
                onClick: handleCancel,
                class: 'flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors'
              }, opts.cancelText),
              h('button', {
                onClick: handleConfirm,
                class: 'flex-1 py-2 bg-taobao-orange text-white rounded-lg hover:bg-orange-600 transition-colors'
              }, opts.confirmText)
            ])
          ])
        ])))
      }
    }
    
    const app = createApp(ConfirmComponent)
    app.mount(confirmContainer.value)
  })
}
