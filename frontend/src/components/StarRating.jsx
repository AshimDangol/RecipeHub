import React, { useState } from 'react'

export default function StarRating({ value, onChange, size = '1.5rem', readOnly = false }) {
  const [hover, setHover] = useState(0)
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
