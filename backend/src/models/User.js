import mongoose from 'mongoose'

// Core user account — stores credentials and public profile data
const userSchema = new mongoose.Schema({
  email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:     { type: String, required: true }, // bcrypt hash, never stored in plain text
  displayName:      { type: String, required: true, trim: true, minlength: 2 },
  aboutMe:          { type: String, default: '' },
  profilePhotoUrl:  { type: String, default: null },
  contactLinks:     { type: String, default: '' },
  socialMediaLinks: { type: String, default: '' },
  isAdmin:          { type: Boolean, default: false },
}, { timestamps: true })

// Returns a safe public representation of the user (no passwordHash)
userSchema.methods.toDTO = function () {
  return {
    id:               this._id,
    email:            this.email,
    displayName:      this.displayName,
    aboutMe:          this.aboutMe,
    profilePhotoUrl:  this.profilePhotoUrl,
    contactLinks:     this.contactLinks,
    socialMediaLinks: this.socialMediaLinks,
    isAdmin:          this.isAdmin,
    createdAt:        this.createdAt,
  }
}

export default mongoose.model('User', userSchema)
