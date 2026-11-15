import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api.js';
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
 * Resolves absolute URL for avatar images stored locally or remotely.
 */
function resolveAvatarUrl(src) {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
    return src;
  }
  if (src.startsWith('/api/')) {
    const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    return `${backendOrigin}${src}`;
  }
  return src;
}

/**
 * Reusable Avatar component for students, educators, and authors.
 *
 * @param {{
 *   src?: string,
 *   alt?: string,
 *   name?: string,
 *   size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
 *   className?: string
 * }} props
 */
export function Avatar({ src, alt = 'Avatar', name = '', size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const resolvedSrc = resolveAvatarUrl(src);
  const showFallback = !resolvedSrc || imageError;
  const initials = getInitials(name || alt);

  return (
    <div
      className={`avatar avatar--${size} ${className}`.trim()}
      aria-label={name || alt}
      role="img"
    >
      {!showFallback ? (
        <img
          src={resolvedSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          className="avatar__image"
        />
      ) : (
        <span className="avatar__initials" aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}

export default Avatar;
