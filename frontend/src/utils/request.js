import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken')
    const userToken = localStorage.getItem('token')
    
    let token
    if (config.url?.includes('/admin/')) {
      token = adminToken || userToken
    } else {
      token = userToken || adminToken
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API请求错误:', error.response || error.message)
    
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    
    return Promise.reject(error)
  }
)

export default request
