import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router.jsx';

/**
 * Root Application component.
 */
export function App() {
  return <RouterProvider router={router} />;
}

export default App;
