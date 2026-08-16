import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Email dan password wajib diisi!' },
        { status: 400 }
      );
    }

    const { data: user, error: findError } = await supabase
      .from('User')
      .select('id, email, password')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Email atau password salah!' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { status: 'error', message: 'Email atau password salah!' },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      status: 'success',
      message: 'Login berhasil!',
      token,
      email: user.email,
      userId: user.id,
    });

    // Set HTTP-only cookie for session
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    const msg = error.message || '';
    if (
      msg.includes('apiKey') ||
      msg.includes('invalid') ||
      msg.includes('fetch') ||
      msg.includes('Failed to fetch') ||
      msg.includes('URL')
    ) {
      return NextResponse.json(
        {
          status: 'error',
          message: '⚠️ Koneksi Supabase Gagal! Pastikan file `.env.local` telah diisi dengan variabel `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` yang valid.',
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { status: 'error', message: msg || 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
