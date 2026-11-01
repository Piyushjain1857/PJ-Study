import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import './RootLayout.css';

/**
 * Root application layout shell providing standard Header, dynamic Outlet, and Footer.
 */
export function RootLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main id="main-content" className="app-layout__content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default RootLayout;

