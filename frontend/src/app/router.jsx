import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AppLayout from '../layouts/AppLayout.jsx';

import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import GuestRoute from '../components/common/GuestRoute.jsx';
import { RouteErrorBoundary } from '../components/common/ErrorBoundary.jsx';
import { ROLES } from '../utils/permissions.js';

// Accessible Route-Level Loading Fallback
function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        width: '100%',
        color: 'var(--color-text-secondary, #64748b)'
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '3px solid var(--color-border, #e2e8f0)',
          borderTopColor: 'var(--color-primary, #0f766e)',
          animation: 'route-spin 0.7s linear infinite'
        }}
      />
      <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
        Loading page...
      </span>
      <style>{`
        @keyframes route-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper to wrap lazy components in Suspense
const withLazy = (Component) => (props) => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Component {...props} />
  </Suspense>
);

import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';

// Route-Level Code Splitting for heavy views (drastically reduces initial JS bundle)
const HomePage = withLazy(lazy(() => import('../pages/HomePage.jsx')));
const NotFoundPage = withLazy(lazy(() => import('../pages/NotFoundPage.jsx')));
const LoginPage = withLazy(lazy(() => import('../pages/auth/LoginPage.jsx')));
const RegisterPage = withLazy(lazy(() => import('../pages/auth/RegisterPage.jsx')));
const VerifyEmailPage = withLazy(lazy(() => import('../pages/auth/VerifyEmailPage.jsx')));
const ForgotPasswordPage = withLazy(lazy(() => import('../pages/auth/ForgotPasswordPage.jsx')));
const ResetPasswordPage = withLazy(lazy(() => import('../pages/auth/ResetPasswordPage.jsx')));

const AdminDashboardPage = withLazy(lazy(() => import('../pages/admin/AdminDashboardPage.jsx')));
const AdminWorkspacePage = withLazy(lazy(() => import('../pages/admin/AdminWorkspacePage.jsx')));
const DesignSystemPage = withLazy(lazy(() => import('../pages/DesignSystemPage.jsx')));
const ProfilePage = withLazy(lazy(() => import('../pages/auth/ProfilePage.jsx')));
const NotificationCenterPage = withLazy(
  lazy(() => import('../pages/notifications/NotificationCenterPage.jsx'))
);
const StudentDashboardPage = withLazy(
  lazy(() => import('../pages/dashboard/StudentDashboardPage.jsx'))
);
const NotesExplorePage = withLazy(lazy(() => import('../pages/notes/NotesExplorePage.jsx')));
const NoteDetailsPage = withLazy(lazy(() => import('../pages/notes/NoteDetailsPage.jsx')));
const RecommendedNotesPage = withLazy(
  lazy(() => import('../pages/notes/RecommendedNotesPage.jsx'))
);
const CreateNotePage = withLazy(lazy(() => import('../pages/notes/CreateNotePage.jsx')));
const EditNotePage = withLazy(lazy(() => import('../pages/notes/EditNotePage.jsx')));
const MyNotesPage = withLazy(lazy(() => import('../pages/notes/MyNotesPage.jsx')));

/**
 * Application routing table for PJ Study.
 * - PublicLayout: Editorial marketing pages, login/registration, public auth verification
 * - AppLayout: Notion/Linear-grade academic workspace (dashboard, notes discovery, library, recommendations, moderation)
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          path: 'dashboard',
          element: (
            <ProtectedRoute>
              <StudentDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'app',
          element: (
            <ProtectedRoute>
              <StudentDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'notes',
          element: <NotesExplorePage />
        },
        {
          path: 'notes/explore',
          element: <NotesExplorePage />
        },
        {
          path: 'notes/recommended',
          element: (
            <ProtectedRoute>
              <RecommendedNotesPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'notes/new',
          element: (
            <ProtectedRoute roles={[ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
              <CreateNotePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'notes/:id',
          element: <NoteDetailsPage />
        },
        {
          path: 'notes/:id/edit',
          element: (
            <ProtectedRoute roles={[ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
              <EditNotePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'my-notes',
          element: (
            <ProtectedRoute>
              <MyNotesPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'profile',
          element: (
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'notifications',
          element: (
            <ProtectedRoute>
              <NotificationCenterPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace/analytics',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace/assigned',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace/notes',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace/moderation',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace/reports',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace/quality',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin-workspace/history',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MODERATOR]}>
              <AdminWorkspacePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/analytics',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/activity',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/users',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/moderators',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/admins',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/roles',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/suspended-users',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/academics',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/academics/:sub',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/notes',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/notes/upload',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <CreateNotePage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/moderation',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/reports',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/reviews',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/announcements',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/notifications',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/storage',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/audit-logs',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/ui-builder',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/ui-builder/:target',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/appearance',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/navigation',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/widgets',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/features',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/permissions',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/content',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/config/history',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/settings',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/security',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/health',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'admin/backups',
          element: (
            <ProtectedRoute roles={[ROLES.SUPER_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'design-system',
          element: (
            <ProtectedRoute roles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
              <DesignSystemPage />
            </ProtectedRoute>
          )
        }
      ]
    },
    {
      path: '/',
      element: <PublicLayout />,
      errorElement: <RouteErrorBoundary />,
      children: [
        {
          index: true,
          element: <HomePage />
        },
        {
          path: 'login',
          element: (
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          )
        },
        {
          path: 'register',
          element: (
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          )
        },
        {
          path: 'verify-email',
          element: <VerifyEmailPage />
        },
        {
          path: 'forgot-password',
          element: (
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          )
        },
        {
          path: 'reset-password',
          element: (
            <GuestRoute>
              <ResetPasswordPage />
            </GuestRoute>
          )
        },
        {
          path: 'unauthorized',
          element: <UnauthorizedPage />
        },
        {
          path: '*',
          element: <NotFoundPage />
        }
      ]
    }
  ],
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
);

export default router;
