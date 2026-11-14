import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Avatar from '../common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import './Navbar.css';

/**
 * Public navigation bar with responsive mobile menu and authentication state.
 */
export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
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

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  async function handleLogout() {
    closeMobileMenu();
    await logout();
    navigate('/');
  }

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
            <span className="navbar-brand__sub">Academic Library</span>
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
          {isAuthenticated && (
            <NavLink
              to="/my-notes"
              className={({ isActive }) =>
                `navbar-nav__link ${isActive ? 'navbar-nav__link--active' : ''}`
              }
            >
              My Notes
            </NavLink>
          )}
          <a href="/#how-it-works" className="navbar-nav__link">
            How It Works
          </a>
          <NavLink
            to="/design-system"
            className={({ isActive }) =>
              `navbar-nav__link ${isActive ? 'navbar-nav__link--active' : ''}`
            }
          >
            Design System
          </NavLink>
          <NavLink
            to="/app"
            className={({ isActive }) =>
              `navbar-nav__link ${isActive ? 'navbar-nav__link--active' : ''}`
            }
          >
            App Shell
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `navbar-nav__link ${isActive ? 'navbar-nav__link--active' : ''}`
              }
            >
              Admin Portal
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `navbar-nav__link ${isActive ? 'navbar-nav__link--active' : ''}`
              }
            >
              Account
            </NavLink>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/notes/new">
                <Button variant="primary" size="sm">
                  + Upload Note
                </Button>
              </Link>
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Avatar name={user?.name || 'Scholar'} size="sm" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {user?.name?.split(' ')[0]}
                </span>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="navbar-mobile-toggle"
          aria-expanded={mobileMenuOpen}
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

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="navbar-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <div className="navbar-mobile-backdrop" onClick={closeMobileMenu} />
          <div className="navbar-mobile-content">
            <nav className="navbar-mobile-nav" aria-label="Mobile links">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/notes/explore"
                className={({ isActive }) =>
                  `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                Explore Notes
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink
                    to="/my-notes"
                    className={({ isActive }) =>
                      `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                    }
                    onClick={closeMobileMenu}
                  >
                    My Notes
                  </NavLink>
                  <NavLink
                    to="/notes/new"
                    className={({ isActive }) =>
                      `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                    }
                    onClick={closeMobileMenu}
                  >
                    + Upload Note
                  </NavLink>
                </>
              )}
              <a href="/#how-it-works" className="navbar-mobile-link" onClick={closeMobileMenu}>
                How It Works
              </a>
              <NavLink
                to="/design-system"
                className={({ isActive }) =>
                  `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                }
              >
                Design System
              </NavLink>
              <NavLink
                to="/app"
                className={({ isActive }) =>
                  `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                }
              >
                App Shell
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                  }
                >
                  Admin Governance
                </NavLink>
              )}
              {isAuthenticated && (
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `navbar-mobile-link ${isActive ? 'navbar-mobile-link--active' : ''}`
                  }
                >
                  Account Profile
                </NavLink>
              )}
            </nav>

            <div className="navbar-mobile-actions">
              {isAuthenticated ? (
                <Button variant="secondary" size="md" className="w-100" onClick={handleLogout}>
                  Sign Out ({user?.name?.split(' ')[0]})
                </Button>
              ) : (
                <>
                  <Link to="/login" className="d-block mb-2" onClick={closeMobileMenu}>
                    <Button variant="secondary" size="md" className="w-100">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" className="d-block" onClick={closeMobileMenu}>
                    <Button variant="primary" size="md" className="w-100">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
