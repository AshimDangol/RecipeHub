import mongoose from 'mongoose'

// Tracks which recipes a user has saved as favorites
const favoriteSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

// Prevent a user from favoriting the same recipe twice
favoriteSchema.index({ recipe: 1, user: 1 }, { unique: true })

export default mongoose.model('Favorite', favoriteSchema)
