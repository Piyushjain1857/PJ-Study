import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import DesignSystemPage from '../pages/DesignSystemPage.jsx';
import DashboardShellPage from '../pages/DashboardShellPage.jsx';

// Auth Pages & Route Guards
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import VerifyEmailPage from '../pages/auth/VerifyEmailPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import ProfilePage from '../pages/auth/ProfilePage.jsx';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
import GuestRoute from '../components/common/GuestRoute.jsx';

/**
 * Application routing table for PJ Study.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <PublicLayout />,
      children: [
        {
          index: true,
          element: <HomePage />
        },
        {
          path: 'design-system',
          element: <DesignSystemPage />
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
          path: 'profile',
          element: (
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          )
        },
        {
          path: '*',
          element: <NotFoundPage />
        }
      ]
    },
    {
      path: '/app',
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: <DashboardShellPage />
        },
        {
          path: '*',
          element: <DashboardShellPage />
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
