import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Op } from 'sequelize'
import { User, Product, Order, OrderItem, Category } from '../models/index.js'

dotenv.config()

export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    const user = await User.findOne({ where: { username } })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '该账户不是管理员'
      })
    }

    const isValidPassword = await user.validatePassword(password)

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      },
      message: '登录成功'
    })
  } catch (error) {
    console.error('管理员登录失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getDashboard = async (req, res) => {
  try {
    const userCount = await User.count()
    const productCount = await Product.count()
    const orderCount = await Order.count()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayOrderCount = await Order.count({
      where: {
        createdAt: { [Op.between]: [today, tomorrow] }
      }
    })

    const totalSales = await Order.sum('total_price', {
      where: { status: { [Op.in]: ['paid', 'shipped', 'completed'] } }
    }) || 0

    const lastWeekStart = new Date(today)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekSales = await Order.sum('total_price', {
      where: {
        createdAt: { [Op.between]: [lastWeekStart, today] },
        status: { [Op.in]: ['paid', 'shipped', 'completed'] }
      }
    }) || 0
    const salesChange = lastWeekSales > 0 ? ((totalSales - lastWeekSales) / lastWeekSales * 100).toFixed(1) : 0

    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      const count = await Order.count({
        where: {
          createdAt: { [Op.between]: [date, nextDay] }
        }
      })
      last7Days.push({
        date: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        count
      })
    }

    // 热门商品
    const hotProducts = await Product.findAll({
      order: [['sales', 'DESC']],
      limit: 3,
      attributes: ['id', 'title', 'sales', 'price']
    })

    // 最新订单
    const recentOrders = await Order.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
      limit: 5,
      order: [['createdAt', 'DESC']]
    })

    return res.status(200).json({
      success: true,
      data: {
        userCount,
        productCount,
        orderCount,
        todayOrderCount,
        totalSales: Number(totalSales).toFixed(2),
        salesChange: parseFloat(salesChange),
        orderChange: 8.2,
        userChange: 5.3,
        todayChange: 3.1,
        last7Days,
        hotProducts,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderNo: order.order_no,
          user: order.user,
          totalPrice: order.total_price,
          status: order.status,
          createdAt: order.createdAt
        })),
        todayNewUsers: await User.count({
          where: { createdAt: { [Op.between]: [today, tomorrow] } }
        })
      },
      message: '获取仪表盘数据成功'
    })
  } catch (error) {
    console.error('获取仪表盘失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, keyword } = req.query
    const where = {}

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

    return res.status(200).json({
      success: true,
      data: {
        users: rows.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        })),
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      message: '获取用户列表成功'
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    return res.status(200).json({
      success: true,
      data: user,
      message: '获取用户详情成功'
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const user = await User.findByPk(id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    if (user.role === 'admin' && status === 'banned') {
      return res.status(400).json({
        success: false,
        message: '不能封禁管理员账户'
      })
    }

    await user.update({ status })

    return res.status(200).json({
      success: true,
      data: user,
      message: '用户状态更新成功'
    })
  } catch (error) {
    console.error('更新用户状态失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const batchUpdateUsersStatus = async (req, res) => {
  try {
    const { ids, status } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择用户' })
    }
    
    await User.update(
      { status },
      { 
        where: { 
          id: { [Op.in]: ids },
          role: { [Op.ne]: 'admin' }
        }
      }
    )
    return res.status(200).json({
      success: true,
      message: '批量更新用户状态成功'
    })
  } catch (error) {
    console.error('批量更新用户状态失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, keyword, categoryId, minPrice, maxPrice } = req.query
    const where = {}

    if (keyword) {
      where.title = { [Op.like]: `%${keyword}%` }
    }

    if (categoryId) {
      where.category_id = categoryId
    }

    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) }
    }

    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) }
    }

    const offset = (page - 1) * limit

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category' }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    })

    return res.status(200).json({
      success: true,
      data: {
        products: rows.map(product => ({
          id: product.id,
          title: product.title,
          category: product.category,
          categoryId: product.category_id,
          price: product.price,
          stock: product.stock,
          sales: product.sales,
          description: product.description,
          image: product.image,
          status: product.status,
          createdAt: product.createdAt
        })),
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      message: '获取商品列表成功'
    })
  } catch (error) {
    console.error('获取商品列表失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.findByPk(id, { include: [{ model: Category, as: 'category' }] })
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    return res.status(200).json({
      success: true,
      data: product,
      message: '获取商品详情成功'
    })
  } catch (error) {
    console.error('获取商品详情失败:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    return res.status(201).json({
      success: true,
      data: product,
      message: '创建商品成功'
    })
  } catch (error) {
    console.error('创建商品失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.findByPk(id)
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    await product.update(req.body)
    return res.status(200).json({
      success: true,
      data: product,
      message: '更新商品成功'
    })
  } catch (error) {
    console.error('更新商品失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.findByPk(id)
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    await product.destroy()
    return res.status(200).json({
      success: true,
      message: '删除商品成功'
    })
  } catch (error) {
    console.error('删除商品失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const batchUpdateProductsStatus = async (req, res) => {
  try {
    const { ids, status } = req.body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择商品' })
    }
    
    await Product.update(
      { status },
      { where: { id: { [Op.in]: ids } } }
    )
    return res.status(200).json({
      success: true,
      message: '批量更新商品状态成功'
    })
  } catch (error) {
    console.error('批量更新商品状态失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const where = {}

    if (status) {
      where.status = status
    }

    const offset = (page - 1) * limit

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        {
          model: OrderItem, as: 'items', include: [
            { model: Product, as: 'product', attributes: ['id', 'title', 'price', 'image'] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    })

    return res.status(200).json({
      success: true,
      data: {
        orders: rows.map(order => ({
          id: order.id,
          orderNo: order.order_no,
          user: order.user,
          items: order.items?.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            product: item.product ? {
              id: item.product.id,
              title: item.product.title,
              price: item.product.price,
              image: item.product.image
            } : null
          })),
          totalPrice: order.total_price,
          status: order.status,
          trackingNo: order.tracking_no,
          createdAt: order.createdAt
        })),
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      message: '获取订单列表成功'
    })
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'phone'] },
        {
          model: OrderItem, as: 'items', include: [
            { model: Product, as: 'product', attributes: ['id', 'title', 'price', 'image'] }
          ]
        }
      ]
    })
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 转换为驼峰格式
    const transformedOrder = {
      id: order.id,
      orderNo: order.order_no,
      userId: order.user_id,
      addressId: order.address_id,
      totalPrice: order.total_price,
      status: order.status,
      trackingNo: order.tracking_no,
      paymentMethod: order.payment_method,
      paidAt: order.paid_at,
      shippedAt: order.shipped_at,
      completedAt: order.completed_at,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      user: order.user,
      items: order.items?.map(item => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: item.product
      }))
    }
    
    return res.status(200).json({
      success: true,
      data: transformedOrder,
      message: '获取订单详情成功'
    })
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, trackingNo } = req.body

    const order = await Order.findByPk(id)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      })
    }

    await order.update({ status, tracking_no: trackingNo })

    return res.status(200).json({
      success: true,
      data: order,
      message: '订单状态更新成功'
    })
  } catch (error) {
    console.error('更新订单状态失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    })
    return res.status(200).json({
      success: true,
      data: categories,
      message: '获取分类列表成功'
    })
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params
    const { status, trackingNo } = req.body
    const order = await Order.findByPk(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    await order.update({ status, tracking_no: trackingNo })
    return res.status(200).json({
      success: true,
      data: order,
      message: '订单更新成功'
    })
  } catch (error) {
    console.error('更新订单失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body)
    return res.status(201).json({
      success: true,
      data: category,
      message: '创建分类成功'
    })
  } catch (error) {
    console.error('创建分类失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' })
    }
    await category.update(req.body)
    return res.status(200).json({
      success: true,
      data: category,
      message: '更新分类成功'
    })
  } catch (error) {
    console.error('更新分类失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params
    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' })
    }
    await category.destroy()
    return res.status(200).json({
      success: true,
      message: '删除分类成功'
    })
  } catch (error) {
    console.error('删除分类失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const moveCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { direction } = req.body
    const category = await Category.findByPk(id)
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' })
    }

    const categories = await Category.findAll({
      order: [['sortOrder', 'ASC']]
    })

    const currentIndex = categories.findIndex(c => c.id === parseInt(id))
    if (currentIndex === -1) {
      return res.status(404).json({ success: false, message: '分类不存在' })
    }

    if (direction === 'up' && currentIndex > 0) {
      const prevCategory = categories[currentIndex - 1]
      const tempSort = prevCategory.sortOrder
      await prevCategory.update({ sortOrder: category.sortOrder })
      await category.update({ sortOrder: tempSort })
    } else if (direction === 'down' && currentIndex < categories.length - 1) {
      const nextCategory = categories[currentIndex + 1]
      const tempSort = nextCategory.sortOrder
      await nextCategory.update({ sortOrder: category.sortOrder })
      await category.update({ sortOrder: tempSort })
    }

    return res.status(200).json({
      success: true,
      message: '分类排序更新成功'
    })
  } catch (error) {
    console.error('移动分类失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const globalSearch = async (req, res) => {
  try {
    const { q, keyword } = req.query
    const searchKeyword = q || keyword
    
    if (!searchKeyword) {
      return res.status(400).json({ success: false, message: '请输入搜索关键词' })
    }

    const products = await Product.findAll({
      where: { title: { [Op.like]: `%${searchKeyword}%` } },
      limit: 10
    })

    const users = await User.findAll({
      where: { username: { [Op.like]: `%${searchKeyword}%` } },
      limit: 10
    })

    const orders = await Order.findAll({
      where: { order_no: { [Op.like]: `%${searchKeyword}%` } },
      limit: 10
    })

    const results = [
      ...products.map(p => ({
        id: p.id,
        title: p.title,
        description: `价格: ¥${p.price}`,
        type: '商品',
        path: `/admin/products`,
        icon: 'Product'
      })),
      ...users.map(u => ({
        id: u.id,
        title: u.username,
        description: u.email || '',
        type: '用户',
        path: `/admin/users`,
        icon: 'User'
      })),
      ...orders.map(o => ({
        id: o.id,
        title: `订单 #${o.order_no}`,
        description: `总额: ¥${o.total_price}`,
        type: '订单',
        path: `/admin/orders`,
        icon: 'Order'
      }))
    ]

    return res.status(200).json({
      success: true,
      data: results,
      message: '搜索成功'
    })
  } catch (error) {
    console.error('全局搜索失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
