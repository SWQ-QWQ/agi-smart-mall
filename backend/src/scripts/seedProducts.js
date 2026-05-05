import { sequelize } from '../models/index.js'
import { Category, Product, Cart, Favorite, Order, OrderItem } from '../models/index.js'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const IMAGE_API_KEY = process.env.IMAGE_API_KEY
const USE_PEXELS = !!IMAGE_API_KEY

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(1)

const log = (message, type = 'info') => {
  const icons = { info: '🔄', success: '✅', error: '❌', title: '📦' }
  console.log(`${icons[type] || '➡️'} ${message}`)
}

const placeholderLabels = {
  1: ['收纳盒', '香薰蜡烛', '床上用品', '台灯', '花瓶', '地毯', '抱枕', '收纳袋', '窗帘', '相框'],
  2: ['361运动鞋', '李宁运动鞋', '阿迪达斯运动鞋', '安踏运动鞋', '特步运动鞋', '运动帽', '运动套装', '斐乐运动鞋', '匹克运动鞋', '运动袜'],
  3: ['手机', '笔记本电脑', '无线耳机', '键盘', '鼠标', '音箱', '智能手表', '平板', '充电宝', '数据线'],
  4: ['洗衣机', '冰箱', '空调', '电饭煲', '加湿器', '吸尘器', '微波炉', '热水器', '洗碗机', '电磁炉'],
  5: ['沙发', '床', '餐桌', '椅子', '柜子', '灯具', '书架', '梳妆台', '茶几', '电视柜'],
  6: ['口红', '粉底液', '香水', '面膜', '眼影', '护肤品', '睫毛膏', '腮红', '精华液', '防晒'],
  7: ['炒锅', '菜刀', '餐具套装', '保温杯', '水壶', '咖啡杯', '砧板', '锅具套装', '保鲜盒', '筷子'],
  8: ['书籍', '笔记本', '钢笔', '文具套装', '画材', '彩铅', '文具盒', '水彩笔', '素描本', '文件夹']
}

const placeholderColors = {
  1: { bg: 'e8f4f8', text: '333333' },
  2: { bg: 'f5f5f4', text: '333333' },
  3: { bg: '1a1a2e', text: 'ffffff' },
  4: { bg: 'fef3c7', text: '333333' },
  5: { bg: 'd1fae5', text: '333333' },
  6: { bg: 'ffe4e6', text: '333333' },
  7: { bg: 'f0ebe3', text: '333333' },
  8: { bg: 'e0e7ff', text: '333333' }
}

const keywordMap = {
  // 生活家居 (category_id = 1)
  '太力 真空压缩袋套装': 'vacuum storage bags',
  '野兽派 薰衣草香薰蜡烛': 'lavender scented candle',
  '无印良品 MUJI 棉法兰绒四件套': 'muji bedding set',
  '飞利浦 Hue 智能LED台灯': 'philips smart led lamp',
  '野兽派 彩色玻璃陶瓷花瓶': 'colorful ceramic vase',
  '宜家 卡斯普特 长毛绒地毯': 'cozy area rug',
  'HAY 几何图形抱枕': 'designer throw pillow',
  '宜家 勒斯达 落地窗帘': 'linen curtain',
  '吱音 创意木质相框': 'wooden photo frame',
  '茶花 塑料收纳箱套装': 'plastic storage boxes',
  
  // 运动户外 (category_id = 2)
  '361° 轻便透气运动鞋': '361 sport running shoes',
  '李宁 赤兔6 Pro 跑步鞋': 'lining running shoes',
  '安踏 马赫3代 运动鞋': 'anta sport shoes',
  '特步 騛速X 跑鞋': 'xtep running shoes',
  '匹克 态极3.0 运动鞋': 'peak sport shoes',
  '斐乐 FILA 复古运动鞋': 'fila retro sneakers',
  'Nike Air Max 270 运动休闲鞋': 'nike air max 270',
  'Adidas Originals 三叶草 经典款运动帽': 'adidas cap',
  '李宁 运动套装 短袖短裤': 'lining sport set',
  'Nike 速干运动T恤': 'nike quick dry tshirt',
  
  // 数码电子 (category_id = 3)
  'iPhone 15 Pro Max 智能手机': 'iphone 15 pro max',
  '华为 MateBook X Pro 轻薄笔记本': 'huawei laptop',
  '索尼 WF-1000XM5 真无线降噪耳机': 'sony wireless earbuds',
  '罗技 MX Master 3 无线鼠标': 'logitech wireless mouse',
  '机械键盘 青轴RGB': 'mechanical keyboard rgb',
  '华为 Sound X 智能音箱': 'huawei speaker',
  'Apple Watch Series 9 智能手表': 'apple watch',
  'iPad Pro 12.9英寸 M2芯片': 'ipad pro tablet',
  '罗马仕 20000mAh 快充移动电源': 'power bank 20000mah',
  '苹果 Lightning 数据线 快充线': 'iphone lightning cable',
  
  // 家用电器 (category_id = 4)
  '海尔 滚筒洗衣机 洗烘一体': 'haier washing machine',
  '美的 变频双开门冰箱': 'midea refrigerator',
  '格力 新一级能效 立柜式空调': 'gree air conditioner',
  '松下 IH智能电饭煲 4L': 'panasonic rice cooker',
  '戴森 AM10 除菌加湿器': 'dyson humidifier',
  '科沃斯 T20 扫地机器人 扫拖一体': 'ecovacs robot vacuum',
  '格兰仕 微波炉 平板加热': 'galanz microwave',
  '史密斯 电热水器 60升': 'smith water heater',
  '老板 嵌入式洗碗机 大容量': 'robam dishwasher',
  '九阳 电磁炉 家用套装': 'joyoung induction cooker',
  
  // 家具家装 (category_id = 5)
  '顾家家居 简约布艺沙发': 'fabric sofa modern',
  '慕思 乳胶床垫 独立弹簧': 'latex mattress',
  '全友家居 现代简约餐桌 木质饭桌': 'wood dining table',
  '曲美家居 实木餐椅 靠背椅': 'solid wood dining chair',
  '宜家 比利书架 组合书柜': 'ikea billy bookcase',
  '索菲亚 整体衣柜 定制': 'custom wardrobe',
  '欧普照明 LED吸顶灯 客厅灯': 'opple ceiling lamp',
  '林氏木业 化妆台 梳妆台': 'makeup vanity desk',
  '顾家家居 茶几 实木茶桌': 'tea table solid wood',
  '小米 液晶电视 75英寸': 'xiaomi tv 75 inch',
  
  // 美妆个护 (category_id = 6)
  '迪奥Dior 烈艳蓝金唇膏 999经典红': 'dior lipstick 999',
  '雅诗兰黛 DW持妆粉底液': 'estee lauder double wear foundation',
  '香奈儿 5号香水 经典款': 'chanel no 5 perfume',
  'SK-II 前男友面膜 10片装': 'skii facial mask',
  'Tom Ford 四色眼影盘': 'tom ford eyeshadow palette',
  '兰蔻小黑瓶精华肌底液': 'lancome advanced serum',
  'WHOO后 天气丹花献滋养水乳套装': 'whoo skincare set',
  'NARS 腮红 经典色号 Orgasm': 'nars blush orgasm',
  '安耐晒 金瓶防晒霜 60ml': 'anessa sunscreen',
  '悦诗风吟 睫毛膏 浓密型': 'innisfree mascara',
  
  // 餐厨水具 (category_id = 7)
  '双立人 炒锅 不粘锅 32cm': 'zwilling non-stick wok',
  '德国双立人 刀具套装 厨房菜刀': 'zwilling knife set',
  '日本象印 保温杯 480ml 304不锈钢': 'zojirushi thermos',
  '乐扣乐扣 保鲜盒 套装 食品级密封盒': 'lock lock airtight container',
  '苏泊尔 不锈钢炒锅 家用炒菜锅': 'supor stainless steel wok',
  '王麻子 菜刀 厨房切片刀 斩骨刀': 'wangmazi kitchen knife',
  '膳魔师 保温杯 焖烧杯 大容量': 'thermos food jar',
  '宜家 餐具套装 碗碟勺套装': 'ikea dinnerware set',
  '炊大皇 不粘锅 炒锅 锅具套装': 'chuda non stick cookware set',
  '虎牌 保温壶 大容量热水瓶': 'tiger thermal pot',
  
  // 图书文具 (category_id = 8)
  '三体 全集典藏版 刘慈欣': 'three body collection novel',
  'Moleskine 经典硬壳笔记本 可定制': 'moleskine notebook',
  'LAMY凌美 钢笔 Safari狩猎者系列': 'lamy safari fountain pen',
  '日本樱花 水彩笔 固体水彩套装': 'sakura watercolor paint set',
  '德国辉柏嘉 彩铅 48色专业级': 'faber castell colored pencils',
  '晨光文具套装 学生开学礼盒': 'chenguang stationery set',
  '得力 文件夹 资料册 档案袋': 'deli file organizer',
  '马可素描本 8k/4k 速写本': 'marco sketchbook drawing paper',
  '得力 铅笔 三角杆 矫正握姿': 'deli triangular pencils',
  '故宫文具 文创笔记本 礼盒': 'forbidden city stationery set'
}

