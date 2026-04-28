import mongoose from 'mongoose'

// Represents a follow relationship between two users
const followSchema = new mongoose.Schema({
  follower:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // the user who follows
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // the user being followed
}, { timestamps: true })

// Prevent duplicate follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true })

export default mongoose.model('Follow', followSchema)
