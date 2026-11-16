import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import { usePlatformConfig } from '../../context/PlatformConfigContext.jsx';

/**
 * Personalized Welcome Section for Student Dashboard 3.0.
 * Displays student's first name, time-of-day greeting, academic identity, and quick actions.
 */
export function DashboardWelcome({ user }) {
  const { pageConfig } = usePlatformConfig();
  const headerCfg = pageConfig?.welcome_header;

  // Determine time-of-day greeting
  const currentHour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (currentHour < 12) {
    timeGreeting = 'Good morning';
  } else if (currentHour < 17) {
    timeGreeting = 'Good afternoon';
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Scholar';
  const universityName = user?.university || user?.universityRef?.name || 'K.R. Mangalam University';
  const courseName = user?.course?.name || 'School of Computer Science & Engineering';
  const semesterNum = user?.semester || 4;

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  const titleText = headerCfg?.title
    ? `${headerCfg.title}, ${firstName}!`
    : `${timeGreeting}, ${firstName}!`;

  const subtitleText = headerCfg?.subtitle ||
    'Everything you need for your semester, in one focused learning space.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
      {/* Super Admin Configurable Banner Alert */}
      {headerCfg?.bannerAlert?.show && (
        <div
          style={{
            padding: '10px 18px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <span style={{ fontSize: '16px' }}>📢</span>
          <span style={{ fontWeight: 700 }}>
            {headerCfg.bannerAlert.message || 'Semester examination revision notes and curriculum guides are live.'}
          </span>
        </div>
      )}

      {/* Main Welcome Hero Card */}
      <div className="dash-welcome-card" style={{ marginBottom: 0 }}>
        <div className="dash-welcome-content">
          <div className="dash-welcome-kicker">
            <span>{todayFormatted}</span>
            <span>•</span>
            <Badge
              variant="primary"
              label="SCHOLAR"
              dot
            />
            {user?.isEmailVerified && <Badge variant="verified" label="Verified Scholar" />}
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
            <Button variant="primary" size="md">
              📚 Explore Notes
            </Button>
          </Link>
          <Link to="/my-notes">
            <Button variant="outline" size="md">
              🔖 My Library
            </Button>
          </Link>
        </div>
      </div>

      {/* Academic Credentials Identity Ribbon */}
      <div className="dash-academic-ribbon" style={{ marginBottom: 0 }}>
        <div className="dash-academic-ribbon__left">
          <span className="dash-academic-ribbon__icon">🏛️</span>
          <div>
            <div className="dash-academic-ribbon__title">
              {universityName} · Official Academic Portal
            </div>
            <div className="dash-academic-ribbon__sub">
              {courseName} · Semester {semesterNum}
            </div>
          </div>
        </div>
        <span className="dash-academic-ribbon__badge">
          Enrolled Scholar · Active Term 2026
        </span>
      </div>
    </div>
  );
}

export default DashboardWelcome;
