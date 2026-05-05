import { Order, OrderItem, Cart, Product, Address, sequelize } from '../models/index.js'

const generateOrderNo = () => {
  const now = new Date()
  const timestamp = now.getTime().toString().slice(-10)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${timestamp}${random}`
}

export const createOrder = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { addressId } = req.body

    const address = await Address.findOne({
      where: { id: addressId, user_id: req.userId },
      transaction: t
    })
    if (!address) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      })
    }

    const cartItems = await Cart.findAll({
      where: { user_id: req.userId, selected: true },
      include: [{ model: Product, as: 'product' }],
      transaction: t
    })
    if (cartItems.length === 0) {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: '购物车为空'
      })
    }

    let totalPrice = 0
    for (const item of cartItems) {
      if (!item.product || item.product.stock < item.quantity) {
        await t.rollback()
        return res.status(400).json({
          success: false,
          message: `商品 ${item.product?.title || ''} 库存不足`
        })
      }
      totalPrice += item.product.price * item.quantity
    }

    const orderNo = generateOrderNo()
    const order = await Order.create({
      order_no: orderNo,
      user_id: req.userId,
      total_price: totalPrice,
      status: 'pending',
      shipping_address_id: addressId,
      transaction: t
    })

    for (const item of cartItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity,
        transaction: t
      })
      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.product_id },
        transaction: t
      })
    }

    await Cart.destroy({
      where: { user_id: req.userId, selected: true },
      transaction: t
    })

    await t.commit()

    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    })

    res.status(201).json({
      success: true,
      data: createdOrder,
      message: '创建订单成功'
    })
  } catch (error) {
    await t.rollback()
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.userId },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json({
      success: true,
      data: orders,
      message: '获取订单列表成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Address, as: 'shippingAddress' }
      ]
    })
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }
    res.json({
      success: true,
      data: order,
      message: '获取订单详情成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const cancelOrder = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: OrderItem, as: 'items' }
      ],
      transaction: t
    })

    if (!order) {
      await t.rollback()
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }

    if (!['pending', 'paid'].includes(order.status)) {
      await t.rollback()
      return res.status(400).json({
        success: false,
        message: '订单状态不允许取消'
      })
    }

    for (const item of order.items) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.product_id },
        transaction: t
      })
    }

    await order.update({
      status: 'cancelled',
      transaction: t
    })

    await t.commit()

    const updatedOrder = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
      ]
    })

    res.json({
      success: true,
      data: updatedOrder,
      message: '取消订单成功'
    })
  } catch (error) {
    await t.rollback()
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
