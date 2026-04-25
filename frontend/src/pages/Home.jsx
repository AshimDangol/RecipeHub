import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const features = [
  { icon: '🍳', title: 'Cook & Share', desc: 'Share your culinary creations with a passionate community of food lovers.' },
  { icon: '⭐', title: 'Rate & Review', desc: 'Help others discover great recipes with honest ratings and reviews.' },
  { icon: '👨‍🍳', title: 'Follow Chefs', desc: 'Stay inspired by following your favorite chefs and their latest recipes.' },
  { icon: '❤️', title: 'Save Favorites', desc: 'Bookmark recipes you love and build your personal cookbook.' },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  return (
    <div className="space-y">
      <section className="hero">
        <span className="hero-badge">🎉 Join thousands of food lovers</span>
        <h1>Discover &amp; Share<span>Amazing Recipes</span></h1>
        <p>RecipeNest is where passionate cooks come together to share, discover, and celebrate great food.</p>
        <div className="hero-actions">
          <Link to="/recipes" className="btn btn-primary btn-lg">Browse Recipes</Link>
          {!isAuthenticated && <Link to="/register" className="btn btn-secondary btn-lg">Join for Free</Link>}
        </div>
      </section>
      <section>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="font-bold" style={{ fontSize: '1.875rem', marginBottom: '.75rem' }}>Everything you need to cook better</h2>
          <p className="text-muted">A platform built for food lovers, by food lovers.</p>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.title} className="card feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {!isAuthenticated && (
        <section className="cta">
          <h2>Ready to start cooking?</h2>
          <p>Create your free account and start sharing your recipes with the world.</p>
          <Link to="/register" className="btn btn-lg">Create Free Account</Link>
        </section>
      )}
    </div>
  )
}
