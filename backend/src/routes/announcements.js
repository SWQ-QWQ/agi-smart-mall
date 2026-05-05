import express from 'express'
import * as announcementController from '../controllers/announcementController.js'

const router = express.Router()

router.get('/', announcementController.getAnnouncements)
router.get('/:id', announcementController.getAnnouncementById)

export default router
