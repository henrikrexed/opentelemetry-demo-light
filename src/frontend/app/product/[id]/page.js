'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  // Fetch product on mount
  if (loading && !product) {
    fetch(`/api/product/${params.id}`)
      .then(r => r.json())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  if (loading) return <p>Loading...</p>;
  if (!product) return <p>Product not found.</p>;

  async function handleAddToCart() {
    await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, quantity }),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '600px' }}>
      <h1>{product.name}</h1>
      <p style={{ color: '#666', lineHeight: 1.6 }}>{product.description}</p>
      <p style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#2d6a4f' }}>
        {formatPrice(product.priceUsd?.amountCents || 0)}
      </p>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
        <label>Qty:
          <select value={quantity} onChange={e => setQuantity(Number(e.target.value))}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button onClick={handleAddToCart} style={{
          background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem',
          borderRadius: '4px', cursor: 'pointer', fontSize: '1rem'
        }}>
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
