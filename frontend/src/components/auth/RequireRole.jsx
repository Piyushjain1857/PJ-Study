import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Conditionally renders children if the authenticated user holds one of the specified roles.
 *
 * @param {object} props
 * @param {string|string[]} props.roles - Single role or array of authorized roles
 * @param {React.ReactNode} [props.fallback=null] - Rendered when role check fails
 * @param {React.ReactNode} props.children
 */
export function RequireRole({ roles, fallback = null, children }) {
  const { hasRole } = useAuth();

  const allowedList = Array.isArray(roles) ? roles : [roles];
  const isAuthorized = hasRole(...allowedList);

  if (!isAuthorized) {
    return fallback;
  }

  return children;
}

export default RequireRole;

