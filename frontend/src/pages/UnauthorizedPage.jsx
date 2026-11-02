import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button.jsx';
import './auth/Auth.css';

/**
 * Clean editorial 403 Forbidden page for unauthorized access attempts.
 */
export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="verify-status">
          <div className="verify-status__icon verify-status__icon--error">🔒</div>
          <span className="auth-card__badge" style={{ color: 'var(--color-danger)' }}>
            403 Forbidden
          </span>
          <h1 className="auth-card__title" style={{ marginTop: '12px' }}>
            Restricted Academic Area
          </h1>
          <p className="auth-card__subtitle" style={{ marginTop: '12px', fontSize: '1rem' }}>
            Your account role does not have the required permissions to access this administrative
            section.
          </p>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '0.875rem',
              marginTop: '12px'
            }}
          >
            If you believe your academic credentials should grant access, please contact your
            university department or platform administrator.
          </p>

          <div
            style={{
              marginTop: '32px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Button variant="outline" size="md" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Link to="/">
              <Button variant="primary" size="md">
                Return to Library
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
