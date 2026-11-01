import React from 'react';
import './Container.css';

/**
 * Reusable Container component providing standard responsive horizontal padding and max-width.
 *
 * @param {{
 *   size?: 'default' | 'narrow' | 'wide' | 'full',
 *   as?: keyof JSX.IntrinsicElements,
 *   className?: string,
 *   children: React.ReactNode
 * }} props
 */
export function Container({
  size = 'default',
  as: Component = 'div',
  className = '',
  children,
  ...rest
}) {
  return (
    <Component
      className={`layout-container layout-container--${size} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Container;
