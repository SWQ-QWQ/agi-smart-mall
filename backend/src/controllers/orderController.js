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
    const { addressId: reqAddressId } = req.body
    let addressId = reqAddressId

    console.log('[创建订单] 开始处理，用户ID:', req.userId, '请求地址ID:', reqAddressId)

    // 如果没有提供 addressId，使用用户的默认地址或第一个地址
    let address
    if (addressId) {
      address = await Address.findOne({
        where: { id: addressId, user_id: req.userId },
        transaction: t
      })
    } else {
      address = await Address.findOne({
        where: { user_id: req.userId, is_default: true },
        transaction: t
      })
      if (!address) {
        address = await Address.findOne({
          where: { user_id: req.userId },
          transaction: t
        })
      }
    }
    
    if (!address) {
      await t.rollback()
      console.log('[创建订单] 没有找到地址')
      return res.status(200).json({
        success: false,
        message: '请先添加收货地址'
      })
    }
    
    // 使用找到的地址的地址id
    addressId = address.id
    console.log('[创建订单] 使用地址ID:', addressId)

    const cartItems = await Cart.findAll({
      where: { user_id: req.userId, selected: true },
      include: [{ model: Product, as: 'product' }],
      transaction: t
    })
    console.log('[创建订单] 购物车商品数量:', cartItems.length)
    
    if (cartItems.length === 0) {
      await t.rollback()
      return res.status(200).json({
        success: false,
        message: '购物车为空，请先选择商品'
      })
    }

    let totalPrice = 0
    for (const item of cartItems) {
      if (!item.product || item.product.stock < item.quantity) {
        await t.rollback()
        console.log('[创建订单] 库存不足，商品:', item.product?.title)
        return res.status(200).json({
          success: false,
          message: `商品 ${item.product?.title || ''} 库存不足`
        })
      }
      totalPrice += item.product.price * item.quantity
    }
    console.log('[创建订单] 订单总价:', totalPrice)

    const orderNo = generateOrderNo()
    const order = await Order.create({
      order_no: orderNo,
      user_id: req.userId,
      total_price: totalPrice,
      status: 'pending',
      shipping_address_id: addressId
    }, { transaction: t })
    console.log('[创建订单] 订单创建成功，订单ID:', order.id)

    for (const item of cartItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      }, { transaction: t })
      
      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.product_id },
        transaction: t
      })
    }
    console.log('[创建订单] 订单项和库存更新完成')

    await Cart.destroy({
      where: { user_id: req.userId, selected: true },
      transaction: t
    })
    console.log('[创建订单] 购物车已清空')

    await t.commit()
    console.log('[创建订单] 事务提交成功')

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
    console.error('[创建订单] 发生错误:', error)
    await t.rollback()
    res.status(200).json({
      success: false,
      message: error.message || '创建订单失败，请稍后重试'
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
