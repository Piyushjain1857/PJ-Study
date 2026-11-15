import React, { useState } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import { Input } from '../common/Input.jsx';
import notificationService from '../../services/notificationService.js';

export function AnnouncementModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [priority, setPriority] = useState('INFO');
  const [targetUrl, setTargetUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required.');
      return;
    }

    if (targetUrl && !targetUrl.startsWith('/')) {
      setError('Target URL must be a valid internal path starting with / (e.g. /notes/explore)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await notificationService.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        targetAudience,
        priority,
        targetUrl: targetUrl.trim() || undefined
      });

      if (onSuccess) {
        onSuccess(response);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to broadcast announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Broadcast Platform Announcement">
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {error && (
          <div className="auth-alert auth-alert--danger">
            <span>{error}</span>
          </div>
        )}

        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          Broadcast an official platform notice to scholars or staff. Recipients will receive an
          in-app notification.
        </p>

        <Input
          label="Announcement Title"
          placeholder="e.g. Midterm Study Material Published"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          required
        />

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              marginBottom: '6px',
              color: 'var(--color-text-primary)'
            }}
          >
            Announcement Message
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the full announcement text..."
            style={{
              width: '100%',
              padding: '10px 12px',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-surface-subtle)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              resize: 'vertical'
            }}
            maxLength={2000}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                marginBottom: '6px',
                color: 'var(--color-text-primary)'
              }}
            >
              Target Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="admin-select"
              style={{ width: '100%' }}
            >
              <option value="ALL">All Scholars & Staff</option>
              <option value="STUDENT">Students Only</option>
              <option value="MODERATOR">Moderators & Staff</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-semibold)',
                marginBottom: '6px',
                color: 'var(--color-text-primary)'
              }}
            >
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="admin-select"
              style={{ width: '100%' }}
            >
              <option value="INFO">Informational (Normal)</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent / Critical</option>
            </select>
          </div>
        </div>

        <Input
          label="Internal Target Link (Optional)"
          placeholder="e.g. /notes/explore or /dashboard"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
        />

        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Publish Announcement
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AnnouncementModal;
