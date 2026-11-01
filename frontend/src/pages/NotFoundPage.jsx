import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

/**
 * 404 Not Found Page component.
 * Rendered when users navigate to unmatched routes.
 */
export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="container not-found-page__container">
        <div className="not-found-card card text-center">
          <span className="not-found-badge">404 Error</span>
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-description">
            The study resource or page you are looking for doesn't exist, has been moved, or is
            currently under construction.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
