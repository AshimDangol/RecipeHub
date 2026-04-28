import mongoose from 'mongoose'

// Connect to MongoDB using the URI from environment variables
export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables')

  await mongoose.connect(uri)
  console.log(`MongoDB connected: ${mongoose.connection.host}`)
}
