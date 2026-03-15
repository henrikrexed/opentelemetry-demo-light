'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cart')
      .then(r => r.json())
      .then(data => { setCart(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading cart...</p>;

  const items = cart?.items || [];

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '600px' }}>
      <h1>Your Cart</h1>
      {items.length === 0 ? (
        <div>
          <p>Your cart is empty.</p>
          <Link href="/" style={{ color: '#2d6a4f' }}>Continue Shopping</Link>
        </div>
      ) : (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Product ID</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{item.productId}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/checkout">
              <button style={{
                background: '#2d6a4f', color: 'white', border: 'none',
                padding: '0.75rem 2rem', borderRadius: '4px', cursor: 'pointer',
                fontSize: '1rem'
              }}>
                Proceed to Checkout
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
