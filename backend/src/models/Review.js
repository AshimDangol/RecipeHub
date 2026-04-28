import mongoose from 'mongoose'

// A user's rating and optional comment on a recipe
const reviewSchema = new mongoose.Schema({
  recipe:    { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:    { type: Number, required: true, min: 1, max: 5 }, // 1–5 star rating
  comment:   { type: String, default: '' },
  isFlagged: { type: Boolean, default: false }, // hidden by moderators when true
}, { timestamps: true })

// One review per user per recipe
reviewSchema.index({ recipe: 1, author: 1 }, { unique: true })

export default mongoose.model('Review', reviewSchema)
