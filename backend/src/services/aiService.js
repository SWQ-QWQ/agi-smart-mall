import { Product, Cart, Order, OrderItem, Address, Category, User, Promotion, sequelize } from '../models/index.js'
import { tools } from './aiTools.js'
import { adminTools, executeAdminTool, getAdminSessionContext } from './adminAiService.js'
import { Op } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// 会话上下文存储（临时方案，实际应使用Redis等）
const sessionContext = new Map()

// 获取或创建会话上下文
const getSessionContext = (userId) => {
  if (!sessionContext.has(userId)) {
    sessionContext.set(userId, {
      lastSearchResults: [],
      lastCartResults: [],
      lastAddressResults: []
    })
  }
  return sessionContext.get(userId)
}

// RAG 检索函数：从商品中搜索相关内容（增强关键词拆分）
const retrieveRelevantProducts = async (query) => {
  try {
    const keywordParts = query.split(/[\s,.，、]+/).filter(part => part.length > 1)

    const where = {
      [Op.or]: keywordParts.flatMap(word => [
        { title: { [Op.like]: `%${word}%` } },
        { description: { [Op.like]: `%${word}%` } }
      ])
    }

    const products = await Product.findAll({
      where,
      limit: 3
    })

    return products.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      stock: p.stock,
      specs: p.specs
    }))
  } catch (error) {
    console.error('RAG 检索失败:', error)
    return []
  }
}

