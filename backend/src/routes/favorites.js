import express from 'express'
import * as favoriteController from '../controllers/favoriteController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authenticateToken, favoriteController.getFavorites)
router.post('/', authenticateToken, favoriteController.addFavorite)
router.delete('/:product_id', authenticateToken, favoriteController.removeFavorite)
router.get('/check/:product_id', authenticateToken, favoriteController.checkFavorite)

export default router
