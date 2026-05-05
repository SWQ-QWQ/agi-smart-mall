import request from '@/utils/request'

export const getAnnouncements = (params) => request.get('/announcements', { params })
export const getAnnouncementById = (id) => request.get(`/announcements/${id}`)
