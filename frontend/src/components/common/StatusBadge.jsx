import React from 'react';
import Badge from './Badge.jsx';

/**
 * Backwards-compatible StatusBadge wrapper using the unified Badge component.
 */
export function StatusBadge({ status = 'default', label, pulse = false }) {
  // Map legacy status strings to badge variants
  const variantMap = {
    neutral: 'default',
    info: 'verified',
    danger: 'error',
    success: 'success',
    warning: 'warning'
  };

  const variant = variantMap[status] || status;

  return <Badge variant={variant} label={label} dot pulse={pulse} />;
}

export default StatusBadge;
