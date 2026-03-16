'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data.products || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading products...</p>;

  return (
    <div>
      <h1>Products</h1>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              background: 'white', borderRadius: '8px', overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer'
            }}>
              {product.picture && (
                <img
                  src={product.picture}
                  alt={product.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem' }}>{product.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
                  {product.description}
                </p>
                <p style={{ fontWeight: 'bold', color: '#2d6a4f', fontSize: '1.1rem', margin: 0 }}>
                  {formatPrice(product.priceUsd?.amountCents || 0)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
