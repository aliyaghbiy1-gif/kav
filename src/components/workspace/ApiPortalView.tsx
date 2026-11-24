import React, { useState } from 'react';
import { AlertTriangle, Check, Copy, KeyRound, Play, Plus, Trash2 } from 'lucide-react';
import type { AIModelRecord, APIKeyRecord, APIRequestLog } from '../../types/vorta';
import { formatNumber, generateMaskedApiKey } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

interface ApiPortalViewProps {
  models: AIModelRecord[];
  apiKeys: APIKeyRecord[];
  logs: APIRequestLog[];
  onCreateKey: (key: APIKeyRecord) => void;
  onRevokeKey: (id: string) => void;
  onAddLog: (log: APIRequestLog) => void;
}

export const ApiPortalView: React.FC<ApiPortalViewProps> = ({
  models,
  apiKeys,
  logs,
  onCreateKey,
  onRevokeKey,
  onAddLog,
}) => {
  const [tab, setTab] = useState<'keys' | 'playground' | 'docs'>('keys');
  const [keyName, setKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState('60');
  const [monthlyCap, setMonthlyCap] = useState('2000');
  const [newlyCreatedRawKey, setNewlyCreatedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Playground state
  const [pgModel, setPgModel] = useState('gemini-4-hydrogen');
  const [pgPrompt, setPgPrompt] = useState('سلام کاوی! در دو جمله مزیت Idempotency Key در API را توضیح بده.');
  const [pgIdemKey, setPgIdemKey] = useState(`idem_${Date.now()}`);
  const [pgLoading, setPgLoading] = useState(false);
  const [pgResult, setPgResult] = useState<string | null>(null);
  const [pgError, setPgError] = useState<string | null>(null);

  // Code snippet language
  const [codeLang, setCodeLang] = useState<'curl' | 'js' | 'python'>('curl');

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    const { rawKey, prefix } = generateMaskedApiKey();
    setNewlyCreatedRawKey(rawKey);
    onCreateKey({
      id: `key_${Date.now()}`,
      name: keyName.trim(),
      prefix,
      rateLimitRpm: Number(rateLimit) || 60,
      monthlyCapCredits: Number(monthlyCap) || 2000,
      usedCredits: 0,
      revoked: false,
      createdAt: 'هم‌اکنون',
    });
    setKeyName('');
  };

  const runPlayground = async () => {
    setPgLoading(true);
    setPgError(null);
    setPgResult(null);
    try {
      const res = await fetch('/api/gateway/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': pgIdemKey,
        },
        body: JSON.stringify({ modelId: pgModel, prompt: pgPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPgError(data.error || 'خطای اجرای Playground');
      } else {
        setPgResult(JSON.stringify(data, null, 2));
        onAddLog({
          id: `log_${Date.now()}`,
          endpoint: 'POST /api/gateway/playground',
          modelId: pgModel,
          statusCode: 200,
          latencyMs: data.latencyMs || 450,
          credits: 0.35,
          idempotencyKey: pgIdemKey,
          createdAt: 'هم‌اکنون',
        });
      }
    } catch {
      setPgError('خطا در اتصال به سرور Gateway.');
    } finally {
      setPgLoading(false);
    }
  };

  const snippets = {
    curl: `curl -X POST https://api.kaviai.ir/api/gateway/playground \\
  -H "Authorization: Bearer YOUR_KAVI_API_KEY" \\
  -H "Idempotency-Key: req_123456" \\
  -H "Content-Type: application/json" \\
  -d '{"modelId":"gemini-4-hydrogen","prompt":"سلام کاوی"}'`,
    js: `const res = await fetch('/api/gateway/playground', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_KAVI_API_KEY',
    'Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify({ modelId: 'gemini-4-hydrogen', prompt: 'سلام کاوی' }),
});
const data = await res.json();`,
    python: `import requests, uuid

res = requests.post(
    "https://api.kaviai.ir/api/gateway/playground",
    headers={
        "Authorization": "Bearer YOUR_KAVI_API_KEY",
        "Idempotency-Key": str(uuid.uuid4()),
    },
    json={"modelId": "gemini-4-hydrogen", "prompt": "سلام کاوی"},
)
print(res.json())`,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Kavi API — پورتال توسعه‌دهندگان</h1>
            <StatusText status="functional" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            ساخت کلیدهای API، پشتیبانی Idempotency Key، تست زنده در Playground و مشخصات OpenAPI 3.1.
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#151B2B] self-start">
          {(
            [
              { id: 'keys', label: 'کلیدهای API و لاگ' },
              { id: 'playground', label: 'API Playground زنده' },
              { id: 'docs', label: 'مستندات و OpenAPI' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                tab === t.id ? 'bg-white dark:bg-[#0D1220] font-semibold' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'keys' && (
        <div className="space-y-6">
          {newlyCreatedRawKey && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" />
                <span>این کلید فقط همین یک بار نمایش داده می‌شود و مقدار خام آن در دیتابیس ذخیره نمی‌گردد.</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs" dir="ltr">
                <span className="truncate">{newlyCreatedRawKey}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(newlyCreatedRawKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-white cursor-pointer shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form
              onSubmit={handleCreateKey}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3.5"
            >
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#4F8CFF]" />
                <span>ایجاد API Key جدید</span>
              </h2>
              <div>
                <label htmlFor="api-key-name" className="block text-xs font-medium mb-1">نام کلید</label>
                <input
                  id="api-key-name"
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="مثلاً: اپلیکیشن موبایل"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="api-rpm" className="block text-xs font-medium mb-1">محدودیت RPM</label>
                  <input
                    id="api-rpm"
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="api-cap" className="block text-xs font-medium mb-1">سقف ماهانه (کردیت)</label>
                  <input
                    id="api-cap"
                    type="number"
                    value={monthlyCap}
                    onChange={(e) => setMonthlyCap(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs tabular-nums"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!keyName.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] disabled:opacity-50 cursor-pointer"
              >
                تولید کلید امن
              </button>
            </form>

            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
                  کلیدهای فعال و لغوشده
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold">
                          <KeyRound className="w-3.5 h-3.5 text-[#4F8CFF]" />
                          <span>{k.name}</span>
                          {k.revoked && <span className="text-rose-500">(لغو شده)</span>}
                        </div>
                        <div className="font-mono text-slate-500" dir="ltr">
                          {k.prefix}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 tabular-nums text-slate-500">
                        <span>{k.rateLimitRpm} RPM</span>
                        <span>
                          مصرف: {formatNumber(k.usedCredits)} / {formatNumber(k.monthlyCapCredits)}
                        </span>
                        {!k.revoked && (
                          <button
                            type="button"
                            onClick={() => onRevokeKey(k.id)}
                            className="inline-flex items-center gap-1 text-rose-500 hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>لغو کلید</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
                  لاگ درخواست‌های اخیر
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 dark:bg-[#151B2B] text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">مسیر</th>
                        <th className="px-4 py-2.5">مدل</th>
                        <th className="px-4 py-2.5">وضعیت</th>
                        <th className="px-4 py-2.5">تاخیر</th>
                        <th className="px-4 py-2.5">Idempotency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                      {logs.map((lg) => (
                        <tr key={lg.id}>
                          <td className="px-4 py-2.5 font-mono" dir="ltr">{lg.endpoint}</td>
                          <td className="px-4 py-2.5 font-mono">{lg.modelId}</td>
                          <td className="px-4 py-2.5 text-emerald-500 font-mono">{lg.statusCode}</td>
                          <td className="px-4 py-2.5">{lg.latencyMs}ms</td>
                          <td className="px-4 py-2.5 font-mono text-slate-400">{lg.idempotencyKey}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4">
            <h2 className="font-bold text-sm">ارسال درخواست واقعی به Gateway</h2>
            <div>
              <label htmlFor="pg-model" className="block text-xs font-medium mb-1">مدل</label>
              <select
                id="pg-model"
                value={pgModel}
                onChange={(e) => setPgModel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              >
                {models.filter((m) => m.modalities.includes('text')).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.availability === 'functional' ? 'متصل' : 'دمو'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pg-idem" className="block text-xs font-medium mb-1">Idempotency-Key</label>
              <div className="flex gap-2">
                <input
                  id="pg-idem"
                  type="text"
                  dir="ltr"
                  value={pgIdemKey}
                  onChange={(e) => setPgIdemKey(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setPgIdemKey(`idem_${Date.now()}`)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer"
                >
                  کلید جدید
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="pg-prompt" className="block text-xs font-medium mb-1">Prompt</label>
              <textarea
                id="pg-prompt"
                rows={4}
                value={pgPrompt}
                onChange={(e) => setPgPrompt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] p-3 text-xs"
              />
            </div>
            <button
              type="button"
              disabled={pgLoading}
              onClick={runPlayground}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{pgLoading ? 'در حال ارسال...' : 'اجرای درخواست API'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-5 flex flex-col">
            <div className="text-xs font-mono text-slate-400 mb-3">Gateway Response</div>
            {pgError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs mb-3">
                {pgError}
              </div>
            )}
            <pre dir="ltr" className="flex-1 text-xs font-mono overflow-auto leading-6 text-emerald-300">
              {pgResult || '// خروجی JSON از سرور اینجا نمایش داده می‌شود'}
            </pre>
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base">مستندات اتصال، Webhook و OpenAPI</h2>
              <p className="text-xs text-slate-500 mt-1">
                برای تولید رسانه از درخواست Asynchronous همراه با Job ID و Webhook استفاده کنید.
              </p>
            </div>
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#4F8CFF] text-[#4F8CFF]"
            >
              مشاهده OpenAPI JSON
            </a>
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#151B2B] w-fit">
            {(['curl', 'js', 'python'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setCodeLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                  codeLang === lang ? 'bg-white dark:bg-[#0D1220] font-semibold' : 'text-slate-500'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <pre dir="ltr" className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-6">
            {snippets[codeLang]}
          </pre>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151B2B]">
              <div className="font-bold mb-1">کدهای خطا (Error Codes)</div>
              <p className="text-slate-500 dark:text-slate-400 leading-6">
                400 ورودی نامعتبر · 402 کمبود اعتبار · 429 عبور از Rate Limit · 503 عدم اتصال ارائه‌دهنده.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151B2B]">
              <div className="font-bold mb-1">Job غیرهم‌زمان رسانه</div>
              <p className="text-slate-500 dark:text-slate-400 leading-6">
                درخواست تصویر/ویدیو با کد 202 و شناسه Job برمی‌گردد و نتیجه از طریق Polling یا Webhook ارسال می‌شود.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#151B2B]">
              <div className="font-bold mb-1">Idempotency Key</div>
              <p className="text-slate-500 dark:text-slate-400 leading-6">
                ارسال هدر Idempotency-Key مانع از کسر مجدد اعتبار در Retryهای شبکه می‌شود.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
