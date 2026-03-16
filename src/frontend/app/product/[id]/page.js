'use client';

import { useState } from 'react';

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  if (loading && !product) {
    fetch(`/api/product/${params.id}`)
      .then(r => r.json())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }

  if (loading) return <p style={{padding: '100px', textAlign: 'center'}}>Loading...</p>;
  if (!product) return <p style={{padding: '100px', textAlign: 'center'}}>Product not found.</p>;

  async function handleAddToCart() {
    await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, quantity }),
    });
    setAdded(true);
    window.dispatchEvent(new Event('cart-updated'));
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="product-detail">
      <div
        className="product-detail-image"
        style={{ backgroundImage: `url(${product.picture})` }}
      />
      <div className="product-detail-info">
        <h1 className="product-detail-name">{product.name}</h1>
        <p className="product-detail-description">{product.description}</p>
        <p className="product-detail-price">
          {formatPrice(product.priceUsd?.amountCents || 0)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select
            className="qty-select"
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button className="btn-add-cart" onClick={handleAddToCart}>
            {added ? 'Added!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
