'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const form = new FormData(e.target);
    const body = Object.fromEntries(form.entries());

    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (data.error) {
        setError(data.error);
        setSubmitting(false);
      } else {
        router.push(`/order?id=${data.orderId}&tx=${data.transactionId}`);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.5rem', border: '1px solid #ccc',
    borderRadius: '4px', boxSizing: 'border-box', marginBottom: '0.75rem'
  };

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '500px' }}>
      <h1>Checkout</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <h3>Contact</h3>
        <input name="email" placeholder="Email" style={inputStyle} defaultValue="demo@example.com" />

        <h3>Shipping Address</h3>
        <input name="streetAddress" placeholder="Street Address" style={inputStyle} defaultValue="123 Main St" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input name="city" placeholder="City" style={inputStyle} defaultValue="Springfield" />
          <input name="state" placeholder="State" style={inputStyle} defaultValue="IL" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <input name="zipCode" placeholder="Zip Code" style={inputStyle} defaultValue="62704" />
          <input name="country" placeholder="Country" style={inputStyle} defaultValue="US" />
        </div>

        <h3>Payment (Demo)</h3>
        <input name="creditCardNumber" placeholder="Card Number" style={inputStyle} defaultValue="4111111111111111" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <input name="creditCardExpirationMonth" placeholder="MM" style={inputStyle} defaultValue="12" />
          <input name="creditCardExpirationYear" placeholder="YYYY" style={inputStyle} defaultValue="2030" />
          <input name="creditCardCvv" placeholder="CVV" style={inputStyle} defaultValue="123" />
        </div>

        <button type="submit" disabled={submitting} style={{
          background: submitting ? '#999' : '#2d6a4f', color: 'white', border: 'none',
          padding: '0.75rem 2rem', borderRadius: '4px', cursor: 'pointer',
          fontSize: '1rem', marginTop: '1rem', width: '100%'
        }}>
          {submitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
