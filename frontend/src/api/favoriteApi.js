import request from '@/utils/request'

export const getFavorites = () => request.get('/favorites')
export const addFavorite = (data) => request.post('/favorites', data)
export const removeFavorite = (productId) => request.delete(`/favorites/${productId}`)
export const checkFavorite = (productId) => request.get(`/favorites/check/${productId}`)
