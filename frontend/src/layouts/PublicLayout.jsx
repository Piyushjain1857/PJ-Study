import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import PwaManager from '../components/pwa/PwaManager.jsx';

/**
 * PublicLayout shell for landing pages, design system showcase, and public exploration.
 */
export function PublicLayout() {
  return (
    <div className="d-flex flex-col" style={{ minHeight: '100dvh' }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1 d-flex flex-col" tabIndex="-1">
        <Outlet />
      </main>
      <Footer />
      <PwaManager />
    </div>
  );
}

export default PublicLayout;
