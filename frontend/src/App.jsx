import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { PlatformConfigProvider } from './context/PlatformConfigContext.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { router } from './app/router.jsx';

/**
 * Root Application component.
 */
export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlatformConfigProvider>
          <NotificationProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </NotificationProvider>
        </PlatformConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
