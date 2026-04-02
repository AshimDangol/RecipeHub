let counter = 0
const container = () => document.getElementById('toast-container')

const icons = { success: '✓', error: '✕', info: 'ℹ' }

export function showToast(message, type = 'info') {
  const id = `toast-${++counter}`
  const el = document.createElement('div')
  el.className = `toast toast-${type}`
  el.id = id
  el.setAttribute('role', 'alert')
  el.innerHTML = `
    <span class="toast-icon">${icons[type] ?? icons.info}</span>
    <span>${message}</span>
    <button class="toast-close" aria-label="Dismiss">✕</button>
  `
  el.querySelector('.toast-close').addEventListener('click', () => dismiss(id))
  container().appendChild(el)
  setTimeout(() => dismiss(id), 3500)
}

function dismiss(id) {
  const el = document.getElementById(id)
  if (el) el.remove()
}
