import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    isLoading: false
  }),
  getters: {
    totalCount: (state) => {
      return state.items.reduce((sum, item) => sum + item.quantity, 0)
    },
    totalPrice: (state) => {
      return state.items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)
    },
    selectedItems: (state) => {
      return state.items.filter(item => item.selected)
    },
    selectedTotalPrice: (state) => {
      return state.items.filter(item => item.selected).reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)
    },
    allSelected: (state) => {
      return state.items.length > 0 && state.items.every(item => item.selected)
    }
  },
  actions: {
    async fetchCart() {
      this.isLoading = true
      try {
        const { getCart } = await import('@/api/cartApi')
        const response = await getCart()
        if (response.success) {
          this.items = response.data
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error)
      } finally {
        this.isLoading = false
      }
    },
    async addToCart(productId, quantity = 1) {
      try {
        const { addToCart } = await import('@/api/cartApi')
        const response = await addToCart({ productId, quantity })
        if (response.success) {
          await this.fetchCart()
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to add to cart:', error)
        return false
      }
    },
    async updateQuantity(cartItemId, quantity) {
      try {
        const { updateCartItem } = await import('@/api/cartApi')
        const response = await updateCartItem(cartItemId, { quantity })
        if (response.success) {
          await this.fetchCart()
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to update quantity:', error)
        return false
      }
    },
    async toggleSelection(cartItemId, selected) {
      try {
        const { updateCartItem } = await import('@/api/cartApi')
        const response = await updateCartItem(cartItemId, { selected })
        if (response.success) {
          await this.fetchCart()
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to toggle selection:', error)
        return false
      }
    },
    async toggleAllSelection(selected) {
      for (const item of this.items) {
        await this.toggleSelection(item.id, selected)
      }
    },
    async removeFromCart(cartItemId) {
      try {
        const { removeFromCart } = await import('@/api/cartApi')
        const response = await removeFromCart(cartItemId)
        if (response.success) {
          await this.fetchCart()
          return true
        }
        return false
      } catch (error) {
        console.error('Failed to remove from cart:', error)
        return false
      }
    },
    async clearCart() {
      this.items = []
    }
  }
})
