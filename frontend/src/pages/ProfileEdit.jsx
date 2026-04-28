import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersApi, mediaUrl } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { showToast } from '../toast.js'

// Profile edit form — allows updating display name, bio, links, and photo
export default function ProfileEdit() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName]           = useState(user?.displayName ?? '')
  const [aboutMe, setAboutMe]                   = useState(user?.aboutMe ?? '')
  const [contactLinks, setContactLinks]         = useState(user?.contactLinks ?? '')
  const [socialMediaLinks, setSocialMediaLinks] = useState(user?.socialMediaLinks ?? '')
  const [photoFile, setPhotoFile]               = useState(null)
  const [photoPreview, setPhotoPreview]         = useState(user?.profilePhotoUrl ? mediaUrl(user.profilePhotoUrl) : null)
  const [photoError, setPhotoError]             = useState('')
  const [formError, setFormError]               = useState('')
  const [uploading, setUploading]               = useState(false)
  const [saving, setSaving]                     = useState(false)
  const fileRef = useRef(null)

  // Validate and preview the selected photo before uploading
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    if (!file.type.startsWith('image/')) { setPhotoError('Please select a valid image file'); return }
    if (file.size > 5 * 1024 * 1024) { setPhotoError('Image must be smaller than 5MB'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // Upload the photo immediately without saving the rest of the form
  const handleUploadPhoto = async () => {
    if (!photoFile) return
    setUploading(true); setPhotoError('')
    try {
      await usersApi.uploadPhoto(user.id.toString(), photoFile)
      await refreshUser()
      setPhotoFile(null)
      showToast('Photo uploaded!', 'success')
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Failed to upload photo'
      setPhotoError(msg); showToast(msg, 'error')
    }
    setUploading(false)
  }

  // Save all profile fields (and upload photo if pending) then navigate to profile
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(''); setSaving(true)
    try {
      if (photoFile) { await usersApi.uploadPhoto(user.id.toString(), photoFile); setPhotoFile(null) }
      const r = await usersApi.update(user.id.toString(), { displayName, aboutMe, contactLinks, socialMediaLinks })
      await refreshUser()
      showToast('Profile updated!', 'success')
      navigate(`/profile/${r.data.id}`)
    } catch {
      setFormError('Failed to update profile')
      showToast('Failed to update profile', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Edit Profile</h1>
        <p className="page-subtitle">Update your public profile information</p>
      </div>
      {formError && <div className="alert alert-error">{formError}</div>}
      <div className="card card-body">
        {/* Photo picker */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Profile Photo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '.5rem' }}>
            <div className="profile-avatar" style={{ width: 80, height: 80, fontSize: '2rem' }}>
              {photoPreview ? <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>Choose Photo</button>
              {photoFile && (
                <button type="button" className="btn btn-sm" style={{ background: 'rgba(249,115,22,.1)', color: 'var(--brand)', marginLeft: '.5rem' }} onClick={handleUploadPhoto} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Now'}
                </button>
              )}
              <p className="text-xs text-muted" style={{ marginTop: '.25rem' }}>JPG, PNG, GIF up to 5MB</p>
              {photoError && <p className="form-error">{photoError}</p>}
            </div>
          </div>
        </div>

        {/* Profile fields */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="pe-name">Display Name</label>
            <input id="pe-name" type="text" className="form-input" required minLength={2} value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pe-about">About Me</label>
            <textarea id="pe-about" className="form-textarea" rows={4} placeholder="Tell the community about yourself..." value={aboutMe} onChange={e => setAboutMe(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pe-contact">Contact Links</label>
            <input id="pe-contact" type="text" className="form-input" placeholder="Email, website, etc." value={contactLinks} onChange={e => setContactLinks(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="pe-social">Social Media</label>
            <input id="pe-social" type="text" className="form-input" placeholder="Twitter, Instagram, etc." value={socialMediaLinks} onChange={e => setSocialMediaLinks(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '.75rem', paddingTop: '.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
