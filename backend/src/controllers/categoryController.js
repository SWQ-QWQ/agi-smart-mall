import { Category } from '../models/index.js'

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

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params
    const category = await Category.findByPk(id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    return res.status(200).json({
      success: true,
      data: category,
      message: '获取分类详情成功'
    })
  } catch (error) {
    console.error('获取分类详情失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const createCategory = async (req, res) => {
  try {
    const { name, parentId, description, sortOrder } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      })
    }

    const category = await Category.create({
      name,
      parentId: parentId || null,
      description,
      sortOrder: sortOrder || 0
    })

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
    const { name, parentId, description, sortOrder } = req.body

    const category = await Category.findByPk(id)

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    if (parentId && parseInt(parentId) === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: '不能将分类设为自身的父分类'
      })
    }

    await category.update({
      name: name || category.name,
      parentId: parentId !== undefined ? parentId : category.parentId,
      description: description !== undefined ? description : category.description,
      sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder
    })

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
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      })
    }

    const childrenCount = await Category.count({
      where: { parentId: id }
    })

    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该分类下有子分类，不能删除'
      })
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
