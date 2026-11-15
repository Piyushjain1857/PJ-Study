import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { router } from './app/router.jsx';

/**
 * Root Application component.
 */
export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
