import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Editorial Personalized Academic Workspace Header (Section A).
 * Greets the student naturally without decorative promotional banners.
 * Displays real course, semester, and institution metadata.
 */
export const DashboardPersonalizedHeader = React.memo(function DashboardPersonalizedHeader({ user }) {
  // Natural time-of-day greeting
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Scholar';
  const courseName = user?.course?.name;
  const semester = user?.semester;
  const university = user?.university || user?.universityRef?.name || 'K.R. Mangalam University';

  return (
    <header className="dash-header-section" aria-label="Student Welcome and Academic Status">
      <div className="dash-header-main">
        <div className="dash-header-greeting-wrap">
          <h1 className="dash-header-greeting">
            {timeGreeting}, {firstName}.
          </h1>
          <p className="dash-header-tagline">
            Find what you need for your next class.
          </p>
        </div>

        {/* Academic Identity Metadata */}
        <div className="dash-header-academic-meta" aria-label="Current Academic Enrollment">
          {courseName ? (
            <div className="dash-header-badge-group">
              <span className="dash-header-pill dash-header-pill--course">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <span>{courseName}</span>
              </span>

              {semester && (
                <span className="dash-header-pill dash-header-pill--semester">
                  <span>Semester {semester}</span>
                </span>
              )}

              <span className="dash-header-pill dash-header-pill--uni">
                <span>{university}</span>
              </span>
            </div>
          ) : (
            <div className="dash-header-badge-group">
              <span className="dash-header-pill dash-header-pill--uni">
                <span>{university}</span>
              </span>
              <Link to="/profile" className="dash-header-pill dash-header-pill--action" title="Configure your academic course and semester in Profile">
                <span>Set your course & semester →</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

export default DashboardPersonalizedHeader;
