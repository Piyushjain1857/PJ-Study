import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

/**
 * Editorial footer component reflecting an academic digital library aesthetic.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-root">
      <div className="container footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand">
              <span className="footer-brand__name">PJ Study</span>
            </Link>
            <p className="footer-tagline">Your Entire Study World, One Place.</p>
            <p className="footer-description">
              A curated academic repository and AI-assisted study workspace designed for students,
              researchers, and educators pursuing academic excellence.
            </p>
          </div>

          {/* Navigation Column */}
          <div className="footer-col">
            <h4 className="footer-col__title">Platform</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <a href="/#features">Explore Notes</a>
              </li>
              <li>
                <a href="/#how-it-works">How It Works</a>
              </li>
              <li>
                <Link to="/design-system">Design System</Link>
              </li>
              <li>
                <Link to="/app">Student Dashboard Shell</Link>
              </li>
            </ul>
          </div>

          {/* Standards & Philosophy */}
          <div className="footer-col">
            <h4 className="footer-col__title">Academic Standards</h4>
            <ul className="footer-links">
              <li>
                <span>Verified Curriculum</span>
              </li>
              <li>
                <span>Academic Integrity Code</span>
              </li>
              <li>
                <span>Peer Review System</span>
              </li>
              <li>
                <span>Author Attribution</span>
              </li>
            </ul>
          </div>

          {/* Architecture Status */}
          <div className="footer-col">
            <h4 className="footer-col__title">Architecture</h4>
            <ul className="footer-links footer-links--meta">
              <li>
                <span>API Version 1.0 (REST)</span>
              </li>
              <li>
                <span>Prisma ORM & MySQL</span>
              </li>
              <li>
                <span>Node.js ES Modules</span>
              </li>
              <li>
                <span>Standard CSS Tokens</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} PJ Study. Preserving academic rigor in the digital age.
          </p>
          <div className="footer-bottom-meta">
            <span>Clean Architecture</span>
            <span className="footer-sep" aria-hidden="true">
              &bull;
            </span>
            <span>Accessibility First</span>
            <span className="footer-sep" aria-hidden="true">
              &bull;
            </span>
            <span>Zero Tracking Bloat</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
