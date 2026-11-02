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
  const { user, isAuthenticated, isLoading, hasPermission } = useAuth();
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
