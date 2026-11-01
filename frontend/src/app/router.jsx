import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout.jsx';
import AppLayout from '../layouts/AppLayout.jsx';
import HomePage from '../pages/HomePage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import DesignSystemPage from '../pages/DesignSystemPage.jsx';
import DashboardShellPage from '../pages/DashboardShellPage.jsx';

/**
 * Application routing table for PJ Study.
 */
export const router = createBrowserRouter([
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
]);

export default router;
