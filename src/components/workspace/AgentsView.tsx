import React, { useState } from 'react';
import {
  Bot,
  CandlestickChart,
  CheckCircle2,
  Globe,
  LayoutTemplate,
  Pause,
  Play,
  Plus,
  RefreshCw,
  SearchCheck,
  Share2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { AIModelRecord, AgentDefinition, AgentRun } from '../../types/vorta';
import { formatNumber } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

const AGENT_SPECIALIST_TEMPLATES: Array<{
  id: string;
  label: string;
  name: string;
  goal: string;
  urls: string;
  tools: string[];
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'social',
    label: 'مدیریت شبکه‌های اجتماعی',
    name: 'ایجنت شبکه‌های اجتماعی برند',
    goal: 'تقویم محتوای ۷ روزه اینستاگرام و تلگرام بساز، کپشن و هشتگ بنویس و اسلایدهای استوری ۹:۱۶ را آماده کن.',
    urls: 'https://kaviai.ir/brand-kit\n@instagram_page',
    tools: ['تقویم محتوای چندکاناله', 'تولید استوری ۹:۱۶', 'کپشن‌نویس هوشمند'],
    icon: Share2,
  },
  {
    id: 'web',
    label: 'طراحی سایت',
    name: 'ایجنت طراحی سایت و لندینگ',
    goal: 'وایرفریم، طراحی ریسپانسیو صفحه فرود، متن فروش فارسی و کد React/Tailwind آماده تحویل بساز.',
    urls: 'https://kaviai.ir/design-system',
    tools: ['وایرفریم‌ساز هوشمند', 'تولید کد React/Tailwind', 'تست موبایل و دسکتاپ'],
    icon: LayoutTemplate,
  },
  {
    id: 'seo',
    label: 'مدیریت سئو سایت',
    name: 'ایجنت سئو و بهینه‌سازی گوگل',
    goal: 'سایت را ممیزی فنی کن، کلمات کلیدی کم‌رقابت بیاب و متاتگ‌ها و Schema JSON-LD صفحات را اصلاح کن.',
    urls: 'https://kaviai.ir/sitemap.xml',
    tools: ['ممیزی فنی سئو', 'تحقیق کلمات کلیدی', 'تولید Schema JSON-LD'],
    icon: SearchCheck,
  },
  {
    id: 'trading',
    label: 'دستیار ترید',
    name: 'دستیار تحلیل و مدیریت ریسک ترید',
    goal: 'جفت‌ارزهای BTC/USDT و ETH/USDT را در تایم ۴ ساعته تحلیل کن و حجم معامله را با ریسک ۱٪ محاسبه کن (حالت دمو).',
    urls: 'BTC/USDT (4H)\nETH/USDT (4H)',
    tools: ['تحلیل پرایس‌اکشن (دمو)', 'ماشین‌حساب حجم و ریسک', 'هشدار سطوح کلیدی'],
    icon: CandlestickChart,
  },
];

