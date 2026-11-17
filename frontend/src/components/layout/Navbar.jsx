import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Avatar from '../common/Avatar.jsx';
import Dropdown from '../common/Dropdown.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css';

/**
 * Public navigation bar with responsive mobile menu and authentication state.
 * Refined for clean editorial elegance on marketing & guest pages.
 */
export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  async function handleLogout() {
    closeMobileMenu();
    await logout();
    navigate('/');
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isPlatformAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const userMenuItems = [
    {
      label: isSuperAdmin ? 'Command Center' : isPlatformAdmin ? 'Admin Workspace' : 'Student Dashboard',
      onClick: () => navigate(isSuperAdmin ? '/admin' : isPlatformAdmin ? '/admin-workspace' : '/dashboard')
    },
    ...(!isSuperAdmin ? [{ label: 'My Study Library', onClick: () => navigate('/my-notes') }] : []),
    { label: 'Profile', onClick: () => navigate('/profile') },
    ...(isSuperAdmin
      ? [{ label: 'Super Admin Center', onClick: () => navigate('/admin') }]
      : isPlatformAdmin
        ? [{ label: 'Admin Workspace', onClick: () => navigate('/admin-workspace') }]
        : []),
    { divider: true },
    { label: 'Sign Out', danger: true, onClick: handleLogout }
  ];

  return (
    <header className="navbar-root">
      <div className="container navbar-container">
        {/* Brand Wordmark */}
        <Link to="/" className="navbar-brand" aria-label="PJ Study Homepage">
          <span className="navbar-brand__mark" aria-hidden="true">
            PJ
          </span>
          <span className="navbar-brand__text">
            <span className="navbar-brand__name">PJ Study</span>
            <span className="navbar-brand__sub">K.R. Mangalam University</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar-nav__link ${isActive ? 'navbar-nav__link--active' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/notes/explore"
            className={({ isActive }) =>
              `navbar-nav__link ${isActive ? 'navbar-nav__link--active' : ''}`
            }
          >
            Explore Notes
          </NavLink>
          <a href="/#how-it-works" className="navbar-nav__link">
            How It Works
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="d-flex items-center gap-3">
              {(isPlatformAdmin || isSuperAdmin) && (
                <Link to="/notes/new">
                  <Button variant="outline" size="sm">
                    + Upload Note
                  </Button>
                </Link>
              )}
              <Link to={isSuperAdmin ? '/admin' : isPlatformAdmin ? '/admin-workspace' : '/dashboard'}>
                <Button variant="primary" size="sm">
                  {isSuperAdmin ? 'Command Center' : isPlatformAdmin ? 'Admin Workspace' : 'Dashboard'}
                </Button>
              </Link>
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="navbar-avatar-btn"
                    aria-label="Scholar account menu"
                  >
                    <Avatar name={user?.name || 'Scholar'} src={user?.avatarUrl} size="sm" />
                  </button>
                }
                items={userMenuItems}
                align="right"
              />
            </div>
          ) : (
            <div className="d-flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="navbar-mobile-toggle"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span
            className={`navbar-mobile-toggle__bar ${mobileMenuOpen ? 'navbar-mobile-toggle__bar--open-1' : ''}`}
          />
          <span
            className={`navbar-mobile-toggle__bar ${mobileMenuOpen ? 'navbar-mobile-toggle__bar--open-2' : ''}`}
          />
          <span
            className={`navbar-mobile-toggle__bar ${mobileMenuOpen ? 'navbar-mobile-toggle__bar--open-3' : ''}`}
          />
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div
        id="mobile-navigation-drawer"
        className={`navbar-mobile-menu ${mobileMenuOpen ? 'navbar-mobile-menu--open' : ''}`}
        aria-hidden={!mobileMenuOpen}
        role="region"
        aria-label="Mobile Navigation Drawer"
      >
        <div className="navbar-mobile-menu__inner">
          <nav className="navbar-mobile-nav" aria-label="Mobile Navigation">
            <NavLink
              to="/"
              end
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/notes/explore"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
              }
            >
              Explore Notes
            </NavLink>
            <a href="/#how-it-works" onClick={closeMobileMenu} className="navbar-mobile-nav__link">
              How It Works
            </a>

            {isAuthenticated && (
              <>
                <div className="navbar-mobile-divider" />
                <NavLink
                  to={isSuperAdmin ? '/admin' : isPlatformAdmin ? '/admin-workspace' : '/dashboard'}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
                  }
                >
                  {isSuperAdmin ? 'Command Center' : isPlatformAdmin ? 'Admin Workspace' : 'Dashboard'}
                </NavLink>
                {!isSuperAdmin && (
                  <NavLink
                    to="/my-notes"
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
                    }
                  >
                    My Study Library
                  </NavLink>
                )}
                {(isPlatformAdmin || isSuperAdmin) && (
                  <NavLink
                    to="/notes/new"
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
                    }
                  >
                    + Upload Note
                  </NavLink>
                )}
                <NavLink
                  to="/profile"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
                  }
                >
                  Profile
                </NavLink>
                {isSuperAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
                    }
                  >
                    Command Center
                  </NavLink>
                )}
                {isPlatformAdmin && !isSuperAdmin && (
                  <NavLink
                    to="/admin-workspace"
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `navbar-mobile-nav__link ${isActive ? 'navbar-mobile-nav__link--active' : ''}`
                    }
                  >
                    Admin Workspace
                  </NavLink>
                )}
              </>
            )}
          </nav>

          <div className="navbar-mobile-footer">
            {isAuthenticated ? (
              <div className="d-flex flex-col gap-2">
                <div className="d-flex items-center gap-3 mb-2">
                  <Avatar name={user?.name || 'Scholar'} src={user?.avatarUrl} size="sm" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={handleLogout} style={{ width: '100%' }}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-col gap-2">
                <Link to="/login" className="d-block" onClick={closeMobileMenu}>
                  <Button variant="secondary" size="md" style={{ width: '100%' }}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="d-block" onClick={closeMobileMenu}>
                  <Button variant="primary" size="md" style={{ width: '100%' }}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
