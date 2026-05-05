import request from '@/utils/request'

export const getAddresses = () => request.get('/addresses')
export const getAddressDetail = (id) => request.get(`/addresses/${id}`)
export const createAddress = (data) => request.post('/addresses', {
  receiver_name: data.receiverName || data.receiver_name,
  phone: data.phone,
  province: data.province,
  city: data.city,
  district: data.district,
  detail: data.detail,
  postal_code: data.postalCode || data.postal_code,
  is_default: data.isDefault || data.is_default
})
export const updateAddress = (id, data) => request.put(`/addresses/${id}`, {
  receiver_name: data.receiverName || data.receiver_name,
  phone: data.phone,
  province: data.province,
  city: data.city,
  district: data.district,
  detail: data.detail,
  postal_code: data.postalCode || data.postal_code,
  is_default: data.isDefault || data.is_default
})
export const deleteAddress = (id) => request.delete(`/addresses/${id}`)
export const setDefaultAddress = (id) => request.put(`/addresses/${id}`, {
  is_default: true
})
