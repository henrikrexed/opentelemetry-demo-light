'use client';

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

  async function quickAdd(productId) {
    await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    window.dispatchEvent(new Event('cart-updated'));
  }

  if (loading) return <p style={{padding: '100px', textAlign: 'center'}}>Loading...</p>;

  return (
    <>
      <div className="banner">
        <div className="banner-image-container">
          <img src="/images/banner.jpg" alt="Astronomy Shop" />
        </div>
        <div className="banner-text">
          <h1 className="banner-title">Welcome to the Astronomy Shop</h1>
          <p className="banner-subtitle">Powered by OpenTelemetry</p>
          <a href="#products" className="btn-go-shopping">Go Shopping</a>
        </div>
      </div>

      <div id="products" className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <a href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="product-card-image"
                style={{ backgroundImage: `url(${product.picture})` }}
              />
              <p className="product-card-name">{product.name}</p>
              <p className="product-card-price">
                {formatPrice(product.priceUsd?.amountCents || 0)}
              </p>
            </a>
            <button className="btn-add-cart-small" onClick={() => quickAdd(product.id)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
