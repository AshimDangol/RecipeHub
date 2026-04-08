const diffBadge = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }

export function recipeCardHTML(r) {
  return `
    <a href="/recipes/${r.id}" class="card recipe-card">
      <div class="recipe-card-img">
        ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}" loading="lazy">` : '🍽️'}
        <span class="recipe-card-badge badge ${diffBadge[r.difficulty] ?? ''}">${r.difficulty}</span>
      </div>
      <div class="recipe-card-body">
        <div class="recipe-card-cat">${r.category}</div>
        <h3 class="recipe-card-title">${r.title}</h3>
        ${r.description ? `<p class="recipe-card-desc">${r.description}</p>` : ''}
        <div class="recipe-card-footer">
          <div style="display:flex;gap:.75rem">
            <span>⏱ ${r.preparationTimeMinutes}m</span>
            <span>⭐ ${(r.averageRating ?? 0).toFixed(1)} (${r.reviewCount})</span>
          </div>
          <span>by ${r.author?.displayName ?? ''}</span>
        </div>
      </div>
    </a>
  `
}
