const mongoose = require('mongoose')

require('dotenv').config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables')
  process.exit(1)
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  image: String,
  provider: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function makeAdmin(email) {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      console.error(`User not found with email: ${email}`)
      process.exit(1)
    }

    if (user.role === 'admin') {
      console.log(`ℹUser ${email} is already an admin`)
      process.exit(0)
    }

    user.role = 'admin'
    await user.save()

    console.log(`Successfully promoted ${email} to admin role`)
    console.log('\nUser details:')
    console.log(`  Name: ${user.name}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Created: ${user.createdAt}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}
const email = process.argv[2]

if (!email) {
  console.error('Please provide an email address')
  console.log('\nUsage: node scripts/make-admin.js <email>')
  console.log('Example: node scripts/make-admin.js user@example.com')
  process.exit(1)
}

makeAdmin(email)
