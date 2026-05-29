import sequelize from '../config/database.js'
import { User } from '../models/index.js'
import { initAssociations } from '../models/index.js'

const seedAdmin = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connection established successfully')

    initAssociations()
    console.log('✅ Model associations initialized')

    const [admin, created] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        password: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active'
      }
    })

    if (!created && admin) {
      await admin.update({
        password: 'admin123',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active'
      })
      console.log('✅ Admin account updated')
    } else {
      console.log('✅ Admin account created')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to seed admin account:', error)
    process.exit(1)
  }
}

seedAdmin()
