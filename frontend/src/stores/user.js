import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false
  }),
  getters: {
    userName: (state) => state.user?.username || '',
    userEmail: (state) => state.user?.email || '',
    userPhone: (state) => state.user?.phone || '',
    userAvatar: (state) => state.user?.avatar || localStorage.getItem('userAvatar') || ''
  },
  actions: {
    initFromStorage() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        this.user = JSON.parse(user)
        this.isAuthenticated = true
      }
    },
    login(userData, token) {
      this.user = userData
      this.isAuthenticated = true
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
    },
    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    updateUserInfo(userData) {
      this.user = { ...this.user, ...userData }
      localStorage.setItem('user', JSON.stringify(this.user))
    },
    updateAvatar(avatarUrl) {
      if (this.user) {
        this.user = { ...this.user, avatar: avatarUrl }
        localStorage.setItem('user', JSON.stringify(this.user))
      }
      localStorage.setItem('userAvatar', avatarUrl)
    }
  }
})
