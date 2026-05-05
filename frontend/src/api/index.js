import request from '@/utils/request'

export const getProducts = () => request.get('/products')
export const getProductDetail = (id) => request.get(`/products/${id}`)
