'use client';

import CartIcon from './CartIcon';

export default function NavBar() {
  return (
    <nav style={{
      background: '#1a1a2e', color: 'white', padding: '1rem 2rem',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <a href="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.25rem', fontWeight: 'bold' }}>
        🔭 OTel Demo Light
      </a>
      <CartIcon />
    </nav>
  );
}
