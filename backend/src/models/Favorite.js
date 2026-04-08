import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

favoriteSchema.index({ recipe: 1, user: 1 }, { unique: true })

export default mongoose.model('Favorite', favoriteSchema)
