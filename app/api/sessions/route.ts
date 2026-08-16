import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getUserFromRequest(req: Request) {
  const tokenCookie = cookies().get('token')?.value;
  const authHeader = req.headers.get('authorization');
  const tokenHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = tokenCookie || tokenHeader;

  if (token) {
    const payload = verifyToken(token);
    if (payload) return payload;
  }
  return null;
}

// GET /api/sessions -> list or search sessions
export async function GET(req: Request) {
  try {
    const userPayload = await getUserFromRequest(req);

    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const query = searchParams.get('query') || '';

    let user = null;
    if (userPayload) {
      const { data, error } = await supabase
        .from('User')
        .select('id')
        .eq('id', userPayload.userId)
        .maybeSingle();
      if (!error) user = data;
    } else if (emailParam && emailParam !== 'GUEST') {
      const { data, error } = await supabase
        .from('User')
        .select('id')
        .eq('email', emailParam)
        .maybeSingle();
      if (!error) user = data;
    }

    if (!user) {
      return NextResponse.json({ status: 'success', data: [] });
    }

    let queryBuilder = supabase
      .from('Session')
      .select('id, title, createdAt')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (query) {
      queryBuilder = queryBuilder.ilike('title', `%${query}%`);
    }

    const { data: sessions, error: sessionError } = await queryBuilder;
    if (sessionError) throw sessionError;

    return NextResponse.json({ status: 'success', data: sessions || [] });
  } catch (error: any) {
    console.error('Fetch sessions error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

// POST /api/sessions -> create new session ID
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || 'GUEST';

    const userPayload = await getUserFromRequest(req);
    const isGuest = !userPayload && email === 'GUEST';

    if (isGuest) {
      return NextResponse.json({
        status: 'success',
        session_id: 'guest_' + Math.random().toString(36).substring(2, 15),
      });
    }

    const sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    return NextResponse.json({ status: 'success', session_id: sessionId });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

// DELETE /api/sessions -> delete a session
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ status: 'error', message: 'Session ID required' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('Session')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.warn('Session delete error or already deleted:', deleteError.message);
    }

    return NextResponse.json({ status: 'success', message: 'Session deleted' });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
