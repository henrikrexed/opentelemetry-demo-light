import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const grpc = require('../../../../lib/grpc-client');
  try {
    const product = await grpc.getProduct({ id: params.id });
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