interface AgentsViewProps {
  agents: AgentDefinition[];
  models: AIModelRecord[];
  initialPrompt?: string;
  onConsumeInitialPrompt: () => void;
  onCreateAgent: (agent: AgentDefinition) => void;
  onUpdateAgent: (id: string, updater: (prev: AgentDefinition) => AgentDefinition) => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  models,
  initialPrompt,
  onConsumeInitialPrompt,
  onCreateAgent,
  onUpdateAgent,
}) => {
  const [selectedId, setSelectedId] = useState(agents[0]?.id || '');
  const [showCreate, setShowCreate] = useState(Boolean(initialPrompt));
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(initialPrompt || '');
  const [instructions, setInstructions] = useState('');
  const [modelId, setModelId] = useState('gemini-4-hydrogen');
  const [maxCost, setMaxCost] = useState('150');
  const [requireApproval, setRequireApproval] = useState(true);
  const [urlsText, setUrlsText] = useState('https://example-shop.ir/pricing');

  React.useEffect(() => {
    if (initialPrompt) {
      setGoal(initialPrompt);
      setShowCreate(true);
      onConsumeInitialPrompt();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  const activeAgent = agents.find((a) => a.id === selectedId) || agents[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !goal.trim()) return;
    const newAgent: AgentDefinition = {
      id: `agent_${Date.now()}`,
      name: name.trim(),
      goal: goal.trim(),
      instructions: instructions.trim() || goal.trim(),
      modelId,
      allowedTools: ['مرورگر ایزوله (Sandbox)', 'تحلیل ساختاریافته'],
      dataSources: urlsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      maxCostCredits: Number(maxCost) || 100,
      requireApproval,
      runs: [],
    };
    onCreateAgent(newAgent);
    setSelectedId(newAgent.id);
    setShowCreate(false);
    setName('');
    setGoal('');
    setInstructions('');
  };

  const triggerNewRun = (agent: AgentDefinition) => {
    const newRun: AgentRun = {
      id: `run_${Date.now()}`,
      agentId: agent.id,
      status: agent.requireApproval ? 'awaiting_approval' : 'completed',
      startedAt: 'هم‌اکنون',
      costCredits: 12.4,
      sandboxUrl: agent.dataSources[0] || 'https://isolated-sandbox.kaviai.ir',
      pendingApprovalAction: agent.requireApproval
        ? 'ارسال گزارش نهایی به کانال اطلاع‌رسانی و ذخیره در سیستم خارجی (عملیات حساس)'
        : undefined,
      finalReport: agent.requireApproval
        ? undefined
        : 'اجرای آزمایشی ایجنت در Sandbox با موفقیت کامل شد.',
      steps: [
        {
          id: `st_${Date.now()}_1`,
          index: 1,
          title: 'ساخت نشست مرورگر ایزوله',
          detail: 'کانتینر Sandbox بدون اشتراک کوکی با سایر کاربران راه‌اندازی شد.',
          status: 'done',
          timestamp: 'هم‌اکنون',
        },
        {
          id: `st_${Date.now()}_2`,
          index: 2,
          title: agent.requireApproval ? 'درخواست تأیید صریح کاربر' : 'تکمیل گزارش نهایی',
          detail: agent.requireApproval
            ? 'پیش از انجام اقدام خارجی، منتظر تأیید شماست.'
            : 'خروجی گزارش آماده بررسی است.',
          status: agent.requireApproval ? 'awaiting_approval' : 'done',
          timestamp: 'هم‌اکنون',
        },
      ],
    };

    onUpdateAgent(agent.id, (prev) => ({
      ...prev,
      runs: [newRun, ...prev.runs],
    }));
  };

  const updateRunStatus = (
    agentId: string,
    runId: string,
    nextStatus: AgentRun['status'],
    report?: string
  ) => {
    onUpdateAgent(agentId, (prev) => ({
      ...prev,
      runs: prev.runs.map((r) =>
        r.id === runId
          ? {
              ...r,
              status: nextStatus,
              pendingApprovalAction:
                nextStatus === 'completed' || nextStatus === 'cancelled'
                  ? undefined
                  : r.pendingApprovalAction,
              finalReport: report ?? r.finalReport,
              steps: r.steps.map((s) =>
                s.status === 'awaiting_approval'
                  ? {
                      ...s,
                      status: nextStatus === 'cancelled' ? 'pending' : 'done',
                    }
                  : s
              ),
            }
          : r
      ),
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Kavi Agents — ایجنت‌های خودکار کاوی</h1>
            <StatusText status="demo" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            کارتو به کاوی بسپار: اجرای ایزوله برای شبکه‌های اجتماعی، طراحی سایت، سئو و دستیار ترید با سقف هزینه و تأیید صریح شما.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#875BFF] hover:bg-[#7548f0] transition-colors cursor-pointer self-start whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>ساخت ایجنت جدید</span>
        </button>
      </div>

      {/* Quick Specialist Templates */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {AGENT_SPECIALIST_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                setName(tpl.name);
                setGoal(tpl.goal);
                setUrlsText(tpl.urls);
                setShowCreate(true);
              }}
              className="text-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] px-3.5 py-3 hover:border-[#875BFF]/60 transition-colors cursor-pointer flex items-center justify-between gap-2"
            >
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                الگوی {tpl.label}
              </span>
              <Icon className="w-4 h-4 text-[#875BFF] shrink-0" />
            </button>
          );
        })}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-[#875BFF]/40 bg-white dark:bg-[#0D1220] p-5 sm:p-6 space-y-4"
        >
          <h2 className="font-bold text-base">تعریف ایجنت جدید کاوی</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ag-name" className="block text-xs font-semibold mb-1.5">
                نام ایجنت
              </label>
              <input
                id="ag-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: تحلیلگر هفتگی بازار"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="ag-model" className="block text-xs font-semibold mb-1.5">
                مدل هوش مصنوعی
              </label>
              <select
                id="ag-model"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              >
                {models.filter((m) => m.modalities.includes('text')).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ag-goal" className="block text-xs font-semibold mb-1.5">
              هدف ایجنت به زبان فارسی
            </label>
            <input
              id="ag-goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="هر روز سایت‌های مشخص‌شده را بررسی کن و تغییر قیمت‌ها را گزارش بده."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ag-urls" className="block text-xs font-semibold mb-1.5">
                منابع داده و URLها
              </label>
              <textarea
                id="ag-urls"
                rows={2}
                dir="ltr"
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] p-2.5 text-xs font-mono"
              />
            </div>
            <div>
              <label htmlFor="ag-cap" className="block text-xs font-semibold mb-1.5">
                سقف هزینه هر اجرا (کردیت)
              </label>
              <input
                id="ag-cap"
                type="number"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs tabular-nums"
              />
              <label className="mt-3 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                />
                <span>دریافت تأیید صریح کاربر پیش از عملیات حساس خارجی</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#875BFF] cursor-pointer"
            >
              ذخیره ایجنت
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <div className="space-y-3">
          {agents.map((ag) => (
            <button
              key={ag.id}
              type="button"
              onClick={() => setSelectedId(ag.id)}
              className={`w-full text-right rounded-2xl border p-4 transition-colors cursor-pointer space-y-1.5 ${
                ag.id === activeAgent?.id
                  ? 'border-[#875BFF] bg-[#875BFF]/5'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{ag.name}</span>
                <Bot className="w-4 h-4 text-[#875BFF]" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{ag.goal}</p>
              <div className="text-[11px] text-slate-400 tabular-nums">
                سقف هزینه: {formatNumber(ag.maxCostCredits)} کردیت · {ag.runs.length} اجرا
              </div>
            </button>
          ))}
        </div>

        {/* Agent Runs & Sandbox Monitor */}
        {activeAgent && (
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold">{activeAgent.name}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ابزارهای مجاز: {activeAgent.allowedTools.join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => triggerNewRun(activeAgent)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>اجرای دستی Task Run</span>
              </button>
            </div>

            {activeAgent.runs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                هنوز اجرایی برای این ایجنت ثبت نشده است. برای شروع دکمه «اجرای دستی Task Run» را بزنید.
              </div>
            ) : (
              activeAgent.runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-semibold">
                      شناسه اجرا: <span className="font-mono">{run.id}</span> · {run.startedAt}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-slate-500">
                        مصرف: {formatNumber(run.costCredits)} کردیت
                      </span>
                      {run.status === 'running' && (
                        <button
                          type="button"
                          onClick={() => updateRunStatus(activeAgent.id, run.id, 'paused')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                        >
                          <Pause className="w-3 h-3" />
                          <span>توقف</span>
                        </button>
                      )}
                      {run.status === 'paused' && (
                        <button
                          type="button"
                          onClick={() => updateRunStatus(activeAgent.id, run.id, 'running')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#4F8CFF] text-[#4F8CFF] cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>ادامه</span>
                        </button>
                      )}
                      {run.status !== 'completed' && run.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => updateRunStatus(activeAgent.id, run.id, 'cancelled')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-rose-500/40 text-rose-500 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>لغو</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Isolated Browser Sandbox Monitor */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#4F8CFF]" />
                        <span>نمایشگر Browser Sandbox ایزوله (حالت دمو)</span>
                      </span>
                      <span dir="ltr" className="font-mono truncate max-w-[220px]">
                        {run.sandboxUrl}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-6">
                      نشست مجزا بدون اشتراک کوکی یا اطلاعات ورود بین کاربران. در صورت نیاز به لاگین در سایت مقصد، نشست امن اختصاصی برای خود شما باز می‌شود.
                    </div>
                  </div>

                  {/* Explicit Human Approval Gate */}
                  {run.status === 'awaiting_approval' && run.pendingApprovalAction && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                      <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 font-semibold">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>درخواست تأیید صریح پیش از عملیات حساس: {run.pendingApprovalAction}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateRunStatus(
                              activeAgent.id,
                              run.id,
                              'completed',
                              'تأیید کاربر دریافت شد و گزارش نهایی در نشست دمو ثبت گردید.'
                            )
                          }
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          تأیید و ادامه اجرا
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRunStatus(activeAgent.id, run.id, 'cancelled')}
                          className="px-3.5 py-1.5 rounded-lg text-xs border border-rose-500/40 text-rose-500 cursor-pointer"
                        >
                          لغو عملیات
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  <div className="space-y-2">
                    {run.steps.map((st) => (
                      <div key={st.id} className="flex items-start gap-2.5 text-xs">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            st.status === 'done' ? 'text-emerald-500' : 'text-amber-500'
                          }`}
                        />
                        <div>
                          <div className="font-semibold">
                            {st.index}. {st.title} <span className="text-slate-400 font-normal">({st.timestamp})</span>
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">{st.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {run.finalReport && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-6">
                      <span className="font-bold">گزارش نهایی: </span>
                      {run.finalReport}
                    </div>
                  )}

                  {run.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => updateRunStatus(activeAgent.id, run.id, 'running')}
                      className="inline-flex items-center gap-1 text-xs text-[#4F8CFF] cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>اجرای مجدد</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
