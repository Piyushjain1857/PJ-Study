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
              A curated academic repository and study workspace designed for students, researchers,
              and educators pursuing academic excellence.
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
                <Link to="/notes/explore">Explore Notes</Link>
              </li>
              <li>
                <a href="/#how-it-works">How It Works</a>
              </li>
              <li>
                <Link to="/design-system">Design System</Link>
              </li>
              <li>
                <Link to="/dashboard">Student Dashboard</Link>
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
                <span>Open Science Policy</span>
              </li>
            </ul>
          </div>

          {/* Institutional / Contact */}
          <div className="footer-col">
            <h4 className="footer-col__title">Legal & Security</h4>
            <ul className="footer-links">
              <li>
                <span>Terms of Service</span>
              </li>
              <li>
                <span>Privacy Protocol</span>
              </li>
              <li>
                <span>Security Overview</span>
              </li>
              <li>
                <span>Cookie Directives</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon */}
        <div className="footer-bottom">
          <div className="footer-bottom__copy">
            &copy; {currentYear} PJ Study. All rights reserved. Built with precision for higher
            education.
          </div>
          <div className="footer-bottom__status">
            <span className="footer-status-indicator" aria-hidden="true" />
            <span className="footer-status-text">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
