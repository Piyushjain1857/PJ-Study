import React, { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam or Promotional Content' },
  { value: 'HARASSMENT', label: 'Harassment or Defamation' },
  { value: 'OFFENSIVE', label: 'Offensive or Inappropriate Language' },
  { value: 'MISLEADING', label: 'Misleading or Factually Inaccurate Content' },
  { value: 'OTHER', label: 'Other (requires description)' }
];

/**
 * Modal dialog for reporting an inappropriate review.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (payload: { reason: string, description?: string }) => Promise<void>,
 *   review?: object | null
 * }} props
 */
export function ReportReviewDialog({ isOpen, onClose, onSubmit, _review = null }) {
  const [reason, setReason] = useState('OFFENSIVE');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (reason === 'OTHER' && !description.trim()) {
      setError('Please provide an explanation when choosing "Other".');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        reason,
        description: description.trim() || undefined
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Review"
      description="Help maintain a respectful, constructive academic environment on PJ Study."
      maxWidth="480px"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {error && (
          <div className="auth-alert auth-alert--danger" style={{ margin: 0 }}>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="report-reason-select"
            style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Reason for Report <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            id="report-reason-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="reviews-sort-select"
            style={{ width: '100%', padding: '8px 12px' }}
          >
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="report-desc-input"
            style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Details{' '}
            <span style={{ fontSize: '0.75rem', color: '#74756f' }}>(Optional unless "Other")</span>
          </label>
          <textarea
            id="report-desc-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe why this review violates guidelines..."
            className="note-form__textarea"
            maxLength={1000}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" isLoading={isSubmitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ReportReviewDialog;
