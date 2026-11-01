import React from 'react';
import './Skeleton.css';

/**
 * Reusable loading placeholder skeleton component.
 *
 * @param {{
 *   variant?: 'text' | 'circular' | 'rectangular',
 *   width?: string | number,
 *   height?: string | number,
 *   count?: number,
 *   className?: string
 * }} props
 */
export function Skeleton({ variant = 'text', width, height, count = 1, className = '' }) {
  const elements = Array.from({ length: count });

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  return (
    <>
      {elements.map((_, idx) => (
        <span
          key={idx}
          className={`skeleton skeleton--${variant} ${className}`.trim()}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

export default Skeleton;
