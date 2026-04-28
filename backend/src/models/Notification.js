import mongoose from 'mongoose'

// In-app notification sent to a user (e.g. new follower, recipe liked)
const notificationSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
  message:         { type: String, required: true },
  isRead:          { type: Boolean, default: false },
  relatedRecipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null }, // optional recipe link
  relatedUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },   // optional user link
}, { timestamps: true })

// Index for fast per-user notification queries sorted by newest first
notificationSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
