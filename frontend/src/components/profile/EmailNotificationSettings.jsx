import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService.js';
import { Button } from '../common/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function EmailNotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    emailSecurityAlerts: true,
    emailNewNotes: true,
    emailAnnouncements: true,
    emailLiveActivity: true,
    emailAccountUpdates: true,
    emailWeeklyDigest: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      setIsLoading(true);
      try {
        const data = await notificationService.getPreferences();
        if (isMounted && data) {
          setPreferences({
            emailSecurityAlerts: data.emailSecurityAlerts ?? true,
            emailNewNotes: data.emailNewNotes ?? true,
            emailAnnouncements: data.emailAnnouncements ?? true,
            emailLiveActivity: data.emailLiveActivity ?? true,
            emailAccountUpdates: data.emailAccountUpdates ?? true,
            emailWeeklyDigest: data.emailWeeklyDigest ?? false
          });
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to load email preferences.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await notificationService.updatePreferences(preferences);
      setSuccessMessage('Email notification preferences updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update email preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const emailItems = [
    {
      key: 'emailSecurityAlerts',
      title: 'Login Security Alerts',
      description: 'Receive instant email alerts on new logins, unfamiliar devices, or suspicious account access.',
      critical: false
    },
    {
      key: 'emailNewNotes',
      title: 'New Notes Notifications',
      description: 'Receive email alerts when newly verified lecture notes or past papers matching your curriculum are published.',
      critical: false
    },
    {
      key: 'emailAnnouncements',
      title: 'Important Announcements',
      description: 'Broadcasts from university administrators, examination schedules, and vital academic bulletins.',
      critical: false
    },
    {
      key: 'emailLiveActivity',
      title: 'Live Activity Updates',
      description: 'Real-time notifications on collaborative study activities, note updates, and discussions.',
      critical: false
    },
    {
      key: 'emailAccountUpdates',
      title: 'Account Updates',
      description: 'Periodic updates regarding your profile status, verified badge, and study library changes.',
      critical: false
    },
    {
      key: 'emailWeeklyDigest',
      title: 'Weekly Activity Summaries',
      description: 'A curated weekly email recap of top trending manuscripts and community recommendations.',
      critical: false
    }
  ];

  return (
    <div className="profile-section-card">
      <div className="d-flex items-center justify-between" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 className="profile-section-title" style={{ margin: 0 }}>Email Notification Preferences</h2>
          <p className="profile-section-desc" style={{ marginTop: '4px', marginBottom: 0 }}>
            Manage the email communications delivered to <strong>{user?.email}</strong>.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="auth-alert auth-alert--success" style={{ marginBottom: '16px' }}>
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert auth-alert--danger" style={{ marginBottom: '16px' }}>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mandatory Security Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 16px',
          backgroundColor: '#F3F4F6',
          borderLeft: '4px solid #285943',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#285943"
          strokeWidth="2"
          width="20"
          height="20"
          style={{ flexShrink: 0, marginTop: '2px' }}
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div style={{ fontSize: 'var(--text-xs)', color: '#374151', lineHeight: '1.5' }}>
          <strong>Security-Critical Communications:</strong> Email verification links, password recovery instructions, and security-enforced password change receipts are mandatory and will always be delivered regardless of these preferences.
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading your notification preferences...
        </div>
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {emailItems.map((item) => (
              <label
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ paddingRight: '16px' }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: '2px'
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--line-normal)'
                    }}
                  >
                    {item.description}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(preferences[item.key])}
                  onChange={() => handleToggle(item.key)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: 'var(--color-primary)',
                    flexShrink: 0
                  }}
                  aria-label={item.title}
                />
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              disabled={isLoading}
            >
              Save Email Preferences
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default EmailNotificationSettings;
