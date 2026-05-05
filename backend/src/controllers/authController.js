import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { User } from '../models/index.js'

dotenv.config()

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export const register = async (req, res) => {
  try {
    const { username, password, email } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '用户名已存在'
      })
    }

    const user = await User.create({
      username,
      password,
      email: email || null
    })

    const token = generateToken(user.id)

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      },
      message: '注册成功'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    const user = await User.findOne({ where: { username } })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const token = generateToken(user.id)

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      },
      message: '登录成功'
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'avatar', 'role', 'status', 'created_at']
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: '获取用户信息成功'
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.userId
    const { avatar } = req.body

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: '请提供头像URL'
      })
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    await user.update({ avatar })

    return res.status(200).json({
      success: true,
      data: {
        avatar: avatar
      },
      message: '头像更新成功'
    })
  } catch (error) {
    console.error('更新头像失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updatePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body
    const userId = req.userId

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: '请提供原密码和新密码'
      })
    }

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    const isValidPassword = await user.validatePassword(old_password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '原密码错误'
      })
    }

    await user.update({ password: new_password })

    return res.status(200).json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateUserInfo = async (req, res) => {
  try {
    const userId = req.userId
    const { email } = req.body

    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    const updateData = {}
    if (email !== undefined) updateData.email = email

    await user.update(updateData)

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      message: '用户信息更新成功'
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
