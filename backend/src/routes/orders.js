import express from 'express'
import * as orderController from '../controllers/orderController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authenticateToken, orderController.getMyOrders)
router.get('/:id', authenticateToken, orderController.getOrderDetail)
router.post('/', authenticateToken, orderController.createOrder)
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder)

export default router
