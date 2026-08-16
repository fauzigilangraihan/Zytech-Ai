import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateGeminiResponse, ChatContent } from '@/lib/gemini';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUserFromRequest(req: Request, emailFallback?: string) {
  const tokenCookie = cookies().get('token')?.value;
  const authHeader = req.headers.get('authorization');
  const tokenHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = tokenCookie || tokenHeader;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const { data: user } = await supabase
        .from('User')
        .select('id, email')
        .eq('id', payload.userId)
        .maybeSingle();
      if (user) return user;
    }
  }

  if (emailFallback && emailFallback !== 'GUEST') {
    const { data: user } = await supabase
      .from('User')
      .select('id, email')
      .eq('email', emailFallback)
      .maybeSingle();
    return user;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PASTE_YOUR_NEW')) {
      return NextResponse.json({
        reply: '⚠️ **API Key Gemini Belum Diisi!**\n\nSilakan buka file `.env.local` di proyek Anda, lalu isi `GEMINI_API_KEY` dengan API Key baru yang gratis dari [Google AI Studio](https://aistudio.google.com/).',
      });
    }

    let email = 'GUEST';
    let sessionId = '';
    let messageText = '';
    let model = 'gemini-1.5-flash';
    let fileBase64 = '';
    let fileMimeType = '';
    let fileName = '';
    let isEdit = false;
    let messageId = '';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      email = (formData.get('email') as string) || 'GUEST';
      sessionId = (formData.get('session_id') as string) || '';
      messageText = (formData.get('message') as string) || '';
      model = (formData.get('model') as string) || 'gemini-1.5-flash';
      isEdit = formData.get('is_edit') === 'true';
      messageId = (formData.get('message_id') as string) || '';

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        fileName = file.name;
        fileMimeType = file.type || 'application/octet-stream';
        const buffer = Buffer.from(await file.arrayBuffer());
        fileBase64 = buffer.toString('base64');
      }
    } else {
      const body = await req.json();
      email = body.email || 'GUEST';
      sessionId = body.session_id || '';
      messageText = body.message || '';
      model = body.model || 'gemini-1.5-flash';
      fileBase64 = body.file_base64 || '';
      fileMimeType = body.file_mime_type || '';
      fileName = body.file_name || '';
      isEdit = body.is_edit === true || body.is_edit === 'true';
      messageId = body.message_id || '';
    }

    if (!sessionId) {
      return NextResponse.json({ reply: 'Sesi tidak valid. Harap muat ulang halaman.' });
    }

    const user = await getUserFromRequest(req, email);
    const isLoggedIn = !!user && !sessionId.startsWith('guest_');

    // Build chat history context
    const contents: ChatContent[] = [];

    let userMsgId: string | undefined = undefined;
    let aiMsgId: string | undefined = undefined;

    if (isLoggedIn && user) {
      try {
        // Find existing session or create session in DB
        const { data: session, error: sessionFetchError } = await supabase
          .from('Session')
          .select('id')
          .eq('id', sessionId)
          .maybeSingle();

        if (sessionFetchError) throw sessionFetchError;

        if (!session) {
          const title = messageText.length > 25 ? messageText.substring(0, 25) + '...' : messageText || 'Obrolan Baru';
          const { error: sessionCreateError } = await supabase
            .from('Session')
            .insert([{ id: sessionId, userId: user.id, title }]);

          if (sessionCreateError) throw sessionCreateError;
        }

        if (isEdit && messageId) {
          userMsgId = messageId;
          // 1. Update the target message text in database
          const { error: updateError } = await supabase
            .from('Message')
            .update({ text: messageText })
            .eq('id', messageId);
          
          if (updateError) throw updateError;

          // 2. Fetch the target message details to get its createdAt timestamp
          const { data: targetMsg, error: targetError } = await supabase
            .from('Message')
            .select('createdAt')
            .eq('id', messageId)
            .single();

          if (targetError) throw targetError;

          // 3. Delete all messages after the target message in this session
          if (targetMsg) {
            const { error: deleteError } = await supabase
              .from('Message')
              .delete()
              .eq('sessionId', sessionId)
              .gt('createdAt', targetMsg.createdAt);
            
            if (deleteError) throw deleteError;
          }
        } else {
          // Save new user message into DB
          let userMessageText = messageText;
          if (fileName) {
            userMessageText += `\n*[Melampirkan file: ${fileName}]*`;
          }

          const { data: userMsg, error: userMsgInsertError } = await supabase
            .from('Message')
            .insert([{ sessionId, sender: 'user', text: userMessageText }])
            .select('id')
            .single();

          if (userMsgInsertError) throw userMsgInsertError;
          if (userMsg) {
            userMsgId = userMsg.id;
          }
        }

        // Fetch current message history (if edit, now ends with the updated message)
        const { data: existingMessages, error: messagesError } = await supabase
          .from('Message')
          .select('sender, text')
          .eq('sessionId', sessionId)
          .order('createdAt', { ascending: true });

        if (messagesError) throw messagesError;

        if (existingMessages) {
          for (const msg of existingMessages) {
            contents.push({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }],
            });
          }
        }
      } catch (dbErr) {
        console.error('Database session handling error:', dbErr);
      }
    }

    const skipAppendUserMessage = isEdit && isLoggedIn;

    if (!skipAppendUserMessage) {
      // Prepare current prompt for Gemini API
      const newParts: ChatContent['parts'] = [];
      if (messageText) {
        newParts.push({ text: messageText });
      }

      if (fileBase64 && fileMimeType) {
        newParts.push({
          inline_data: {
            mime_type: fileMimeType,
            data: fileBase64,
          },
        });
      }

      if (newParts.length === 0) {
        newParts.push({ text: 'Halo' });
      }

      contents.push({
        role: 'user',
        parts: newParts,
      });
    }

    // Call Gemini API server-side
    const replyText = await generateGeminiResponse({
      model,
      contents,
    });

    // Save AI response to DB if logged in
    if (isLoggedIn && user) {
      try {
        const { data: aiMsg, error: aiMsgInsertError } = await supabase
          .from('Message')
          .insert([{ sessionId, sender: 'model', text: replyText }])
          .select('id')
          .single();

        if (aiMsgInsertError) throw aiMsgInsertError;
        if (aiMsg) {
          aiMsgId = aiMsg.id;
        }
      } catch (dbErr) {
        console.error('Error saving AI message to DB:', dbErr);
      }
    }

    return NextResponse.json({
      reply: replyText,
      userMessageId: userMsgId,
      aiMessageId: aiMsgId
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    if (error.message?.includes('leaked') || error.message?.includes('Forbidden') || error.message?.includes('403')) {
      return NextResponse.json({
        reply: '⚠️ **Gemini API Key Diblokir oleh Google!**\n\nKunci API sebelumnya telah dideteksi publik (leaked) oleh Google dan diblokir secara otomatis.\n\n👉 **Solusi:** Buat API Key baru (100% Gratis) di [Google AI Studio](https://aistudio.google.com/), lalu masukkan di file `.env.local` pada baris `GEMINI_API_KEY`.',
      });
    }
    return NextResponse.json({ reply: 'Terjadi kesalahan pada model: ' + error.message });
  }
}
