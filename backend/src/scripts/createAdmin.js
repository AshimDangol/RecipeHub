import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/User.js'

const EMAIL = 'admin@recipenest.com'
const PASSWORD = 'Admin@1234'
const DISPLAY_NAME = 'Admin'

await mongoose.connect(process.env.MONGODB_URI)

const existing = await User.findOne({ email: EMAIL })
if (existing) {
  if (!existing.isAdmin) {
    existing.isAdmin = true
    await existing.save()
    console.log('Existing user promoted to admin.')
  } else {
    console.log('Admin user already exists.')
  }
} else {
  await User.create({
    email: EMAIL,
    passwordHash: await bcrypt.hash(PASSWORD, 12),
    displayName: DISPLAY_NAME,
    isAdmin: true,
  })
  console.log('Admin user created.')
}

console.log(`\nEmail:    ${EMAIL}`)
console.log(`Password: ${PASSWORD}`)

await mongoose.disconnect()
