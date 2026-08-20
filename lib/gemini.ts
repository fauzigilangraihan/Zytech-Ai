import { GoogleGenerativeAI } from '@google/generative-ai';

export const ZYTECH_PERSONA = `
Kamu adalah Zytech AI, asisten kecerdasan buatan (AI) tingkat tinggi yang sangat cerdas, responsif, profesional, dan bersahabat.
Gaya bahasamu luwes, asik, dan mudah dipahami (gunakan kata "aku" dan "kamu").
Kamu memiliki pengetahuan luas dalam bidang pemrograman (full-stack web, mobile, DevOps, database), sains, matematika, analisis data, penulisan kreatif, serta pemecahan masalah kompleks.
Aturan responmu:
1. Berikan jawaban yang terstruktur, jelas, akurat, dan langsung ke intinya.
2. Jika menjawab koding, sertakan potongan kode (code blocks) yang bersih, efisien, dan siap pakai.
3. Selalu bersikap positif, membantu, dan solutif dalam setiap interaksi.
`;

export interface ChatContentPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export interface ChatContent {
  role: 'user' | 'model';
  parts: ChatContentPart[];
}

export async function generateGeminiResponse({
  model: modelName = 'gemini-3.5-flash',
  contents,
}: {
  model?: string;
  contents: ChatContent[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('PASTE_YOUR_NEW')) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Model candidates to try in order
  const candidateModels = [
    modelName,
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash',
  ];

  const modelsToTry = Array.from(new Set(candidateModels));
  let lastError: any = null;

  for (const mName of modelsToTry) {
    try {
      const generativeModel = genAI.getGenerativeModel({
        model: mName,
        systemInstruction: ZYTECH_PERSONA,
      });

      // Build history for SDK chat (all elements except the last one)
      const history: Array<{ role: string; parts: Array<any> }> = [];

      for (let i = 0; i < contents.length - 1; i++) {
        const item = contents[i];
        const role = item.role === 'model' ? 'model' : 'user';
        const parts: any[] = [];

        for (const p of item.parts) {
          if (p.text) {
            parts.push({ text: p.text });
          }
          if (p.inline_data) {
            parts.push({
              inlineData: {
                mimeType: p.inline_data.mime_type,
                data: p.inline_data.data,
              },
            });
          }
        }

        if (parts.length > 0) {
          history.push({ role, parts });
        }
      }

      // Current prompt (last message)
      const currentMsg = contents[contents.length - 1];
      const currentParts: any[] = [];

      if (currentMsg) {
        for (const p of currentMsg.parts) {
          if (p.text) {
            currentParts.push({ text: p.text });
          }
          if (p.inline_data) {
            currentParts.push({
              inlineData: {
                mimeType: p.inline_data.mime_type,
                data: p.inline_data.data,
              },
            });
          }
        }
      }

      if (currentParts.length === 0) {
        currentParts.push({ text: 'Halo' });
      }

      const chat = generativeModel.startChat({ history });
      const result = await chat.sendMessage(currentParts);
      const response = await result.response;
      const text = response.text();

      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`[Zytech AI SDK] Model '${mName}' attempt failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Gagal memproses respon dari Zytech AI.');
}
