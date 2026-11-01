import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';

/**
 * PublicLayout shell for landing pages, design system showcase, and public exploration.
 */
export function PublicLayout() {
  return (
    <div className="d-flex flex-col" style={{ minHeight: '100dvh' }}>
      <Navbar />
      <main id="main-content" className="flex-1 d-flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;

