import { usersApi } from '../api.js'
import { getUser, isAuthenticated, refreshUser } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'
import { openCropModal } from '../components/crop-modal.js'

export function renderProfileEdit(params, container) {
  if (!isAuthenticated()) { navigate('/login'); return }
  const user = getUser()
  if (!user) {
    container.innerHTML = `<div class="empty-state"><p class="text-muted">Please login to edit your profile</p></div>`
    return
  }

  let photoFile = null

  container.innerHTML = `
    <div style="max-width:560px;margin:0 auto">
      <div class="page-header">
        <h1 class="page-title">Edit Profile</h1>
        <p class="page-subtitle">Update your public profile information</p>
      </div>
      <div id="form-error" class="alert alert-error hidden"></div>
      <div class="card card-body">
        <div class="form-group mb-6">
          <label class="form-label">Profile Photo</label>
          <div style="display:flex;align-items:center;gap:1.25rem;margin-top:.5rem">
            <div class="profile-avatar" style="width:80px;height:80px;font-size:2rem" id="avatar-wrap">
              ${user.profilePhotoUrl
                ? `<img src="${user.profilePhotoUrl}" alt="Preview" id="photo-preview">`
                : user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <input type="file" id="photo-input" accept="image/*" style="display:none">
              <button type="button" id="choose-photo" class="btn btn-outline btn-sm">Choose Photo</button>
              <button type="button" id="upload-photo" class="btn btn-sm hidden" style="background:rgba(249,115,22,.1);color:var(--brand);margin-left:.5rem">Upload Now</button>
              <p class="text-xs text-muted mt-1">JPG, PNG, GIF up to 5MB</p>
              <p id="photo-error" class="form-error hidden"></p>
            </div>
          </div>
        </div>
        <form id="profile-form" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="pe-name">Display Name</label>
            <input id="pe-name" type="text" class="form-input" value="${user.displayName}" required minlength="2">
          </div>
          <div class="form-group">
            <label class="form-label" for="pe-about">About Me</label>
            <textarea id="pe-about" class="form-textarea" rows="4" placeholder="Tell the community about yourself...">${user.aboutMe || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="pe-contact">Contact Links</label>
            <input id="pe-contact" type="text" class="form-input" value="${user.contactLinks || ''}" placeholder="Email, website, etc.">
          </div>
          <div class="form-group">
            <label class="form-label" for="pe-social">Social Media</label>
            <input id="pe-social" type="text" class="form-input" value="${user.socialMediaLinks || ''}" placeholder="Twitter, Instagram, etc.">
          </div>
          <div style="display:flex;gap:.75rem;padding-top:.5rem">
            <button type="submit" id="pe-submit" class="btn btn-primary" style="flex:1">Save Changes</button>
            <button type="button" id="pe-cancel" class="btn btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `

  const photoInput   = container.querySelector('#photo-input')
  const chooseBtn    = container.querySelector('#choose-photo')
  const uploadBtn    = container.querySelector('#upload-photo')
  const avatarWrap   = container.querySelector('#avatar-wrap')
  const photoErrEl   = container.querySelector('#photo-error')
  const formErrEl    = container.querySelector('#form-error')
  const submitBtn    = container.querySelector('#pe-submit')
  const cancelBtn    = container.querySelector('#pe-cancel')
  const form         = container.querySelector('#profile-form')

  chooseBtn.addEventListener('click', () => photoInput.click())

  photoInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    photoErrEl.classList.add('hidden')
    if (!file.type.startsWith('image/')) {
      photoErrEl.textContent = 'Please select a valid image file'
      photoErrEl.classList.remove('hidden')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      photoErrEl.textContent = 'Image must be smaller than 5MB'
      photoErrEl.classList.remove('hidden')
      return
    }
    // Open crop modal (1:1 aspect for profile photo)
    const cropped = await openCropModal(file, { aspect: 1, outputSize: 400 })
    if (!cropped) { photoInput.value = ''; return }
    photoFile = cropped
    avatarWrap.innerHTML = `<img src="${URL.createObjectURL(cropped)}" alt="Preview" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
    uploadBtn.classList.remove('hidden')
  })

  uploadBtn.addEventListener('click', async () => {
    if (!photoFile) return
    uploadBtn.disabled = true
    uploadBtn.textContent = 'Uploading...'
    photoErrEl.classList.add('hidden')
    try {
      await usersApi.uploadPhoto(user.id.toString(), photoFile)
      await refreshUser()
      photoFile = null
      uploadBtn.classList.add('hidden')
      uploadBtn.textContent = 'Upload Now'
      showToast('Photo uploaded!', 'success')
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Failed to upload photo'
      photoErrEl.textContent = msg
      photoErrEl.classList.remove('hidden')
      uploadBtn.disabled = false
      uploadBtn.textContent = 'Upload Now'
      showToast(msg, 'error')
    }
  })

  cancelBtn.addEventListener('click', () => navigate(-1))

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    formErrEl.classList.add('hidden')
    submitBtn.disabled = true
    submitBtn.textContent = 'Saving...'
    try {
      if (photoFile) {
        await usersApi.uploadPhoto(user.id.toString(), photoFile)
        photoFile = null
      }
      const r = await usersApi.update(user.id.toString(), {
        displayName: container.querySelector('#pe-name').value,
        aboutMe:     container.querySelector('#pe-about').value,
        contactLinks: container.querySelector('#pe-contact').value,
        socialMediaLinks: container.querySelector('#pe-social').value,
      })
      await refreshUser()
      showToast('Profile updated!', 'success')
      navigate(`/profile/${r.data.id}`)
    } catch {
      formErrEl.textContent = 'Failed to update profile'
      formErrEl.classList.remove('hidden')
      submitBtn.disabled = false
      submitBtn.textContent = 'Save Changes'
      showToast('Failed to update profile', 'error')
    }
  })
}