const generateImageUrl = (title, categoryId, index) => {
  const colors = placeholderColors[categoryId] || { bg: 'eeeeee', text: '999999' }
  const labels = placeholderLabels[categoryId] || ['Product']
  const label = labels[index % labels.length] || 'Product'

  return `https://placehold.co/400x400/${colors.bg}/${colors.text}?text=${encodeURIComponent(label)}`
}

const getRealProductImage = async (productName) => {
  if (!USE_PEXELS) {
    return null
  }

  try {
    const searchQuery = keywordMap[productName] || (productName.length > 30 ? productName.substring(0, 30) : productName)

    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: searchQuery,
        per_page: 1,
        size: 'medium',
        orientation: 'square'
      },
      headers: {
        Authorization: IMAGE_API_KEY
      }
    })

    if (response.data && response.data.photos && response.data.photos.length > 0) {
      return response.data.photos[0].src.medium
    }
  } catch (error) {
    console.warn(`获取图片失败 [${productName}]: ${error.message}`)
  }

  return null
}

const seedData = async () => {
  try {
    if (!USE_PEXELS) {
      log('⚠️ 未设置 IMAGE_API_KEY，将使用占位图', 'info')
    } else {
      log(`✅ Pexels API 已配置，将尝试获取真实图片`, 'success')
    }

    log('开始连接数据库...')
    await sequelize.authenticate()
    log('数据库连接成功', 'success')

    log('清空旧数据...')
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    
    await Cart.destroy({ where: {} })
    await Favorite.destroy({ where: {} })
    await OrderItem.destroy({ where: {} })
    await Order.destroy({ where: {} })
    await Product.destroy({ where: {} })
    await Category.destroy({ where: {} })
    
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')
    log('数据表已清空', 'success')

    log('开始创建8个分类结构...', 'title')

    const categoryData = [
      { id: 1, name: '生活家居', level: 1, sortOrder: 1, show_in_nav: 1, description: '收纳整理、香薰蜡烛、家居饰品、床上用品、台灯、收纳盒等家居用品' },
      { id: 2, name: '运动户外', level: 1, sortOrder: 2, show_in_nav: 1, description: '361°、特步、匹克、安踏、斐乐、李宁、阿迪达斯等品牌的运动鞋、运动帽等' },
      { id: 3, name: '数码电子', level: 1, sortOrder: 3, show_in_nav: 1, description: '手机、电脑、耳机、键盘、鼠标、音箱、手表、平板、充电宝、数据线等数码产品' },
      { id: 4, name: '家用电器', level: 1, sortOrder: 4, show_in_nav: 1, description: '洗衣机、冰箱、空调、电饭煲、加湿器、吸尘器等家电产品' },
      { id: 5, name: '家具家装', level: 1, sortOrder: 5, show_in_nav: 1, description: '沙发、床、桌子、椅子、柜子、灯具等家具产品' },
      { id: 6, name: '美妆个护', level: 1, sortOrder: 6, show_in_nav: 1, description: '口红、粉底、香水、面膜、眼影、护肤品等美妆产品' },
      { id: 7, name: '餐厨水具', level: 1, sortOrder: 7, show_in_nav: 1, description: '锅具、刀具、餐具、水杯、保温杯等厨房用品' },
      { id: 8, name: '图书文具', level: 1, sortOrder: 8, show_in_nav: 1, description: '书籍、笔记本、钢笔、文具套装、画材等文化用品' }
    ]

    for (const cat of categoryData) {
      await Category.upsert({
        id: cat.id,
        name: cat.name,
        level: cat.level,
        sortOrder: cat.sortOrder,
        show_in_nav: cat.show_in_nav,
        description: cat.description
      })
      log(`分类: ${cat.name} (ID: ${cat.id})`, 'success')
    }

    log('分类结构创建完成', 'success')
    log('开始创建商品数据...', 'title')

    const productsData = [
      // ==================== 生活家居 (category_id = 1) ====================
      {
        title: '太力 真空压缩袋套装 送抽气泵',
        description: 'PA+PE材质，强劲压缩节省80%空间，防水防潮防虫蛀，反复可用，衣柜收纳必备',
        brand: '太力',
        price: 99,
        stock: randomInt(100, 300),
        sales: randomInt(600, 9999),
        rating: randomFloat(4.5, 4.8),
        categoryId: 1,
        specs: JSON.stringify({ color: ['透明'], includes: ['大号被子袋x3', '中号衣物袋x4', '抽气泵'], material: 'PA+PE' })
      },
      {
        title: '野兽派 薰衣草香薰蜡烛礼盒',
        description: '天然大豆蜡，法国进口香精，燃烧约40小时，薰衣草助眠香，礼盒包装精美',
        brand: '野兽派',
        price: 268,
        stock: randomInt(50, 150),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 1,
        specs: JSON.stringify({ color: ['紫色', '粉色', '绿色'], scent: ['薰衣草', '玫瑰', '白茶'], burnTime: '约40小时' })
      },
      {
        title: '无印良品 MUJI 棉法兰绒四件套',
        description: '100%棉法兰绒，柔软亲肤，透气舒适，简约日式风格，无印良品品质保证',
        brand: '无印良品',
        price: 899,
        stock: randomInt(20, 70),
        sales: randomInt(100, 2800),
        rating: randomFloat(4.6, 4.9),
        categoryId: 1,
        specs: JSON.stringify({ color: ['浅灰色', '白色', '条纹蓝'], size: ['1.5m床', '1.8m床'], material: '100%棉法兰绒' })
      },
      {
        title: '飞利浦 Hue 智能LED台灯',
        description: '智能互联，1600万色可调，语音控制，场景联动，护眼柔光，APP远程操控',
        brand: '飞利浦',
        price: 599,
        stock: randomInt(25, 80),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.5, 4.9),
        categoryId: 1,
        specs: JSON.stringify({ color: ['白色'], feature: ['智能控制', '1600万色', '语音控制'], wattage: '12W' })
      },
      {
        title: '野兽派 彩色玻璃陶瓷花瓶',
        description: '手工彩色玻璃陶瓷，造型独特艺术感强，插花装饰提升空间格调，送礼自用两相宜',
        brand: '野兽派',
        price: 359,
        stock: randomInt(35, 100),
        sales: randomInt(120, 2500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 1,
        specs: JSON.stringify({ color: ['彩色', '渐变蓝', '渐变粉'], size: '高度约22cm', material: '陶瓷' })
      },
      {
        title: '宜家 卡斯普特 长毛绒地毯',
        description: '柔软舒适长毛绒，时尚现代风格，多种尺寸可选，客厅卧室书房必备，温暖家居',
        brand: '宜家',
        price: 699,
        stock: randomInt(15, 60),
        sales: randomInt(80, 1800),
        rating: randomFloat(4.3, 4.7),
        categoryId: 1,
        specs: JSON.stringify({ color: ['米色', '灰色', '驼色'], size: ['130x170cm', '160x230cm'], material: '涤纶长毛绒' })
      },
      {
        title: 'HAY 几何图形抱枕',
        description: '丹麦设计品牌，几何图案创意设计，优质棉麻面料，舒适透气，沙发床品百搭',
        brand: 'HAY',
        price: 199,
        stock: randomInt(50, 140),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.4, 4.7),
        categoryId: 1,
        specs: JSON.stringify({ color: ['几何黄', '几何蓝', '几何灰'], size: '50x50cm', material: '棉麻' })
      },
      {
        title: '宜家 勒斯达 落地窗帘',
        description: '亚麻混纺面料，自然垂感，透气遮光，简约北欧风格，提升空间品味',
        brand: '宜家',
        price: 299,
        stock: randomInt(30, 90),
        sales: randomInt(100, 2200),
        rating: randomFloat(4.4, 4.7),
        categoryId: 1,
        specs: JSON.stringify({ color: ['自然白', '灰色', '米色'], size: '宽140cm x 高250cm', material: '亚麻混纺' })
      },
      {
        title: '吱音 创意木质相框',
        description: '设计感强北美黑胡桃木，磁吸设计易更换，简约现代风格，多尺寸可选',
        brand: '吱音',
        price: 159,
        stock: randomInt(45, 130),
        sales: randomInt(180, 2800),
        rating: randomFloat(4.5, 4.8),
        categoryId: 1,
        specs: JSON.stringify({ color: ['胡桃木', '橡木', '白色'], size: ['10x15cm', '20x25cm'], material: '实木' })
      },
      {
        title: '茶花 塑料收纳箱套装 3个装',
        description: 'PP食品级材质，加厚耐用，带滑轮方便移动，透明可视，整理衣物零食玩具',
        brand: '茶花',
        price: 129,
        stock: randomInt(80, 200),
        sales: randomInt(400, 6000),
        rating: randomFloat(4.4, 4.7),
        categoryId: 1,
        specs: JSON.stringify({ color: ['透明', '粉色', '蓝色'], includes: '3个装', capacity: ['35L', '45L', '65L'] })
      },

      // ==================== 运动户外 (category_id = 2) ====================
      {
        title: '361° 轻便透气运动鞋 跑步鞋',
        description: 'Q弹科技鞋底，缓震舒适，飞织鞋面透气，轻便易弯折，日常训练慢跑两用',
        brand: '361°',
        price: 399,
        stock: randomInt(50, 150),
        sales: randomInt(400, 5500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 2,
        specs: JSON.stringify({ color: ['黑白', '灰蓝', '全黑'], size: ['39', '40', '41', '42', '43', '44'], feature: 'Q弹缓震' })
      },
      {
        title: '李宁 赤兔6 Pro 跑步鞋 专业跑鞋',
        description: '李宁䨻科技中底，轻弹缓震，䨻丝鞋面透气，全掌碳板加持，专业竞速跑鞋',
        brand: '李宁',
        price: 799,
        stock: randomInt(30, 100),
        sales: randomInt(200, 4000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 2,
        specs: JSON.stringify({ color: ['标准白', '黑色', '赤兔橙'], size: ['39', '40', '41', '42', '43', '44'], tech: '䨻丝 + 䨻科技' })
      },
      {
        title: '安踏 马赫3代 运动鞋 竞速训练',
        description: '氮科技中底回弹迅猛，A-FLASHEDGE碳板，双重提速，透气鞋面不闷脚',
        brand: '安踏',
        price: 699,
        stock: randomInt(35, 105),
        sales: randomInt(250, 4500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 2,
        specs: JSON.stringify({ color: ['象牙白', '碳灰', '电光蓝'], size: ['39', '40', '41', '42', '43', '44'], tech: '氮科技' })
      },
      {
        title: '特步 騛速X 跑鞋 竞速碳板',
        description: '动力巢PB中底，碳板助力推进，飞织鞋面轻盈透气，PB竞速首选',
        brand: '特步',
        price: 749,
        stock: randomInt(28, 85),
        sales: randomInt(180, 3500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 2,
        specs: JSON.stringify({ color: ['白色', '黑色', '荧光绿'], size: ['39', '40', '41', '42', '43', '44'], tech: '动力巢PB' })
      },
      {
        title: '匹克 态极3.0 运动鞋 轻弹缓震',
        description: '态极自适应科技，踩屎感缓震，轻量化设计，网面透气，日常穿搭休闲鞋',
        brand: '匹克',
        price: 459,
        stock: randomInt(40, 120),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 2,
        specs: JSON.stringify({ color: ['大白', '深灰', '水墨蓝'], size: ['39', '40', '41', '42', '43', '44'], tech: '态极自适应' })
      },
      {
        title: '斐乐 FILA 复古运动鞋 MARS 火星鞋',
        description: '经典复古造型，皮革拼接鞋面，增高厚底，街头潮流，老爹鞋款式',
        brand: '斐乐FILA',
        price: 899,
        stock: randomInt(25, 80),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 2,
        specs: JSON.stringify({ color: ['奶白', '灰绿', '古铜金'], size: ['35', '36', '37', '38', '39', '40'], style: '复古老爹鞋' })
      },
      {
        title: 'Nike Air Max 270 男子运动鞋',
        description: '270度可视化Air Max气垫，舒适缓震，透气网面材质，日常运动休闲百搭',
        brand: '耐克Nike',
        price: 1099,
        stock: randomInt(30, 100),
        sales: randomInt(500, 6000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 2,
        specs: JSON.stringify({ color: ['黑白', '白色', '灰蓝'], size: ['39', '40', '41', '42', '43', '44', '45'], feature: ['Air Max气垫', '透气网面'] })
      },
      {
        title: 'Adidas Originals 三叶草 经典款运动帽',
        description: '经典三叶草Logo，纯棉材质透气舒适，可调节按扣，日常运动搭配必备',
        brand: '阿迪达斯Adidas',
        price: 199,
        stock: randomInt(60, 180),
        sales: randomInt(400, 5500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 2,
        specs: JSON.stringify({ color: ['黑色', '白色', '藏青色'], adjustable: '可调节按扣', material: '纯棉' })
      },
      {
        title: '李宁 运动套装 短袖短裤 两件套',
        description: '速干透气面料，吸湿排汗，弹力舒适，简约设计，健身房跑步训练必备',
        brand: '李宁',
        price: 299,
        stock: randomInt(45, 135),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.4, 4.7),
        categoryId: 2,
        specs: JSON.stringify({ color: ['黑色', '灰色', '藏青'], size: ['M', 'L', 'XL', 'XXL'], material: '速干面料' })
      },
      {
        title: 'Nike 速干运动T恤 男子透气上衣',
        description: 'Dri-FIT速干科技，吸湿排汗，轻便透气，简约百搭，日常健身训练跑步',
        brand: '耐克Nike',
        price: 249,
        stock: randomInt(55, 160),
        sales: randomInt(350, 5500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 2,
        specs: JSON.stringify({ color: ['黑色', '白色', '藏蓝'], size: ['M', 'L', 'XL', 'XXL'], tech: 'Dri-FIT' })
      },

      // ==================== 数码电子 (category_id = 3) ====================
      {
        title: 'iPhone 15 Pro Max 智能手机 256GB',
        description: 'A17 Pro芯片，钛金属设计，4800万像素主摄，USB-C接口，专业级影像系统',
        brand: '苹果Apple',
        price: 9999,
        stock: randomInt(20, 60),
        sales: randomInt(200, 4000),
        rating: randomFloat(4.7, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['钛金属黑', '钛金属白', '钛金属蓝', '钛金属灰'], storage: ['128GB', '256GB', '512GB'], display: '6.7英寸 Super Retina XDR' })
      },
      {
        title: '华为 MateBook X Pro 轻薄笔记本电脑',
        description: '3.2K触控全面屏，第13代酷睿i7，16GB+1TB，超薄金属机身，超级终端协同',
        brand: '华为HUAWEI',
        price: 11999,
        stock: randomInt(10, 40),
        sales: randomInt(100, 2500),
        rating: randomFloat(4.6, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['深空灰', '微绒典藏墨蓝'], cpu: 'i7-1360P', ram: '16GB', storage: '1TB SSD', display: '14.2英寸 3.2K' })
      },
      {
        title: '索尼 WF-1000XM5 真无线蓝牙降噪耳机',
        description: '行业领先降噪技术，LDAC高清音质，8小时续航，AI智能降噪，多设备连接',
        brand: '索尼SONY',
        price: 2199,
        stock: randomInt(30, 100),
        sales: randomInt(500, 6000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['黑色', '铂金银'], feature: ['主动降噪', 'LDAC', '8小时续航'], weight: '5.9g' })
      },
      {
        title: '罗技 MX Master 3S 无线鼠标',
        description: '8000DPI高精度传感器，MagSpeed电磁滚轮，70天超长续航，多设备切换',
        brand: '罗技Logitech',
        price: 799,
        stock: randomInt(25, 80),
        sales: randomInt(200, 4000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['石墨灰', '白色'], dpi: '8000DPI', feature: 'MagSpeed电磁滚轮', battery: '70天续航' })
      },
      {
        title: '罗技 G Pro X 机械键盘 青轴RGB',
        description: 'C轴线性手感，全键无冲，可拆卸腕托，LIGHTSYNC RGB灯效，专业电竞键盘',
        brand: '罗技Logitech',
        price: 999,
        stock: randomInt(30, 90),
        sales: randomInt(250, 4500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 3,
        specs: JSON.stringify({ color: ['黑色'], switchType: ['青轴', '红轴', '茶轴'], lighting: 'RGB背光', layout: '104键' })
      },
      {
        title: '华为 Sound X 智能音箱 帝瓦雷设计',
        description: '帝瓦雷联合设计，三分频澎湃低音，空间智慧感知，HarmonyOS生态协同',
        brand: '华为HUAWEI',
        price: 2199,
        stock: randomInt(20, 70),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['星际黑', '白色'], audio: '60W低音炮', system: 'HarmonyOS', connection: 'WiFi+蓝牙' })
      },
      {
        title: 'Apple Watch Series 9 蜂窝版 智能手表',
        description: 'S9芯片，亮度提升2000尼特，双指手势操作，健康监测全面升级',
        brand: '苹果Apple',
        price: 3999,
        stock: randomInt(20, 80),
        sales: randomInt(1000, 8000),
        rating: randomFloat(4.7, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['午夜色', '星光色', '银色', '红色'], size: ['41mm', '45mm'], connectivity: ['GPS', '蜂窝版'] })
      },
      {
        title: 'iPad Pro 12.9英寸 M2芯片 平板电脑',
        description: 'M2芯片性能强劲，12.9英寸Liquid视网膜XDR显示屏，120Hz ProMotion，Apple Pencil悬停',
        brand: '苹果Apple',
        price: 9299,
        stock: randomInt(5, 30),
        sales: randomInt(200, 3000),
        rating: randomFloat(4.7, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['深空灰', '银色'], storage: ['128GB', '256GB', '512GB', '1TB', '2TB'], connectivity: ['WiFi', 'WiFi+蜂窝'] })
      },
      {
        title: '罗马仕 20000mAh 快充移动电源',
        description: '20000mAh大容量，支持22.5W快充，三口同时输出，智能电压识别，多设备同时充电',
        brand: '罗马仕',
        price: 159,
        stock: randomInt(80, 250),
        sales: randomInt(800, 9999),
        rating: randomFloat(4.5, 4.8),
        categoryId: 3,
        specs: JSON.stringify({ color: ['白色', '黑色'], capacity: '20000mAh', output: '22.5W快充', ports: '3个USB输出' })
      },
      {
        title: '苹果 Lightning 数据线 快充线 2米',
        description: 'MFi官方认证，原装芯片不弹窗，加粗线芯耐用抗弯折，1米/2米可选',
        brand: '苹果Apple',
        price: 149,
        stock: randomInt(100, 300),
        sales: randomInt(1000, 9999),
        rating: randomFloat(4.6, 4.9),
        categoryId: 3,
        specs: JSON.stringify({ color: ['白色'], length: ['1米', '2米'], certification: 'MFi官方认证' })
      },

      // ==================== 家用电器 (category_id = 4) ====================
      {
        title: '海尔 滚筒洗衣机 洗烘一体 10公斤',
        description: 'BLDC变频电机，洗烘一体，蒸汽除菌，空气洗祛味，筒自洁免清洗',
        brand: '海尔Haier',
        price: 3999,
        stock: randomInt(20, 70),
        sales: randomInt(200, 4000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 4,
        specs: JSON.stringify({ capacity: '10KG', feature: ['洗烘一体', '蒸汽除菌', '空气洗'], motor: 'BLDC变频' })
      },
      {
        title: '美的 变频双开门冰箱 606升',
        description: '对开门大容量，变频压缩机，智能互联，风冷无霜，节能静音，分区精储',
        brand: '美的Midea',
        price: 4999,
        stock: randomInt(15, 60),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 4,
        specs: JSON.stringify({ capacity: '606L', style: '对开门', feature: ['风冷无霜', '变频节能'], color: ['炫晶灰', '白色'] })
      },
      {
        title: '格力 新一级能效 立柜式空调 3匹',
        description: '新一级能效，变频制冷，3匹强劲动力，立柜式设计，智能WiFi控制，静音舒适',
        brand: '格力GREE',
        price: 8999,
        stock: randomInt(10, 45),
        sales: randomInt(80, 2000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 4,
        specs: JSON.stringify({ capacity: '3匹', type: '立柜式', energy: '新一级能效', feature: '智能WiFi' })
      },
      {
        title: '松下 IH智能电饭煲 4L 日本原装',
        description: 'IH环绕加热，备长炭铜釜内胆，智能预约，日本原装进口，多种烹饪模式',
        brand: '松下Panasonic',
        price: 2999,
        stock: randomInt(20, 65),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 4,
        specs: JSON.stringify({ capacity: '4L', heating: 'IH环绕加热', innerPot: '备长炭铜釜', origin: '日本原装' })
      },
      {
        title: '戴森 AM10 除菌加湿器',
        description: '专利紫外线杀菌技术，智能湿度控制，无叶风扇技术，安静运行，Air Multiplier技术',
        brand: '戴森Dyson',
        price: 3899,
        stock: randomInt(5, 25),
        sales: randomInt(30, 500),
        rating: randomFloat(4.5, 4.9),
        categoryId: 4,
        specs: JSON.stringify({ color: ['白色', '银色'], capacity: '3L', feature: ['紫外线杀菌', '无叶技术', '智能控湿'], noise: '35dB' })
      },
      {
        title: '科沃斯 T20 扫地机器人 扫拖一体',
        description: '激光导航，扫拖一体，自动集尘，热水洗拖布，热风烘干，全链路抗菌',
        brand: '科沃斯ECOVACS',
        price: 4999,
        stock: randomInt(15, 55),
        sales: randomInt(100, 2500),
        rating: randomFloat(4.6, 4.9),
        categoryId: 4,
        specs: JSON.stringify({ navigation: '激光导航', feature: ['扫拖一体', '自动集尘', '热水洗拖布'], battery: '5200mAh' })
      },
      {
        title: '格兰仕 微波炉 平板加热 23升',
        description: '平板加热，23升大容量，800W功率，微电脑控制，智能菜单，一键解冻',
        brand: '格兰仕Galanz',
        price: 499,
        stock: randomInt(40, 120),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.4, 4.7),
        categoryId: 4,
        specs: JSON.stringify({ capacity: '23L', power: '800W', heating: '平板加热', control: '微电脑' })
      },
      {
        title: 'A.O.史密斯 电热水器 60升 金圭内胆',
        description: '金圭内胆8年包换，双棒速热，60升大容量，智能预约，一级能效更节能',
        brand: 'A.O.史密斯',
        price: 2699,
        stock: randomInt(20, 70),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 4,
        specs: JSON.stringify({ capacity: '60L', feature: ['金圭内胆', '双棒速热', '智能预约'], energy: '一级能效' })
      },
      {
        title: '老板 嵌入式洗碗机 大容量 13套',
        description: '13套大容量，嵌入式设计，高温高压冲洗，热风烘干，除菌消毒，智能软水',
        brand: '老板Robam',
        price: 4999,
        stock: randomInt(15, 60),
        sales: randomInt(120, 2800),
        rating: randomFloat(4.5, 4.8),
        categoryId: 4,
        specs: JSON.stringify({ capacity: '13套', style: '嵌入式', feature: ['高温高压', '热风烘干', '除菌'], water: '智能软水' })
      },
      {
        title: '九阳 电磁炉 家用套装 配炒锅',
        description: '2200W大火力，微晶面板，智能触控，赠炒锅汤锅，8档火力调节，一键爆炒',
        brand: '九阳Joyoung',
        price: 299,
        stock: randomInt(50, 150),
        sales: randomInt(400, 6000),
        rating: randomFloat(4.4, 4.7),
        categoryId: 4,
        specs: JSON.stringify({ power: '2200W', includes: ['电磁炉', '炒锅', '汤锅'], levels: '8档火力', panel: '微晶面板' })
      },

      // ==================== 家具家装 (category_id = 5) ====================
      {
        title: '顾家家居 简约布艺沙发 现代客厅',
        description: '现代简约风格，高密度海绵填充，实木框架，可拆洗面料，舒适久坐',
        brand: '顾家家居',
        price: 6999,
        stock: randomInt(10, 40),
        sales: randomInt(100, 2500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 5,
        specs: JSON.stringify({ color: ['浅灰色', '米白色', '科技布'], style: 'L型转角', material: ['实木框架', '高密度海绵'], size: '四人位' })
      },
      {
        title: '慕思 乳胶床垫 独立弹簧 1.8m',
        description: '泰国进口天然乳胶，独立袋装弹簧，静音无干扰，透气面料，人体工学支撑',
        brand: '慕思DeRUCCI',
        price: 5999,
        stock: randomInt(15, 55),
        sales: randomInt(120, 2800),
        rating: randomFloat(4.6, 4.9),
        categoryId: 5,
        specs: JSON.stringify({ size: ['1.5m', '1.8m'], latex: '泰国天然乳胶', spring: '独立袋装弹簧', thickness: '25cm' })
      },
      {
        title: '全友家居 现代简约餐桌 木质饭桌',
        description: '实木框架，简约北欧风格，餐桌椅套装，E1级环保板材，耐磨耐刮',
        brand: '全友家居QuanU',
        price: 3999,
        stock: randomInt(20, 65),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 5,
        specs: JSON.stringify({ style: '北欧简约', material: ['实木框架', 'E1级板材'], include: ['餐桌', '椅子x4'], size: '1.6m' })
      },
      {
        title: '曲美家居 实木餐椅 靠背椅 北欧风',
        description: '白蜡木实木，人体工学靠背，软包坐垫，简约北欧设计，舒适美观',
        brand: '曲美家居QM',
        price: 999,
        stock: randomInt(30, 90),
        sales: randomInt(200, 4000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 5,
        specs: JSON.stringify({ material: '白蜡木实木', style: '北欧简约', cushion: '软包坐垫', ergonomic: '人体工学靠背' })
      },
      {
        title: '宜家 比利书架 组合书柜 多层',
        description: '经典BILLY书架，可调节层板，大容量收纳，简约设计，可组合搭配',
        brand: '宜家IKEA',
        price: 599,
        stock: randomInt(40, 120),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 5,
        specs: JSON.stringify({ color: ['白色', '黑褐色', '浅木纹'], material: '刨花板', feature: '可调节层板', size: '80x28x202cm' })
      },
      {
        title: '索菲亚 整体衣柜 定制 现代简约',
        description: '环保板材，推拉门/平开门可选，大容量收纳，分区设计，量身定制',
        brand: '索菲亚SOGAL',
        price: 8999,
        stock: randomInt(10, 40),
        sales: randomInt(80, 2000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 5,
        specs: JSON.stringify({ style: '现代简约', doorType: ['推拉门', '平开门'], material: 'E0级环保板材', custom: '量身定制' })
      },
      {
        title: '欧普照明 LED吸顶灯 客厅灯 简约',
        description: 'LED节能光源，三色调光，简约大气，超薄设计，适配各种装修风格',
        brand: '欧普OPPLE',
        price: 599,
        stock: randomInt(35, 105),
        sales: randomInt(250, 4500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 5,
        specs: JSON.stringify({ color: ['白色'], wattage: '80W', lighting: '三色调光', style: '简约现代' })
      },
      {
        title: '林氏木业 化妆台 梳妆台 现代简约',
        description: '多功能化妆台，大容量收纳，高清化妆镜，现代简约风格，女生卧室必备',
        brand: '林氏木业',
        price: 1299,
        stock: randomInt(25, 75),
        sales: randomInt(180, 3500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 5,
        specs: JSON.stringify({ style: '现代简约', mirror: '高清化妆镜', storage: '大容量收纳', color: ['白色', '胡桃色'] })
      },
      {
        title: '顾家家居 茶几 实木茶桌 现代简约',
        description: '实木框架，岩板台面，简约现代设计，大容量抽屉，客厅搭配首选',
        brand: '顾家家居',
        price: 2999,
        stock: randomInt(18, 58),
        sales: randomInt(130, 2800),
        rating: randomFloat(4.5, 4.8),
        categoryId: 5,
        specs: JSON.stringify({ top: '岩板台面', frame: '实木框架', drawers: '大容量抽屉', style: '现代简约' })
      },
      {
        title: '小米 液晶电视 75英寸 4K超高清',
        description: '4K超高清分辨率，MEMC运动补偿，远场语音控制，金属全面屏，杜比视界',
        brand: '小米MI',
        price: 3999,
        stock: randomInt(15, 55),
        sales: randomInt(150, 3000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 5,
        specs: JSON.stringify({ size: '75英寸', resolution: '4K', feature: ['MEMC运动补偿', '远场语音', '杜比视界'], screen: '金属全面屏' })
      },

      // ==================== 美妆个护 (category_id = 6) ====================
      {
        title: '迪奥Dior 烈艳蓝金唇膏 999经典红',
        description: '经典999正红色，丝绒质地，滋润不干涩，持久显色，女人必备口红',
        brand: '迪奥Dior',
        price: 380,
        stock: randomInt(50, 150),
        sales: randomInt(800, 9999),
        rating: randomFloat(4.7, 4.9),
        categoryId: 6,
        specs: JSON.stringify({ color: ['999经典红', '666 MATTE', '720豆沙红'], finish: ['丝绒', '哑光', '润泽'] })
      },
      {
        title: '雅诗兰黛 DW持妆粉底液',
        description: '24小时持久持妆，控油遮瑕，柔雾妆感，轻薄不闷痘，油皮亲妈',
        brand: '雅诗兰黛Estee Lauder',
        price: 420,
        stock: randomInt(40, 120),
        sales: randomInt(600, 8000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 6,
        specs: JSON.stringify({ color: ['1W1 象牙白', '2W0 自然白', '3W0 暖自然色'], shade: '多种色号', duration: '24小时持妆' })
      },
      {
        title: '香奈儿 5号香水 经典款 100ml',
        description: '全球最著名的香水之一，乙醛花香调，优雅神秘，约会聚会必备，提升魅力',
        brand: '香奈儿CHANEL',
        price: 1290,
        stock: randomInt(20, 60),
        sales: randomInt(200, 3500),
        rating: randomFloat(4.7, 4.9),
        categoryId: 6,
        specs: JSON.stringify({ color: ['经典透明'], size: ['50ml', '100ml', '150ml'], scent: '乙醛花香调' })
      },
      {
        title: 'SK-II 前男友面膜 10片装',
        description: 'PITERA精华密集修护，敷10分钟急救焕肤，皮肤透亮嫩滑，熬夜急救神器',
        brand: 'SK-II',
        price: 899,
        stock: randomInt(25, 80),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 6,
        specs: JSON.stringify({ color: ['金色'], includes: '10片装', keyIngredient: 'PITERA' })
      },
      {
        title: 'Tom Ford 四色眼影盘 03Disco',
        description: '奢华TF眼影，细腻珠光哑光搭配，粉质高级不飞粉，精致妆容必备',
        brand: 'Tom Ford',
        price: 699,
        stock: randomInt(15, 50),
        sales: randomInt(100, 2000),
        rating: randomFloat(4.7, 4.9),
        categoryId: 6,
        specs: JSON.stringify({ color: ['03 Disco', '04 Honeymoon', '01 Golden Mink'], finish: ['珠光', '哑光', '亮片'] })
      },
      {
        title: '兰蔻小黑瓶精华肌底液 100ml',
        description: '10年经典口碑，酵母精粹深层修护肌肤，质地清爽易吸收，肌肤细嫩透亮',
        brand: '兰蔻Lancôme',
        price: 1080,
        stock: randomInt(30, 90),
        sales: randomInt(400, 6000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 6,
        specs: JSON.stringify({ color: ['经典黑'], size: ['30ml', '50ml', '75ml', '100ml'], keyIngredient: '酵母精粹' })
      },
      {
        title: 'WHOO后 天气丹花献滋养水乳套装',
        description: '韩国顶级护肤品牌，珍贵植萃成分，密集滋养，改善肌肤细纹暗沉，保湿修护',
        brand: 'WHOO后',
        price: 899,
        stock: randomInt(20, 70),
        sales: randomInt(200, 4000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 6,
        specs: JSON.stringify({ color: ['金色'], includes: ['滋养水150ml', '滋养乳110ml'], keyIngredient: '天气精萃' })
      },
      {
        title: 'NARS 腮红 经典色号 Orgasm',
        description: '全球畅销腮红，微微带闪的蜜桃粉色，显气色又自然，黄皮亲妈，适合亚洲肤色',
        brand: 'NARS',
        price: 268,
        stock: randomInt(40, 110),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 6,
        specs: JSON.stringify({ color: ['Orgasm', 'Deep Throat', 'Gina'], finish: ['微闪', '哑光'] })
      },
      {
        title: '安耐晒 金瓶防晒霜 60ml SPF50+',
        description: 'SPF50+ PA++++ 超强防晒，防水防汗，质地清爽不油腻，户外活动必备',
        brand: '安耐晒ANESSA',
        price: 218,
        stock: randomInt(80, 200),
        sales: randomInt(1000, 9999),
        rating: randomFloat(4.5, 4.8),
        categoryId: 6,
        specs: JSON.stringify({ color: ['金色'], size: '60ml', spf: 'SPF50+ PA++++', waterResistance: '防水防汗' })
      },
      {
        title: '悦诗风吟 睫毛膏 浓密型',
        description: '纤长浓密二合一，刷头设计贴合眼型，持久不晕染，打造迷人电眼',
        brand: '悦诗风吟Innisfree',
        price: 128,
        stock: randomInt(60, 160),
        sales: randomInt(400, 5500),
        rating: randomFloat(4.4, 4.7),
        categoryId: 6,
        specs: JSON.stringify({ color: ['黑色', '棕色'], effect: ['浓密', '纤长'], finish: '自然卷翘' })
      },

      // ==================== 餐厨水具 (category_id = 7) ====================
      {
        title: '双立人 炒锅 不粘锅 32cm',
        description: '德国品牌，不粘涂层，32cm大容量，少油烟，不挑炉灶，家用炒菜必备',
        brand: '双立人ZWILLING',
        price: 499,
        stock: randomInt(35, 105),
        sales: randomInt(250, 4500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 7,
        specs: JSON.stringify({ size: '32cm', coating: '不粘涂层', stove: '通用炉灶', handle: '隔热手柄' })
      },
      {
        title: '德国双立人 刀具套装 厨房菜刀',
        description: '德国工艺，不锈钢材质，6件套装，含斩骨刀、切片刀、水果刀、磨刀棒等',
        brand: '双立人ZWILLING',
        price: 399,
        stock: randomInt(40, 120),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 7,
        specs: JSON.stringify({ includes: ['斩骨刀', '切片刀', '水果刀', '剪刀', '磨刀棒', '刀座'], material: '不锈钢', origin: '德国工艺' })
      },
      {
        title: '日本象印 保温杯 480ml 304不锈钢',
        description: '日本知名品牌，304不锈钢内胆，真空隔热，保冷保温两用，480ml容量',
        brand: '象印ZOJIRUSHI',
        price: 259,
        stock: randomInt(50, 150),
        sales: randomInt(400, 6000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 7,
        specs: JSON.stringify({ capacity: '480ml', material: '304不锈钢', feature: '真空隔热保冷保温', color: ['黑色', '银色', '粉色'] })
      },
      {
        title: '乐扣乐扣 保鲜盒 套装 食品级密封盒',
        description: '韩国品牌，食品级PP材质，密封防漏，微波炉适用，冰箱收纳，多种规格可选',
        brand: '乐扣乐扣LOCK&LOCK',
        price: 99,
        stock: randomInt(80, 220),
        sales: randomInt(600, 9000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 7,
        specs: JSON.stringify({ includes: '6件套', material: '食品级PP', feature: '密封防漏', microwave: '微波炉适用' })
      },
      {
        title: '苏泊尔 不锈钢炒锅 家用炒菜锅 34cm',
        description: '不锈钢材质，蜂窝防粘设计，34cm大容量，铁锅质感，物理不粘健康',
        brand: '苏泊尔SUPOR',
        price: 329,
        stock: randomInt(45, 135),
        sales: randomInt(350, 5500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 7,
        specs: JSON.stringify({ size: '34cm', material: '304不锈钢', design: '蜂窝防粘', feature: '物理不粘' })
      },
      {
        title: '王麻子 菜刀 厨房切片刀 斩骨刀两件套',
        description: '中华老字号，百年传承，锋利耐用，切片刀+斩骨刀组合，厨房好帮手',
        brand: '王麻子',
        price: 129,
        stock: randomInt(70, 200),
        sales: randomInt(500, 7500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 7,
        specs: JSON.stringify({ includes: ['切片刀', '斩骨刀'], material: '不锈钢', heritage: '百年老字号', feature: '锋利耐用' })
      },
      {
        title: '膳魔师 保温杯 焖烧杯 大容量 720ml',
        description: '德国知名品牌，不锈钢材质，真空保温保冷，720ml大容量，可焖粥保温便当',
        brand: '膳魔师THERMOS',
        price: 299,
        stock: randomInt(50, 150),
        sales: randomInt(400, 6000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 7,
        specs: JSON.stringify({ capacity: '720ml', feature: ['保温', '保冷', '焖烧杯'], material: '304不锈钢', color: ['粉色', '黑色', '金色'] })
      },
      {
        title: '宜家 餐具套装 碗碟勺套装 18件套',
        description: '简约北欧设计，白色骨瓷，碗碟勺套装，18件套，家庭使用，送礼佳品',
        brand: '宜家IKEA',
        price: 199,
        stock: randomInt(60, 170),
        sales: randomInt(450, 6500),
        rating: randomFloat(4.4, 4.7),
        categoryId: 7,
        specs: JSON.stringify({ includes: '18件套', material: '骨瓷', style: '北欧简约', color: '白色' })
      },
      {
        title: '炊大皇 不粘锅 炒锅 锅具套装 四件套',
        description: '四件套锅具，炒锅+煎锅+汤锅+奶锅，不粘涂层，少油烟，厨房全套配齐',
        brand: '炊大皇COOKER KING',
        price: 399,
        stock: randomInt(45, 135),
        sales: randomInt(350, 5500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 7,
        specs: JSON.stringify({ includes: ['炒锅', '煎锅', '汤锅', '奶锅'], coating: '不粘涂层', feature: '少油烟', stove: '通用炉灶' })
      },
      {
        title: '虎牌 保温壶 大容量热水瓶 2L',
        description: '日本虎牌，真空玻璃内胆，2L大容量，家庭热水保温，安全健康材质',
        brand: '虎牌TIGER',
        price: 359,
        stock: randomInt(35, 105),
        sales: randomInt(280, 4800),
        rating: randomFloat(4.6, 4.9),
        categoryId: 7,
        specs: JSON.stringify({ capacity: '2L', liner: '真空玻璃内胆', feature: '热水保温', color: ['白色', '红色', '蓝色'] })
      },

      // ==================== 图书文具 (category_id = 8) ====================
      {
        title: '三体 全集典藏版 刘慈欣 精装全3册',
        description: '雨果奖获奖作品，中国科幻里程碑，三体1+黑暗森林+死神永生，精装典藏',
        brand: '重庆出版社',
        price: 168,
        stock: randomInt(80, 220),
        sales: randomInt(1000, 9999),
        rating: randomFloat(4.7, 4.9),
        categoryId: 8,
        specs: JSON.stringify({ includes: '三体1+2+3全3册', author: '刘慈欣', binding: '精装典藏', category: '科幻小说' })
      },
      {
        title: 'Moleskine 经典硬壳笔记本 可定制 A5',
        description: '意大利传奇笔记本，硬壳封面，无酸纸，192页，可定制名字，送礼佳品',
        brand: 'Moleskine',
        price: 199,
        stock: randomInt(50, 140),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 8,
        specs: JSON.stringify({ size: 'A5', pages: '192页', cover: '硬壳', paper: '无酸纸' })
      },
      {
        title: 'LAMY凌美 钢笔 Safari狩猎者系列',
        description: '德国品牌，经典Safari系列，钢笔礼盒，ABS笔杆，书写流畅，送礼自用',
        brand: '凌美LAMY',
        price: 399,
        stock: randomInt(40, 110),
        sales: randomInt(250, 4500),
        rating: randomFloat(4.6, 4.9),
        categoryId: 8,
        specs: JSON.stringify({ series: 'Safari狩猎者', nib: 'EF/F/M尖可选', material: 'ABS笔杆', color: ['磨砂黑', '红色', '白色', '蓝色'] })
      },
      {
        title: '日本樱花 水彩笔 固体水彩套装 24色',
        description: '日本樱花水彩，24色固体水彩，颜料鲜艳，透明质感，插画水彩练习必备',
        brand: '樱花SAKURA',
        price: 149,
        stock: randomInt(35, 105),
        sales: randomInt(200, 4000),
        rating: randomFloat(4.5, 4.8),
        categoryId: 8,
        specs: JSON.stringify({ color: '24色', type: '固体水彩', material: '优质颜料', includes: '水彩盘+画笔' })
      },
      {
        title: '德国辉柏嘉 彩铅 48色专业级',
        description: '德国辉柏嘉经典彩铅，48色专业级，色彩饱和，笔触顺滑，美术生首选',
        brand: '辉柏嘉FABER-CASTELL',
        price: 129,
        stock: randomInt(40, 120),
        sales: randomInt(300, 5000),
        rating: randomFloat(4.6, 4.9),
        categoryId: 8,
        specs: JSON.stringify({ color: '48色', type: '油性彩铅', origin: '德国', includes: '收纳铁盒' })
      },
      {
        title: '晨光文具套装 学生开学礼盒',
        description: '晨光文具大礼包，含铅笔、橡皮、尺子、笔记本等，开学季必备礼物',
        brand: '晨光M&G',
        price: 59,
        stock: randomInt(100, 300),
        sales: randomInt(800, 9999),
        rating: randomFloat(4.4, 4.7),
        categoryId: 8,
        specs: JSON.stringify({ includes: '20件套', type: '开学礼盒', for: '学生', color: '多款可选' })
      },
      {
        title: '得力 文件夹 资料册 A4 100页',
        description: '得力A4文件夹，100页资料册，透明插页，办公文件整理，耐用PP材质',
        brand: '得力DELI',
        price: 29,
        stock: randomInt(120, 300),
        sales: randomInt(1000, 9999),
        rating: randomFloat(4.5, 4.8),
        categoryId: 8,
        specs: JSON.stringify({ size: 'A4', capacity: '100页', material: 'PP塑料', color: '蓝色/黑色/红色' })
      },
      {
        title: '马可素描本 8k/4k 速写本',
        description: '马可专业素描本，8k/4k可选，100g优质纸张，不吸墨不渗墨，绘画写生必备',
        brand: '马可MARCO',
        price: 49,
        stock: randomInt(70, 200),
        sales: randomInt(500, 7500),
        rating: randomFloat(4.5, 4.8),
        categoryId: 8,
        specs: JSON.stringify({ size: ['8k', '4k'], pages: '50页', type: '素描本', weight: '100g' })
      }
    ];

    for (let i = 0; i < productsData.length; i++) {
      const product = productsData[i];
      const image = await getRealProductImage(product.title);
      
      // 确保有 category_id，默认为3（数码电子）
      if (!product.categoryId && !product.category_id) {
        log(`⚠️ 产品 ${product.title} 缺少 category_id，使用默认值3`, 'info');
        product.category_id = 3;
      } else if (product.categoryId) {
        product.category_id = product.categoryId;
      }
      
      if (image) {
        product.image = image;
      } else {
        product.image = generateImageUrl(product.title, product.category_id || 3, i);
      }
      product.description = product.description || '';
      product.specs = product.specs || '{}';
      
      // 确保所有必要字段都有值
      if (!product.price) product.price = 0;
      if (!product.stock) product.stock = 0;
      if (!product.sales) product.sales = 0;
      if (!product.rating) product.rating = 0;
      
      await Product.upsert(product);
      log(`产品: ${product.title} (ID: ${i + 1}, 分类: ${product.category_id})`, 'success');
    }

    log('✅ 种子数据导入成功!', 'success');
    log(`📊 共导入 ${categoryData.length} 个分类, ${productsData.length} 个产品`, 'success');
    process.exit(0);
  } catch (error) {
    log('❌ 导入种子数据失败: ' + error.message, 'error');
    console.error(error);
    process.exit(1);
  }
};

seedData();