# AGI智能商城数据库设计文档

## 数据库表关系图

```
┌─────────────┐
│    Users    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       ▼              ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Orders    │  │    Cart     │  │   Address   │  │             │
└──────┬──────┘  └──────┬──────┘  └─────────────┘  │             │
       │                │                            │             │
       │                │                            │             │
       ▼                ▼                            │             │
┌─────────────┐  ┌─────────────┐                    │             │
│  OrderItems │  │   Products  │◄───────────────────┘             │
└──────┬──────┘  └─────────────┘                                  │
       │                                                          │
       └──────────────────────────────────────────────────────────┘

┌─────────────┐
│  Category   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Products  │
└─────────────┘
```

## 表结构说明

### 1. users 用户表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| email | VARCHAR(100) | 邮箱，唯一 |
| password | VARCHAR(255) | bcrypt加密后的密码 |
| phone | VARCHAR(20) | 手机号 |
| avatar | VARCHAR(255) | 头像URL |
| status | ENUM | 状态：active/inactive/banned |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 2. products 商品表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| category_id | INT | 分类ID |
| title | VARCHAR(200) | 商品标题 |
| description | TEXT | 商品描述 |
| image | VARCHAR(255) | 商品图片URL |
| price | DECIMAL(10,2) | 单价 |
| stock | INT | 库存 |
| sales | INT | 销量 |
| rating | DECIMAL(3,2) | 评分 |
| status | ENUM | 状态：active/inactive/deleted |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 3. categories 商品分类表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| name | VARCHAR(50) | 分类名称 |
| parent_id | INT | 父分类ID |
| level | INT | 层级 |
| sort_order | INT | 排序 |
| status | ENUM | 状态：active/inactive |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 4. orders 订单表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| order_no | VARCHAR(50) | 订单号，唯一 |
| user_id | INT | 用户ID |
| total_price | DECIMAL(10,2) | 订单总价 |
| status | ENUM | 状态：pending/paid/shipped/delivered/cancelled/refunded |
| payment_method | ENUM | 支付方式：wechat/alipay/card/other |
| payment_no | VARCHAR(100) | 支付流水号 |
| shipping_address_id | INT | 收货地址ID |
| tracking_no | VARCHAR(100) | 物流单号 |
| remark | TEXT | 备注 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 5. order_items 订单项表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| order_id | INT | 订单ID |
| product_id | INT | 商品ID |
| quantity | INT | 数量 |
| price | DECIMAL(10,2) | 购买时的单价 |
| subtotal | DECIMAL(10,2) | 小计 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 6. carts 购物车表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| product_id | INT | 商品ID |
| quantity | INT | 数量 |
| selected | BOOLEAN | 是否选中 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 7. addresses 收货地址表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | INT | 用户ID |
| receiver_name | VARCHAR(50) | 收货人姓名 |
| phone | VARCHAR(20) | 联系电话 |
| province | VARCHAR(50) | 省份 |
| city | VARCHAR(50) | 城市 |
| district | VARCHAR(50) | 区县 |
| detail_address | VARCHAR(255) | 详细地址 |
| postal_code | VARCHAR(10) | 邮政编码 |
| is_default | BOOLEAN | 是否默认地址 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 模型关联关系

```javascript
// 用户-订单：一对多
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' })
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 用户-地址：一对多
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' })
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 订单-订单项：一对多
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' })
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' })

// 订单项-商品：多对一
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' })

// 订单-收货地址：多对一
Order.belongsTo(Address, { foreignKey: 'shipping_address_id', as: 'shippingAddress' })

// 用户-购物车：一对多
User.hasMany(Cart, { foreignKey: 'user_id', as: 'cartItems' })
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 购物车-商品：多对一
Cart.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })
Product.hasMany(Cart, { foreignKey: 'product_id', as: 'cartItems' })

// 商品-分类：多对一
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' })
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' })
```

## 初始化数据库

```bash
node src/scripts/initDatabase.js
```
