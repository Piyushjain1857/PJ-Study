import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';

/**
 * Personalized welcome header for student dashboard.
 *
 * @param {{ user: any }} props
 */
export function DashboardWelcome({ user }) {
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

  return (
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
          {greeting}, {firstName}
        </h1>
        <p className="dash-welcome-subtitle">
          Here&apos;s what&apos;s happening in your study space. Track your saved guides, review
          recent downloads, and discover peer-reviewed materials.
        </p>
      </div>

      <div className="dash-welcome-actions">
        <Link to="/notes/explore">
          <Button variant="outline" size="sm">
            Explore Catalog
          </Button>
        </Link>
        <Link to="/notes/new">
          <Button variant="primary" size="sm">
            + Upload Note
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default DashboardWelcome;
