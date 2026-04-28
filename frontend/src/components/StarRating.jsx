import React, { useState } from 'react'

// Interactive (or read-only) 1–5 star rating widget.
// Pass onChange to make it interactive; readOnly to disable interaction.
export default function StarRating({ value, onChange, size = '1.5rem', readOnly = false }) {
  const [hover, setHover] = useState(0) // star index currently hovered

  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`star${s <= (hover || value) ? ' filled' : ''}`}
          style={{ fontSize: size, cursor: readOnly ? 'default' : 'pointer' }}
          onMouseEnter={() => !readOnly && setHover(s)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(s)}
        >★</span>
      ))}
    </div>
  )
}
