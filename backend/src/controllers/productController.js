import { Product, Category } from '../models/index.js'
import { Op } from 'sequelize'

export const getProducts = async (req, res) => {
  try {
    const { category_id, categoryId, keyword, page = 1, limit = 20, status } = req.query

    const where = {}
    if (status) {
      where.status = status
    } else {
      where.status = { [Op.ne]: 'deleted' }
    }

    const categoryIdParam = category_id || categoryId
    if (categoryIdParam) {
      where.category_id = parseInt(categoryIdParam)
    }

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
        { brand: { [Op.like]: `%${keyword}%` } }
      ]
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)

    const products = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    })

    res.json({
      success: true,
      data: {
        products: products.rows,
        total: products.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(products.count / parseInt(limit))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    if (product) {
      res.json({ success: true, data: product })
    } else {
      res.status(404).json({ success: false, message: 'Product not found' })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.status(201).json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    await product.update(req.body)
    res.json({ success: true, data: product })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    await product.destroy()
    res.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
