import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar.jsx';
import Dropdown from '../components/common/Dropdown.jsx';
import Badge from '../components/common/Badge.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './AppLayout.css';

/**
 * Premium Educational SaaS Application Shell for PJ Study.
 * V2 Upgrade: Plus Jakarta Sans headings, refined 256px sidebar, glassmorphic top header, Cmd+K search.
 */
export function AppLayout() {
  const { user, isAuthenticated, isAdmin, isModerator, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Global Command+K / Ctrl+K keyboard shortcut to focus or navigate to Explore Notes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/notes/explore');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Lock background scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileSidebarOpen]);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);
  const toggleMobileSidebar = () => setMobileSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  async function handleLogout() {
    closeMobileSidebar();
    await logout();
    navigate('/');
  }

  // Derive human-readable page context based on active route
  const getPageTitle = (path) => {
    if (path === '/dashboard' || path === '/app') return 'Student Dashboard';
    if (path.startsWith('/notes/explore') || path === '/notes') return 'Explore Notes';
    if (path.startsWith('/notes/recommended')) return 'Recommended For You';
    if (path.startsWith('/my-notes')) return 'My Study Library';
    if (path.startsWith('/notes/new')) return 'Upload Study Note';
    if (path.includes('/edit')) return 'Edit Study Note';
    if (path.startsWith('/notes/')) return 'Study Manuscript Details';
    if (path.startsWith('/profile')) return 'Profile & Security';
    if (path.startsWith('/notifications')) return 'Notification Center';
    if (path.startsWith('/admin')) return 'Academic Moderation Console';
    if (path.startsWith('/design-system')) return 'Design System Reference';
    return 'PJ Study Workspace';
  };

  const userMenuItems = [
    { label: 'View Profile', onClick: () => navigate('/profile') },
    { label: 'Notifications', onClick: () => navigate('/notifications') },
    { label: 'My Study Library', onClick: () => navigate('/my-notes') },
    { label: 'Explore Catalog', onClick: () => navigate('/notes/explore') },
    ...(isAdmin
      ? [{ label: 'Admin Portal', onClick: () => navigate('/admin') }]
      : []),
    { divider: true },
    { label: 'Sign Out', danger: true, onClick: handleLogout }
  ];

  // Core navigation items per Section 5 specification
  const primaryNavItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      requiresAuth: true,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    },
    {
      to: '/notes/explore',
      label: 'Explore Notes',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    },
    {
      to: '/notes/recommended',
      label: 'Recommended',
      requiresAuth: true,
      badge: 'Curated',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
    {
      to: '/my-notes',
      label: 'My Library',
      requiresAuth: true,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
    ...(isModerator
      ? [
          {
            to: '/notes/new',
            label: 'Upload Note',
            requiresAuth: true,
            highlight: true,
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            )
          }
        ]
      : [])
  ];

  // Secondary platform navigation items
  const secondaryNavItems = [
    {
      to: '/profile',
      label: 'Profile',
      requiresAuth: true,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
    ...(isAdmin
      ? [
          {
            to: '/admin',
            label: 'Admin Portal',
            badge: 'Staff',
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )
          }
        ]
      : [])
  ];

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'app-shell--collapsed' : ''}`}>
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="app-shell__mobile-backdrop"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (256px Desktop) */}
      <aside
        className={`app-shell__sidebar ${
          mobileSidebarOpen ? 'app-shell__sidebar--mobile-open' : ''
        }`}
        aria-label="Application Navigation"
      >
        {/* Brand Header */}
        <div className="app-shell__sidebar-header">
          <Link to="/" className="app-shell__sidebar-brand" title="PJ Study Homepage">
            <span className="app-shell__sidebar-logo" aria-hidden="true">
              PJ
            </span>
            {!sidebarCollapsed && (
              <span className="app-shell__sidebar-brand-text">
                <span className="app-shell__sidebar-title">PJ Study</span>
                <span className="app-shell__sidebar-subtitle">Academic Library</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="app-shell__collapse-btn d-none d-md-flex"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6-6-6" />}
            </svg>
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="app-shell__nav">
          <div className="app-shell__nav-group">
            {!sidebarCollapsed && <span className="app-shell__nav-label">Workspace</span>}
            {primaryNavItems
              .filter((item) => !item.requiresAuth || isAuthenticated)
              .map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.to}
                  onClick={closeMobileSidebar}
                  className={({ isActive }) =>
                    `app-shell__nav-item ${isActive ? 'app-shell__nav-item--active' : ''} ${
                      item.highlight ? 'app-shell__nav-item--highlight' : ''
                    }`
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="app-shell__nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="app-shell__nav-text">{item.label}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <Badge variant="primary" size="sm" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
          </div>

          <div className="app-shell__nav-group mt-auto">
            {!sidebarCollapsed && <span className="app-shell__nav-label">System</span>}
            {secondaryNavItems
              .filter((item) => !item.requiresAuth || isAuthenticated)
              .map((item, idx) => (
                <NavLink
                  key={idx}
                  to={item.to}
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
                    <Badge variant="accent" size="sm" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
          </div>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="app-shell__sidebar-footer">
          {isAuthenticated ? (
            <div className="app-shell__user-container">
              <Avatar
                name={user?.name || 'Scholar'}
                src={user?.avatarUrl}
                size={sidebarCollapsed ? 'sm' : 'md'}
              />
              {!sidebarCollapsed && (
                <div className="app-shell__user-info">
                  <span className="app-shell__user-name">{user?.name || 'Scholar'}</span>
                  <span className="app-shell__user-role">
                    {user?.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : user?.role === 'MODERATOR'
                        ? 'Academic Moderator'
                        : 'Verified Scholar'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="app-shell__guest-container">
              {!sidebarCollapsed ? (
                <div className="d-flex flex-col gap-2 w-full">
                  <Link to="/login" className="btn btn--sm btn--primary w-full text-center">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn--sm btn--secondary w-full text-center">
                    Get Started
                  </Link>
                </div>
              ) : (
                <Link to="/login" className="app-shell__nav-icon" title="Sign In">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="20"
                    height="20"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="app-shell__main-wrapper">
        {/* Top Header Bar */}
        <header className="app-shell__top-bar">
          <div className="d-flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              className="app-shell__mobile-menu-btn"
              aria-label="Toggle navigation menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="20"
                height="20"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="app-shell__breadcrumb">
              <span className="app-shell__breadcrumb-sub">PJ Study</span>
              <span className="app-shell__breadcrumb-sep">/</span>
              <h1 className="app-shell__breadcrumb-current">{getPageTitle(location.pathname)}</h1>
            </div>
          </div>

          <div className="d-flex items-center gap-3">
            {/* Quick Search Shortcut Pill */}
            <button
              type="button"
              onClick={() => navigate('/notes/explore')}
              className="app-shell__search-pill"
              aria-label="Search study notes (Command+K)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="15"
                height="15"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="app-shell__search-text">Search notes, subjects...</span>
              <kbd className="app-shell__search-kbd">⌘K</kbd>
            </button>

            {/* Notification Center Trigger */}
            {isAuthenticated && <NotificationBell />}

            {/* User Account Menu */}
            {isAuthenticated ? (
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="app-shell__avatar-btn"
                    aria-label="Open scholar account menu"
                  >
                    <Avatar name={user?.name || 'Scholar'} src={user?.avatarUrl} size="sm" />
                  </button>
                }
                items={userMenuItems}
                align="right"
              />
            ) : (
              <div className="d-flex items-center gap-2">
                <Link to="/login" className="btn btn--sm btn--ghost">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn--sm btn--primary">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Content Outlet */}
        <main id="main-content" className="app-shell__content" tabIndex="-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
