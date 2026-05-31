import { User, Product, Order, OrderItem, Category, sequelize } from '../models/index.js'
import { adminTools } from './adminAiTools.js'
import { Op } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// 会话上下文存储
const adminSessionContext = new Map()

// 获取或创建管理员会话上下文
export const getAdminSessionContext = (userId) => {
  if (!adminSessionContext.has(userId)) {
    adminSessionContext.set(userId, {
      lastSearchResults: [],
      lastSearchTime: null
    })
  }
  return adminSessionContext.get(userId)
}

const executeAdminTool = async (toolName, toolArguments, userId, userRole) => {
  if (userRole !== 'admin') {
    return { success: false, message: '权限不足，需要管理员权限', actions: [] }
  }

  const resolveProductId = (ProductId) => {
    if (ProductId) return { resolved: true, ProductId }

    const ctx = getAdminSessionContext(userId)
    const results = ctx.lastSearchResults || []

    if (results.length === 0) {
      return { resolved: false, Products: [] }
    }

    if (results.length === 1) {
      return { resolved: true, ProductId: results[0].id, ProductName: results[0].title }
    }

    return { resolved: false, Products: results }
  }

  try {
    switch (toolName) {
      case 'search_products': {
        const { keyword, categoryId, minPrice, maxPrice } = toolArguments
        
        console.log('[管理员搜索] 搜索关键词:', keyword)
        
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
        let searchKeywords = []

        if (keyword) {
          // 智能关键词拆分和生成
          const keywordParts = keyword.split(/[\s,.，、]+/).filter(part => part.length > 0)
          
          // 生成所有可能的关键词组合
          const allKeywords = new Set()
          
          // 1. 加入原始关键词
          allKeywords.add(keyword)
          
          // 2. 加入拆分的单个词（如"蓝牙耳机"拆分为"蓝牙"和"耳机"）
          keywordParts.forEach(part => {
            if (part.length > 0) {
              allKeywords.add(part)
            }
          })
          
          // 3. 对于每个超过2个字符的词，生成所有2个字符以上的子串
          // 例如："蓝牙耳机" → "蓝牙"、"牙耳"、"耳机"、"蓝牙耳"、"牙耳机"、"蓝牙耳机"
          keywordParts.forEach(part => {
            if (part.length > 2) {
              // 生成所有连续的子串（至少2个字符）
              for (let i = 0; i < part.length; i++) {
                for (let j = i + 2; j <= part.length; j++) {
                  const substring = part.substring(i, j)
                  allKeywords.add(substring)
                }
              }
            }
          })
          
          searchKeywords = [...allKeywords]
          
          console.log(`[管理员搜索] 原始关键词: "${keyword}"`)
          console.log(`[管理员搜索] 生成的搜索词: ${searchKeywords.join(', ')}`)
          
          // 构建模糊匹配条件：匹配标题或描述中包含任意关键词
          // 使用 OR 逻辑：title LIKE '%蓝牙%' OR title LIKE '%耳机%'
          const keywordConditions = searchKeywords.flatMap(word => [
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

        let products = await Product.findAll({
          where,
          limit: 10,
          order,
          include: [{ model: Category, as: 'category' }]
        })

        // 回退机制：如果拆分关键词没有结果，尝试用单个关键词搜索
        if (products.length === 0 && keyword) {
          const keywordParts = keyword.split(/[\s,.，、]+/).filter(part => part.length > 0)
          if (keywordParts.length > 0) {
            console.log(`[管理员搜索] 关键词"${keyword}"没有找到，尝试使用单个关键词回退搜索...`)
            
            // 尝试每个单个关键词
            for (const singleKeyword of keywordParts) {
              if (singleKeyword.length > 1) {
                const fallbackWhere = {
                  [Op.or]: [
                    { title: { [Op.like]: `%${singleKeyword}%` } },
                    { description: { [Op.like]: `%${singleKeyword}%` } }
                  ]
                }
                
                if (categoryId) {
                  fallbackWhere.category_id = categoryId
                }
                
                products = await Product.findAll({
                  where: fallbackWhere,
                  limit: 10,
                  order,
                  include: [{ model: Category, as: 'category' }]
                })
                
                if (products.length > 0) {
                  console.log(`[管理员搜索] ✅ 回退搜索"${singleKeyword}"找到了 ${products.length} 个商品`)
                  searchKeywords = [singleKeyword]
                  break
                }
              }
            }
          }
        }

        console.log(`[管理员搜索] 最终找到 ${products.length} 个商品`)
        console.log(`[管理员搜索] 商品列表:`, products.map(p => ({ id: p.id, title: p.title, price: p.price, stock: p.stock, status: p.status })))

        const productList = products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          stock: p.stock,
          status: p.status,
          category: p.category?.name || '未分类'
        }))

        // 保存搜索结果到会话上下文
        const ctx = getAdminSessionContext(userId)
        ctx.lastSearchResults = productList
        ctx.lastSearchTime = Date.now()

        const productSummary = products.map((p, idx) => 
          `${idx + 1}. ${p.title} - ¥${p.price}，库存${p.stock}，[${p.status === 'active' ? '在售' : '下架'}]`
        ).join('\n')

        return {
          success: true,
          data: {
            products: productList,
            count: products.length
          },
          message: '搜索成功',
          summary: products.length > 0
            ? `已找到 ${products.length} 个商品：\n${productSummary}\n[查看商品管理](/admin/products)`
            : `抱歉，暂时没有找到与"${keyword || ''}"相关的商品，请尝试其他关键词。\n[查看商品管理](/admin/products)`,
          products: productList,
          actions: []
        }
      }
      case 'get_dashboard_stats': {
        const userCount = await User.count({ where: { role: { [Op.ne]: 'admin' } } })
        const productCount = await Product.count()
        const orderCount = await Order.count()
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        
        const todayOrderCount = await Order.count({
          where: { createdAt: { [Op.between]: [today, tomorrow] } }
        })

        const totalSales = await Order.sum('total_price', {
          where: { status: { [Op.ne]: 'cancelled' } }
        }) || 0

        return {
          success: true,
          data: { userCount, productCount, orderCount, todayOrderCount, totalSales },
          message: '获取统计数据成功',
          summary: `仪表盘统计：总用户${userCount}人，总商品${productCount}件，总订单${orderCount}单，今日订单${todayOrderCount}单，总销售额¥${totalSales.toFixed(2)}\n[查看完整数据](/admin/dashboard)`,
          actions: []
        }
      }

      case 'list_users': {
        const { page = 1, limit = 10, keyword, status } = toolArguments
        const where = { role: { [Op.ne]: 'admin' } }

        if (status) {
          where.status = status
        }

        if (keyword) {
          where[Op.or] = [
            { username: { [Op.like]: `%${keyword}%` } },
            { email: { [Op.like]: `%${keyword}%` } }
          ]
        }

        const offset = (page - 1) * limit
        const { count, rows } = await User.findAndCountAll({
          where,
          limit: parseInt(limit),
          offset,
          order: [['createdAt', 'DESC']]
        })

        const userList = rows.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          status: u.status,
          createdAt: u.createdAt
        }))

        const statusText = { active: '正常', banned: '封禁' }
        const formattedUsers = userList.map(u => {
          const date = new Date(u.createdAt)
          const formattedDate = date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
          return `用户ID: ${u.id}，用户名: ${u.username}，邮箱: ${u.email}，状态: ${statusText[u.status] || u.status}，注册时间: ${formattedDate}`
        })

        let summary = `已获取最新用户列表（第${page}页，共${count}条）：\n${formattedUsers.join('  \n')}\n\n如需按关键词搜索、筛选封禁用户或翻页查看，请告诉我。\n[管理用户](/admin/users)`

        return {
          success: true,
          data: { users: userList, total: count, page: parseInt(page) },
          message: '获取用户列表成功',
          summary,
          actions: []
        }
      }

      case 'toggle_user_status': {
        const { userId, status, confirm } = toolArguments
        
        if (!confirm) {
          return {
            success: false,
            message: '需要确认操作',
            summary: `确认要将用户ID ${userId}的状态改为${status === 'active' ? '启用' : '封禁'}吗？请调用toggle_user_status并设置confirm: true`,
            actions: []
          }
        }

        const user = await User.findByPk(userId)
        if (!user) {
          return { success: false, message: '用户不存在', actions: [] }
        }

        if (user.role === 'admin') {
          return { success: false, message: '不能修改管理员状态', actions: [] }
        }

        await user.update({ status })

        return {
          success: true,
          data: user,
          message: '用户状态更新成功',
          summary: `已将用户${user.username}状态改为${status === 'active' ? '已启用' : '已封禁'}`,
          actions: []
        }
      }

      case 'list_all_orders': {
        const { page = 1, limit = 10, status, keyword } = toolArguments
        const where = {}

        if (status) {
          where.status = status
        }

        const offset = (page - 1) * limit

        let include = [{ model: User, as: 'user', attributes: ['username', 'email'] }]
        if (keyword) {
          include.push({
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          })
        }

        const { count, rows } = await Order.findAndCountAll({
          where,
          include,
          limit: parseInt(limit),
          offset,
          order: [['createdAt', 'DESC']]
        })

        const orderList = rows.map(o => ({
          id: o.id,
          orderNo: o.order_no,
          username: o.user?.username,
          totalPrice: o.total_price,
          status: o.status,
          createdAt: o.createdAt
        }))

        const statusText = {
          pending: '待付款',
          paid: '已付款',
          shipped: '已发货',
          completed: '已完成',
          cancelled: '已取消'
        }

        return {
          success: true,
          data: { orders: orderList, total: count, page: parseInt(page) },
          message: '获取订单列表成功',
          summary: `共找到${count}个订单，当前显示第${page}页，状态筛选：${status ? statusText[status] || status : '全部'}\n[查看订单管理](/admin/orders)`,
          actions: []
        }
      }

      case 'update_order_status': {
        const { orderId, status, trackingNo } = toolArguments

        const order = await Order.findByPk(orderId)
        if (!order) {
          return { success: false, message: '订单不存在', actions: [] }
        }

        const updateData = { status }
        if (trackingNo) {
          updateData.tracking_no = trackingNo
        }

        await order.update(updateData)

        const statusText = {
          pending: '待付款',
          paid: '已付款',
          shipped: '已发货',
          completed: '已完成',
          cancelled: '已取消'
        }

        return {
          success: true,
          data: order,
          message: '订单状态更新成功',
          summary: `订单${order.order_no}状态已更新为${statusText[status] || status}${trackingNo ? `，物流单号：${trackingNo}` : ''}`,
          actions: []
        }
      }

      case 'add_product': {
        const { title, description, price, stock, categoryId, image } = toolArguments

        if (!title || !price || !stock || !categoryId) {
          return { success: false, message: '缺少必填字段（title、price、stock、categoryId）', actions: [] }
        }

        console.log(`[添加商品] 新商品: ${title}, 价格: ¥${price}, 库存: ${stock}, 分类ID: ${categoryId}`)

        const product = await Product.create({
          title,
          description: description || '',
          price: parseFloat(price),
          stock: parseInt(stock),
          category_id: parseInt(categoryId),
          image: image || null,
          status: 'active'
        })

        console.log(`[添加商品] ✅ 商品创建成功, ID: ${product.id}`)

        return {
          success: true,
          data: product,
          message: '商品添加成功',
          summary: `已添加新商品：${title}，价格¥${price}，库存${stock}件 ✅\n[查看商品管理](/admin/products)`,
          actions: ['refreshProducts']
        }
      }

      case 'edit_product': {
        let { productId, title, description, price, stock, categoryId, status } = toolArguments

        const resolveResult = resolveProductId(productId)
        if (!resolveResult.resolved) {
          if (resolveResult.Products.length === 0) {
            return { success: false, message: '未指定商品ID且没有搜索上下文', summary: '请先搜索商品，或直接提供商品ID', actions: [] }
          }
          return {
            success: false,
            message: '需要选择商品',
            summary: '上一次搜索找到多个商品，请指定要修改哪一个：\n' + resolveResult.Products.map((p, i) => `${i + 1}. ${p.title}（ID:${p.id}，¥${p.price}）`).join('\n'),
            actions: []
          }
        }
        productId = resolveResult.ProductId

        const product = await Product.findByPk(productId)
        if (!product) {
          return { success: false, message: '商品不存在', actions: [] }
        }

        const updateData = {}
        const changes = []
        const logs = []

        if (title !== undefined && title !== product.title) {
          logs.push(`[修改商品 ${productId}] 名称: "${product.title}" -> "${title}"`)
          updateData.title = title
          changes.push('名称')
        }
        if (description !== undefined && description !== product.description) {
          logs.push(`[修改商品 ${productId}] 描述已更新`)
          updateData.description = description
          changes.push('描述')
        }
        if (price !== undefined && parseFloat(price) !== parseFloat(product.price)) {
          const oldPrice = product.price
          const newPrice = parseFloat(price)
          logs.push(`[修改商品 ${productId}] 价格: ¥${oldPrice} -> ¥${newPrice}`)
          updateData.price = newPrice
          changes.push(`价格从 ¥${oldPrice} 改为 ¥${newPrice}`)
        }
        if (stock !== undefined && parseInt(stock) !== parseInt(product.stock)) {
          const oldStock = product.stock
          const newStock = parseInt(stock)
          logs.push(`[修改商品 ${productId}] 库存: ${oldStock} -> ${newStock}`)
          updateData.stock = newStock
          changes.push(`库存从 ${oldStock} 改为 ${newStock}`)
        }
        if (categoryId !== undefined && parseInt(categoryId) !== parseInt(product.category_id)) {
          logs.push(`[修改商品 ${productId}] 分类ID: ${product.category_id} -> ${categoryId}`)
          updateData.category_id = parseInt(categoryId)
          changes.push('分类')
        }
        if (status !== undefined && status !== product.status) {
          const oldStatus = product.status === 'active' ? '上架' : '下架'
          const newStatus = status === 'active' ? '上架' : '下架'
          logs.push(`[修改商品 ${productId}] 状态: ${oldStatus} -> ${newStatus}`)
          updateData.status = status
          changes.push(`状态从"${oldStatus}"改为"${newStatus}"`)
        }

        logs.forEach(log => console.log(log))

        if (Object.keys(updateData).length === 0) {
          return {
            success: false,
            message: '没有需要修改的字段或值未发生变化',
            summary: `商品信息没有变化，无需更新`,
            actions: []
          }
        }

        await product.update(updateData)

        let summary = ''
        if (price !== undefined && changes.some(c => c.startsWith('价格'))) {
          summary += `已将 "${product.title}" 的价格从 ¥${product.price} 修改为 ¥${updateData.price || price} ✅ `
        }
        if (stock !== undefined && changes.some(c => c.startsWith('库存'))) {
          summary += `已将 "${product.title}" 的库存从 ${product.stock} 改为 ${updateData.stock || stock} ✅ `
        }
        if (status !== undefined && changes.some(c => c.startsWith('状态'))) {
          summary += `已将 "${product.title}" ${status === 'active' ? '上架' : '下架'} ✅ `
        }
        if (!summary) {
          summary = `已更新商品 "${product.title}" 的信息`
        }

        return {
          success: true,
          data: product,
          message: '商品信息更新成功',
          summary: `${summary.trim()}\n[查看商品管理](/admin/products)`,
          actions: ['refreshProducts']
        }
      }

      case 'update_product_price': {
        let { productId, newPrice } = toolArguments

        const resolveResult = resolveProductId(productId)
        if (!resolveResult.resolved) {
          if (resolveResult.Products.length === 0) {
            return { success: false, message: '未指定商品ID且没有搜索上下文', summary: '请先搜索商品，或直接告诉我商品ID', actions: [] }
          }
          return {
            success: false,
            message: '需要选择商品',
            summary: '上一次搜索找到多个商品，请指定要修改哪一个的价格：\n' + resolveResult.Products.map((p, i) => `${i + 1}. ${p.title}（ID:${p.id}，¥${p.price}）`).join('\n'),
            actions: []
          }
        }
        productId = resolveResult.ProductId

        console.log('[修改商品价格] 开始执行，参数:', { productId, newPrice })

        if (!newPrice || newPrice < 0) {
          console.log('[修改商品价格] ❌ 价格无效:', newPrice)
          return { success: false, message: '价格必须大于等于0', actions: [] }
        }

        const product = await Product.findByPk(productId)
        if (!product) {
          console.log('[修改商品价格] ❌ 商品不存在，ID:', productId)
          return { success: false, message: '商品不存在', actions: [] }
        }

        const oldPrice = parseFloat(product.price)
        const updatedPrice = parseFloat(newPrice)

        console.log('[修改商品价格] 当前价格:', oldPrice, '新价格:', updatedPrice)

        if (oldPrice === updatedPrice) {
          console.log('[修改商品价格] ⚠️ 价格未变化')
          return {
            success: false,
            message: '价格未变化',
            summary: `商品 "${product.title}" 的价格已经是 ¥${oldPrice}，无需修改`,
            actions: []
          }
        }

        console.log(`[修改商品价格] ID=${productId}, "${product.title}": ¥${oldPrice} -> ¥${updatedPrice}`)

        await product.update({ price: updatedPrice })

        console.log('[修改商品价格] 数据库更新完成')

        const updatedProduct = await Product.findByPk(productId)
        console.log('[修改商品价格] ✅ 验证修改结果 - 商品ID:', productId, '当前价格:', updatedProduct.price)

        return {
          success: true,
          data: updatedProduct,
          message: '商品价格修改成功',
          summary: `已将 "${product.title}" 的价格从 ¥${oldPrice} 修改为 ¥${updatedProduct.price} ✅\n[查看商品管理](/admin/products)`,
          actions: ['refreshProducts']
        }
      }

      case 'update_product_stock': {
        let { productId, newStock } = toolArguments

        const resolveResult = resolveProductId(productId)
        if (!resolveResult.resolved) {
          if (resolveResult.Products.length === 0) {
            return { success: false, message: '未指定商品ID且没有搜索上下文', summary: '请先搜索商品，或直接告诉我商品ID', actions: [] }
          }
          return {
            success: false,
            message: '需要选择商品',
            summary: '上一次搜索找到多个商品，请指定要修改哪一个的库存：\n' + resolveResult.Products.map((p, i) => `${i + 1}. ${p.title}（ID:${p.id}，库存${p.stock}）`).join('\n'),
            actions: []
          }
        }
        productId = resolveResult.ProductId

        console.log('[修改商品库存] 开始执行，参数:', { productId, newStock })

        if (!newStock || newStock < 0) {
          console.log('[修改商品库存] ❌ 库存无效:', newStock)
          return { success: false, message: '库存必须大于等于0', actions: [] }
        }

        const product = await Product.findByPk(productId)
        if (!product) {
          console.log('[修改商品库存] ❌ 商品不存在，ID:', productId)
          return { success: false, message: '商品不存在', actions: [] }
        }

        const oldStock = parseInt(product.stock)
        const updatedStock = parseInt(newStock)

        console.log('[修改商品库存] 当前库存:', oldStock, '新库存:', updatedStock)

        if (oldStock === updatedStock) {
          console.log('[修改商品库存] ⚠️ 库存未变化')
          return {
            success: false,
            message: '库存未变化',
            summary: `商品 "${product.title}" 的库存已经是 ${oldStock}，无需修改`,
            actions: []
          }
        }

        console.log(`[修改商品库存] ID=${productId}, "${product.title}": ${oldStock} -> ${updatedStock}`)

        await product.update({ stock: updatedStock })

        console.log('[修改商品库存] 数据库更新完成')

        const updatedProduct = await Product.findByPk(productId)
        console.log('[修改商品库存] ✅ 验证修改结果 - 商品ID:', productId, '当前库存:', updatedProduct.stock)

        return {
          success: true,
          data: updatedProduct,
          message: '商品库存修改成功',
          summary: `已将 "${product.title}" 的库存从 ${oldStock} 改为 ${updatedProduct.stock} ✅\n[查看商品管理](/admin/products)`,
          actions: ['refreshProducts']
        }
      }

      case 'update_product_status': {
        let { productId, status } = toolArguments

        const resolveResult = resolveProductId(productId)
        if (!resolveResult.resolved) {
          if (resolveResult.Products.length === 0) {
            return { success: false, message: '未指定商品ID且没有搜索上下文', summary: '请先搜索商品，或直接告诉我商品ID', actions: [] }
          }
          return {
            success: false,
            message: '需要选择商品',
            summary: '上一次搜索找到多个商品，请指定要修改哪一个的状态：\n' + resolveResult.Products.map((p, i) => `${i + 1}. ${p.title}（ID:${p.id}，¥${p.price}）`).join('\n'),
            actions: []
          }
        }
        productId = resolveResult.ProductId

        console.log('[修改商品状态] 开始执行，参数:', { productId, status })

        if (!status || !['active', 'inactive'].includes(status)) {
          console.log('[修改商品状态] ❌ 状态无效:', status)
          return { success: false, message: '状态必须是 active（上架）或 inactive（下架）', actions: [] }
        }

        const product = await Product.findByPk(productId)
        if (!product) {
          console.log('[修改商品状态] ❌ 商品不存在，ID:', productId)
          return { success: false, message: '商品不存在', actions: [] }
        }

        const oldStatus = product.status
        const newStatus = status

        if (oldStatus === newStatus) {
          const statusText = oldStatus === 'active' ? '上架' : '下架'
          console.log('[修改商品状态] ⚠️ 状态未变化')
          return {
            success: false,
            message: '状态未变化',
            summary: `商品 "${product.title}" 已经是 ${statusText} 状态，无需修改`,
            actions: []
          }
        }

        const oldStatusText = oldStatus === 'active' ? '上架' : '下架'
        const newStatusText = newStatus === 'active' ? '上架' : '下架'

        console.log(`[修改商品状态] ID=${productId}, "${product.title}": ${oldStatusText} -> ${newStatusText}`)

        await product.update({ status: newStatus })

        console.log('[修改商品状态] 数据库更新完成')

        const updatedProduct = await Product.findByPk(productId)
        console.log('[修改商品状态] ✅ 验证修改结果 - 商品ID:', productId, '当前状态:', updatedProduct.status)

        return {
          success: true,
          data: updatedProduct,
          message: '商品状态修改成功',
          summary: `已将 "${product.title}" ${newStatusText} ✅\n[查看商品管理](/admin/products)`,
          actions: ['refreshProducts']
        }
      }

      case 'delete_product': {
        let { productId, confirm } = toolArguments

        const resolveResult = resolveProductId(productId)
        if (!resolveResult.resolved) {
          if (resolveResult.Products.length === 0) {
            return { success: false, message: '未指定商品ID且没有搜索上下文', summary: '请先搜索商品，或直接告诉我商品ID', actions: [] }
          }
          return {
            success: false,
            message: '需要选择商品',
            summary: '上一次搜索找到多个商品，请指定要删除哪一个：\n' + resolveResult.Products.map((p, i) => `${i + 1}. ${p.title}（ID:${p.id}，¥${p.price}）`).join('\n'),
            actions: []
          }
        }
        productId = resolveResult.ProductId

        if (!confirm) {
          return {
            success: false,
            message: '需要确认操作',
            summary: `确认要删除商品ID ${productId}吗？请调用delete_product并设置confirm: true`,
            actions: []
          }
        }

        const product = await Product.findByPk(productId)
        if (!product) {
          return { success: false, message: '商品不存在', actions: [] }
        }

        const productName = product.title
        console.log(`[删除商品] 删除商品: ID=${productId}, 名称="${productName}"`)

        await product.destroy()

        console.log(`[删除商品] ✅ 商品 "${productName}" (ID=${productId}) 已删除`)

        return {
          success: true,
          message: '商品删除成功',
          summary: `已删除商品：${productName} ✅\n[查看商品管理](/admin/products)`,
          actions: ['refreshProducts']
        }
      }

      case 'get_category_stats': {
        const categories = await Category.findAll({
          include: [{ model: Product, as: 'products' }],
          order: [['sortOrder', 'ASC']]
        })

        const stats = categories.map(c => ({
          id: c.id,
          name: c.name,
          productCount: c.products?.length || 0,
          showInNav: c.showInNav
        }))

        const totalProducts = stats.reduce((sum, c) => sum + c.productCount, 0)

        return {
          success: true,
          data: stats,
          message: '获取分类统计成功',
          summary: `共${stats.length}个分类，${totalProducts}件商品。${stats.map(c => `${c.name}(${c.productCount}件)`).join('、')}`,
          actions: []
        }
      }

      case 'get_sales_stats': {
        const { days = 30 } = toolArguments
        
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        const orders = await Order.findAll({
          where: {
            createdAt: { [Op.gte]: startDate },
            status: { [Op.ne]: 'cancelled' }
          },
          include: [{
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }]
          }]
        })

        const orderCount = orders.length
        const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)

        const productSales = {}
        orders.forEach(order => {
          order.items?.forEach(item => {
            const productId = item.product_id
            const productTitle = item.product?.title || '未知商品'
            if (!productSales[productId]) {
              productSales[productId] = { title: productTitle, quantity: 0 }
            }
            productSales[productId].quantity += item.quantity
          })
        })

        const topProducts = Object.entries(productSales)
          .sort((a, b) => b[1].quantity - a[1].quantity)
          .slice(0, 5)
          .map(([id, data]) => ({ title: data.title, quantity: data.quantity }))

        return {
          success: true,
          data: { orderCount, totalSales, topProducts, days },
          message: '获取销售统计成功',
          summary: `近${days}天共完成${orderCount}笔订单，销售额¥${totalSales.toFixed(2)}。销量Top5：${topProducts.map((p, i) => `${i + 1}.${p.title}（销${p.quantity}件）`).join('、')}`,
          actions: []
        }
      }

      default:
        return { success: false, message: '未知的管理员工具', actions: [] }
    }
  } catch (error) {
    console.error('管理员工具执行失败:', error)
    return { success: false, message: '执行失败: ' + error.message, actions: [] }
  }
}

export { adminTools, executeAdminTool }
