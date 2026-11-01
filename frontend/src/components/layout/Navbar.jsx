import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Button from '../common/Button.jsx';
import './Navbar.css';

/**
 * Public navigation bar with responsive mobile menu.
 */
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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
          <a href="/#features" className="navbar-nav__link">
            Explore Notes
          </a>
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
        </nav>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          <Link to="/app">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </Link>
          <Link to="/app">
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </Link>
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
              <a href="/#features" className="navbar-mobile-link" onClick={closeMobileMenu}>
                Explore Notes
              </a>
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
            </nav>

            <div className="navbar-mobile-actions">
              <Link to="/app" className="d-block mb-2" onClick={closeMobileMenu}>
                <Button variant="secondary" size="md" className="w-100">
                  Log In
                </Button>
              </Link>
              <Link to="/app" className="d-block" onClick={closeMobileMenu}>
                <Button variant="primary" size="md" className="w-100">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
