'use client';

import { useState, useEffect } from 'react';

export default function CartIcon() {
  const [count, setCount] = useState(0);

  const fetchCount = () => {
    fetch('/api/cart')
      .then(r => r.json())
      .then(data => {
        const items = data.items || [];
        const total = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCount(total);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    window.addEventListener('cart-updated', fetchCount);
    return () => window.removeEventListener('cart-updated', fetchCount);
  }, []);

  return (
    <a href="/cart" style={{ color: 'white', textDecoration: 'none', position: 'relative', fontSize: '1.5rem' }}>
      🛒
      {count > 0 && (
        <span style={{
          position: 'absolute', top: '-8px', right: '-12px',
          background: '#e94560', color: 'white', borderRadius: '50%',
          width: '20px', height: '20px', fontSize: '0.7rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  );
}
