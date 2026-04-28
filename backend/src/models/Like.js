import mongoose from 'mongoose'

// Tracks which users have liked which recipes
const likeSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

// A user can only like a recipe once
likeSchema.index({ recipe: 1, user: 1 }, { unique: true })

export default mongoose.model('Like', likeSchema)
