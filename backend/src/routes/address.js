import express from 'express'
import * as addressController from '../controllers/addressController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/', authenticateToken, addressController.getMyAddresses)
router.get('/:id', authenticateToken, addressController.getAddressById)
router.post('/', authenticateToken, addressController.createAddress)
router.put('/:id', authenticateToken, addressController.updateAddress)
router.delete('/:id', authenticateToken, addressController.deleteAddress)

export default router
