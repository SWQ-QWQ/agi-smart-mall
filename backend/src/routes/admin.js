import express from 'express'
import * as adminController from '../controllers/adminController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

router.post('/login', adminController.login)
router.get('/dashboard', adminAuth, adminController.getDashboard)
router.get('/users', adminAuth, adminController.getUsers)
router.get('/users/:id', adminAuth, adminController.getUserById)
router.put('/users/:id/status', adminAuth, adminController.toggleUserStatus)
router.put('/users/batch-status', adminAuth, adminController.batchUpdateUsersStatus)
router.get('/products', adminAuth, adminController.getProducts)
router.get('/products/:id', adminAuth, adminController.getProductById)
router.post('/products', adminAuth, adminController.createProduct)
router.put('/products/:id', adminAuth, adminController.updateProduct)
router.delete('/products/:id', adminAuth, adminController.deleteProduct)
router.put('/products/batch-status', adminAuth, adminController.batchUpdateProductsStatus)
router.get('/orders', adminAuth, adminController.getOrders)
router.get('/orders/:id', adminAuth, adminController.getOrderById)
router.put('/orders/:id/status', adminAuth, adminController.updateOrderStatus)
router.put('/orders/:id', adminAuth, adminController.updateOrder)
router.get('/categories', adminAuth, adminController.getCategories)
router.post('/categories', adminAuth, adminController.createCategory)
router.put('/categories/:id', adminAuth, adminController.updateCategory)
router.delete('/categories/:id', adminAuth, adminController.deleteCategory)
router.put('/categories/:id/move', adminAuth, adminController.moveCategory)
router.get('/search', adminAuth, adminController.globalSearch)

export default router
