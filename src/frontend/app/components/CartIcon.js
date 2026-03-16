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
    <a href="/cart" className="cart-icon-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#29293E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      {count > 0 && <span className="cart-badge">{count > 99 ? '99+' : count}</span>}
    </a>
  );
}
