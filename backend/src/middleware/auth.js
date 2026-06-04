import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { User } from '../models/index.js'

dotenv.config()

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    
    // 检查用户状态
    const user = await User.findByPk(req.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: '账号已被封禁，请联系管理员'
      })
    }
    
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效或过期的令牌'
    })
  }
}
