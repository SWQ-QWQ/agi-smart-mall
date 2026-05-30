import { User, Product, Order, OrderItem, Category, sequelize } from '../models/index.js'
import { adminTools } from './adminAiTools.js'
import { Op } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const executeAdminTool = async (toolName, toolArguments, userId, userRole) => {
  if (userRole !== 'admin') {
    return { success: false, message: '权限不足，需要管理员权限', actions: [] }
  }

  try {
    switch (toolName) {
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
          summary: `仪表盘统计：总用户${userCount}人，总商品${productCount}件，总订单${orderCount}单，今日订单${todayOrderCount}单，总销售额¥${totalSales.toFixed(2)}`,
          actions: []
        }
      }

      case 'search_products': {
        const { keyword, categoryId, status, minPrice, maxPrice, page = 1, limit = 10 } = toolArguments
        const where = {}

        if (keyword) {
          where[Op.or] = [
            { title: { [Op.like]: `%${keyword}%` } },
            { description: { [Op.like]: `%${keyword}%` } }
          ]
        }

        if (categoryId) {
          where.category_id = categoryId
        }

        if (status) {
          where.status = status
        }

        if (minPrice !== undefined) {
          where.price = { ...where.price, [Op.gte]: minPrice }
        }

        if (maxPrice !== undefined) {
          where.price = { ...where.price, [Op.lte]: maxPrice }
        }

        const offset = (page - 1) * limit
        const { count, rows } = await Product.findAndCountAll({
          where,
          include: [{ model: Category, as: 'category', attributes: ['name'] }],
          limit: parseInt(limit),
          offset,
          order: [['createdAt', 'DESC']]
        })

        const productList = rows.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          stock: p.stock,
          status: p.status || 'active',
          sales: p.sales || 0,
          category: p.category?.name || '未分类'
        }))

        const statusText = { active: '在售', inactive: '下架' }
        const summary = productList.length > 0
          ? `已查到${count}款商品：${productList.slice(0, 5).map(p => `${p.title}（¥${p.price}，库存${p.stock}，${statusText[p.status] || p.status}）`).join('、')}${count > 5 ? '...' : ''}`
          : '未找到符合条件的商品'

        return {
          success: true,
          data: { products: productList, total: count, page: parseInt(page) },
          message: '搜索商品成功',
          summary,
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

        let summary = `已获取最新用户列表（第${page}页，共${count}条）：\n${formattedUsers.join('  \n')}\n\n如需按关键词搜索、筛选封禁用户或翻页查看，请告诉我。`

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
          summary: `共找到${count}个订单，当前显示第${page}页，状态筛选：${status ? statusText[status] || status : '全部'}`,
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

        const product = await Product.create({
          title,
          description: description || '',
          price,
          stock,
          category_id: categoryId,
          image: image || null,
          status: 'active'
        })

        return {
          success: true,
          data: product,
          message: '商品添加成功',
          summary: `已添加新商品：${title}，价格¥${price}，库存${stock}件`,
          actions: []
        }
      }

      case 'edit_product': {
        const { productId, title, description, price, stock, categoryId, status } = toolArguments

        const product = await Product.findByPk(productId)
        if (!product) {
          return { success: false, message: '商品不存在', actions: [] }
        }

        const updateData = {}
        if (title !== undefined) updateData.title = title
        if (description !== undefined) updateData.description = description
        if (price !== undefined) updateData.price = price
        if (stock !== undefined) updateData.stock = stock
        if (categoryId !== undefined) updateData.category_id = categoryId
        if (status !== undefined) updateData.status = status

        await product.update(updateData)

        const changes = []
        if (title !== undefined) changes.push('名称')
        if (description !== undefined) changes.push('描述')
        if (price !== undefined) changes.push('价格')
        if (stock !== undefined) changes.push('库存')
        if (categoryId !== undefined) changes.push('分类')
        if (status !== undefined) changes.push('状态')

        return {
          success: true,
          data: product,
          message: '商品信息更新成功',
          summary: `已更新商品${product.title}的${changes.join('、')}`,
          actions: []
        }
      }

      case 'delete_product': {
        const { productId, confirm } = toolArguments

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
        await product.destroy()

        return {
          success: true,
          message: '商品删除成功',
          summary: `已删除商品：${productName}`,
          actions: []
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
