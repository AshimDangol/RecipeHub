import { login } from '../auth.js'
import { navigate } from '../router.js'
import { showToast } from '../toast.js'

export function renderLogin(params, container) {
  container.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-box">
        <div class="auth-header">
          <div class="auth-icon">🍳</div>
          <h1>Welcome back</h1>
          <p>Sign in to your RecipeNest account</p>
        </div>
        <div class="card card-body">
          <div id="login-error" class="alert alert-error hidden"></div>
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input id="email" type="email" class="form-input" placeholder="you@example.com" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <div class="password-wrap">
                <input id="password" type="password" class="form-input" placeholder="••••••••" required />
                <button type="button" class="password-toggle" aria-label="Toggle password visibility">👁</button>
              </div>
            </div>
            <button type="submit" id="login-btn" class="btn btn-primary btn-full">Sign In</button>
          </form>
        </div>
        <p class="auth-footer">Don't have an account? <a href="/register">Create one free</a></p>
      </div>
    </div>
  `

  const form = document.getElementById('login-form')
  const errEl = document.getElementById('login-error')
  const btn = document.getElementById('login-btn')

  // Password visibility toggle
  const pwInput = document.getElementById('password')
  document.querySelector('.password-toggle').addEventListener('click', () => {
    const show = pwInput.type === 'password'
    pwInput.type = show ? 'text' : 'password'
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errEl.classList.add('hidden')
    btn.disabled = true; btn.textContent = 'Signing in...'
    try {
      await login(document.getElementById('email').value, document.getElementById('password').value)
      showToast('Welcome back!', 'success')
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? 'Invalid email or password. Please try again.'
      errEl.textContent = msg; errEl.classList.remove('hidden')
      showToast(msg, 'error')
    } finally {
      btn.disabled = false; btn.textContent = 'Sign In'
    }
  })
}
