import express from 'express'
import * as categoryController from '../controllers/categoryController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

router.get('/', categoryController.getCategories)
router.get('/:id', categoryController.getCategoryById)
router.post('/', adminAuth, categoryController.createCategory)
router.put('/:id', adminAuth, categoryController.updateCategory)
router.delete('/:id', adminAuth, categoryController.deleteCategory)

export default router
