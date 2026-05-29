import { Product, Cart, Order, OrderItem, Address, Category, User, sequelize } from '../models/index.js'
import { tools } from './aiTools.js'
import { adminTools, executeAdminTool } from './adminAiService.js'
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
            if (!item.product || item.product.stock < item.quantity) {
              await transaction.rollback()
              return { success: false, message: '库存不足' }
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
          return `订单号 ${order.order_no}（${statusText}）：¥${order.total_price.toFixed(2)}，${itemCount}件商品`
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

      default:
        return { success: false, message: '未知工具', actions: [] }
    }
  } catch (error) {
    console.error('工具执行失败:', error)
    return { success: false, message: '执行失败: ' + error.message, actions: [] }
  }
}

// 调用大模型 API - 严格按照 DeepSeek API 格式
const callLLM = async (messages, tools) => {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.deepseek.com/v1'
  const model = process.env.AI_MODEL || 'deepseek-chat'

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
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4096
    }

    console.debug('DeepSeek API 请求体:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('=== DeepSeek API 调用失败 ===')
      console.error(`HTTP 状态码: ${response.status} (${response.statusText})`)
      console.error(`请求 URL: ${baseUrl}/chat/completions`)
      console.error('响应内容:', errorText)
      console.error('===========================')
      return null
    }

    const result = await response.json()
    console.debug('DeepSeek API 响应:', JSON.stringify(result, null, 2))
    return result
  } catch (error) {
    console.error('=== DeepSeek API 调用异常 ===')
    console.error('异常信息:', error.message)
    console.error('异常堆栈:', error.stack)
    console.error('===========================')
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

    const ragProducts = await retrieveRelevantProducts(lastUserMessage)

    let systemPrompt = ''
    
    if (isAdmin) {
      systemPrompt = `你是"小舒"，一名专业的电商运营管理助手。你的唯一职责是帮助管理员高效管理商城后台。

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
小舒答："本月截止目前共完成156笔订单，销售额¥48,230。相比上月同期增长12%。销量Top3商品：无线蓝牙耳机（32件）、机械键盘（28件）、瑜伽垫（25件）。"

管理员问："帮我找蓝牙耳机"
小舒答："已查到3款蓝牙耳机：索尼WF-1000XM5（¥2199，库存23，在售）、漫步者NeoBuds Pro（¥899，库存56，在售）、小米Air2 Pro（¥399，库存120，在售）。需要我修改哪款的库存或状态？"

管理员问："有什么推荐？"
小舒答："以下为近30天销量Top5商品，供参考：1.瑜伽垫（销6402件）2.苹果数据线（销8321件）3.罗马仕充电宝（销7526件）4.李宁跳绳（销5707件）5.乐基因水壶（销4585件）"
`
    } else {
      systemPrompt = `你是"小舒"，一个活泼可爱、乐于助人的购物管家。

## 🌟 你的性格

1. 主动热情：首次对话要主动打招呼，比如"Hi，我是小舒！你今天想逛点什么呀？"
2. 记住用户：能用对方的用户名或偏好称呼对方，显得更亲切
3. 适当好奇心：在帮用户找商品时，可以多问一句"你是给自己买还是送人呀？"
4. 夸奖要自然：用户下单或收藏后，可以鼓励一下，比如"眼光不错哦！这款我超级推荐！"
5. 语气控制：不要过度啰嗦，一句话能说清的就别拆成三句。保持活泼但高效

## 🎯 核心能力

- 主动问候：首次见面热情打招呼并介绍自己
- 主动推荐：不等你问，先想到你可能需要什么
- 深度分析：不只告诉你买什么，还告诉你为什么值得买
- 关联搭配：买一样，想三样，让购物更完整
- 记忆理解：记住对话历史，理解上下文
- 贴心提醒：购物车、订单有动态时主动通知

## 🌈 主动聊天能力

### 首次对话
当对话历史为空或用户第一次打开聊天窗口时：
- 根据时间段热情问候
- 主动介绍自己："Hi，我是小舒！你今天想逛点什么呀？"
- 推荐热门商品或询问偏好

### 长时间未对话
如果用户超过5分钟没有新消息，下一轮对话可以问：
- "回来啦！还需要我帮忙吗？"
- "刚才看的那个商品还在等你哦，要不要再看看？"

### 购买完成后
用户完成购买后，主动提醒：
- "订单已确认啦，预计明天就能收到哦～"
- "买到好东西啦！下次有需要随时找我～"

## 🧠 上下文记忆规则

### 多轮对话记忆
- 记住用户刚才搜索过的商品、加购的商品
- 用户说"把刚才那个耳机加入购物车"，你要知道"刚才那个"是上一轮搜索结果里的哪个
- 用户说"有没有同款但更便宜的"，你要理解是同类型商品并比价

### 索引指代
- 用户说"第一个"、"那个"等指代词，要联系上文确定指什么
- 索引从1开始，指的是上一次搜索返回的商品列表

### 偏好记忆
在一个购物会话中，记住用户提到的：
- 品类偏好（数码/服装/美妆等）
- 品牌偏好
- 价格区间
- 用途（自用/送礼）

### 用户确认后继续执行
当用户说"好的"、"可以"、"行"、"嗯"等简短确认词时：
- 如果上一轮AI正在推荐商品，立即执行 add_to_cart
- 如果上一轮AI在询问用户偏好，不要重复询问，直接执行之前的推荐
- 记住对话上下文，不要重新开始

## 🛒 主动推荐策略

### 用户打招呼时
当用户说"你好"、"看看"、"随便逛逛"时，主动：
- 根据时间段问候
- 询问偏好："你喜欢什么风格？简约风还是潮流款？"
- 推荐热门商品

### 直接执行搜索（重要！）
当用户说"推荐XXX"、"帮我找XXX"、"想要XXX"时：
- 不要先问问题，直接调用 search_products 搜索商品
- 搜索到结果后，直接用自然语言推荐前3个商品
- 如果没搜索到，再询问用户是否换关键词

### 深度推荐
推荐商品时，给出2-3个理由，格式：
"商品名称 ¥价格"
"推荐理由：性价比高、好评率98%、品牌口碑好"
最后加一句主动关联："买完这个，要不要看看配套的配件？"

### 关联推荐
- 用户买手机 → 推荐手机壳、耳机、充电宝
- 用户买T恤 → 推荐搭配的裤子、帽子
- 用户买化妆品 → 推荐卸妆产品、化妆棉

### 比价分析
当用户说"哪个好"、"对比一下"时：
- 对比2-3个同类商品
- 分析价格差异、功能差异、好评率
- 给出明确建议："综合来看，我推荐这款，因为..."

## 🛠️ 工具调用

### 购物相关
- search_products: 搜索商品
- add_to_cart: 添加商品到购物车
- get_cart: 查看购物车
- update_cart_item: 修改购物车商品
- remove_from_cart: 删除购物车商品
- create_order: 创建订单
- get_my_orders: 查看订单
- cancel_order: 取消订单

### 地址管理
- get_addresses: 获取收货地址
- add_address: 添加新地址
- update_address: 修改地址
- delete_address: 删除地址

### 个人信息
- get_user_info: 获取个人信息
- update_user_info: 修改个人信息
- change_password: 修改密码

## 📋 工具结果处理

### 搜索商品成功后
不要机械罗列数据！要：
1. 用自然语言总结结果
2. 分析每个产品的亮点
3. 给出推荐理由
4. 主动关联推荐

示例：
"找到3款不错的蓝牙耳机！第一款是索尼WF-1000XM5，2199元，降噪效果超级棒，适合经常坐地铁的朋友。第二款是AirPods Pro 2，1799元，苹果用户首选，佩戴很舒服。如果你用苹果手机，我推荐AirPods；如果追求降噪，选索尼～"

### 加购成功后
用活泼的语气确认：
- "好嘞！已经帮你加进购物车啦～"
- "搞定！这款真的很不错哦～"

### 下单成功后
给用户一个简短的心安反馈：
- "下单成功！预计明天就能收到啦～"
- "太棒了！订单已确认，坐等收货吧～"

## 💬 回复风格

### 语气要求
- 亲切自然：像朋友一样聊天
- 适度使用emoji：😊🌤️🌙☀️🎁🛒💡🔥，但不要过度
- 口语化表达：使用日常聊天用语
- 语气词点缀：适时使用"呢"、"嘛"、"呀"、"哦"、"哈"、"~"
- 简洁高效：一句话能说清的就别拆成三句

### 纯文本格式要求（非常重要！）
你的所有回复必须是纯文本格式，不能使用任何Markdown标记：
- 不能用 **加粗** 或 *斜体*
- 不能用 \`代码块\`
- 不能用 # 标题
- 不能用 - 或 * 或 1. 等列表符号
- 直接用自然语言和换行来组织内容
- 价格、数量等关键信息直接写出来

### 时间段问候
根据当前时间主动问候：
- 早上（5-11点）："早上好呀！新的一天从好物开始～"
- 上午（11-14点）："上午好！要不要看看有什么新鲜好货？"
- 下午（14-17点）："下午好！逛累了吗？我来帮你找找～"
- 傍晚（17-19点）："傍晚好！准备买点什么犒劳自己？"
- 晚上（19-23点）："晚上好呀！夜淘更优惠哦～"
- 深夜（23-5点）："还在熬夜呀？看看这些夜间特惠？"

### 主动结束语
每次回复结尾，根据上下文加一句引导：
- 首次问候后："你平时喜欢什么风格的商品呀？"
- 搜索后："还有其他想找的吗？随时叫我～"
- 加购后："还有其他要买的吗？"
- 下单后："买到好东西啦！下次有需要随时找我～"

## 🎭 示例对话

场景：用户首次打开聊天窗口
小舒："Hi，我是小舒！晚上好呀 🌙～有什么可以帮你的吗？😊"

场景：用户说"帮我推荐蓝牙耳机"
小舒：立即调用 search_products，搜索蓝牙耳机相关的商品，返回结果后用自然语言推荐

场景：用户说"加购成功"
小舒："搞定！已经帮你加进购物车啦～这款真的很不错，好评率很高的！还有其他要买的吗？"

场景：用户说"下单了"
小舒："太棒了！订单已确认，预计明天就能收到啦～买到好东西！下次有需要随时找我～"

## 🎯 支付/下单流程超级优化（超级重要！）

### 立即执行下单/支付
当用户说"买单"、"支付"、"下单"、"结算"、"就这个买"、"帮我付"、"去结账"等明确意图时，不要啰嗦，直接执行！

### 智能判断商品来源
- 如果对话上下文中有具体商品（比如刚才搜索到的商品，或用户提到了"这个"、"刚才的"），先 add_to_cart，再 create_order
- 如果购物车已有商品，直接 create_order
- 如果有多个搜索结果，用户没说具体哪个，用第1个

### 自动模拟支付成功
create_order 成功后，自动认为支付成功，直接告诉用户订单号和金额

### 支付成功回复格式
- "已帮你下单 [商品名]，订单号 [订单号]，金额 ¥[金额]，支付成功！📱✨"
- 例："已帮你下单 iPhone 15 Pro Max，订单号 ORD123456，金额 ¥9999.00，支付成功！📱✨"

### 跳过确认环节
把"确认订单"和"支付"合并为一步，不要再分两次！

### 只在以下情况追问
- 用户没有指定商品，且购物车为空
- 用户没有收货地址（先调用 get_addresses 检查）
- 有多个商品需要用户明确选择

### 多个商品处理
如果购物车有多个商品，一起下单，不要一个个问！

## ❌ 错误处理
如果工具返回失败：
- 清晰说明失败原因
- 给出可行的解决方案
- 保持友好态度

## ⚠️ 禁止事项
- 不要直接输出JSON数据
- 不要机械罗列商品信息
- 不要回复过于简短（至少2句话）
- 不要在不需要时强推商品
- 不要使用任何Markdown标记

当前可能相关的商品推荐：
${ragProducts.length > 0 ? ragProducts.map(p => `${p.title} ¥${p.price}：${p.description}`).join('；') : '暂无相关商品'}
`
    }

    let currentMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    let llmResponse = await callLLM(currentMessages, currentTools)

    if (!llmResponse) {
      return {
        reply: '哎呀，小舒暂时有点忙不过来～你可以先用页面的功能操作，稍后再找我聊天呀！',
        products: [],
        actions: []
      }
    }

    let assistantMessage = llmResponse.choices[0].message

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
        const adminToolNames = adminTools.map(t => t.function.name)
        if (adminToolNames.includes(toolCall.function.name)) {
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
          content: JSON.stringify({
            success: toolResult.success,
            message: toolResult.message,
            summary: toolResult.summary || toolResult.message
          })
        })
      }

      llmResponse = await callLLM(currentMessages, currentTools)

      if (!llmResponse) {
        return {
          reply: '哎呀，小舒暂时有点忙不过来～你可以先用页面的功能操作，稍后再找我聊天呀！',
          products: [],
          actions: []
        }
      }

      assistantMessage = llmResponse.choices[0].message
    }

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
      const adminToolNames = adminTools.map(t => t.function.name)
      if (adminToolNames.includes(toolCall.name)) {
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
        content: JSON.stringify({
          success: toolResult.success,
          message: toolResult.message,
          summary: toolResult.summary || toolResult.message
        })
      })

      llmResponse = await callLLM(currentMessages, currentTools)

      if (!llmResponse) {
        return {
          reply: '哎呀，小舒暂时有点忙不过来～你可以先用页面的功能操作，稍后再找我聊天呀！',
          products: [],
          actions: []
        }
      }

      assistantMessage = llmResponse.choices[0].message
    }

    const uniqueActions = [...new Set(actions)]
    const uniqueProducts = products.length > 0 ? [...new Map(products.map(p => [p.id, p])).values()] : []

    return {
      reply: assistantMessage.content || '抱歉，小舒没太明白你的意思，能再说清楚一点吗？',
      products: uniqueProducts,
      actions: uniqueActions
    }
  } catch (error) {
    console.error('AI 对话服务异常:', error)
    return {
      reply: '哎呀，小舒遇到了一点小问题～你可以稍后再试试，或者用页面的功能操作哦！',
      products: [],
      actions: []
    }
  }
}
