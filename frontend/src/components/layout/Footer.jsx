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
            <Link to="/" className="footer-brand" aria-label="PJ Study Homepage">
              <span className="footer-brand__mark">PJ</span>
              <span className="footer-brand__name">PJ Study</span>
            </Link>
            <p className="footer-tagline">Your Entire Study World, One Place.</p>
            <p className="footer-description">
              A focused academic workspace designed for higher education scholars and educators.
              Explore structured study materials, discover curriculum subjects, and organize your
              entire academic journey.
            </p>
            <div className="footer-programs-pills" aria-label="Academic degree programs">
              <span className="footer-program-pill">B.Tech</span>
              <span className="footer-program-pill">BCA</span>
              <span className="footer-program-pill">B.Sc.</span>
              <span className="footer-program-pill">MCA</span>
              <span className="footer-program-pill">M.Tech</span>
            </div>
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
                <Link to="/dashboard">Student Dashboard</Link>
              </li>
              <li>
                <Link to="/my-notes">My Study Library</Link>
              </li>
            </ul>
          </div>

          {/* Academic Degrees */}
          <div className="footer-col">
            <h4 className="footer-col__title">Academic Programs</h4>
            <ul className="footer-links">
              <li>
                <Link to="/notes/explore">B.Tech (8 Semesters)</Link>
              </li>
              <li>
                <Link to="/notes/explore">BCA (6 Semesters)</Link>
              </li>
              <li>
                <Link to="/notes/explore">B.Sc. (6 Semesters)</Link>
              </li>
              <li>
                <Link to="/notes/explore">MCA (4 Semesters)</Link>
              </li>
              <li>
                <Link to="/notes/explore">M.Tech (4 Semesters)</Link>
              </li>
            </ul>
          </div>

          {/* Standards & Integrity */}
          <div className="footer-col">
            <h4 className="footer-col__title">Academic Standards</h4>
            <ul className="footer-links">
              <li>
                <span>Curated Taxonomies</span>
              </li>
              <li>
                <span>Academic Integrity Code</span>
              </li>
              <li>
                <span>Peer Quality Feedback</span>
              </li>
              <li>
                <span>Ad-Free Learning</span>
              </li>
              <li>
                <span>Role-Based Access Control</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon */}
        <div className="footer-bottom">
          <div className="footer-bottom__info">
            <div className="footer-bottom__copy">
              &copy; {currentYear} PJ Study. All rights reserved. Built with precision for higher
              education.
            </div>
            <p className="footer-disclaimer">
              This is not an official portal authorized by K.R. Mangalam University.
            </p>
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
