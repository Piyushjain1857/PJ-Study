import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';

/**
 * Main application header and navigation bar.
 */
export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__container">
        <Link to="/" className="site-header__brand" aria-label="PJ Study Home">
          <div className="site-header__logo-icon" aria-hidden="true">
            <span>PJ</span>
          </div>
          <div className="site-header__brand-text">
            <span className="site-header__brand-name">PJ Study</span>
            <span className="site-header__brand-badge">Academic & AI</span>
          </div>
        </Link>

        <nav className="site-header__nav" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `site-header__nav-link ${isActive ? 'site-header__nav-link--active' : ''}`
            }
          >
            Home
          </NavLink>
          <a
            href="#explore"
            className="site-header__nav-link site-header__nav-link--disabled"
            title="Coming soon in upcoming steps"
            tabIndex={-1}
            aria-disabled="true"
          >
            Explore Notes
          </a>
          <a
            href="#ai"
            className="site-header__nav-link site-header__nav-link--disabled"
            title="Coming soon in upcoming steps"
            tabIndex={-1}
            aria-disabled="true"
          >
            AI Study Tools
          </a>
        </nav>

        <div className="site-header__actions">
          <span className="site-header__version">v1.0 Foundation</span>
        </div>
      </div>
    </header>
  );
}

export default Header;

