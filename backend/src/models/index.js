import sequelize from '../config/database.js'
import User from './User.js'
import Product from './Product.js'
import Order from './Order.js'
import OrderItem from './OrderItem.js'
import Cart from './Cart.js'
import Address from './Address.js'
import Category from './Category.js'
import Announcement from './Announcement.js'
import Promotion from './Promotion.js'
import Favorite from './Favorite.js'

export const initAssociations = () => {
  Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
  })
  Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
  })

  Category.hasMany(Category, {
    foreignKey: 'parent_id',
    as: 'children'
  })
  Category.belongsTo(Category, {
    foreignKey: 'parent_id',
    as: 'parent'
  })

  User.hasMany(Order, {
    foreignKey: 'user_id',
    as: 'orders'
  })
  Order.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  })

  User.hasMany(Address, {
    foreignKey: 'user_id',
    as: 'addresses'
  })
  Address.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  })

  Order.belongsTo(Address, {
    foreignKey: 'shipping_address_id',
    as: 'shippingAddress'
  })

  Order.hasMany(OrderItem, {
    foreignKey: 'order_id',
    as: 'items'
  })
  OrderItem.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order'
  })

  OrderItem.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  })
  Product.hasMany(OrderItem, {
    foreignKey: 'product_id',
    as: 'orderItems'
  })

  User.hasMany(Cart, {
    foreignKey: 'user_id',
    as: 'cartItems'
  })
  Cart.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  })

  Cart.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  })
  Product.hasMany(Cart, {
    foreignKey: 'product_id',
    as: 'cartItems'
  })

  User.hasMany(Favorite, {
    foreignKey: 'user_id',
    as: 'favorites'
  })
  Favorite.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  })

  Product.hasMany(Favorite, {
    foreignKey: 'product_id',
    as: 'favoriteRecords'
  })
  Favorite.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product'
  })
}

export const syncDatabase = async (force = false) => {
  if (force) {
    await sequelize.sync({ force: true })
  }
}

export {
  User,
  Product,
  Order,
  OrderItem,
  Cart,
  Address,
  Category,
  Announcement,
  Promotion,
  Favorite,
  sequelize
}
