import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { User } from '../models/index.js'

dotenv.config()

export const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限'
      })
    }

    req.user = user
    req.userId = user.id
    next()
  } catch (error) {
    console.error('管理员鉴权失败:', error)
    return res.status(401).json({
      success: false,
      message: '无效或过期的令牌'
    })
  }
}
