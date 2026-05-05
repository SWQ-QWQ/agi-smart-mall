import request from '@/utils/request'

export const login = (data) => request.post('/auth/login', data)
export const register = (data) => request.post('/auth/register', data)
export const getUserInfo = () => request.get('/auth/me')
export const updateUserInfo = (data) => request.put('/auth/me', data)
export const changePassword = (data) => request.put('/auth/password', data)
