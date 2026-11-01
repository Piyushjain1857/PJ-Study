import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Route wrapper that ensures the user is authenticated before rendering protected content.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children]
 * @param {string[]} [props.roles]
 */
export function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}
      >
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
          Verifying academic credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '12px' }}>
          You do not have the required permissions to view this academic page.
        </p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
