import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema({
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

likeSchema.index({ recipe: 1, user: 1 }, { unique: true })

export default mongoose.model('Like', likeSchema)
