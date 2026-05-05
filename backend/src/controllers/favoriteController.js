import { Favorite, Product } from '../models/index.js'

export const getFavorites = async (req, res) => {
  try {
    const userId = req.userId

    const favorites = await Favorite.findAll({
      where: { user_id: userId },
      include: [
        { model: Product, as: 'product' }
      ],
      order: [['created_at', 'DESC']]
    })

    return res.status(200).json({
      success: true,
      data: favorites,
      message: '获取收藏列表成功'
    })
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const addFavorite = async (req, res) => {
  try {
    const { product_id } = req.body
    const userId = req.userId

    const product = await Product.findByPk(product_id)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '商品不存在'
      })
    }

    const [favorite, created] = await Favorite.findOrCreate({
      where: { user_id: userId, product_id }
    })

    if (created) {
      await product.increment('favorites')
    }

    return res.status(200).json({
      success: true,
      data: favorite,
      message: created ? '收藏成功' : '已经收藏过了'
    })
  } catch (error) {
    console.error('添加收藏失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const removeFavorite = async (req, res) => {
  try {
    const { product_id } = req.params
    const userId = req.userId

    const deletedCount = await Favorite.destroy({
      where: { user_id: userId, product_id }
    })

    if (deletedCount > 0) {
      const product = await Product.findByPk(product_id)
      if (product) {
        await product.decrement('favorites')
      }
    }

    return res.status(200).json({
      success: true,
      message: '取消收藏成功'
    })
  } catch (error) {
    console.error('取消收藏失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const checkFavorite = async (req, res) => {
  try {
    const { product_id } = req.params
    const userId = req.userId

    const favorite = await Favorite.findOne({
      where: { user_id: userId, product_id }
    })

    return res.status(200).json({
      success: true,
      data: { is_favorite: !!favorite },
      message: '获取收藏状态成功'
    })
  } catch (error) {
    console.error('获取收藏状态失败:', error)
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
