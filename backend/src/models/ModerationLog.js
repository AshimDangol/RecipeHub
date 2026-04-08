import mongoose from 'mongoose'

const moderationLogSchema = new mongoose.Schema({
  admin:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:      { type: String, enum: ['Flag', 'Restore'], required: true },
  contentType: { type: String, enum: ['Recipe', 'Review'], required: true },
  contentId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  reason:      { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('ModerationLog', moderationLogSchema)
