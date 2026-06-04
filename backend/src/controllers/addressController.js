import { Address, Order } from '../models/index.js'

export const getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.userId }
    })
    res.json({
      success: true,
      data: addresses,
      message: '获取地址列表成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      })
    }
    res.json({
      success: true,
      data: address,
      message: '获取地址详情成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const createAddress = async (req, res) => {
  try {
    const { receiver_name, phone, province, city, district, detail, postal_code, is_default } = req.body

    if (is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id: req.userId } }
      )
    }

    const address = await Address.create({
      user_id: req.userId,
      receiver_name,
      phone,
      province,
      city,
      district,
      detail,
      postal_code,
      is_default: is_default || false
    })
    res.status(201).json({
      success: true,
      data: address,
      message: '创建地址成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const updateAddress = async (req, res) => {
  try {
    const { receiver_name, phone, province, city, district, detail, postal_code, is_default } = req.body
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })

    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在'
      })
    }

    if (is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id: req.userId } }
      )
    }

    await address.update({
      receiver_name,
      phone,
      province,
      city,
      district,
      detail,
      postal_code,
      is_default: is_default || false
    })

    const updatedAddress = await Address.findByPk(req.params.id)
    res.json({
      success: true,
      data: updatedAddress,
      message: '更新地址成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.userId }
    })
    if (!address) {
      return res.status(200).json({
        success: false,
        message: '地址不存在'
      })
    }
    
    // 检查该地址是否被订单引用
    const orderCount = await Order.count({
      where: { shipping_address_id: req.params.id }
    })
    if (orderCount > 0) {
      return res.status(200).json({
        success: false,
        message: '该地址已被订单使用，无法删除'
      })
    }
    
    await address.destroy()
    res.json({
      success: true,
      message: '删除地址成功'
    })
  } catch (error) {
    res.status(200).json({
      success: false,
      message: '删除地址失败，请稍后重试'
    })
  }
}
