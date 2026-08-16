import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('token')?.value;

    const authHeader = req.headers.get('authorization');
    const tokenHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const token = tokenCookie || tokenHeader;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: decoded.userId, email: decoded.email },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
