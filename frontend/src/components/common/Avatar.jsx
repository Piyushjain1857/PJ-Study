import React, { useState } from 'react';
import './Avatar.css';

/**
 * Extracts 1-2 initials from a person or entity name.
 *
 * @param {string} [name] - Full name or title
 * @returns {string} 1-2 letter uppercase initials
 */
function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Reusable Avatar component for students, educators, and authors.
 *
 * @param {{
 *   src?: string,
 *   alt?: string,
 *   name?: string,
 *   size?: 'sm' | 'md' | 'lg',
 *   className?: string
 * }} props
 */
export function Avatar({ src, alt = 'Avatar', name = '', size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;
  const initials = getInitials(name || alt);

  return (
    <div
      className={`avatar avatar--${size} ${className}`.trim()}
      aria-label={name || alt}
      role="img"
    >
      {!showFallback ? (
        <img src={src} alt={alt} onError={() => setImageError(true)} className="avatar__image" />
      ) : (
        <span className="avatar__initials" aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}

export default Avatar;
