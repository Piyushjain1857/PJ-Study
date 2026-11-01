import React from 'react';
import './Badge.css';

/**
 * Reusable Badge component for academic notes, verification status, and system tags.
 *
 * @param {{
 *   variant?: 'default' | 'success' | 'warning' | 'error' | 'verified',
 *   label?: string,
 *   dot?: boolean,
 *   pulse?: boolean,
 *   icon?: React.ReactNode,
 *   size?: 'sm' | 'md',
 *   children?: React.ReactNode,
 *   className?: string
 * }} props
 */
export function Badge({
  variant = 'default',
  label,
  dot = false,
  pulse = false,
  icon,
  size = 'md',
  children,
  className = ''
}) {
  const content = children || label;

  return (
    <span className={`badge badge--${variant} badge--${size} ${className}`.trim()} role="status">
      {dot && (
        <span className={`badge__dot ${pulse ? 'badge__dot--pulse' : ''}`} aria-hidden="true" />
      )}
      {icon && (
        <span className="badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="badge__label">{content}</span>
    </span>
  );
}

export default Badge;
