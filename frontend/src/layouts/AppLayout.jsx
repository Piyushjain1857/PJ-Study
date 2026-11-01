import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import Avatar from '../components/common/Avatar.jsx';
import Dropdown from '../components/common/Dropdown.jsx';
import Badge from '../components/common/Badge.jsx';
import './AppLayout.css';

/**
 * Authenticated application shell for student workspace and dashboard.
 */
export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleMobileSidebar = () => setMobileSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const userMenuItems = [
    { label: 'View Profile', onClick: () => {} },
    { label: 'Study Preferences', onClick: () => {} },
    { label: 'Platform Settings', onClick: () => {} },
    { label: 'Log Out', danger: true, onClick: () => {} }
  ];

  const navItems = [
    {
      to: '/app',
      label: 'Workspace Overview',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    },
    {
      to: '/app/notes',
      label: 'My Study Notes',
      badge: 'Phase 2',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    {
      to: '/app/ai-tutor',
      label: 'AI Study Assistant',
      badge: 'Planned',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )
    },
    {
      to: '/app/flashcards',
      label: 'Recall & Quizzes',
      badge: 'Planned',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    }
  ];

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="app-shell__mobile-backdrop"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`app-shell__sidebar ${
          mobileSidebarOpen ? 'app-shell__sidebar--mobile-open' : ''
        }`}
        aria-label="Workspace Navigation"
      >
        <div className="app-shell__sidebar-header">
          <Link to="/" className="app-shell__sidebar-brand">
            <span className="app-shell__sidebar-logo" aria-hidden="true">
              PJ
            </span>
            {!sidebarCollapsed && (
              <span className="app-shell__sidebar-brand-text">
                <span className="app-shell__sidebar-title">PJ Study</span>
                <span className="app-shell__sidebar-subtitle">Workspace</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="app-shell__collapse-btn d-none d-md-flex"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6-6-6" />}
            </svg>
          </button>
        </div>

        <nav className="app-shell__nav">
          <div className="app-shell__nav-group">
            {!sidebarCollapsed && <span className="app-shell__nav-label">Academic Tools</span>}
            {navItems.map((item, idx) => (
              <NavLink
                key={idx}
                to={item.to}
                end={item.to === '/app'}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `app-shell__nav-item ${isActive ? 'app-shell__nav-item--active' : ''}`
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="app-shell__nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span className="app-shell__nav-text">{item.label}</span>}
                {!sidebarCollapsed && item.badge && (
                  <Badge variant="default" size="sm" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </div>

          <div className="app-shell__nav-group mt-auto">
            {!sidebarCollapsed && <span className="app-shell__nav-label">System</span>}
            <Link
              to="/design-system"
              onClick={closeMobileSidebar}
              className="app-shell__nav-item"
              title={sidebarCollapsed ? 'Design System' : undefined}
            >
              <span className="app-shell__nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
              {!sidebarCollapsed && <span className="app-shell__nav-text">Design System</span>}
            </Link>
            <Link
              to="/"
              onClick={closeMobileSidebar}
              className="app-shell__nav-item"
              title={sidebarCollapsed ? 'Return Home' : undefined}
            >
              <span className="app-shell__nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              {!sidebarCollapsed && <span className="app-shell__nav-text">Return to Site</span>}
            </Link>
          </div>
        </nav>

        {/* Sidebar Footer User info */}
        <div className="app-shell__sidebar-footer">
          <Avatar name="Piyush Student" size={sidebarCollapsed ? 'sm' : 'md'} />
          {!sidebarCollapsed && (
            <div className="app-shell__user-info">
              <span className="app-shell__user-name">Scholar Account</span>
              <span className="app-shell__user-role">Student Member</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="app-shell__main-wrapper">
        {/* Top Header */}
        <header className="app-shell__top-bar">
          <div className="d-flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="app-shell__mobile-menu-btn"
              aria-label="Toggle workspace navigation"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="app-shell__breadcrumb-current">PJ Study Workspace</span>
          </div>

          <div className="d-flex items-center gap-3">
            <Badge variant="verified" label="Academic Plan" dot />
            <Dropdown
              trigger={
                <button type="button" className="app-shell__avatar-btn" aria-label="Open user menu">
                  <Avatar name="Piyush Student" size="sm" />
                </button>
              }
              items={userMenuItems}
              align="right"
            />
          </div>
        </header>

        {/* Dynamic Workspace Content */}
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
