import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import UnauthorizedPage from '../../pages/UnauthorizedPage.jsx';

/**
 * Route wrapper that ensures the user is authenticated and holds required roles/permissions.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children]
 * @param {string[]} [props.roles]
 * @param {string|string[]} [props.permissions]
 */
export function ProtectedRoute({ children, roles = [], permissions = [] }) {
  const { user, isAuthenticated, isLoading, error, retrySession, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: '16px',
          padding: '24px',
          textAlign: 'center'
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '3px solid var(--color-border, #e2e1db)',
            borderTopColor: 'var(--color-primary, #245c46)',
            animation: 'protected-route-spin 0.8s linear infinite'
          }}
        />
        <style>{`
          @keyframes protected-route-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ color: 'var(--color-text-secondary, #57635a)', fontSize: '1rem', fontWeight: 500 }}>
          Verifying academic credentials...
        </p>
      </div>
    );
  }

  // If session restoration failed due to server delay or network disconnection (not 401/403)
  if (!isAuthenticated && error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          padding: '24px'
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #e2e1db)',
            borderRadius: '16px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>📡</div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-text, #202620)',
              marginBottom: '10px'
            }}
          >
            Connection Interrupted
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary, #57635a)',
              lineHeight: 1.55,
              marginBottom: '24px'
            }}
          >
            The academic cloud server took longer to respond or your connection was momentarily interrupted. Your session is preserved.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => retrySession?.()}
              style={{
                backgroundColor: 'var(--color-primary, #245c46)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 22px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary, #57635a)',
                border: '1px solid var(--color-border, #e2e1db)',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <UnauthorizedPage />;
  }

  // Check permission authorization
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  if (requiredPermissions.length > 0) {
    const hasAll = requiredPermissions.every((perm) => hasPermission(perm));
    if (!hasAll) {
      return <UnauthorizedPage />;
    }
  }

  return children;
}

export default ProtectedRoute;
