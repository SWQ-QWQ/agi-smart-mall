import express from 'express'
import { chat } from '../services/aiService.js'
import { authenticateToken } from '../middleware/auth.js'
import { User } from '../models/index.js'

const router = express.Router()

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body
    const userId = req.userId

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的对话消息'
      })
    }

    const user = await User.findByPk(userId, { attributes: ['role'] })
    const userRole = user?.role || 'user'

    const result = await chat(messages, userId, userRole)
    res.json({
      success: true,
      data: result,
      message: '对话成功'
    })
  } catch (error) {
    console.error('AI 对话错误:', error)
    res.status(500).json({
      success: false,
      message: 'AI 服务异常'
    })
  }
})

export default router
