import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId || sessionId.startsWith('guest_')) {
      return NextResponse.json({ status: 'success', data: [] });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('Message')
      .select('id, sender, text, fileUrl, createdAt')
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    const formattedChats = (messages || []).map((m) => ({
      id: m.id,
      sender: m.sender === 'user' ? 'Kamu' : 'AI',
      teks: m.text,
      fileUrl: m.fileUrl,
    }));

    return NextResponse.json({ status: 'success', data: formattedChats });
  } catch (error: any) {
    console.error('Fetch chat history error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
