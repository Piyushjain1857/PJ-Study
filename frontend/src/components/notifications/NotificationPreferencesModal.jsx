import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';
import notificationService from '../../services/notificationService.js';

export function NotificationPreferencesModal({ isOpen, onClose }) {
  const [preferences, setPreferences] = useState({
    noteModeration: true,
    reviewActivity: true,
    helpfulVotes: true,
    platformAnnouncements: true,
    inAppEnabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    setFeedback({ type: '', message: '' });

    async function load() {
      try {
        const data = await notificationService.getPreferences();
        if (isMounted && data) {
          setPreferences({
            noteModeration: data.noteModeration ?? true,
            reviewActivity: data.reviewActivity ?? true,
            helpfulVotes: data.helpfulVotes ?? true,
            platformAnnouncements: data.platformAnnouncements ?? true,
            inAppEnabled: data.inAppEnabled ?? true
          });
        }
      } catch (err) {
        if (isMounted) {
          setFeedback({ type: 'danger', message: err.message || 'Failed to load preferences.' });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      await notificationService.updatePreferences(preferences);
      setFeedback({ type: 'success', message: 'Notification preferences saved successfully!' });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Failed to update preferences.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Preferences">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {feedback.message && (
          <div
            className={`auth-alert auth-alert--${feedback.type}`}
            style={{ marginBottom: '8px' }}
          >
            <span>{feedback.message}</span>
          </div>
        )}

        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-normal)'
          }}
        >
          Choose which notifications you receive in PJ Study. Essential security notices are always
          delivered.
        </p>

        {isLoading ? (
          <div
            style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}
          >
            Loading preferences...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Master Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  In-App Notification Center
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Enable or pause the bell dropdown and notification feed
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={() => handleToggle('inAppEnabled')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'var(--color-primary)'
                }}
                aria-label="Toggle In-App Notification Center"
              />
            </div>

            {/* Note Moderation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Academic Note Moderation
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Approval, rejection, or revision requests on your manuscripts
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.noteModeration}
                onChange={() => handleToggle('noteModeration')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'var(--color-primary)'
                }}
                aria-label="Toggle Academic Note Moderation"
              />
            </div>

            {/* Review Activity */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Peer Reviews & Ratings
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Feedback received when fellow scholars review your study notes
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.reviewActivity}
                onChange={() => handleToggle('reviewActivity')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'var(--color-primary)'
                }}
                aria-label="Toggle Peer Reviews & Ratings"
              />
            </div>

            {/* Helpful Votes */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Helpful Votes & Recognition
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  When scholars mark your review or comments as helpful
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.helpfulVotes}
                onChange={() => handleToggle('helpfulVotes')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'var(--color-primary)'
                }}
                aria-label="Toggle Helpful Votes & Recognition"
              />
            </div>

            {/* Platform Announcements */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px'
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Platform & Curricular Announcements
                </strong>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Updates from administrators about curriculum and platform features
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.platformAnnouncements}
                onChange={() => handleToggle('platformAnnouncements')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'var(--color-primary)'
                }}
                aria-label="Toggle Platform Announcements"
              />
            </div>
          </div>
        )}

        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}
        >
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            disabled={isLoading}
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default NotificationPreferencesModal;
