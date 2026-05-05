import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.ENUM('wechat', 'alipay', 'card', 'other'),
    allowNull: true
  },
  payment_no: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  shipping_address_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tracking_no: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true
})

export default Order
