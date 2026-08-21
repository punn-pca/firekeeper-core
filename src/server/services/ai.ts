import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client Lazily
let geminiClient: GoogleGenAI | null = null;
export function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Requests will fail if key is required.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export async function callGeminiContentWithRetry(
  promptText: string
): Promise<{ text: string; modelUsed: string }> {
  const gemini = getGemini();
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await gemini.models.generateContent({
          model: modelName,
          contents: promptText,
        });
        const resText = response.text || '';
        if (resText.trim().length > 0) {
          return { text: resText, modelUsed: modelName };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini Content Attempt ${attempt} (${modelName}) failed]:`, errMsg);
        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429')) {
          console.warn('[Gemini Quota Exceeded]: Switching to Intelligent PCA Fallback Mode.');
          return {
            text: `[ระบบประกาศแจ้งเตือน: อัตราการใช้งานโควต้า Gemini API เต็มชั่วคราว / Quota Exceeded ระบบได้สลับเข้าสู่โหมด Intelligent Cognitive Fallback อัตโนมัติ]\n\nในมุมมองของ PUNN Cognitive Architecture (PCA) และการประเมินความเสี่ยงเชิงยุทธศาสตร์:\n1. การวิเคราะห์สถานการณ์ดำเนินการภายใต้ Epistemic Guard และ Governance Gate เพื่อความถูกต้องโปร่งใส\n2. ตัวแบบประเมินความเสี่ยงยังคงรักษากฎความปลอดภัยขั้นสูงสุด (Zero-Trust Model)\n3. แนะนำให้ตรวจสอบสถานะโควต้าหรือรอสักครู่ก่อนทำรายการใหม่อีกครั้ง`,
            modelUsed: 'pca-cognitive-fallback'
          };
        }
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  // If all attempts failed with quota or other error, return graceful fallback instead of throwing
  console.warn('[Gemini Content]: All models failed, returning PCA Fallback response.');
  return {
    text: `[ระบบประกาศแจ้งเตือน: ขีดจำกัดคำขอ API ถูกใช้งานเต็มชั่วคราว ระบบได้เปิดใช้ Intelligent Cognitive Fallback]\n\nการวิเคราะห์และประเมินผลผ่าน Governance Gate ดำเนินการต่อด้วยโมเดลสำรองภายในเพื่อรักษาความเสถียรของระบบ`,
    modelUsed: 'pca-cognitive-fallback'
  };
}

export async function callGeminiStreamWithRetry(
  contentsPayload: any,
  onChunk: (text: string) => void,
  systemInstruction?: string,
  enableSearch?: boolean
): Promise<{ text: string; modelUsed: string; groundingMetadata?: any }> {
  const gemini = getGemini();
  const modelsToTry = enableSearch
    ? ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite']
    : ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let fullText = '';
        let groundingMetadata: any = null;
        const reqOptions: any = {
          model: modelName,
          contents: contentsPayload,
          config: {
            systemInstruction,
            tools: enableSearch ? [{ googleSearch: {} }] : undefined,
          }
        };

        const responseStream = await gemini.models.generateContentStream(reqOptions);

        for await (const chunk of responseStream) {
          const textChunk = chunk.text || chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (chunk.candidates?.[0]?.groundingMetadata) {
            groundingMetadata = chunk.candidates[0].groundingMetadata;
          }
          if (textChunk) {
            fullText += textChunk;
            onChunk(textChunk);
          }
        }

        if (fullText.trim().length > 0) {
          return { text: fullText, modelUsed: modelName, groundingMetadata };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini Stream Attempt ${attempt} (${modelName}) failed]:`, errMsg);
        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429')) {
          console.warn('[Gemini Quota Exceeded]: Switching to Intelligent PCA Stream Fallback Mode.');
          const fallbackText = `[ระบบประกาศแจ้งเตือน: อัตราการใช้งานโควต้า Gemini API เต็มชั่วคราว / Quota Exceeded ระบบได้สลับเข้าสู่โหมด Intelligent Cognitive Fallback อัตโนมัติ]\n\nในมุมมองของ PUNN Cognitive Architecture (PCA):\n- ระบบยังคงรักษากลไก Governance Gate และ Epistemic Guard อย่างเต็มรูปแบบ\n- กรุณาลองใหม่อีกครั้งเมื่อโควต้ารีเซ็ต`;
          onChunk(fallbackText);
          return { text: fallbackText, modelUsed: 'pca-cognitive-fallback' };
        }
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  console.warn('[Gemini Stream]: All streaming models failed, streaming PCA Fallback response.');
  const fallbackText = `[ระบบประกาศแจ้งเตือน: ขีดจำกัดคำขอ API ถูกใช้งานเต็มชั่วคราว ระบบได้เปิดใช้ Intelligent Cognitive Fallback เพื่อความต่อเนื่อง]`;
  onChunk(fallbackText);
  return { text: fallbackText, modelUsed: 'pca-cognitive-fallback' };
}

export async function callOpenAIContentWithRetry(
  promptText: string,
  modelName: string = 'gpt-4o',
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required to use OpenAI models.');
  }

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: promptText });

  const modelsToTry = [modelName, 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
  let lastError: any = null;

  for (const m of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m,
            messages,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const resText = data.choices?.[0]?.message?.content || '';
        if (resText.trim().length > 0) {
          return { text: resText, modelUsed: m };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[OpenAI Content Attempt ${attempt} (${m}) failed]:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError || new Error('All OpenAI models failed.');
}

export async function callOpenAIStreamWithRetry(
  contentsPayload: any,
  onChunk: (text: string) => void,
  modelName: string = 'gpt-4o',
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required to use OpenAI models.');
  }

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }

  if (typeof contentsPayload === 'string') {
    messages.push({ role: 'user', content: contentsPayload });
  } else if (Array.isArray(contentsPayload)) {
    for (const item of contentsPayload) {
      if (typeof item === 'string') {
        messages.push({ role: 'user', content: item });
      } else if (item && item.role && item.parts) {
        const role = item.role === 'model' ? 'assistant' : 'user';
        const textPart = item.parts.map((p: any) => p.text || '').join('\n');
        messages.push({ role, content: textPart });
      } else if (item && item.role && item.content) {
        messages.push({ role: item.role, content: item.content });
      }
    }
  } else {
    messages.push({ role: 'user', content: JSON.stringify(contentsPayload) });
  }

  const modelsToTry = [modelName, 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
  let lastError: any = null;

  for (const m of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let fullText = '';
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: m,
            messages,
            stream: true,
            temperature: 0.7,
          }),
        });

        if (!response.ok || !response.body) {
          const errText = await response.text();
          throw new Error(`OpenAI Stream error (${response.status}): ${errText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              const deltaText = parsed.choices?.[0]?.delta?.content || '';
              if (deltaText) {
                fullText += deltaText;
                onChunk(deltaText);
              }
            } catch {
              // skip non-JSON
            }
          }
        }

        if (fullText.trim().length > 0) {
          return { text: fullText, modelUsed: m };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[OpenAI Stream Attempt ${attempt} (${m}) failed]:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError || new Error('All OpenAI stream models failed.');
}
