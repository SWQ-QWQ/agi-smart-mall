import { Announcement } from '../models/index.js'
import { Op } from 'sequelize'

export const getAnnouncements = async (req, res) => {
  try {
    const { status } = req.query
    const where = {}
    if (status) {
      where.status = status
    } else {
      where.status = 'active'
    }

    const announcements = await Announcement.findAll({
      where,
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      success: true,
      data: announcements,
      message: '获取公告成功'
    })
  } catch (error) {
    console.error('获取公告失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params
    const announcement = await Announcement.findByPk(id)

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '公告不存在'
      })
    }

    return res.status(200).json({
      success: true,
      data: announcement,
      message: '获取公告详情成功'
    })
  } catch (error) {
    console.error('获取公告详情失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
