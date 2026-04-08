import { isAuthenticated } from '../auth.js'

const features = [
  { icon: '🍳', title: 'Cook & Share', desc: 'Share your culinary creations with a passionate community of food lovers.' },
  { icon: '⭐', title: 'Rate & Review', desc: 'Help others discover great recipes with honest ratings and reviews.' },
  { icon: '👨‍🍳', title: 'Follow Chefs', desc: 'Stay inspired by following your favorite chefs and their latest recipes.' },
  { icon: '❤️', title: 'Save Favorites', desc: 'Bookmark recipes you love and build your personal cookbook.' },
]
const categories = ['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Snacks', 'Drinks']

export function renderHome(params, container) {
  const auth = isAuthenticated()
  container.innerHTML = `
    <div class="space-y">
      <section class="hero">
        <span class="hero-badge">🎉 Join thousands of food lovers</span>
        <h1>Discover &amp; Share<span>Amazing Recipes</span></h1>
        <p>RecipeNest is where passionate cooks come together to share, discover, and celebrate great food.</p>
        <div class="hero-actions">
          <a href="/recipes" class="btn btn-primary btn-lg">Browse Recipes</a>
          ${!auth ? `<a href="/register" class="btn btn-secondary btn-lg">Join for Free</a>` : ''}
        </div>
      </section>

      <section>
        <div style="text-align:center;margin-bottom:3rem">
          <h2 class="font-bold" style="font-size:1.875rem;margin-bottom:.75rem">Everything you need to cook better</h2>
          <p class="text-muted">A platform built for food lovers, by food lovers.</p>
        </div>
        <div class="features-grid">
          ${features.map(f => `
            <div class="card feature-card">
              <div class="feature-icon">${f.icon}</div>
              <h3 class="feature-title">${f.title}</h3>
              <p class="feature-desc">${f.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <section>
        <div style="text-align:center;margin-bottom:2rem">
          <h2 class="font-bold" style="font-size:1.875rem;margin-bottom:.75rem">Browse by Category</h2>
          <p class="text-muted">Find exactly what you're craving.</p>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.75rem;justify-content:center">
          ${categories.map(cat => `
            <a href="/recipes?category=${cat.toLowerCase()}" class="btn btn-secondary">${cat}</a>
          `).join('')}
        </div>
      </section>

      ${!auth ? `
        <section class="cta">
          <h2>Ready to start cooking?</h2>
          <p>Create your free account and start sharing your recipes with the world.</p>
          <a href="/register" class="btn btn-lg">Create Free Account</a>
        </section>
      ` : ''}
    </div>
  `
}
