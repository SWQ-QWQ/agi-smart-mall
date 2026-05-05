import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { sequelize } from './models/index.js'
import { initAssociations } from './models/index.js'

import productRoutes from './routes/products.js'
import authRoutes from './routes/auth.js'
import addressRoutes from './routes/address.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/orders.js'
import aiRoutes from './routes/ai.js'
import adminRoutes from './routes/admin.js'
import categoryRoutes from './routes/categories.js'
import announcementRoutes from './routes/announcements.js'
import promotionRoutes from './routes/promotions.js'
import favoriteRoutes from './routes/favorites.js'
import uploadRoutes from './routes/upload.js'
import paymentRoutes from './routes/payment.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AGI智能商城 - 后端服务</title>
      <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 0; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
        .container { max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.15); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); }
        h1 { font-size: 3rem; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .subtitle { font-size: 1.2rem; margin-bottom: 40px; opacity: 0.9; }
        .info { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin: 20px 0; }
        .endpoints { text-align: left; margin-top: 30px; }
        .endpoint { margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; font-family: 'Courier New', monospace; }
        .status { display: inline-block; padding: 5px 15px; background: #10b981; border-radius: 20px; font-weight: bold; margin: 20px 0; }
        .url { font-size: 1.5rem; color: #ffd700; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏪 AGI智能商城</h1>
        <p class="subtitle">后端API服务正常运行中</p>
        <div class="status">✅ 服务状态: 正常</div>
        <p class="url">📡 访问地址: http://localhost:3000</p>
        
        <div class="info">
          <h3>📋 API 端点</h3>
          <div class="endpoints">
            <div class="endpoint">GET /api/health - 健康检查</div>
            <div class="endpoint">GET /api/products - 获取商品列表</div>
            <div class="endpoint">GET /api/categories - 获取分类列表</div>
            <div class="endpoint">POST /api/auth/login - 用户登录</div>
            <div class="endpoint">POST /api/auth/register - 用户注册</div>
            <div class="endpoint">POST /api/cart - 添加购物车</div>
            <div class="endpoint">GET /api/orders - 获取订单列表</div>
          </div>
        </div>
        
        <p style="margin-top: 30px; opacity: 0.8;">前端地址: <a href="http://localhost:5173" style="color: #ffd700; font-weight: bold;">http://localhost:5173</a></p>
      </div>
    </body>
    </html>
  `)
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AGI智能商城后端服务运行正常' })
})

app.use('/uploads', express.static('src/uploads'))
app.use(express.raw({ type: 'application/xml', limit: '1mb' }))

app.use('/api/products', productRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/payment', paymentRoutes)

const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection established successfully')

    initAssociations()
    console.log('✅ Model associations initialized')

    // await sequelize.sync({ alter: true })
    // console.log('✅ Database tables synchronized with schema updates')

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('❌ Unable to start server:', error)
    process.exit(1)
  }
}

startServer()
