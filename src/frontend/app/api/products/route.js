import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const grpc = require('../../../lib/grpc-client');
  try {
    const resp = await grpc.listProducts({});
    return NextResponse.json(resp);
  } catch (err) {
    return NextResponse.json({ products: [], error: err.message }, { status: 500 });
  }
}
