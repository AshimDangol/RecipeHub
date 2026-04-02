import { initRouter, route, navigate } from './router.js'
import { initLayout } from './components/layout.js'
import { loadUser, isAuthenticated } from './auth.js'
import { renderHome } from './pages/home.js'
import { renderLogin } from './pages/login.js'
import { renderRegister } from './pages/register.js'
import { renderRecipes } from './pages/recipes.js'
import { renderRecipeDetail } from './pages/recipe-detail.js'
import { renderRecipeForm } from './pages/recipe-form.js'
import { renderChefs } from './pages/chefs.js'
import { renderChefDetail } from './pages/chef-detail.js'
import { renderProfile } from './pages/profile.js'
import { renderProfileEdit } from './pages/profile-edit.js'
import { renderNotifications } from './pages/notifications.js'
import { renderAdmin } from './pages/admin.js'
import { renderModeration } from './pages/moderation.js'

function requireAuth(handler) {
  return (params, container) => {
    if (!isAuthenticated()) { navigate('/login'); return }
    return handler(params, container)
  }
}

// Register routes
route('/', renderHome)
route('/login', renderLogin)
route('/register', renderRegister)
route('/recipes', renderRecipes)
route('/recipes/create', requireAuth(renderRecipeForm))
route('/recipes/edit/:id', requireAuth((params, container) => renderRecipeForm({ recipeId: params.id }, container)))
route('/recipes/:id', renderRecipeDetail)
route('/chefs', renderChefs)
route('/chefs/:id', renderChefDetail)
route('/profile/edit', requireAuth(renderProfileEdit))
route('/profile/:id', renderProfile)
route('/notifications', requireAuth(renderNotifications))
route('/admin', requireAuth(renderAdmin))
route('/admin/moderation', requireAuth(renderModeration))

async function init() {
  // Load user from stored token before rendering
  await loadUser()
  initLayout()
  initRouter()
  // Re-render header on navigation to update active links
  window.addEventListener('popstate', () => initLayout())
}

init()
