import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    field: 'parent_id'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order'
  },
  showInNav: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'show_in_nav'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true
})

export default Category
