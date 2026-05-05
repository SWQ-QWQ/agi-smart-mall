import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', authenticateToken, paymentController.createPayment);
router.get('/status/:orderId', authenticateToken, paymentController.getPaymentStatus);
router.post('/alipay/notify', paymentController.alipayNotify);
router.post('/wechat/notify', paymentController.wechatNotify);
router.post('/test', authenticateToken, paymentController.testPayment);

export default router;