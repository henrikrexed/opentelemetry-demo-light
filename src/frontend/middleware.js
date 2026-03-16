import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  
  if (!request.cookies.get('userId')) {
    // Generate a UUID-like session ID
    const userId = crypto.randomUUID();
    response.cookies.set('userId', userId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