// 生成唯一订单号
const generateOrderNo = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${timestamp}${random}`
}

// 智能查找商品（通过索引或名称）
const findProductByContext = async (args, userId) => {
  const ctx = getSessionContext(userId)
  
  if (args.productId) {
    const product = await Product.findByPk(args.productId)
    if (product) return { success: true, product }
  }
  
  if (args.index && ctx.lastSearchResults.length > 0) {
    const idx = args.index - 1
    if (idx >= 0 && idx < ctx.lastSearchResults.length) {
      const product = await Product.findByPk(ctx.lastSearchResults[idx].id)
      if (product) return { success: true, product }
    }
  }
  
  if (args.productName) {
    const keyword = args.productName
    const where = {
      [Op.or]: [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } }
      ]
    }
    
    if (ctx.lastSearchResults.length > 0) {
      const matched = ctx.lastSearchResults.find(p => 
        p.title.includes(keyword) || (p.description && p.description.includes(keyword))
      )
      if (matched) {
        const product = await Product.findByPk(matched.id)
        if (product) return { success: true, product }
      }
    }
    
    const products = await Product.findAll({ where, limit: 1 })
    if (products.length > 0) return { success: true, product: products[0] }
  }
  
  return { success: false, message: '未找到匹配的商品' }
}

// 智能查找购物车项（通过索引或名称）
const findCartItemByContext = async (args, userId) => {
  const ctx = getSessionContext(userId)
  
  if (args.cartItemId) {
    const cartItem = await Cart.findOne({
      where: { id: args.cartItemId, user_id: userId },
      include: [{ model: Product, as: 'product' }]
    })
    if (cartItem) return { success: true, cartItem }
  }
  
  if (args.index && ctx.lastCartResults.length > 0) {
    const idx = args.index - 1
    if (idx >= 0 && idx < ctx.lastCartResults.length) {
      const cartItem = await Cart.findOne({
        where: { id: ctx.lastCartResults[idx].id, user_id: userId },
        include: [{ model: Product, as: 'product' }]
      })
      if (cartItem) return { success: true, cartItem }
    }
  }
  
  if (args.productName) {
    const keyword = args.productName
    
    if (ctx.lastCartResults.length > 0) {
      const matched = ctx.lastCartResults.find(item => 
        item.product?.title.includes(keyword)
      )
      if (matched) {
        const cartItem = await Cart.findOne({
          where: { id: matched.id, user_id: userId },
          include: [{ model: Product, as: 'product' }]
        })
        if (cartItem) return { success: true, cartItem }
      }
    }
    
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      include: [{ model: Product, as: 'product' }]
    })
    
    const matched = cartItems.find(item => 
      item.product?.title.includes(keyword)
    )
    
    if (matched) return { success: true, cartItem: matched }
  }
  
  return { success: false, message: '未找到匹配的购物车项' }
}

// 促销活动查询
const getPromotions = async () => {
  try {
    const promotions = await Promotion.findAll({
      where: { status: 'active' },
      order: [['created_at', 'DESC']]
    })

    if (promotions.length === 0) {
      return {
        success: true,
        data: [],
        message: '当前没有促销活动',
        summary: '目前没有正在进行的促销活动，请留意后续活动通知～',
        actions: []
      }
    }

    const promoSummary = promotions.map(p =>
      `${p.title}${p.description ? '：' + p.description : ''}${p.end_time ? '（截止' + new Date(p.end_time).toLocaleDateString('zh-CN') + '）' : ''}`
    ).join('；')

    return {
      success: true,
      data: promotions,
      message: '获取促销活动成功',
      summary: `当前有 ${promotions.length} 个促销活动：${promoSummary}`,
      actions: []
    }
  } catch (error) {
    console.error('获取促销活动失败:', error)
    return { success: false, message: '获取促销活动失败' }
  }
}

// 工具执行函数
const executeTool = async (toolName, toolArguments, userId) => {
  const ctx = getSessionContext(userId)
  
  try {
    switch (toolName) {
      case 'search_products': {
        const { keyword, categoryId, minPrice, maxPrice } = toolArguments

        let matchedCategoryIds = []
        if (keyword) {
          const keywordParts = keyword.split(/[\s,.，、]+/).filter(part => part.length > 0)
          const categoryConditions = keywordParts.flatMap(word => [
            { name: { [Op.like]: `%${word}%` } }
          ])

          const matchedCategories = await Category.findAll({
            where: { [Op.or]: categoryConditions }
          })
          matchedCategoryIds = matchedCategories.map(c => c.id)
        }

        const where = {}

        if (keyword) {
          const keywordParts = keyword.split(/[\s,.，、]+/).filter(part => part.length > 0)
          const allKeywords = [...keywordParts]

          for (const part of keywordParts) {
            if (part.length >= 4) {
              for (let k = 0; k <= part.length - 2; k++) {
                const sub = part.slice(k, k + 2)
                if (!allKeywords.includes(sub)) allKeywords.push(sub)
              }
            }
          }

          for (let i = 0; i < keywordParts.length; i++) {
            for (let j = i + 1; j <= keywordParts.length; j++) {
              const combo = keywordParts.slice(i, j).join('')
              if (combo.length > 1) {
                allKeywords.push(combo)
              }
            }
          }

          const uniqueKeywords = [...new Set(allKeywords)]
          const keywordConditions = uniqueKeywords.flatMap(word => [
            { title: { [Op.like]: `%${word}%` } },
            { description: { [Op.like]: `%${word}%` } }
          ])

          if (matchedCategoryIds.length > 0) {
            keywordConditions.push({ category_id: { [Op.in]: matchedCategoryIds } })
          }

          where[Op.or] = keywordConditions
        } else if (matchedCategoryIds.length > 0) {
          where.category_id = { [Op.in]: matchedCategoryIds }
        }

        if (categoryId) {
          where.category_id = categoryId
        }

        if (minPrice) {
          where.price = { ...where.price, [Op.gte]: minPrice }
        }

        if (maxPrice) {
          where.price = { ...where.price, [Op.lte]: maxPrice }
        }

        const order = matchedCategoryIds.length > 0
          ? [['category_id', 'ASC']]
          : []

        const products = await Product.findAll({
          where,
          attributes: ['id', 'title', 'description', 'image', 'price', 'stock', 'category_id', 'brand', 'sales', 'rating'],
          limit: 10,
          order,
          include: [{ model: Category, as: 'category' }]
        })

        let summary
        if (products.length === 0) {
          summary = `抱歉，没有找到与"${keyword}"相关的商品。试试其他关键词，比如"耳机"、"T恤"、"电子产品"、"家居"等`
        } else if (products.length === 1) {
          const categoryName = products[0].category?.name || '未分类'
          summary = `找到 1 个相关商品：【${categoryName}】${products[0].title}，价格 ¥${products[0].price}。${products[0].description?.slice(0, 50)}...`
        } else {
          const top3 = products.slice(0, 3)
          summary = `找到 ${products.length} 个相关商品，推荐：${top3.map(p => `【${p.category?.name || '未分类'}】${p.title}(¥${p.price})`).join('、')}...`
        }

        const productList = products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          image: p.image || '',
          stock: p.stock,
          brand: p.brand || '',
          sales: p.sales || 0,
          rating: p.rating || 0,
          category: p.category?.name || '未分类',
          description: p.description?.slice(0, 100) || ''
        }))

        ctx.lastSearchResults = productList

        return {
          success: true,
          data: products,
          message: '搜索成功',
          summary,
          products: productList,
          actions: products.length > 0 ? ['showProducts'] : []
        }
      }

      case 'get_product_detail': {
        const product = await Product.findByPk(toolArguments.productId)
        if (!product) {
          return { success: false, message: '商品不存在' }
        }
        return {
          success: true,
          data: product,
          message: '获取商品详情成功',
          summary: `商品名称：${product.title}，价格：¥${product.price}，库存：${product.stock}件。${product.description}`,
          actions: []
        }
      }

      case 'add_to_cart': {
        const { quantity = 1 } = toolArguments
        
        const findResult = await findProductByContext(toolArguments, userId)
        
        if (!findResult.success) {
          return { 
            success: false, 
            message: findResult.message || '请先搜索商品或指定商品ID' 
          }
        }

        const product = findResult.product

        if (product.stock < quantity) {
          return { success: false, message: '库存不足' }
        }

        const existingItem = await Cart.findOne({
          where: { user_id: userId, product_id: product.id }
        })

        let cartItem
        if (existingItem) {
          cartItem = await existingItem.update({
            quantity: existingItem.quantity + quantity
          })
        } else {
          cartItem = await Cart.create({
            user_id: userId,
            product_id: product.id,
            quantity,
            selected: true
          })
        }

        return {
          success: true,
          data: cartItem,
          message: '已添加到购物车',
          summary: `已将 ${product.title} x ${quantity} 加入购物车，当前购物车中该商品数量为 ${cartItem.quantity}`,
          actions: ['refreshCart']
        }
      }

      case 'get_cart': {
        const cartItems = await Cart.findAll({
          where: { user_id: userId },
          include: [{ model: Product, as: 'product' }]
        })
        
        ctx.lastCartResults = cartItems.map(item => ({
          id: item.id,
          product: item.product
        }))
        
        const totalPrice = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0)
        const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

        const itemSummary = cartItems.map((item, idx) =>
          `${idx + 1}. ${item.product?.title || '未知商品'} x ${item.quantity} (¥${(item.product?.price || 0) * item.quantity})`
        ).join('、')

        return {
          success: true,
          data: cartItems,
          message: '获取购物车成功',
          summary: cartItems.length > 0
            ? `购物车中有 ${totalCount} 件商品，共 ${cartItems.length} 种，总计 ¥${totalPrice.toFixed(2)}。商品：${itemSummary}`
            : '购物车是空的，快去选购吧！',
          actions: []
        }
      }

      case 'update_cart_item': {
        const { quantity, selected } = toolArguments
        
        const findResult = await findCartItemByContext(toolArguments, userId)
        
        if (!findResult.success) {
          return { 
            success: false, 
            message: findResult.message || '请先查看购物车或指定购物车项ID' 
          }
        }

        const cartItem = findResult.cartItem
        const updateData = {}
        if (quantity !== undefined) updateData.quantity = quantity
        if (selected !== undefined) updateData.selected = selected

        await cartItem.update(updateData)

        const changes = []
        if (quantity !== undefined) changes.push(`数量改为 ${quantity}`)
        if (selected !== undefined) changes.push(`选中状态改为 ${selected ? '已选中' : '未选中'}`)

        return {
          success: true,
          data: cartItem,
          message: '更新购物车成功',
          summary: `已更新 ${cartItem.product?.title || '商品'}：${changes.join('，')}`,
          actions: ['refreshCart']
        }
      }

      case 'remove_from_cart': {
        const findResult = await findCartItemByContext(toolArguments, userId)
        
        if (!findResult.success) {
          return { 
            success: false, 
            message: findResult.message || '请先查看购物车或指定购物车项ID' 
          }
        }

        const cartItem = findResult.cartItem
        const productName = cartItem.product?.title || '商品'
        await cartItem.destroy()
        
        return {
          success: true,
          message: '删除购物车项成功',
          summary: `已从购物车中删除 ${productName}`,
          actions: ['refreshCart']
        }
      }

      case 'create_order': {
        const transaction = await sequelize.transaction()

        try {
          let address
          
          if (toolArguments.addressId) {
            address = await Address.findOne({
              where: { id: toolArguments.addressId, user_id: userId },
              transaction
            })
          } else {
            address = await Address.findOne({
              where: { user_id: userId, is_default: true },
              transaction
            })
            if (!address) {
              address = await Address.findOne({
                where: { user_id: userId },
                transaction
              })
            }
          }

          if (!address) {
            await transaction.rollback()
            return { success: false, message: '请先添加收货地址' }
          }

          const cartItems = await Cart.findAll({
            where: { user_id: userId, selected: true },
            include: [{ model: Product, as: 'product' }],
            transaction
          })

          if (cartItems.length === 0) {
            await transaction.rollback()
            return { success: false, message: '购物车为空或没有选中的商品' }
          }

          let totalPrice = 0
          for (const item of cartItems) {
            if (!item.product) {
              await transaction.rollback()
              return { success: false, message: `商品不存在，请检查购物车` }
            }
            if (item.quantity <= 0) {
              await transaction.rollback()
              return { success: false, message: `商品${item.product.title}的数量不能为0或负数，请调整购物车` }
            }
            if (item.product.stock < item.quantity) {
              await transaction.rollback()
              return { success: false, message: `商品${item.product.title}库存不足，当前库存${item.product.stock}，您要购买${item.quantity}件，请调整数量` }
            }
            totalPrice += item.product.price * item.quantity
          }

          const orderNo = generateOrderNo()
          const order = await Order.create({
            order_no: orderNo,
            user_id: userId,
            total_price: totalPrice,
            status: 'paid',
            shipping_address_id: address.id
          }, { transaction })

          for (const item of cartItems) {
            await OrderItem.create({
              order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price,
              subtotal: item.product.price * item.quantity
            }, { transaction })

            await Product.decrement('stock', {
              by: item.quantity,
              where: { id: item.product_id },
              transaction
            })
          }

          await Cart.destroy({
            where: { user_id: userId, selected: true },
            transaction
          })

          await transaction.commit()

          return {
            success: true,
            data: order,
            message: '创建订单成功',
            summary: `订单创建成功！订单号：${orderNo}，共 ${cartItems.length} 种商品，订单金额：¥${totalPrice.toFixed(2)}。收货地址：${address.province}${address.city}${address.district}${address.detail}，收货人：${address.receiver_name}`,
            actions: ['refreshCart', 'refreshOrders']
          }
        } catch (error) {
          await transaction.rollback()
          throw error
        }
      }

      case 'get_my_orders': {
        const orders = await Order.findAll({
          where: { user_id: userId },
          include: [
            { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
          ],
          order: [['created_at', 'DESC']]
        })

        const orderSummary = orders.map(order => {
          const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
          const statusText = {
            pending: '待付款',
            paid: '已付款',
            shipped: '已发货',
            completed: '已完成',
            cancelled: '已取消'
          }[order.status] || order.status
          return `订单号 ${order.order_no}（${statusText}）：¥${Number(order.total_price || 0).toFixed(2)}，${itemCount}件商品`
        }).join('；')

        return {
          success: true,
          data: orders,
          message: '获取订单列表成功',
          summary: orders.length > 0
            ? `你有 ${orders.length} 个订单：${orderSummary}`
            : '你还没有订单，快去购物吧！',
          actions: []
        }
      }

      case 'get_order_detail': {
        const order = await Order.findOne({
          where: { id: toolArguments.orderId, user_id: userId },
          include: [
            { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
            { model: Address, as: 'shippingAddress' }
          ]
        })

        if (!order) {
          return { success: false, message: '订单不存在' }
        }

        const statusText = {
          pending: '待付款',
          paid: '已付款',
          shipped: '已发货',
          completed: '已完成',
          cancelled: '已取消'
        }[order.status] || order.status

        const itemsSummary = order.items?.map(item =>
          `${item.product?.title} x ${item.quantity} (¥${item.subtotal.toFixed(2)})`
        ).join('、')

        const addr = order.shippingAddress
        return {
          success: true,
          data: order,
          message: '获取订单详情成功',
          summary: `订单号：${order.order_no}，状态：${statusText}，金额：¥${order.total_price.toFixed(2)}。商品：${itemsSummary}。收货地址：${addr?.province}${addr?.city}${addr?.district}${addr?.detail}`,
          actions: []
        }
      }

      case 'cancel_order': {
        const transaction = await sequelize.transaction()

        try {
          const order = await Order.findOne({
            where: { id: toolArguments.orderId, user_id: userId },
            transaction
          })

          if (!order) {
            await transaction.rollback()
            return { success: false, message: '订单不存在' }
          }

          if (!['pending', 'paid'].includes(order.status)) {
            await transaction.rollback()
            return { success: false, message: '订单状态不允许取消' }
          }

          await order.update({ status: 'cancelled' }, { transaction })

          const orderItems = await OrderItem.findAll({
            where: { order_id: order.id },
            transaction
          })

          for (const item of orderItems) {
            await Product.increment('stock', {
              by: item.quantity,
              where: { id: item.product_id },
              transaction
            })
          }

          await transaction.commit()

          return {
            success: true,
            data: order,
            message: '取消订单成功',
            summary: `订单 ${order.order_no} 已取消，库存已恢复`,
            actions: ['refreshOrders', 'refreshCart']
          }
        } catch (error) {
          await transaction.rollback()
          throw error
        }
      }

      case 'get_addresses': {
        const addresses = await Address.findAll({
          where: { user_id: userId }
        })

        ctx.lastAddressResults = addresses

        const addrSummary = addresses.map((addr, idx) =>
          `${idx + 1}. ${addr.receiver_name}(${addr.phone})：${addr.province}${addr.city}${addr.district}${addr.detail}${addr.is_default ? '（默认）' : ''}`
        ).join('；')

        return {
          success: true,
          data: addresses,
          message: '获取地址列表成功',
          summary: addresses.length > 0
            ? `你有 ${addresses.length} 个收货地址：${addrSummary}`
            : '你还没有添加收货地址，请先添加',
          actions: []
        }
      }

      case 'add_address': {
        const { receiver_name, phone, province, city, district, detail, is_default = false } = toolArguments

        if (is_default) {
          await Address.update({ is_default: false }, { where: { user_id: userId } })
        }

        const address = await Address.create({
          user_id: userId,
          receiver_name,
          phone,
          province,
          city,
          district,
          detail,
          is_default
        })

        return {
          success: true,
          data: address,
          message: '添加地址成功',
          summary: `已添加新收货地址：${receiver_name}(${phone})，${province}${city}${district}${detail}${is_default ? '，已设为默认地址' : ''}`,
          actions: []
        }
      }

      case 'update_address': {
        const { addressId, ...updateFields } = toolArguments

        const address = await Address.findOne({
          where: { id: addressId, user_id: userId }
        })

        if (!address) {
          return { success: false, message: '地址不存在或无权修改' }
        }

        if (updateFields.is_default === true) {
          await Address.update({ is_default: false }, { where: { user_id: userId } })
        }

        await address.update(updateFields)

        const changes = []
        if (updateFields.receiver_name) changes.push(`收货人改为${updateFields.receiver_name}`)
        if (updateFields.phone) changes.push(`电话改为${updateFields.phone}`)
        if (updateFields.is_default === true) changes.push('已设为默认地址')

        return {
          success: true,
          data: address,
          message: '地址修改成功',
          summary: `地址修改成功：${changes.join('，') || '信息已更新'}`,
          actions: []
        }
      }

      case 'delete_address': {
        const { addressId } = toolArguments

        const address = await Address.findOne({
          where: { id: addressId, user_id: userId }
        })

        if (!address) {
          return { success: false, message: '地址不存在或无权删除' }
        }

        const addressInfo = `${address.receiver_name}的地址`
        await address.destroy()

        return {
          success: true,
          message: '删除地址成功',
          summary: `已删除 ${addressInfo}`,
          actions: []
        }
      }

      case 'get_user_info': {
        const user = await User.findByPk(userId, {
          attributes: ['id', 'username', 'email', 'phone', 'avatar', 'status', 'role', 'created_at']
        })

        if (!user) {
          return { success: false, message: '用户不存在' }
        }

        return {
          success: true,
          data: user,
          message: '获取用户信息成功',
          summary: `你的账户信息：用户名 ${user.username}，邮箱 ${user.email || '未设置'}，手机 ${user.phone || '未设置'}`,
          actions: []
        }
      }

      case 'update_user_info': {
        const { email, phone, avatar } = toolArguments
        const updateData = {}

        if (email !== undefined) updateData.email = email
        if (phone !== undefined) updateData.phone = phone
        if (avatar !== undefined) updateData.avatar = avatar

        if (Object.keys(updateData).length === 0) {
          return { success: false, message: '没有要修改的字段' }
        }

        await User.update(updateData, { where: { id: userId } })

        const changes = []
        if (email !== undefined) changes.push(`邮箱改为${email}`)
        if (phone !== undefined) changes.push(`手机号改为${phone}`)

        return {
          success: true,
          message: '个人信息修改成功',
          summary: `个人信息已更新：${changes.join('，')}`,
          actions: []
        }
      }

      case 'change_password': {
        const { oldPassword, newPassword } = toolArguments

        if (!oldPassword || !newPassword) {
          return { success: false, message: '旧密码和新密码都不能为空' }
        }

        if (newPassword.length < 6) {
          return { success: false, message: '新密码长度不能少于6位' }
        }

        const user = await User.findByPk(userId)

        if (!user) {
          return { success: false, message: '用户不存在' }
        }

        const isValid = await user.validatePassword(oldPassword)

        if (!isValid) {
          return { success: false, message: '旧密码错误' }
        }

        await user.update({ password: newPassword })

        return {
          success: true,
          message: '密码修改成功',
          summary: '密码修改成功，下次登录请使用新密码',
          actions: []
        }
      }

      case 'get_promotions': {
        const result = await getPromotions()
        return result
      }

      default:
        return { success: false, message: '未知工具', actions: [] }
    }
  } catch (error) {
    console.error('工具执行失败:', error)
    return { success: false, message: '执行失败: ' + error.message, actions: [] }
  }
}

// 调用大模型 API - 严格按照千问大模型 API 格式
const callLLM = async (messages, tools, toolChoice = 'auto') => {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  const model = process.env.AI_MODEL || 'qwen-plus'

  console.log('发送给千问的 messages 数量:', messages.length)
  console.log('发送给千问的 tools 数量:', tools?.length)
  console.log('tool_choice 设置:', toolChoice)

  if (!apiKey) {
    console.warn('未配置 OPENAI_API_KEY，AI 服务不可用')
    return null
  }

  try {
    const requestBody = {
      model: model,
      messages: messages.map(msg => {
        let content = msg.content
        if (msg.role === 'assistant' && msg.tool_calls && (Array.isArray(content) || content === null || content === undefined)) {
          content = ""
        }
        const baseMsg = {
          role: msg.role,
          content: content
        }
        if (msg.tool_calls) {
          baseMsg.tool_calls = msg.tool_calls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: typeof tc.function.arguments === 'string'
                ? tc.function.arguments
                : JSON.stringify(tc.function.arguments)
            }
          }))
        }
        if (msg.role === 'tool') {
          baseMsg.tool_call_id = msg.tool_call_id
        }
        return baseMsg
      }),
      tools: tools,
      tool_choice: toolChoice,
      temperature: 0.7,
      max_tokens: 4096
    }

    console.debug('千问大模型 API 请求体:', JSON.stringify(requestBody, null, 2))

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== 千问大模型 API 调用失败 ===')
      console.error(`HTTP 状态码: ${response.status} (${response.statusText})`)
      console.error(`请求 URL: ${baseUrl}/chat/completions`)
      console.error('响应内容:', errorText)
      console.error('===========================')
      return null
    }

    const result = await response.json()
    console.log('千问返回的 tool_calls:', result?.choices?.[0]?.message?.tool_calls ? `${result.choices[0].message.tool_calls.length} 个` : '无')
    if (!result?.choices?.[0]?.message?.tool_calls) {
      console.log('千问直接返回了文本回复:', result?.choices?.[0]?.message?.content?.slice(0, 200))
    }
    console.debug('千问大模型 API 响应:', JSON.stringify(result, null, 2))
    return result
  } catch (error) {
    console.error('=== 千问大模型 API 调用异常 ===')
    console.error('异常信息:', error.message)
    console.error('异常堆栈:', error.stack)
    console.error('===========================')
    if (error.name === 'AbortError') {
      console.warn('请求超时 - 可能是网络问题或API响应过慢')
    }
    return null
  }
}

// 构建 assistant 消息（包含 tool_calls）
const buildAssistantMessage = (message) => {
  const assistantMsg = {
    role: 'assistant',
    content: message.content || ''
  }
  if (message.tool_calls) {
    assistantMsg.tool_calls = message.tool_calls.map(tc => ({
      id: tc.id,
      type: 'function',
      function: {
        name: tc.function.name,
        arguments: typeof tc.function.arguments === 'string'
          ? tc.function.arguments
          : JSON.stringify(tc.function.arguments)
      }
    }))
  }
  return assistantMsg
}

export const chat = async (messages, userId, userRole = 'user') => {
  try {
    const actions = []
    const products = []
    let lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''

    const isAdmin = userRole === 'admin'
    const currentTools = isAdmin ? adminTools : tools

    let systemPrompt = ''
    
    if (isAdmin) {
      const adminCtx = getAdminSessionContext(userId)
      const ctxProducts = adminCtx?.lastSearchResults || []
      let contextHint = ''

      if (ctxProducts.length === 1) {
        const p = ctxProducts[0]
        contextHint = `\n## 当前上下文\n管理员上一次搜索只找到1个商品：${p.title}（ID:${p.id}，¥${p.price}，库存${p.stock}）。\n当管理员发出修改指令（如"修改价格为1888"、"下架它"、"增加库存到100"）且未指定商品ID时，你可以直接调用工具，不传productId参数，系统会自动使用该商品ID=${p.id}。`
      } else if (ctxProducts.length > 1) {
        contextHint = `\n## 当前上下文\n管理员上一次搜索找到${ctxProducts.length}个商品：\n${ctxProducts.map((p, i) => `${i + 1}. ${p.title}（ID:${p.id}，¥${p.price}，库存${p.stock}）`).join('\n')}\n\n当管理员发出修改指令但未指定具体商品时，先列出以上商品让管理员选择，不要猜测。`
      }

      systemPrompt = `你是"小舒"，一名专业的电商运营管理助手。你的唯一职责是帮助管理员高效管理商城后台。${contextHint}

## 🚨 最高优先级铁律：禁止编造任何数据！

### 🔴 绝对禁止的行为：
1. **禁止编造商品**：无论任何情况，都不能列出工具未返回的商品
   - 工具返回1个商品 → 你只能说那1个商品
   - 工具返回3个商品 → 你只能列那3个商品
   - 工具返回0个商品 → 你必须说"没有找到相关商品"
   - **严禁**自行添加任何品牌、型号、价格、库存

2. **禁止编造数据**：不能编造订单号、用户信息、统计数据等
3. **禁止编造活动**：不能编造促销名称、活动时间等

### 📋 正确的工作流程：
当管理员询问商品时，你必须：
1. 调用 search_products 工具
2. **严格按照工具返回的商品列表进行回复**
3. 不能多列、不能少列、不能更改任何商品信息

### ⚠️ 违规后果：
如果被发现编造商品，将严重影响系统可信度。你必须100%依赖工具返回的真实数据。

## 核心能力

1. 数据查询：仪表盘数据、销售统计、用户增长趋势
2. 商品管理：查看、搜索、新增、编辑、下架商品
3. 用户管理：查看用户列表、搜索用户、封禁/启封用户
4. 订单管理：查看全部订单、筛选订单、修改订单状态、发货
5. 分类管理：查看分类统计、新增/编辑分类

## 可用工具

- get_dashboard_stats: 获取仪表盘统计数据（总用户、总商品、总订单、今日订单）
- list_users: 查看用户列表，支持搜索和状态筛选
- toggle_user_status: 封禁或启用用户（需要confirm确认）
- list_all_orders: 查看所有用户订单，支持按状态筛选
- update_order_status: 修改订单状态（发货、完成等）
- add_product: 添加新商品
- edit_product: 编辑商品信息
- update_product_price: 修改商品价格（若未提供productId会自动使用上下文）
- update_product_stock: 修改商品库存（若未提供productId会自动使用上下文）
- update_product_status: 修改商品上下架状态（若未提供productId会自动使用上下文）
- delete_product: 删除商品（需要confirm确认）
- get_category_stats: 查看各分类商品数量统计

## 重要约束

- 管理员问商品时，你只展示数据（名称、价格、库存、状态），不要做导购式推荐
- 管理员问"推荐"时，你只基于销量/评分等客观数据排序展示
- 回复简洁专业，用数据说话，不加营销语气词
- 购物车、下单、收货地址等前台功能，不在你的职责范围
- 敏感操作（封禁用户、删除商品）必须要求管理员确认

## 回复风格

- 专业简洁：用简短清晰的语言回复
- 数据导向：提供准确的数据和统计
- 操作导向：明确告知操作结果
- 使用纯文本格式，不要使用Markdown标记

## 回复示例

管理员问："最近销量怎么样？"
小舒答："本月截止目前共完成156笔订单，销售额¥48,230。相比上月同期增长12%。"

管理员问："帮我找蓝牙耳机"
小舒答："已搜索到2款蓝牙耳机：索尼WF-1000XM5（¥2199，库存23，在售）、漫步者NeoBuds Pro（¥899，库存56，在售）。"

管理员问："有什么推荐？"
小舒答："以下为近30天销量Top5商品，供参考：瑜伽垫、苹果数据线、罗马仕充电宝等。"
`
    } else {
      systemPrompt = `你是"小舒"，一个活泼可爱、乐于助人的购物管家。

## 🚨 最高优先级铁律：禁止编造任何数据！

### 🔴 绝对禁止的行为：
1. **禁止编造商品**：无论任何情况，都不能列出工具未返回的商品
   - 工具返回1个商品 → 你只能说那1个商品
   - 工具返回3个商品 → 你只能列那3个商品
   - 工具返回0个商品 → 你必须说"没有找到相关商品"
   - **严禁**自行添加任何品牌、型号、价格、库存

2. **禁止编造订单**：不能编造订单号、订单状态、收货地址等
3. **禁止编造活动**：不能编造促销名称、活动时间等
4. **禁止编造用户信息**：不能编造用户名、手机号、邮箱等

### 📋 正确的工作流程：
当用户询问商品时，你必须：
1. 调用 search_products 工具
2. **严格按照工具返回的商品列表进行回复**
3. 不能多列、不能少列、不能更改任何商品信息

### ⚠️ 违规后果：
如果被发现编造数据，将严重影响用户信任。你必须100%依赖工具返回的真实数据。

## 🚨 你必须调用工具！不要直接回答！不要编造！不要找借口！

对于以下请求，必须先调用工具获取真实数据：
- "推荐"、"找"、"搜索"、"有什么"、"看看" → 调用 search_products
- "购物车" → 调用 get_cart
- "订单" → 调用 get_my_orders
- "促销"、"活动" → 调用 get_promotions
- "地址"、"收货" → 调用 get_addresses
- "我的信息"、"账户" → 调用 get_user_info
- "修改邮箱"、"改邮箱"、"换邮箱" → 调用 update_user_info (参数: email)
- "修改手机"、"改手机"、"换手机"、"改电话号码" → 调用 update_user_info (参数: phone)
- "修改密码"、"改密码"、"换密码" → 调用 change_password (参数: oldPassword, newPassword)

工具返回真实数据后，用自然语言告诉用户即可。

## 🔴 铁律：工具返回什么，你说什么。工具没返回的，绝不能说。

如果 get_promotions 返回空 → 说"暂无促销活动"，绝不能编造"618大促""新年特惠"等。
如果 get_my_orders 返回空 → 说"你还没有订单"，绝不能编造订单号或状态。
如果 search_products 返回空 → 说"没有找到相关商品"。
绝不能自己编造商品名、活动名、订单号、日期、价格等任何数据。

## 🔗 链接
回复中可用：[商品名](/product/ID) [购物车](/cart) [我的订单](/orders)
- 购物车相关场景（如“去下单”、“去结算”）→ 指向 [购物车](/cart)
- 订单相关场景（如“我的订单”、“查看订单”）→ 指向 [我的订单](/orders)

## 🌟 性格
活泼友好、简洁高效。
`
    }

    let currentMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    const intentToTool = (msg) => {
      if (/购物车/.test(msg)) return 'get_cart'
      if (/订单/.test(msg)) return 'get_my_orders'
      if (/促销|活动/.test(msg)) return 'get_promotions'
      if (/地址|收货/.test(msg)) return 'get_addresses'
      if (/我的信息|账户/.test(msg)) return 'get_user_info'
      if (/推荐|找|搜索|看看|有什么|蓝牙|耳机|想要|帮我/.test(msg)) return 'search_products'
      return null
    }
    const specificTool = isAdmin ? null : intentToTool(lastUserMessage)
    const firstToolChoice = specificTool
      ? { type: 'function', function: { name: specificTool } }
      : 'auto'

    console.log('用户意图识别:', specificTool || '闲聊', '→ tool_choice:', JSON.stringify(firstToolChoice))

    let llmResponse = await callLLM(currentMessages, currentTools, firstToolChoice)

    if (!llmResponse) {
      return {
        reply: '暂时无法完成，请稍后重试',
        products: [],
        actions: []
      }
    }

    let assistantMessage = llmResponse.choices[0].message

    const hasToolCalls = assistantMessage.tool_calls?.length > 0
    if (!hasToolCalls && specificTool) {
      console.warn(`模型未调用工具 ${specificTool}，直接返回文本，已拦截:`, assistantMessage.content?.slice(0, 200))
      return {
        reply: '暂时无法完成，请稍后重试',
        products: [],
        actions: []
      }
    }

    if (hasToolCalls && specificTool) {
      const calledRightTool = assistantMessage.tool_calls.some(tc => tc.function.name === specificTool)
      if (!calledRightTool) {
        console.warn(`模型调用了错误工具，预期 ${specificTool}，实际:`, assistantMessage.tool_calls.map(tc => tc.function.name).join(', '))
        // 添加指令消息要求重试
        currentMessages.push({ role: 'assistant', content: '', tool_calls: assistantMessage.tool_calls })
        currentMessages.push({
          role: 'tool',
          tool_call_id: assistantMessage.tool_calls[0].id,
          content: JSON.stringify({ success: false, message: '请调用 ' + specificTool + ' 工具' })
        })
        const retryResponse = await callLLM(currentMessages, currentTools, { type: 'function', function: { name: specificTool } })
        if (!retryResponse?.choices?.[0]?.message?.tool_calls?.some(tc => tc.function.name === specificTool)) {
          console.warn('重试后模型仍未调用正确工具，已拦截')
          return { reply: '暂时无法完成，请稍后重试', products: [], actions: [] }
        }
        assistantMessage = retryResponse.choices[0].message
      }
    }

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      currentMessages.push(buildAssistantMessage(assistantMessage))

      for (const toolCall of assistantMessage.tool_calls) {
        let toolArguments = {}

        try {
          toolArguments = typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments
        } catch (e) {
          console.error('工具参数解析失败:', e)
        }

        console.debug(`执行工具: ${toolCall.function.name}, 参数:`, toolArguments)

        let toolResult
        const userToolNames = new Set(tools.map(t => t.function.name))
        const adminOnlyToolNames = adminTools.filter(t => !userToolNames.has(t.function.name)).map(t => t.function.name)
        const isSharedAdminTool = isAdmin && toolCall.function.name === 'search_products'
        if (adminOnlyToolNames.includes(toolCall.function.name) || isSharedAdminTool) {
          toolResult = await executeAdminTool(
            toolCall.function.name,
            toolArguments,
            userId,
            userRole
          )
        } else {
          toolResult = await executeTool(
            toolCall.function.name,
            toolArguments,
            userId
          )
        }

        console.debug(`工具结果:`, toolResult)

        if (toolResult.actions && toolResult.actions.length > 0) {
          actions.push(...toolResult.actions)
        }

        if (toolResult.products && toolResult.products.length > 0) {
          products.push(...toolResult.products)
        }

        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: (() => {
            const base = {
              success: toolResult.success,
              message: toolResult.message,
              summary: toolResult.summary || toolResult.message
            }
            if (toolCall.function.name === 'search_products' && toolResult.products && toolResult.products.length > 0) {
              base.products = toolResult.products.map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                image: p.image || '',
                stock: p.stock,
                brand: p.brand || '',
                sales: p.sales || 0,
                rating: p.rating || 0,
                category: p.category || '未分类',
                description: p.description ? p.description.slice(0, 200) : ''
              }))
            }
            if (toolCall.function.name === 'get_cart' && toolResult.data) {
              base.items = toolResult.data.map(item => ({
                id: item.id,
                productId: item.product_id,
                title: item.product?.title || '未知商品',
                price: item.product?.price || 0,
                quantity: item.quantity,
                selected: item.selected
              }))
            }
            if (toolCall.function.name === 'get_my_orders' && toolResult.data) {
              base.orders = toolResult.data.map(order => ({
                id: order.id,
                orderNo: order.order_no,
                totalPrice: order.total_price,
                status: order.status,
                itemCount: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
                items: order.items?.map(item => ({
                  title: item.product?.title || '未知商品',
                  quantity: item.quantity,
                  price: item.price
                }))
              }))
            }
            if (toolCall.function.name === 'get_promotions' && toolResult.data) {
              base.promotions = toolResult.data.map(promo => ({
                id: promo.id,
                title: promo.title,
                description: promo.description || '',
                endTime: promo.end_time,
                status: promo.status
              }))
            }
            if (toolCall.function.name === 'get_addresses' && toolResult.data) {
              base.addresses = toolResult.data.map(addr => ({
                id: addr.id,
                receiverName: addr.receiver_name,
                phone: addr.phone,
                province: addr.province,
                city: addr.city,
                district: addr.district,
                detail: addr.detail,
                isDefault: addr.is_default
              }))
            }
            if (toolCall.function.name === 'get_user_info' && toolResult.data) {
              base.user = {
                id: toolResult.data.id,
                username: toolResult.data.username,
                email: toolResult.data.email || '',
                phone: toolResult.data.phone || '',
                role: toolResult.data.role
              }
            }
            return JSON.stringify(base)
          })()
        })
      }

      llmResponse = await callLLM(currentMessages, currentTools)

      if (!llmResponse) {
        return {
          reply: '暂时无法完成，请稍后重试',
          products: [],
          actions: []
        }
      }

      assistantMessage = llmResponse.choices[0].message
    }

    // 兼容旧的 function_call 格式
    while (assistantMessage.function_call) {
      const toolCall = assistantMessage.function_call
      let toolArguments = {}

      try {
        toolArguments = typeof toolCall.arguments === 'string'
          ? JSON.parse(toolCall.arguments)
          : toolCall.arguments
      } catch (e) {
        console.error('工具参数解析失败:', e)
      }

      let toolResult
      const userToolNames = new Set(tools.map(t => t.function.name))
      const adminOnlyToolNames = adminTools.filter(t => !userToolNames.has(t.function.name)).map(t => t.function.name)
      const isSharedAdminTool2 = isAdmin && toolCall.name === 'search_products'
      if (adminOnlyToolNames.includes(toolCall.name) || isSharedAdminTool2) {
        toolResult = await executeAdminTool(
          toolCall.name,
          toolArguments,
          userId,
          userRole
        )
      } else {
        toolResult = await executeTool(
          toolCall.name,
          toolArguments,
          userId
        )
      }

      if (toolResult.actions && toolResult.actions.length > 0) {
        actions.push(...toolResult.actions)
      }

      if (toolResult.products && toolResult.products.length > 0) {
        products.push(...toolResult.products)
      }

      currentMessages.push({
        role: 'assistant',
        content: '',
        function_call: toolCall
      })
      currentMessages.push({
        role: 'function',
        name: toolCall.name,
        content: (() => {
          const base = {
            success: toolResult.success,
            message: toolResult.message,
            summary: toolResult.summary || toolResult.message
          }
          if (toolCall.name === 'search_products' && toolResult.products && toolResult.products.length > 0) {
            base.products = toolResult.products.map(p => ({
              id: p.id,
              title: p.title,
              price: p.price,
              image: p.image || '',
              stock: p.stock,
              brand: p.brand || '',
              sales: p.sales || 0,
              rating: p.rating || 0,
              category: p.category || '未分类',
              description: p.description ? p.description.slice(0, 200) : ''
            }))
          }
          if (toolCall.name === 'get_cart' && toolResult.data) {
            base.items = toolResult.data.map(item => ({
              id: item.id,
              productId: item.product_id,
              title: item.product?.title || '未知商品',
              price: item.product?.price || 0,
              quantity: item.quantity,
              selected: item.selected
            }))
          }
          if (toolCall.name === 'get_my_orders' && toolResult.data) {
            base.orders = toolResult.data.map(order => ({
              id: order.id,
              orderNo: order.order_no,
              totalPrice: order.total_price,
              status: order.status,
              itemCount: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
              items: order.items?.map(item => ({
                title: item.product?.title || '未知商品',
                quantity: item.quantity,
                price: item.price
              }))
            }))
          }
          if (toolCall.name === 'get_promotions' && toolResult.data) {
            base.promotions = toolResult.data.map(promo => ({
              id: promo.id,
              title: promo.title,
              description: promo.description || '',
              endTime: promo.end_time,
              status: promo.status
            }))
          }
          if (toolCall.name === 'get_addresses' && toolResult.data) {
            base.addresses = toolResult.data.map(addr => ({
              id: addr.id,
              receiverName: addr.receiver_name,
              phone: addr.phone,
              province: addr.province,
              city: addr.city,
              district: addr.district,
              detail: addr.detail,
              isDefault: addr.is_default
            }))
          }
          if (toolCall.name === 'get_user_info' && toolResult.data) {
            base.user = {
              id: toolResult.data.id,
              username: toolResult.data.username,
              email: toolResult.data.email || '',
              phone: toolResult.data.phone || '',
              role: toolResult.data.role
            }
          }
          return JSON.stringify(base)
        })()
      })

      llmResponse = await callLLM(currentMessages, currentTools)

      if (!llmResponse) {
        return {
          reply: '暂时无法完成，请稍后重试',
          products: [],
          actions: []
        }
      }

      assistantMessage = llmResponse.choices[0].message
    }

    const uniqueActions = [...new Set(actions)]
    const uniqueProducts = products.length > 0 ? [...new Map(products.map(p => [p.id, p])).values()] : []

    return {
      reply: assistantMessage.content || '暂时无法完成，请稍后重试',
      products: uniqueProducts,
      actions: uniqueActions
    }
  } catch (error) {
    console.error('AI 对话服务异常:', error)
    return {
      reply: '暂时无法完成，请稍后重试',
      products: [],
      actions: []
    }
  }
}
