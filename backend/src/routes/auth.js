import express from 'express'
import * as authController from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authenticateToken, authController.getCurrentUser)
router.put('/password', authenticateToken, authController.updatePassword)
router.put('/me', authenticateToken, authController.updateUserInfo)
router.put('/avatar', authenticateToken, authController.updateAvatar)

export default router
