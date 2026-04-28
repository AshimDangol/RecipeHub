import mongoose from 'mongoose'

// Audit trail for admin moderation actions (flag / restore)
const moderationLogSchema = new mongoose.Schema({
  admin:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin who performed the action
  action:      { type: String, enum: ['Flag', 'Restore'], required: true },
  contentType: { type: String, enum: ['Recipe', 'Review'], required: true },
  contentId:   { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the flagged/restored document
  reason:      { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('ModerationLog', moderationLogSchema)
