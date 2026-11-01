import React from 'react';
import Navbar from './Navbar.jsx';

/**
 * Re-export Navbar as Header for backwards compatibility.
 */
export function Header() {
  return <Navbar />;
}

export default Header;
