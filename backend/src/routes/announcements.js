import express from 'express'
import * as announcementController from '../controllers/announcementController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

router.get('/', announcementController.getAnnouncements)
router.get('/:id', announcementController.getAnnouncementById)
router.post('/', adminAuth, announcementController.createAnnouncement)
router.put('/:id', adminAuth, announcementController.updateAnnouncement)
router.delete('/:id', adminAuth, announcementController.deleteAnnouncement)

export default router
