import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';
import Container from '../components/layout/Container.jsx';
import './NotFoundPage.css';

/**
 * 404 Not Found Page component in PJ Study editorial style.
 */
export function NotFoundPage() {
  return (
    <div className="not-found-root">
      <Container size="narrow">
        <div className="not-found-card card text-center">
          <Badge variant="error" label="404 Error: Folio Missing" dot />
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-desc">
            The study material, notebook, or manuscript you requested could not be located in the
            library repository. It may have been relocated or archived.
          </p>
          <div className="not-found-actions">
            <Link to="/">
              <Button variant="primary" size="md">
                Return to Library Home
              </Button>
            </Link>
            <Link to="/design-system">
              <Button variant="secondary" size="md">
                Design System
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default NotFoundPage;
