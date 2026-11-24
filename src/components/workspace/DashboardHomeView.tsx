import React, { useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CandlestickChart,
  Code2,
  FolderKanban,
  Image as ImageIcon,
  LayoutTemplate,
  MessageSquare,
  SearchCheck,
  Send,
  Share2,
  Workflow,
} from 'lucide-react';
import type {
  AgentDefinition,
  Conversation,
  UserProfile,
  WalletState,
  WorkspaceProject,
  WorkspaceSection,
} from '../../types/vorta';
import { formatNumber, formatToman, getTotalCredits, routePromptIntent } from '../../lib/vortaLogic';

interface DashboardHomeViewProps {
  user: UserProfile;
  projects: WorkspaceProject[];
  conversations: Conversation[];
  agents: AgentDefinition[];
  wallet: WalletState;
  onNavigate: (section: WorkspaceSection) => void;
  onLaunchPrompt: (prompt: string, target: WorkspaceSection) => void;
}

const KAVI_SPECIALIST_LAUNCHERS: Array<{
  id: string;
  title: string;
  desc: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'social',
    title: 'مدیریت شبکه‌های اجتماعی',
    desc: 'زمان‌بندی پست، پیش‌نویس کپشن و آنالیتیکس اینستاگرام و توییتر',
    prompt: 'یک پست معرفی قابلیت جدید کاوی برای اینستاگرام و توییتر با کپشن و هشتگ آماده کن.',
    icon: Share2,
  },
  {
    id: 'web',
    title: 'طراحی سایت هوشمند',
    desc: 'وایرفریم، طراحی صفحه فرود و کد ریسپانسیو',
    prompt: 'ساختار کامل و طراحی ریسپانسیو یک سایت معرفی محصول به زبان فارسی با جدول تعرفه و فرم تماس بساز.',
    icon: LayoutTemplate,
  },
  {
    id: 'seo',
    title: 'مدیریت سئو سایت',
    desc: 'تحقیق کلمات کلیدی، ممیزی فنی و Schema',
    prompt: 'صفحات سایت من را برای سئو ممیزی کن، کلمات کلیدی پربازده بیاب و متاتگ و Schema JSON-LD بساز.',
    icon: SearchCheck,
  },
  {
    id: 'trading',
    title: 'دستیار هوشمند ترید',
    desc: 'تحلیل پرایس‌اکشن، سطوح کلیدی و مدیریت ریسک',
    prompt: 'روند BTC/USDT را در تایم ۴ ساعته بررسی کن و حجم معامله را با ریسک ۱٪ و نسبت R:R محاسبه کن (حالت دمو).',
    icon: CandlestickChart,
  },
];

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  user,
  projects,
  conversations,
  agents,
  wallet,
  onNavigate,
  onLaunchPrompt,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');

  const totalCredits = getTotalCredits(wallet);
  const usedCreditsThisMonth = wallet.ledger
    .filter((l) => l.type === 'usage')
    .reduce((acc, l) => acc + Math.abs(l.amountCredits), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickPrompt.trim();
    if (!trimmed) return;
    const target = routePromptIntent(trimmed);
    setQuickPrompt('');
    onLaunchPrompt(trimmed, target);
  };

  const quickTools: Array<{ id: WorkspaceSection; title: string; sub: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'social', title: 'شبکه‌های اجتماعی', sub: 'تقویم، کپشن و آنالیتیکس', icon: Share2 },
    { id: 'agents', title: 'ایجنت‌های کاوی', sub: 'اجرای خودکار کارها', icon: Bot },
    { id: 'chat', title: 'چت هوشمند', sub: 'استریم زنده مدل‌ها', icon: MessageSquare },
    { id: 'studio', title: 'استودیو رسانه', sub: 'تصویر، ویدیو و استوری', icon: ImageIcon },
    { id: 'automations', title: 'اتوماسیون‌ها', sub: 'اجرای زمان‌بندی‌شده', icon: Workflow },
    { id: 'code', title: 'محیط کدنویسی', sub: 'ویرایشگر و Diff', icon: Code2 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Greeting & Main Composer */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-xs font-semibold text-[#4F8CFF] mb-1">
              کاوی (kaviai.ir) · کارتو به کاوی بسپار
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              سلام، {user.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              هدف خود را بنویسید تا ایجنت مناسب کاوی آن را مرحله‌به‌مرحله پیش ببرد.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">موجودی کل</span>
              <span className="font-bold text-sm text-[#4F8CFF] tabular-nums">
                {formatNumber(totalCredits)} کردیت
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">مصرف ثبت‌شده</span>
              <span className="font-bold text-sm tabular-nums">
                {formatNumber(usedCreditsThisMonth)} کردیت ({formatToman(Math.round(usedCreditsThisMonth * wallet.tomanPerCredit))})
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="workspace-home-prompt" className="sr-only">
            درخواست جدید
          </label>
          <input
            id="workspace-home-prompt"
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="چه کاری را به کاوی می‌سپاری؟ (مثلاً: تقویم اینستاگرام بساز، سئو سایت را چک کن، یا تحلیل ترید بده)..."
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>سپردن به کاوی</span>
          </button>
        </form>
      </section>

      {/* 4 Core Autonomous Agents Launcher */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            ایجنت‌های تخصصی کاوی (اجرای خودکار با تأیید شما)
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('agents')}
            className="text-xs text-[#4F8CFF] hover:underline cursor-pointer"
          >
            مدیریت همه ایجنت‌ها
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {KAVI_SPECIALIST_LAUNCHERS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  item.id === 'social'
                    ? onNavigate('social')
                    : onLaunchPrompt(item.prompt, 'agents')
                }
                className="text-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-4 hover:border-[#875BFF]/60 transition-colors cursor-pointer flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</div>
                  <Icon className="w-4 h-4 text-[#875BFF] shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-5">{item.desc}</p>
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F8CFF]">
                  <span>سپردن کار به ایجنت</span>
                  <ArrowLeft className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Frequently Used Tools */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
          ابزارهای فضای کاری
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onNavigate(tool.id)}
                className="text-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-4 hover:border-[#4F8CFF]/50 transition-colors cursor-pointer space-y-2"
              >
                <Icon className="w-5 h-5 text-[#4F8CFF]" />
                <div className="font-semibold text-xs sm:text-sm">{tool.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{tool.sub}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Projects & Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#4F8CFF]" />
              <span>پروژه‌های اخیر و گفتگوها</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs text-[#4F8CFF] hover:underline cursor-pointer"
            >
              مدیریت پروژه‌ها
            </button>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {projects.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{p.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('chat')}
                  className="inline-flex items-center gap-1 text-xs text-[#4F8CFF] hover:underline whitespace-nowrap cursor-pointer"
                >
                  <span>باز کردن</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {conversations.slice(0, 2).map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium">{c.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    گفتگو · {c.updatedAt}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('chat')}
                  className="text-xs text-slate-500 hover:text-[#4F8CFF] cursor-pointer"
                >
                  ادامه
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#875BFF]" />
              <span>فعالیت ایجنت‌های هوشمند</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('agents')}
              className="text-xs text-[#4F8CFF] hover:underline cursor-pointer"
            >
              همه ایجنت‌ها
            </button>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {agents.map((ag) => {
              const latestRun = ag.runs[0];
              return (
                <div
                  key={ag.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold">{ag.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {latestRun?.status === 'awaiting_approval'
                        ? 'نیازمند تأیید صریح شما برای ادامه'
                        : latestRun
                        ? `آخرین اجرا: ${latestRun.startedAt}`
                        : 'آماده اجرا'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('agents')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-[#151B2B] border border-slate-200 dark:border-slate-700 hover:border-[#4F8CFF] cursor-pointer whitespace-nowrap"
                  >
                    بررسی
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
