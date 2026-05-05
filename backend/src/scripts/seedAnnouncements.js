import { sequelize } from '../models/index.js'
import { Announcement, Promotion } from '../models/index.js'

const seedData = async () => {
  try {
    console.log('🔄 连接数据库...')
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    console.log('🔄 插入公告数据...')
    const announcements = [
      {
        title: '系统维护通知',
        content: '为了提供更好的服务体验，我们将于本周末凌晨2:00-4:00进行系统维护升级，期间可能会暂停部分功能，敬请谅解！',
        status: 'active'
      },
      {
        title: '新功能上线',
        content: 'AGI智能商城新增智能客服功能，24小时在线为您解答问题！欢迎体验！',
        status: 'active'
      },
      {
        title: '会员专享活动',
        content: '即日起，注册会员即送50元优惠券，首单立减！快来加入我们吧！',
        status: 'active'
      }
    ]

    for (const announcementData of announcements) {
      await Announcement.findOrCreate({
        where: { title: announcementData.title },
        defaults: announcementData
      })
    }
    console.log('✅ 公告数据插入完成')

    console.log('🔄 插入促销活动数据...')
    const promotions = [
      {
        title: '春季大促销',
        description: '全场满300减50，满500减100，多买多减！活动时间：即日起至4月30日',
        start_time: new Date('2026-04-01'),
        end_time: new Date('2026-04-30'),
        status: 'active'
      },
      {
        title: '新品首发特惠',
        description: '新品上架首周8折优惠，快来选购心仪的商品！',
        start_time: new Date('2026-04-01'),
        end_time: new Date('2026-04-07'),
        status: 'active'
      }
    ]

    for (const promotionData of promotions) {
      await Promotion.findOrCreate({
        where: { title: promotionData.title },
        defaults: promotionData
      })
    }
    console.log('✅ 促销活动数据插入完成')

    console.log('🎉 公告和促销活动种子数据插入成功！')

    process.exit(0)
  } catch (error) {
    console.error('❌ 种子数据插入失败:', error)
    process.exit(1)
  }
}

seedData()
