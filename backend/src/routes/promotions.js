import express from 'express'
import * as promotionController from '../controllers/promotionController.js'

const router = express.Router()

router.get('/', promotionController.getPromotions)
router.get('/:id', promotionController.getPromotionById)

export default router
