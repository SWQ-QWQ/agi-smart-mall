import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
  }
})

const aiAvatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, 'ai-avatar.png')
  }
})

const upload = multer({ storage })

const aiAvatarUpload = multer({
  storage: aiAvatarStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传图片文件'), false)
    }
  }
})

router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '没有上传文件' })
  }
  const url = `/uploads/avatars/${req.file.filename}`
  res.json({ success: true, data: { url } })
})

router.post('/ai-avatar', aiAvatarUpload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '没有上传文件' })
  }
  const url = '/uploads/avatars/ai-avatar.png'
  res.json({ success: true, data: { url } })
})

export default router