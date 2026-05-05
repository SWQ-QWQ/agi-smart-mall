import { Order } from '../models/index.js'

const createPayment = async (req, res) => {
  const { orderId, paymentMethod } = req.body
  try {
    console.log('创建支付请求:', { orderId, paymentMethod, userId: req.userId })
    const order = await Order.findOne({
      where: { id: orderId, user_id: req.userId }
    })
    if (!order) {
      console.log('订单不存在')
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    if (order.status !== 'pending') {
      console.log('订单状态不允许支付:', order.status)
      return res.status(400).json({ success: false, message: '订单状态不允许支付' })
    }
    res.json({ success: true, data: { orderNo: order.order_no }, message: '请使用测试支付功能' })
  } catch (error) {
    console.error('支付创建失败:', error)
    res.status(500).json({ success: false, message: error.message || '支付创建失败' })
  }
}

const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params
  try {
    const order = await Order.findOne({
      where: { id: orderId, user_id: req.userId }
    })
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    const statusMap = {
      pending: '待付款',
      paid: '已付款',
      shipped: '已发货',
      delivered: '已收货',
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款'
    }
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        status: order.status,
        statusText: statusMap[order.status] || order.status
      },
      message: '获取支付状态成功'
    })
  } catch (error) {
    console.error('获取支付状态失败:', error)
    res.status(500).json({ success: false, message: error.message || '获取支付状态失败' })
  }
}

const testPayment = async (req, res) => {
  const { orderId, paymentMethod } = req.body
  try {
    console.log('模拟支付请求:', { orderId, paymentMethod, userId: req.userId })
    const order = await Order.findOne({
      where: { id: orderId, user_id: req.userId }
    })
    if (!order) {
      console.log('模拟支付失败 - 订单不存在')
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    if (order.status === 'paid') {
      console.log('模拟支付失败 - 订单已支付')
      return res.status(400).json({ success: false, message: '订单已支付' })
    }
    console.log('订单信息:', order.dataValues)
    await order.update({ status: 'paid', payment_method: paymentMethod })
    console.log('订单状态已更新为 paid')
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        status: order.status,
        paymentMethod
      },
      message: '模拟支付成功'
    })
  } catch (error) {
    console.error('模拟支付失败:', error)
    res.status(500).json({ success: false, message: error.message || '模拟支付失败' })
  }
}

const alipayNotify = async (req, res) => {
  res.send('success')
}

const wechatNotify = async (req, res) => {
  res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>')
}

export {
  createPayment,
  getPaymentStatus,
  testPayment,
  alipayNotify,
  wechatNotify
}
