import express from 'express'
import * as productController from '../controllers/productController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

router.get('/', productController.getProducts)
router.get('/:id', productController.getProductById)
router.post('/', adminAuth, productController.createProduct)
router.put('/:id', adminAuth, productController.updateProduct)
router.delete('/:id', adminAuth, productController.deleteProduct)

export default router
