import React, { useState } from 'react';
import { Code2, FileCode, GitCompare, Play, Plus, Terminal } from 'lucide-react';
import { StatusText } from '../StatusText';

interface CodeViewProps {
  initialPrompt?: string;
  onConsumeInitialPrompt: () => void;
}

interface DemoFile {
  path: string;
  content: string;
  previousContent: string;
}

const INITIAL_FILES: DemoFile[] = [
  {
    path: 'src/gateway/webhook.ts',
    previousContent: `export function verifySignature(payload: string) {\n  return payload.length > 0;\n}`,
    content: `import crypto from 'node:crypto';\n\nexport function verifyKaviWebhook(payload: string, signature: string, secret: string) {\n  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');\n  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));\n}`,
  },
  {
    path: 'src/sdk/client.ts',
    previousContent: `export const KAVI_URL = '/api/gateway/playground';`,
    content: `export const KAVI_URL = '/api/gateway/playground';\n\nexport async function askKavi(prompt: string, idempotencyKey: string) {\n  const res = await fetch(KAVI_URL, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },\n    body: JSON.stringify({ modelId: 'gemini-4-hydrogen', prompt }),\n  });\n  return res.json();\n}`,
  },
  {
    path: 'README.md',
    previousContent: `# Kavi Project (kaviai.ir)`,
    content: `# Kavi Project (kaviai.ir)\n\nمحیط آزمایشی Kavi Code برای ویرایش، بررسی Diff و آماده‌سازی کد پیش از اتصال Sandbox اجرایی.`,
  },
];

export const CodeView: React.FC<CodeViewProps> = ({
  initialPrompt,
  onConsumeInitialPrompt,
}) => {
  const [files, setFiles] = useState<DemoFile[]>(INITIAL_FILES);
  const [activePath, setActivePath] = useState(INITIAL_FILES[0].path);
  const [showDiff, setShowDiff] = useState(false);
  const [agentInput, setAgentInput] = useState(initialPrompt || '');
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '[Kavi Code Demo] محیط ویرایشگر آماده است. اجرای واقعی Build/Deploy نیازمند اتصال Sandbox کانتینر است.',
  ]);

  React.useEffect(() => {
    if (initialPrompt) {
      setAgentInput(initialPrompt);
      onConsumeInitialPrompt();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  const activeFile = files.find((f) => f.path === activePath) || files[0];

  const handleUpdateContent = (next: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.path === activeFile.path ? { ...f, content: next } : f))
    );
  };

  const handleAddFile = () => {
    const newPath = `src/module_${files.length + 1}.ts`;
    setFiles((prev) => [
      ...prev,
      {
        path: newPath,
        previousContent: '',
        content: `// ${newPath}\nexport const createdBy = 'KAVI Code Demo';\n`,
      },
    ]);
    setActivePath(newPath);
  };

  const handleDemoBuild = () => {
    setTerminalLines((prev) => [
      ...prev,
      `> kavi-sandbox check ${activeFile.path}`,
      `[Demo Notice] بررسی نحوی فایل (${activeFile.content.split('\n').length} خط) بدون اجرای سرور خارجی انجام شد.`,
    ]);
  };

  const handleAskCodeAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;
    setTerminalLines((prev) => [
      ...prev,
      `کاربر: ${agentInput.trim()}`,
      `دستیار کد (دمو): پیشنهاد تغییر برای ${activeFile.path} در ویرایشگر آماده بررسی است.`,
    ]);
    setAgentInput('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Kavi Code — محیط برنامه‌نویسی</h1>
            <StatusText status="demo" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            این بخش در حالت Demo است؛ ویرایش فایل و مشاهده Diff کار می‌کند و ادعای Build یا استقرار واقعی روی سرور ندارد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDiff((d) => !d)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
              showDiff
                ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#4F8CFF]'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{showDiff ? 'بستن Diff' : 'نمایش Diff'}</span>
          </button>
          <button
            type="button"
            onClick={handleDemoBuild}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>تست Build (دمو)</span>
          </button>
        </div>
      </div>

      {/* 3-Pane IDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[520px]">
        {/* File Explorer */}
        <aside className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-3 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold">فایل‌های پروژه</span>
            <button
              type="button"
              onClick={handleAddFile}
              aria-label="افزودن فایل جدید"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#151B2B] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 flex-1" dir="ltr">
            {files.map((f) => (
              <button
                key={f.path}
                type="button"
                onClick={() => setActivePath(f.path)}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-mono cursor-pointer ${
                  f.path === activeFile.path
                    ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B2B]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{f.path}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Code Editor / Diff */}
        <section
          dir="ltr"
          className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 flex flex-col overflow-hidden"
        >
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="inline-flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-[#4F8CFF]" />
              {activeFile.path}
            </span>
            <span className="text-slate-400">{showDiff ? 'Diff Preview' : 'Editor'}</span>
          </div>

          {showDiff ? (
            <div className="p-4 font-mono text-xs space-y-3 overflow-auto flex-1">
              <div className="text-rose-400 bg-rose-500/10 p-2 rounded">
                <div className="text-[10px] uppercase mb-1">Previous</div>
                <pre className="whitespace-pre-wrap">{activeFile.previousContent || '(new file)'}</pre>
              </div>
              <div className="text-emerald-400 bg-emerald-500/10 p-2 rounded">
                <div className="text-[10px] uppercase mb-1">Current</div>
                <pre className="whitespace-pre-wrap">{activeFile.content}</pre>
              </div>
            </div>
          ) : (
            <textarea
              value={activeFile.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              spellCheck={false}
              aria-label="ویرایشگر کد"
              className="flex-1 w-full p-4 bg-transparent font-mono text-xs leading-6 focus:outline-none resize-none"
            />
          )}
        </section>

        {/* AI Agent & Terminal */}
        <aside className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold">
            <Terminal className="w-4 h-4 text-[#875BFF]" />
            <span>دستیار کد و ترمینال (دمو)</span>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-y-auto text-xs bg-slate-50 dark:bg-[#060912]">
            {terminalLines.map((line, i) => (
              <div key={i} className="p-2 rounded-lg bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800 leading-5">
                {line}
              </div>
            ))}
          </div>
          <form onSubmit={handleAskCodeAgent} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              placeholder="دستور به دستیار کد..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#875BFF] cursor-pointer"
            >
              ارسال
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};
