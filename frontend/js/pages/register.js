import { register } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'

export function renderRegister(params, container) {
  container.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-box">
        <div class="auth-header">
          <div class="auth-icon">🍳</div>
          <h1>Join RecipeNest</h1>
          <p>Create your free account and start cooking</p>
        </div>
        <div class="card card-body">
          <div id="reg-error" class="alert alert-error hidden"></div>
          <form id="reg-form" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="displayName">Display Name</label>
              <input id="displayName" type="text" class="form-input" placeholder="Chef John" required minlength="2" />
            </div>
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input id="email" type="email" class="form-input" placeholder="you@example.com" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <div class="password-wrap">
                <input id="password" type="password" class="form-input" placeholder="Min. 8 chars, upper, lower & number" required minlength="8" />
                <button type="button" class="password-toggle" aria-label="Toggle password visibility">👁</button>
              </div>
            </div>
            <button type="submit" id="reg-btn" class="btn btn-primary btn-full">Create Account</button>
          </form>
        </div>
        <p class="auth-footer">Already have an account? <a href="/login">Sign in</a></p>
      </div>
    </div>
  `

  const form = document.getElementById('reg-form')
  const errEl = document.getElementById('reg-error')
  const btn = document.getElementById('reg-btn')

  // Password visibility toggle
  const pwInput = document.getElementById('password')
  document.querySelector('.password-toggle').addEventListener('click', () => {
    const show = pwInput.type === 'password'
    pwInput.type = show ? 'text' : 'password'
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errEl.classList.add('hidden')
    btn.disabled = true; btn.textContent = 'Creating account...'
    try {
      await register(
        document.getElementById('email').value,
        document.getElementById('password').value,
        document.getElementById('displayName').value
      )
      showToast('Account created! Welcome to RecipeNest.', 'success')
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Registration failed. Please try again.'
      errEl.textContent = msg; errEl.classList.remove('hidden')
      showToast(msg, 'error')
    } finally {
      btn.disabled = false; btn.textContent = 'Create Account'
    }
  })
}
