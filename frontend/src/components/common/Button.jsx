import React from 'react';
import './Button.css';

/**
 * Reusable Button component for PJ Study.
 *
 * @param {{
 *   variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
 *   size?: 'sm' | 'md' | 'lg',
 *   isLoading?: boolean,
 *   disabled?: boolean,
 *   type?: 'button' | 'submit' | 'reset',
 *   icon?: React.ReactNode,
 *   iconPosition?: 'left' | 'right',
 *   children?: React.ReactNode,
 *   className?: string,
 *   onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  icon,
  iconPosition = 'left',
  children,
  className = '',
  onClick,
  ...rest
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      onClick={isDisabled ? undefined : onClick}
      className={`btn btn--${variant} btn--${size} ${isLoading ? 'btn--loading' : ''} ${className}`.trim()}
      {...rest}
    >
      {isLoading && (
        <span className="btn__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeWidth="3"
              strokeDasharray="32"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      {!isLoading && icon && iconPosition === 'left' && (
        <span className="btn__icon btn__icon--left" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="btn__text">{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <span className="btn__icon btn__icon--right" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
}

export default Button;
