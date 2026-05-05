import request from '@/utils/request'

export const getCart = () => request.get('/cart')
export const addToCart = (data) => request.post('/cart', {
  product_id: data.productId || data.product_id,
  quantity: data.quantity
})
export const updateCartItem = (id, data) => request.put(`/cart/${id}`, data)
export const removeFromCart = (id) => request.delete(`/cart/${id}`)
export const clearCart = () => request.delete('/cart')
