import React, { useState } from 'react';

/**
 * StarRating component supporting both interactive input and read-only display.
 *
 * @param {{
 *   value: number,
 *   onChange?: (rating: number) => void,
 *   readOnly?: boolean,
 *   size?: 'sm' | 'md' | 'lg',
 *   label?: string
 * }} props
 */
export function StarRating({
  value = 0,
  onChange = null,
  readOnly = true,
  size = 'md',
  label = 'Star rating'
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const activeValue = hoverValue > 0 ? hoverValue : value;
  const isInteractive = !readOnly && typeof onChange === 'function';

  const sizeStyles = {
    sm: { fontSize: '0.85rem' },
    md: { fontSize: '1.25rem' },
    lg: { fontSize: '1.75rem' }
  };

  const handleKeyDown = (e, star) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(star);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, star + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, star - 1));
    }
  };

  return (
    <div
      className={`star-rating ${isInteractive ? 'star-rating--interactive' : ''}`}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={label ? `${label}: ${value} out of 5 stars` : `${value} out of 5 stars`}
      onMouseLeave={() => isInteractive && setHoverValue(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= activeValue;

        if (isInteractive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={star === value}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              className={`star-btn ${isFilled ? 'star-btn--filled' : ''}`}
              style={sizeStyles[size]}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
            >
              ★
            </button>
          );
        }

        return (
          <span
            key={star}
            aria-hidden="true"
            className={`star-display-icon ${isFilled ? 'star-display-icon--filled' : ''}`}
            style={sizeStyles[size]}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;
