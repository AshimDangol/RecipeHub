import mongoose from 'mongoose'

// Sub-schema for a single ingredient line
const ingredientSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  quantity:   { type: String, required: true },
  orderIndex: { type: Number, default: 0 }, // display order
}, { _id: false })

// Sub-schema for a single instruction step
const instructionSchema = new mongoose.Schema({
  stepText:   { type: String, required: true },
  orderIndex: { type: Number, default: 0 }, // display order
}, { _id: false })

// Main recipe document
const recipeSchema = new mongoose.Schema({
  title:                  { type: String, required: true, trim: true, minlength: 3 },
  description:            { type: String, default: '' },
  category:               { type: String, required: true, trim: true },
  difficulty:             { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  preparationTimeMinutes: { type: Number, required: true, min: 1 },
  imageUrl:               { type: String, default: null },
  author:                 { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ingredients:            [ingredientSchema],
  instructions:           [instructionSchema],
  likeCount:              { type: Number, default: 0 },    // denormalised for fast reads
  averageRating:          { type: Number, default: 0 },    // recalculated on each review change
  reviewCount:            { type: Number, default: 0 },
  isFlagged:              { type: Boolean, default: false }, // hidden from public when true
}, { timestamps: true })

// Full-text search index on title and description
recipeSchema.index({ title: 'text', description: 'text' })
recipeSchema.index({ category: 1 })
recipeSchema.index({ difficulty: 1 })

export default mongoose.model('Recipe', recipeSchema)
