import { Link } from 'react-router-dom'
import { mediaUrl } from '../api.js'

// Maps difficulty level to the corresponding CSS badge class
const diffBadge = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }

// Card component used in recipe grids — links to the recipe detail page
export default function RecipeCard({ recipe: r }) {
  const img = mediaUrl(r.imageUrl)
  return (
    <Link to={`/recipes/${r.id}`} className="card recipe-card">
      {/* Recipe image or placeholder icon */}
      <div className="recipe-card-img">
        {img ? <img src={img} alt={r.title} loading="lazy" /> : <span className="recipe-card-placeholder">🍽️</span>}
        <span className={`recipe-card-badge badge ${diffBadge[r.difficulty] ?? ''}`}>{r.difficulty}</span>
      </div>
      <div className="recipe-card-body">
        <div className="recipe-card-cat">{r.category}</div>
        <h3 className="recipe-card-title">{r.title}</h3>
        {r.description && <p className="recipe-card-desc">{r.description}</p>}
        <div className="recipe-card-footer">
          <div className="recipe-card-stats">
            <span>⏱ {r.preparationTimeMinutes}m</span>
            <span>⭐ {(r.averageRating ?? 0).toFixed(1)}</span>
            <span>({r.reviewCount})</span>
          </div>
          <span className="recipe-card-author">by {r.author?.displayName ?? ''}</span>
        </div>
      </div>
    </Link>
  )
}
