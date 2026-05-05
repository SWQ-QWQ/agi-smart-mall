import { Promotion } from '../models/index.js'
import { Op } from 'sequelize'

export const getPromotions = async (req, res) => {
  try {
    const { status } = req.query
    const where = {}
    if (status) {
      where.status = status
    } else {
      where.status = 'active'
    }

    const promotions = await Promotion.findAll({
      where,
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      success: true,
      data: promotions,
      message: '获取促销活动成功'
    })
  } catch (error) {
    console.error('获取促销活动失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params
    const promotion = await Promotion.findByPk(id)

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: '促销活动不存在'
      })
    }

    return res.status(200).json({
      success: true,
      data: promotion,
      message: '获取促销活动详情成功'
    })
  } catch (error) {
    console.error('获取促销活动详情失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
