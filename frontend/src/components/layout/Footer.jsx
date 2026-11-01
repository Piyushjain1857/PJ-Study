import React from 'react';
import './Footer.css';

/**
 * Main application footer component.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__container">
        <div className="site-footer__main">
          <div className="site-footer__brand-block">
            <span className="site-footer__brand-title">PJ Study</span>
            <p className="site-footer__tagline">Your Entire Study World, One Place.</p>
            <p className="site-footer__description">
              A modern academic notes and AI-powered study platform designed for students,
              researchers, and lifelong learners.
            </p>
          </div>

          <div className="site-footer__links-block">
            <h4 className="site-footer__heading">Platform Foundation</h4>
            <ul className="site-footer__list">
              <li>
                <span>API Version 1.0 (REST)</span>
              </li>
              <li>
                <span>Prisma ORM & MySQL</span>
              </li>
              <li>
                <span>React & Vite Architecture</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copyright">
            &copy; {currentYear} PJ Study. All rights reserved.
          </p>
          <div className="site-footer__meta">
            <span>Clean Architecture</span>
            <span className="site-footer__separator">&bull;</span>
            <span>Security by Design</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
