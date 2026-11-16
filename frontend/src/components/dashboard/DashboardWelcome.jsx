import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import { usePlatformConfig } from '../../context/PlatformConfigContext.jsx';

/**
 * Personalized welcome header for student dashboard.
 *
 * @param {{ user: any }} props
 */
export function DashboardWelcome({ user }) {
  const { pageConfig } = usePlatformConfig();
  const headerCfg = pageConfig?.welcome_header;

  // Determine time-of-day greeting based on local client hour
  const currentHour = new Date().getHours();
  let greeting = 'Good evening';
  if (currentHour < 12) {
    greeting = 'Good morning';
  } else if (currentHour < 17) {
    greeting = 'Good afternoon';
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Scholar';

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  const titleText = headerCfg?.title
    ? `${headerCfg.title}, ${firstName}`
    : `${greeting}, ${firstName}`;

  const subtitleText = headerCfg?.subtitle ||
    "Here's what's happening in your study space. Track your saved guides, review recent downloads, and discover peer-reviewed materials.";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Configurable Institutional Announcement Banner */}
      {headerCfg?.bannerAlert?.show && (
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: '#e8f5e9',
            border: '1px solid #c8e6c9',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#1b4d36',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <span style={{ fontSize: '15px' }}>📢</span>
          <span style={{ fontWeight: 600 }}>
            {headerCfg.bannerAlert.message || 'Semester examination revision notes and syllabus guides are now accessible.'}
          </span>
        </div>
      )}

      <div className="dash-welcome-card">
        <div className="dash-welcome-content">
          <div className="dash-welcome-kicker">
            <span>{todayFormatted}</span>
            <span>•</span>
            <Badge
              variant={
                user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' ? 'verified' : 'primary'
              }
              label={user?.role?.replace('_', ' ') || 'SCHOLAR'}
              dot
            />
            {user?.isEmailVerified && <Badge variant="verified" label="Verified Account" />}
          </div>
          <h1 className="dash-welcome-title">
            {titleText}
          </h1>
          <p className="dash-welcome-subtitle">
            {subtitleText}
          </p>
        </div>

        <div className="dash-welcome-actions">
          <Link to="/notes/explore">
            <Button variant="outline" size="sm">
              Explore Catalog
            </Button>
          </Link>
          {user?.role === 'MODERATOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
            <Link to="/notes/new">
              <Button variant="primary" size="sm">
                + Upload Note
              </Button>
            </Link>
          ) : (
            <Link to="/notes/recommended">
              <Button variant="primary" size="sm">
                Recommended Notes
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardWelcome;
