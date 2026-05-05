import request from '@/utils/request'

export const adminLogin = (data) => request.post('/admin/login', data)

export const getDashboard = () => request.get('/admin/dashboard')

export const getUsers = (params) => request.get('/admin/users', { params })

export const getUserById = (id) => request.get(`/admin/users/${id}`)

export const toggleUserStatus = (id, data) => request.put(`/admin/users/${id}/status`, data)

export const batchUpdateUsersStatus = (data) => request.put('/admin/users/batch-status', data)

export const getProducts = (params) => request.get('/admin/products', { params })

export const getProductById = (id) => request.get(`/admin/products/${id}`)

export const createProduct = (data) => request.post('/admin/products', data)

export const updateProduct = (id, data) => request.put(`/admin/products/${id}`, data)

export const deleteProduct = (id) => request.delete(`/admin/products/${id}`)

export const batchUpdateProductsStatus = (data) => request.put('/admin/products/batch-status', data)

export const getOrders = (params) => request.get('/admin/orders', { params })

export const getOrderById = (id) => request.get(`/admin/orders/${id}`)

export const updateOrderStatus = (id, data) => request.put(`/admin/orders/${id}/status`, data)

export const updateOrder = (id, data) => request.put(`/admin/orders/${id}`, data)

export const getCategories = () => request.get('/admin/categories')

export const createCategory = (data) => request.post('/admin/categories', data)

export const updateCategory = (id, data) => request.put(`/admin/categories/${id}`, data)

export const deleteCategory = (id) => request.delete(`/admin/categories/${id}`)

export const moveCategory = (id, data) => request.put(`/admin/categories/${id}/move`, data)

export const globalSearch = (params) => request.get('/admin/search', { params })
