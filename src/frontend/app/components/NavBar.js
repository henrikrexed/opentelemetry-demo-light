'use client';

import CartIcon from './CartIcon';

export default function NavBar() {
  return (
    <nav className="header-nav">
      <a href="/" className="header-logo">
        <img src="/images/logo.png" alt="OpenTelemetry Demo Light" />
      </a>
      <CartIcon />
    </nav>
  );
}
