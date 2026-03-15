import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request) {
  const grpc = require('../../../../lib/grpc-client');
  const body = await request.json();
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value || 'default-user';

  try {
    await grpc.addItem({
      userId,
      item: { productId: body.productId, quantity: body.quantity || 1 },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
