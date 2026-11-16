import React, { useState } from 'react';

/**
 * High-fidelity StarRating component using crisp SVG vectors.
 * Supports interactive radiogroup inputs with tactile hover/focus states,
 * as well as read-only rating display badges.
 *
 * @param {{
 *   value: number,
 *   onChange?: (rating: number) => void,
 *   readOnly?: boolean,
 *   size?: 'sm' | 'md' | 'lg' | 'xl',
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

  const pixelSizes = {
    sm: 16,
    md: 20,
    lg: 26,
    xl: 34
  };

  const starPx = pixelSizes[size] || 20;

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
      className={`star-rating star-rating--${size} ${
        isInteractive ? 'star-rating--interactive' : 'star-rating--readonly'
      }`}
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
              className={`star-btn star-btn--${size} ${isFilled ? 'star-btn--filled' : ''}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onKeyDown={(e) => handleKeyDown(e, star)}
            >
              <svg
                width={starPx}
                height={starPx}
                viewBox="0 0 24 24"
                fill={isFilled ? '#F59E0B' : '#E5E7EB'}
                stroke={isFilled ? '#D97706' : '#9CA3AF'}
                strokeWidth={isFilled ? '1' : '1.5'}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="star-svg"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          );
        }

        return (
          <span
            key={star}
            aria-hidden="true"
            className={`star-display-icon ${isFilled ? 'star-display-icon--filled' : ''}`}
          >
            <svg
              width={starPx}
              height={starPx}
              viewBox="0 0 24 24"
              fill={isFilled ? '#F59E0B' : '#E5E7EB'}
              stroke={isFilled ? '#D97706' : '#D1D5DB'}
              strokeWidth={isFilled ? '1' : '1.2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="star-svg"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;
