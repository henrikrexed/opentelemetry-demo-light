import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  const grpc = require('../../../lib/grpc-client');
  const body = await request.json();
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value || 'default-user';

  try {
    const order = await grpc.placeOrder({
      userId,
      userEmail: body.email || '',
      address: {
        streetAddress: body.streetAddress || '',
        city: body.city || '',
        state: body.state || '',
        zipCode: body.zipCode || '',
        country: body.country || 'US',
      },
      creditCard: {
        creditCardNumber: body.creditCardNumber || '4111111111111111',
        creditCardCvv: parseInt(body.creditCardCvv) || 123,
        creditCardExpirationYear: parseInt(body.creditCardExpirationYear) || 2030,
        creditCardExpirationMonth: parseInt(body.creditCardExpirationMonth) || 12,
      },
    });
    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
