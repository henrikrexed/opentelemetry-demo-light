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
      <div style={{
        borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem',
        position: 'relative', height: '300px'
      }}>
        <img
          src="/images/banner.jpg"
          alt="OTel Demo Light"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '2rem', color: 'white'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Welcome to the Astronomy Shop</h1>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>Powered by OpenTelemetry</p>
        </div>
      </div>

      <h2>Products</h2>
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
