import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, type GenerateContentResponse } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Simple in-memory idempotency cache for API Gateway playground calls
const idempotencyStore = new Map<string, { status: number; body: unknown; createdAt: number }>();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    const ai = getGeminiClient();
    res.json({
      status: 'ok',
      service: 'kavi-gateway',
      geminiConfigured: Boolean(ai),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/openapi.json', (_req, res) => {
    res.json({
      openapi: '3.1.0',
      info: {
        title: 'KAVI AI (kaviai.ir) Model Gateway API',
        version: '1.0.0',
        description:
          'Unified REST & SSE Model Gateway for Persian autonomous AI agents (Social Media, Web Design, SEO, Trading Assistant), async media jobs, and inference.',
      },
      servers: [{ url: '/api/v1' }],
      paths: {
        '/chat/completions': {
          post: {
            summary: 'Stream or generate text completion through Kavi Gateway',
            parameters: [
              {
                name: 'Idempotency-Key',
                in: 'header',
                required: false,
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': { description: 'Completion payload or SSE stream' },
              '402': { description: 'Insufficient credits' },
              '503': { description: 'Provider unavailable or not configured' },
            },
          },
        },
        '/studio/jobs': {
          post: {
            summary: 'Submit asynchronous image, video, or audio generation job',
            responses: { '202': { description: 'Job queued with tracking ID' } },
          },
        },
      },
    });
  });

  // Streaming SSE Model Gateway endpoint for Kavi Chat
  app.post('/api/gateway/chat', async (req, res) => {
    const {
      modelId = 'gemini-4-hydrogen',
      messages = [],
      systemInstruction,
      fastMode = false,
      attachments = [],
    } = req.body as {
      modelId?: string;
      messages?: Array<{ role: string; content: string }>;
      systemInstruction?: string;
      fastMode?: boolean;
      attachments?: Array<{ name: string; mimeType: string; dataUrl?: string; textPreview?: string }>;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'لیست پیام‌ها نمی‌تواند خالی باشد.' });
    }

    // Only Gemini Functional models hit live SDK; other unconfigured providers return honest 503 with Demo guidance
    const isLiveGemini = modelId === 'gemini-4-hydrogen';
    if (!isLiveGemini) {
      return res.status(503).json({
        error: `ارائه‌دهنده مدل "${modelId}" در این محیط متصل نیست و در حالت Demo قرار دارد. برای پاسخ واقعی، مدل «Gemini 4 Hydrogen» را انتخاب کنید یا کلید ارائه‌دهنده را در سرور تنظیم نمایید.`,
        code: 'PROVIDER_NOT_CONFIGURED',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'کلید GEMINI_API_KEY در محیط سرور تنظیم نشده است. لطفاً کلید را در Settings > Secrets پیکربندی کنید.',
        code: 'MISSING_API_KEY',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const startedAt = Date.now();
    try {
      const historyContext = messages
        .slice(0, -1)
        .map((m) => `${m.role === 'user' ? 'کاربر' : 'دستیار'}: ${m.content}`)
        .join('\n\n');
      const latestMessage = messages[messages.length - 1];

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      for (const att of attachments) {
        if (att.dataUrl && att.mimeType.startsWith('image/')) {
          const base64 = att.dataUrl.split(',')[1];
          if (base64) {
            parts.push({ inlineData: { mimeType: att.mimeType, data: base64 } });
          }
        } else if (att.textPreview) {
          parts.push({ text: `محتوای فایل پیوست (${att.name}):\n${att.textPreview}` });
        }
      }

      const fullPrompt = historyContext
        ? `سابقه گفتگو:\n${historyContext}\n\nپیام جدید کاربر:\n${latestMessage.content}`
        : latestMessage.content;

      parts.push({ text: fullPrompt });

      const stream = await ai.models.generateContentStream({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            systemInstruction ||
            'تو دستیار و ایجنت هوشمند پلتفرم کاوی (kaviai.ir) با شعار «کارتو به کاوی بسپار» هستی. در زمینه‌های مدیریت شبکه‌های اجتماعی، طراحی سایت، مدیریت سئو، تحلیل بازار و ترید (با ذکر هشدار مدیریت ریسک)، تولید محتوا و برنامه‌نویسی دقیق، ساختاریافته و حرفه‌ای به زبان کاربر (پیش‌فرض فارسی روان و استاندارد) پاسخ بده. برای کدها از بلوک‌های Markdown استاندارد استفاده کن.',
          thinkingConfig: {
            thinkingLevel: fastMode ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
          },
        },
      });

      let fullText = '';
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const delta = c.text ?? '';
        if (delta) {
          fullText += delta;
          res.write(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`);
        }
      }

      const latencyMs = Date.now() - startedAt;
      const inputTokens = Math.max(16, Math.ceil(fullPrompt.length / 2.6));
      const outputTokens = Math.max(12, Math.ceil(fullText.length / 2.6));

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          latencyMs,
          inputTokens,
          outputTokens,
          modelId,
        })}\n\n`
      );
      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطای ناشناخته در ارتباط با مدل';
      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
      res.end();
    }
  });

  // Live Gateway Playground endpoint with Idempotency-Key support
  app.post('/api/gateway/playground', async (req, res) => {
    const idempotencyKey = req.header('Idempotency-Key') || `pg_${Date.now()}`;
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached) {
      return res.status(cached.status).json({ ...(cached.body as object), idempotentReplay: true });
    }

    const { prompt, modelId = 'gemini-4-hydrogen' } = req.body as {
      prompt?: string;
      modelId?: string;
    };

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'مقدار prompt الزامی است.' });
    }

    if (modelId !== 'gemini-4-hydrogen') {
      return res.status(503).json({
        error: `مدل "${modelId}" در حالت Demo است و کلید سرور آن متصل نشده است.`,
        code: 'PROVIDER_NOT_CONFIGURED',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'کلید GEMINI_API_KEY روی سرور تنظیم نشده است.',
        code: 'MISSING_API_KEY',
      });
    }

    const startedAt = Date.now();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      const text = response.text ?? '';
      const payload = {
        id: `kavi_req_${Date.now()}`,
        model: modelId,
        output: text,
        usage: {
          inputTokens: Math.ceil(prompt.length / 2.6),
          outputTokens: Math.ceil(text.length / 2.6),
        },
        latencyMs: Date.now() - startedAt,
        idempotencyKey,
      };
      idempotencyStore.set(idempotencyKey, { status: 200, body: payload, createdAt: Date.now() });
      return res.json(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطای Gateway';
      return res.status(502).json({ error: msg });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`KAVI AI (kaviai.ir) server listening on http://localhost:${PORT}`);
  });
}

startServer();
