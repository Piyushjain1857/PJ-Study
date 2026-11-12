import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Conditionally renders children if the authenticated user holds the required permission(s).
 *
 * @param {object} props
 * @param {string|string[]} props.permission - Single permission or array of required permissions
 * @param {React.ReactNode} [props.fallback=null] - Rendered when permission check fails
 * @param {React.ReactNode} props.children
 */
export function RequirePermission({ permission, fallback = null, children }) {
  const { hasPermission } = useAuth();

  const requiredList = Array.isArray(permission) ? permission : [permission];
  const isAuthorized = requiredList.every((perm) => hasPermission(perm));

  if (!isAuthorized) {
    return fallback;
  }

  return children;
}

export default RequirePermission;
