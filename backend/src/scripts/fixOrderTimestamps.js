import { sequelize, Order } from '../models/index.js'

const fixOrderTimestamps = async () => {
  try {
    console.log('🔍 开始修复订单创建时间...')
    
    // 检查有多少订单的 created_at 为 NULL
    const nullCount = await Order.count({
      where: {
        created_at: null
      }
    })
    
    console.log(`📊 发现 ${nullCount} 个订单的创建时间为 NULL`)
    
    if (nullCount === 0) {
      console.log('✅ 所有订单的创建时间都已正常，无需修复')
      return
    }
    
    // 修复所有 created_at 为 NULL 的订单
    const [affectedCount] = await Order.update(
      { created_at: new Date() },
      { where: { created_at: null } }
    )
    
    console.log(`✅ 成功修复 ${affectedCount} 个订单的创建时间`)
    
    // 验证修复结果
    const sampleOrders = await Order.findAll({
      attributes: ['id', 'order_no', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    })
    
    console.log('\n📋 最新5个订单的创建时间：')
    sampleOrders.forEach(order => {
      console.log(`  ${order.order_no}: ${order.created_at}`)
    })
    
    await sequelize.close()
    console.log('\n🎉 修复完成！')
  } catch (error) {
    console.error('❌ 修复失败:', error)
    process.exit(1)
  }
}

fixOrderTimestamps()
