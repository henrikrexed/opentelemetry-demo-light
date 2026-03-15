'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function OrderDetails() {
  const params = useSearchParams();
  const orderId = params.get('id') || 'unknown';
  const transactionId = params.get('tx') || 'unknown';

  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '2rem', maxWidth: '500px' }}>
      <h1 style={{ color: '#2d6a4f' }}>Order Confirmed!</h1>
      <div style={{ margin: '1.5rem 0' }}>
        <p><strong>Order ID:</strong> {orderId}</p>
        <p><strong>Transaction ID:</strong> {transactionId}</p>
      </div>
      <Link href="/">
        <button style={{
          background: '#2d6a4f', color: 'white', border: 'none',
          padding: '0.75rem 2rem', borderRadius: '4px', cursor: 'pointer'
        }}>
          Continue Shopping
        </button>
      </Link>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<p>Loading order details...</p>}>
      <OrderDetails />
    </Suspense>
  );
}
