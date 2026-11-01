import React from 'react';
import PublicLayout from './PublicLayout.jsx';

/**
 * Re-export PublicLayout as RootLayout for backwards compatibility.
 */
export function RootLayout() {
  return <PublicLayout />;
}

export default RootLayout;
