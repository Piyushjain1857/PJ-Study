import React, { useId } from 'react';
import './Input.css';

/**
 * Reusable accessible Input component for PJ Study.
 *
 * @param {{
 *   label?: string,
 *   helperText?: string,
 *   error?: string,
 *   id?: string,
 *   name?: string,
 *   type?: string,
 *   placeholder?: string,
 *   value?: string | number,
 *   disabled?: boolean,
 *   required?: boolean,
 *   icon?: React.ReactNode,
 *   className?: string,
 *   onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
 * } & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export function Input({
  label,
  helperText,
  error,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  disabled = false,
  required = false,
  icon,
  className = '',
  onChange,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const hasError = Boolean(error);
  const describedBy = hasError ? errorId : helperText ? helperId : undefined;

  return (
    <div
      className={`form-field ${disabled ? 'form-field--disabled' : ''} ${hasError ? 'form-field--error' : ''} ${className}`.trim()}
    >
      {label && (
        <label htmlFor={inputId} className="form-field__label">
          {label}
          {required && (
            <span className="form-field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="form-field__input-wrapper">
        {icon && (
          <span className="form-field__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          onChange={onChange}
          className={`form-field__input ${icon ? 'form-field__input--has-icon' : ''}`}
          {...rest}
        />
      </div>

      {hasError && (
        <p id={errorId} className="form-field__error" role="alert">
          {error}
        </p>
      )}

      {!hasError && helperText && (
        <p id={helperId} className="form-field__helper">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Input;
