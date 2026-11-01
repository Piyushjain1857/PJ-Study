import React from 'react';
import './StatusBadge.css';

/**
 * Reusable StatusBadge component for showing system or note status.
 *
 * @param {{
 *   status: 'success' | 'warning' | 'danger' | 'info' | 'neutral',
 *   label: string,
 *   pulse?: boolean
 * }} props
 */
export function StatusBadge({ status = 'neutral', label, pulse = false }) {
  return (
    <span className={`status-badge status-badge--${status}`} role="status">
      <span className={`status-badge__dot ${pulse ? 'status-badge__dot--pulse' : ''}`} />
      <span className="status-badge__label">{label}</span>
    </span>
  );
}

export default StatusBadge;

