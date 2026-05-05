import request from '@/utils/request'

export const getPromotions = (params) => request.get('/promotions', { params })
export const getPromotionById = (id) => request.get(`/promotions/${id}`)
