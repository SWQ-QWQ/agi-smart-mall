import sequelize from '../config/database.js'
import { syncDatabase, initAssociations } from '../models/index.js'

const initDB = async () => {
  try {
    console.log('🔄 Connecting to database...')
    await sequelize.authenticate()
    console.log('✅ Database connected successfully')

    console.log('🔄 Initializing associations...')
    initAssociations()
    console.log('✅ Associations initialized')

    console.log('🔄 Syncing database tables...')
    await syncDatabase(false)
    console.log('✅ Database tables synchronized')

    console.log('🎉 Database initialization completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

initDB()
