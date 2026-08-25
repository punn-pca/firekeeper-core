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
          console.warn('[Gemini Quota Exceeded]: no fallback model succeeded, returning honest error to user.');
          return {
            text: `⚠️ ขออภัย ระบบไม่สามารถเรียก Gemini API ได้ในขณะนี้ เนื่องจากโควต้าการใช้งาน (quota) เต็มชั่วคราว\n\nกรุณาลองใหม่อีกครั้งในอีกสักครู่ หรือตรวจสอบโควต้า API key ของคุณ (คำตอบนี้ไม่ได้ผ่านการวิเคราะห์ใดๆ — เป็นข้อความแจ้งข้อผิดพลาดเท่านั้น)`,
            modelUsed: 'error-quota-exceeded'
          };
        }
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  // If every model failed, say so plainly instead of pretending analysis happened.
  console.warn('[Gemini Content]: All models failed, returning honest error message.');
  return {
    text: `⚠️ ขออภัย ระบบไม่สามารถเรียก Gemini API ได้สำเร็จในขณะนี้ (ลองครบทุกโมเดลสำรองแล้วแต่ไม่สำเร็จ) กรุณาลองใหม่อีกครั้ง หรือตรวจสอบสถานะ API key / เครือข่ายของคุณ\n\n(คำตอบนี้เป็นข้อความแจ้งข้อผิดพลาด ไม่ใช่ผลการวิเคราะห์)`,
    modelUsed: 'error-all-models-failed'
  };
}

export async function callGeminiStreamWithRetry(
  contentsPayload: any,
  onChunk: (text: string) => void,
  systemInstruction?: string,
  enableSearch?: boolean
): Promise<{ text: string; modelUsed: string; groundingMetadata?: any; usageMetadata?: any }> {
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
        let usageMetadata: any = null;
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
          if (chunk.usageMetadata) {
            usageMetadata = chunk.usageMetadata;
          }
          if (textChunk) {
            fullText += textChunk;
            onChunk(textChunk);
          }
        }

        try {
          const finalResp = await (responseStream as any).response;
          if (finalResp?.usageMetadata) {
            usageMetadata = finalResp.usageMetadata;
          }
        } catch {
          // ignore
        }

        if (fullText.trim().length > 0) {
          return { text: fullText, modelUsed: modelName, groundingMetadata, usageMetadata };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini Stream Attempt ${attempt} (${modelName}) failed]:`, errMsg);
        if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429')) {
          console.warn('[Gemini Quota Exceeded]: no fallback model succeeded, streaming honest error to user.');
          const fallbackText = `⚠️ ขออภัย ระบบไม่สามารถเรียก Gemini API ได้ในขณะนี้ เนื่องจากโควต้าการใช้งาน (quota) เต็มชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่ (คำตอบนี้เป็นข้อความแจ้งข้อผิดพลาด ไม่ใช่ผลการวิเคราะห์)`;
          onChunk(fallbackText);
          return { text: fallbackText, modelUsed: 'error-quota-exceeded' };
        }
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  console.warn('[Gemini Stream]: All streaming models failed, streaming honest error message.');
  const fallbackText = `⚠️ ขออภัย ระบบไม่สามารถเรียก Gemini API ได้สำเร็จในขณะนี้ (ลองครบทุกโมเดลสำรองแล้วแต่ไม่สำเร็จ) กรุณาลองใหม่อีกครั้ง`;
  onChunk(fallbackText);
  return { text: fallbackText, modelUsed: 'error-all-models-failed' };
}

export async function callOpenAIContentWithRetry(
  promptText: string,
  modelName: string = 'gpt-4o',
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[OpenAI Content]: OPENAI_API_KEY not configured. Falling back to Gemini content.');
    return callGeminiContentWithRetry(promptText);
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
    console.warn('[OpenAI Stream]: OPENAI_API_KEY not configured. Falling back to Gemini stream.');
    return callGeminiStreamWithRetry(contentsPayload, onChunk, systemInstruction);
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

export async function callDeepSeekContentWithRetry(
  promptText: string,
  modelName: string = 'deepseek-chat',
  systemInstruction?: string,
  customApiKey?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('[DeepSeek Content]: DEEPSEEK_API_KEY not configured. Falling back to Gemini content.');
    return callGeminiContentWithRetry(promptText);
  }

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: promptText });

  const modelsToTry = [modelName, 'deepseek-chat', 'deepseek-reasoner'];
  let lastError: any = null;

  for (const m of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
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
          throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const reasoning = data.choices?.[0]?.message?.reasoning_content || '';
        const content = data.choices?.[0]?.message?.content || '';
        const resText = (reasoning ? `[DeepSeek Reasoning:\n${reasoning}\n]\n\n` : '') + content;
        if (resText.trim().length > 0) {
          return { text: resText, modelUsed: m };
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[DeepSeek Content Attempt ${attempt} (${m}) failed]:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError || new Error('All DeepSeek models failed.');
}

export async function callDeepSeekStreamWithRetry(
  contentsPayload: any,
  onChunk: (text: string) => void,
  modelName: string = 'deepseek-chat',
  systemInstruction?: string,
  customApiKey?: string
): Promise<{ text: string; modelUsed: string }> {
  const apiKey = customApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('[DeepSeek Stream]: DEEPSEEK_API_KEY not configured. Falling back to Gemini stream.');
    return callGeminiStreamWithRetry(contentsPayload, onChunk, systemInstruction);
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

  const modelsToTry = [modelName, 'deepseek-chat', 'deepseek-reasoner'];
  let lastError: any = null;

  for (const m of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let fullText = '';
        const response = await fetch('https://api.deepseek.com/chat/completions', {
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
          throw new Error(`DeepSeek Stream error (${response.status}): ${errText}`);
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
              const reasoningDelta = parsed.choices?.[0]?.delta?.reasoning_content || '';
              const deltaText = parsed.choices?.[0]?.delta?.content || '';

              if (reasoningDelta) {
                fullText += reasoningDelta;
                onChunk(reasoningDelta);
              }
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
        console.warn(`[DeepSeek Stream Attempt ${attempt} (${m}) failed]:`, err?.message || err);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }
  }

  throw lastError || new Error('All DeepSeek stream models failed.');
}

