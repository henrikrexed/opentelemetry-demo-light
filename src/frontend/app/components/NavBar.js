'use client';

import CartIcon from './CartIcon';

export default function NavBar() {
  return (
    <nav style={{
      background: '#1a1a2e', color: 'white', padding: '0.75rem 2rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <img src="/images/logo.png" alt="OpenTelemetry Demo Light" style={{ height: '40px' }} />
      </a>
      <CartIcon />
    </nav>
  );
}
