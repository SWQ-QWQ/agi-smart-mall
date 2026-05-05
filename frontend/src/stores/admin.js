import { defineStore } from 'pinia'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    admin: null,
    token: localStorage.getItem('adminToken') || null,
    isAuthenticated: !!localStorage.getItem('adminToken'),
    aiAvatarTimestamp: localStorage.getItem('aiAvatarTimestamp') || null
  }),
  getters: {
    adminName: (state) => state.admin?.username || '',
    isAdmin: (state) => state.isAuthenticated && state.admin?.role === 'admin',
    aiAvatarUrl: (state) => {
      const timestamp = state.aiAvatarTimestamp || Date.now()
      return '/uploads/avatars/ai-avatar.png?t=' + timestamp
    }
  },
  actions: {
    async login(credentials) {
      const { adminLogin } = await import('@/api/adminApi')
      const response = await adminLogin(credentials)
      if (response.success) {
        this.token = response.data.token
        this.admin = response.data.user
        this.isAuthenticated = true
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('adminUser', JSON.stringify(response.data.user))
        return true
      }
      return false
    },
    logout() {
      this.admin = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    },
    initFromStorage() {
      const token = localStorage.getItem('adminToken')
      const user = localStorage.getItem('adminUser')
      const aiAvatarTimestamp = localStorage.getItem('aiAvatarTimestamp')
      if (token && user) {
        this.token = token
        this.admin = JSON.parse(user)
        this.isAuthenticated = true
      }
      if (aiAvatarTimestamp) {
        this.aiAvatarTimestamp = aiAvatarTimestamp
      }
    },
    updateAiAvatarTimestamp(timestamp) {
      this.aiAvatarTimestamp = timestamp
      localStorage.setItem('aiAvatarTimestamp', timestamp)
    }
  }
})
