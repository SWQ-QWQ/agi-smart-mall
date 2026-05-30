import { Cart, Product } from '../models/index.js'

export const getMyCart = async (req, res) => {
  try {
    const cartItems = await Cart.findAll({
      where: { user_id: req.userId },
      include: [
        { model: Product, as: 'product' }
      ],
      order: [['created_at', 'DESC']]
    })
    res.json({
      success: true,
      data: cartItems,
      message: '获取购物车成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const addToCart = async (req, res) => {
  try {
    const { product_id, productId, quantity } = req.body
    
    // 同时支持 product_id 和 productId 两种格式
    const productIdValue = product_id || productId
    
    if (!productIdValue) {
      return res.status(400).json({
        success: false,
        message: '缺少商品ID参数'
      })
    }

    const product = await Product.findByPk(productIdValue)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      })
    }

    const existingCartItem = await Cart.findOne({
      where: { user_id: req.userId, product_id: productIdValue }
    })

    let cartItem
    if (existingCartItem) {
      cartItem = await existingCartItem.update({
        quantity: existingCartItem.quantity + (quantity || 1)
      })
    } else {
      cartItem = await Cart.create({
        user_id: req.userId,
        product_id: productIdValue,
        quantity: quantity || 1,
        selected: true
      })
    }

    const result = await Cart.findByPk(cartItem.id, {
      include: [
        { model: Product, as: 'product' }
      ]
    })

    res.status(201).json({
      success: true,
      data: result,
      message: '添加到购物车成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateCartItem = async (req, res) => {
  try {
    const { quantity, selected } = req.body
    const cartItem = await Cart.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: '购物车项不存在'
      })
    }

    await cartItem.update({
      quantity: quantity || cartItem.quantity,
      selected: selected !== undefined ? selected : cartItem.selected
    })

    const updatedCartItem = await Cart.findByPk(req.params.id, {
      include: [
        { model: Product, as: 'product' }
      ]
    })

    res.json({
      success: true,
      data: updatedCartItem,
      message: '更新购物车成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const removeFromCart = async (req, res) => {
  try {
    const cartItem = await Cart.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: '购物车项不存在'
      })
    }

    await cartItem.destroy()
    res.json({
      success: true,
      message: '删除购物车项成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
