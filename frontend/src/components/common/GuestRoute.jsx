import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Route wrapper that prevents authenticated users from viewing guest-only auth pages (like /login or /register).
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children]
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
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
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const origin = location.state?.from?.pathname || '/profile';
    return <Navigate to={origin} replace />;
  }

  return children;
}

export default GuestRoute;
