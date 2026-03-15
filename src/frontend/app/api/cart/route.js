import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const grpc = require('../../../lib/grpc-client');
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value || 'default-user';
  try {
    const cart = await grpc.getCart({ userId });
    return NextResponse.json(cart);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
