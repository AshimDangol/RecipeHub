import mongoose from 'mongoose'

const ingredientSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  quantity:   { type: String, required: true },
  orderIndex: { type: Number, default: 0 },
}, { _id: false })

const instructionSchema = new mongoose.Schema({
  stepText:   { type: String, required: true },
  orderIndex: { type: Number, default: 0 },
}, { _id: false })

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
  likeCount:              { type: Number, default: 0 },
  averageRating:          { type: Number, default: 0 },
  reviewCount:            { type: Number, default: 0 },
  isFlagged:              { type: Boolean, default: false },
}, { timestamps: true })

recipeSchema.index({ title: 'text', description: 'text' })
recipeSchema.index({ category: 1 })
recipeSchema.index({ difficulty: 1 })

export default mongoose.model('Recipe', recipeSchema)
