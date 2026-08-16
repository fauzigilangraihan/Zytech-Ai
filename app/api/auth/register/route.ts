import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Email dan password wajib diisi!' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existingUser) {
      return NextResponse.json(
        { status: 'error', message: 'Email sudah terdaftar!' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Insert user into Supabase User table
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert([{ email, password: hashedPassword }])
      .select('id, email')
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({
      status: 'success',
      message: 'Registrasi berhasil! Silakan login.',
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (error: any) {
    console.error('Register error:', error);
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
