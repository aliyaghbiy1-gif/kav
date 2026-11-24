import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Calendar,
  CandlestickChart,
  CheckCircle2,
  Globe,
  LayoutTemplate,
  SearchCheck,
  Send,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { formatNumber } from '../lib/vortaLogic';

export type KaviAgentDomainId = 'social' | 'web' | 'seo' | 'trading';

interface KaviAgentShowcaseProps {
  onSendToHeroBox: (prompt: string, domain: KaviAgentDomainId) => void;
  onLaunchAgent: (prompt: string, domain: KaviAgentDomainId) => void;
}

const DOMAIN_TABS: Array<{
  id: KaviAgentDomainId;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'social',
    label: 'مدیریت شبکه‌های اجتماعی',
    tagline: 'تقویم محتوا، کپشن، هشتگ و استوری ۹:۱۶ خودکار',
    icon: Share2,
  },
  {
    id: 'web',
    label: 'طراحی سایت',
    tagline: 'وایرفریم، کپی‌رایتینگ فارسی و کد ریسپانسیو',
    icon: LayoutTemplate,
  },
  {
    id: 'seo',
    label: 'مدیریت سئو سایت',
    tagline: 'تحقیق کلمات کلیدی، ممیزی فنی و Schema JSON-LD',
    icon: SearchCheck,
  },
  {
    id: 'trading',
    label: 'دستیار ترید',
    tagline: 'تحلیل پرایس‌اکشن و ماشین‌حساب مدیریت ریسک (دمو)',
    icon: CandlestickChart,
  },
];

const SOCIAL_CALENDAR = [
  {
    day: 'شنبه · ۱۹:۳۰',
    channel: 'اینستاگرام (ریلز ۹:۱۶)',
    topic: '۳ ترفند کاهش هزینه تبلیغات با هوش مصنوعی کاوی',
    status: 'آماده زمان‌بندی',
  },
  {
    day: 'دوشنبه · ۱۱:۰۰',
    channel: 'تلگرام + لینکدین',
    topic: 'گزارش تحلیلی خودکارسازی فروش آنلاین بدون تیم بزرگ',
    status: 'در صف تأیید شما',
  },
  {
    day: 'چهارشنبه · ۲۰:۰۰',
    channel: 'استوری ۳ اسلایدی ۹:۱۶',
    topic: 'رونمایی محصول جدید همراه با قلاب و لینک سفارش',
    status: 'طراحی اسلاید کامل',
  },
];

const WEB_BLUEPRINTS = [
  {
    id: 'saas',
    title: 'لندینگ معرفی محصول و استارتاپ',
    sections: ['Hero با فراخوان اقدام', 'مقایسه مزایا و دموی تعاملی', 'جدول تعرفه ماهانه/سالانه', 'FAQ و ثبت‌نام سریع'],
    metrics: 'امتیاز سرعت هدف: ۹۸ · موبایل ۳۹۰px بدون Overflow',
  },
  {
    id: 'shop',
    title: 'فروشگاه آنلاین مدرن و صفحه محصول',
    sections: ['بنر کلکسیون و دسته‌بندی', 'گالری محصول با فیلتر هوشمند', 'سبد خرید و محاسبه ارسال', 'صفحه پیگیری سفارش'],
    metrics: 'سازگار با RTL فارسی · تم تیره و روشن خودکار',
  },
  {
    id: 'corp',
    title: 'وب‌سایت شرکتی و دریافت لید B2B',
    sections: ['معرفی خدمات و پروژه‌ها', 'پورتال مستندات و مقالات', 'فرم درخواست مشاوره سازمانی', 'نقشه اعتماد مشتریان'],
    metrics: 'ساختار معنایی سئو · آماده اتصال به CMS',
  },
];

const SEO_KEYWORDS = [
  { keyword: 'هوش مصنوعی طراحی سایت فارسی', volume: '۱۲٬۴۰۰', difficulty: '۲۸ / ۱۰۰', intent: 'تراکنشی' },
  { keyword: 'مدیریت خودکار پیج اینستاگرام', volume: '۹٬۸۰۰', difficulty: '۳۴ / ۱۰۰', intent: 'تجاری' },
  { keyword: 'چک‌لیست سئو فنی فروشگاه', volume: '۵٬۲۰۰', difficulty: '۱۹ / ۱۰۰', intent: 'اطلاعاتی' },
];

const TRADING_PAIRS = [
  {
    pair: 'BTC/USDT',
    timeframe: '4H · Demo',
    bias: 'صعودی مشروط بالای حمایت',
    support: '۹۱٬۴۰۰',
    resistance: '۹۶٬۸۰۰',
    rsi: '۵۶.۴',
  },
  {
    pair: 'ETH/USDT',
    timeframe: '4H · Demo',
    bias: 'تثبیت در کانال میان‌مدت',
    support: '۳٬۱۸۰',
    resistance: '۳٬۴۵۰',
    rsi: '۵۲.۱',
  },
  {
    pair: 'XAU / تتر طلا',
    timeframe: 'Daily · Demo',
    bias: 'مومنتوم متعادل · نیاز به تأیید شکست',
    support: '۲٬۶۹۰',
    resistance: '۲٬۷۶۵',
    rsi: '۶۱.۰',
  },
];

export const KaviAgentShowcase: React.FC<KaviAgentShowcaseProps> = ({
  onSendToHeroBox,
  onLaunchAgent,
}) => {
  const [activeDomain, setActiveDomain] = useState<KaviAgentDomainId>('social');
  const [customGoal, setCustomGoal] = useState('');
  const [selectedWebId, setSelectedWebId] = useState(WEB_BLUEPRINTS[0].id);
  const [selectedPairIdx, setSelectedPairIdx] = useState(0);

  // Interactive Trading Position Sizing Calculator State
  const [capitalUsd, setCapitalUsd] = useState('1000');
  const [riskPct, setRiskPct] = useState('1.5');
  const [stopLossPct, setStopLossPct] = useState('2.5');

  const tradingCalc = useMemo(() => {
    const cap = Math.max(0, Number(capitalUsd) || 0);
    const risk = Math.max(0, Number(riskPct) || 0);
    const sl = Math.max(0.1, Number(stopLossPct) || 0.1);
    const maxRiskAmount = Number(((cap * risk) / 100).toFixed(2));
    const positionSize = Number(((maxRiskAmount / (sl / 100))).toFixed(2));
    const target2R = Number((maxRiskAmount * 2.5).toFixed(2));
    return { maxRiskAmount, positionSize, target2R };
  }, [capitalUsd, riskPct, stopLossPct]);

  const activeTabMeta = DOMAIN_TABS.find((t) => t.id === activeDomain) ?? DOMAIN_TABS[0];
  const activeWeb = WEB_BLUEPRINTS.find((b) => b.id === selectedWebId) ?? WEB_BLUEPRINTS[0];
  const activePair = TRADING_PAIRS[selectedPairIdx] ?? TRADING_PAIRS[0];

  const defaultDomainPrompt = useMemo(() => {
    if (activeDomain === 'social') {
      return 'مدیریت شبکه‌های اجتماعی برندم را بر عهده بگیر: تقویم ۷ روزه اینستاگرام و تلگرام، کپشن، هشتگ و ۳ استوری ۹:۱۶ بساز.';
    }
    if (activeDomain === 'web') {
      return `طراحی سایت «${activeWeb.title}» را انجام بده: ساختار صفحات، متن فارسی با شعار مناسب و کد ریسپانسیو تم تیره و روشن بساز.`;
    }
    if (activeDomain === 'seo') {
      return 'مدیریت سئو سایت من را انجام بده: کلمات کلیدی کم‌رقابت، متاتگ‌ها، Schema.org JSON-LD و چک‌لیست خطاهای فنی را آماده کن.';
    }
    return `دستیار ترید کاوی: جفت‌ارز ${activePair.pair} را در تایم ${activePair.timeframe} تحلیل کن؛ با سرمایه ${capitalUsd} و ریسک ${riskPct}٪ و حد ضرر ${stopLossPct}٪ پلن دمو و سطوح کلیدی را بنویس.`;
  }, [activeDomain, activeWeb.title, activePair, capitalUsd, riskPct, stopLossPct]);

  const resolvedPrompt = customGoal.trim() || defaultDomainPrompt;

  return (
    <section
      id="kavi-agents"
      className="scroll-mt-20 py-14 sm:py-16 border-b border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#090E1A]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <p className="text-xs font-semibold text-[#4F8CFF] mb-1.5">
            کارتو به کاوی بسپار · ایجنت‌های خودکار kaviai.ir
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            چهار ایجنت تخصصی که کارها را برای شما انجام می‌دهند
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-6">
            به جای پاسخ‌های متنی پراکنده، هدف خود را به ایجنت کاوی بسپارید تا برنامه بچیند، اجرا کند و پیش از هر اقدام حساس تأیید شما را بگیرد.
          </p>
        </div>

        {/* 4 Domain Selector Tabs */}
        <div
          role="tablist"
          aria-label="ایجنت‌های تخصصی کاوی"
          className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-6"
        >
          {DOMAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeDomain;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveDomain(tab.id)}
                className={`text-right rounded-2xl border p-3.5 sm:p-4 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isActive
                    ? 'border-[#4F8CFF] bg-gradient-to-br from-[#4F8CFF]/12 to-[#875BFF]/10 ring-1 ring-[#4F8CFF]/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1220] hover:border-[#4F8CFF]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-[#4F8CFF] text-white'
                        : 'bg-white dark:bg-[#151B2B] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">AGENT</span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {tab.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {tab.tagline}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive Agent Workbench Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0D1220] p-4 sm:p-6 space-y-5">
          {/* Header Row inside Workbench */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-[#875BFF] shrink-0" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {activeTabMeta.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeTabMeta.tagline}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>دارای دروازه تأیید انسانی قبل از اقدام نهایی (حالت دمو)</span>
            </div>
          </div>

          {/* Tab 1: Social Media Management */}
          {activeDomain === 'social' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#4F8CFF]" />
                  <span>خروجی نمونه تقویم خودکار ایجنت (اینستاگرام · تلگرام · لینکدین)</span>
                </div>
                <div className="space-y-2.5">
                  {SOCIAL_CALENDAR.map((item) => (
                    <div
                      key={item.day}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] font-medium text-[#4F8CFF]">
                          {item.day} · {item.channel}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                          {item.topic}
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] p-4 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    کارهایی که ایجنت شبکه‌های اجتماعی خودکار انجام می‌دهد:
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4F8CFF] shrink-0 mt-0.5" />
                      <span>تولید کپشن فارسی، قلاب ثانیه اول ریلز و هشتگ‌های هدفمند</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4F8CFF] shrink-0 mt-0.5" />
                      <span>ساخت سناریوی ۳ اسلایدی استوری ۹:۱۶ هماهنگ با کاوی استودیو</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4F8CFF] shrink-0 mt-0.5" />
                      <span>توقف در صف انتشار و دریافت تأیید نهایی شما پیش از پست شدن</span>
                    </li>
                  </ul>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  اتصال مستقیم به اینستاگرام/تلگرام پس از احراز هویت امن فعال می‌شود.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Website Design */}
          {activeDomain === 'web' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-2.5">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  انتخاب معماری سایت هدف:
                </div>
                {WEB_BLUEPRINTS.map((bp) => {
                  const selected = bp.id === activeWeb.id;
                  return (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setSelectedWebId(bp.id)}
                      className={`w-full text-right rounded-xl border p-3.5 transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#4F8CFF] bg-[#4F8CFF]/10'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] hover:border-[#4F8CFF]/50'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {bp.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {bp.metrics}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] p-4 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    ساختار وایرفریم تولیدی: {activeWeb.title}
                  </span>
                  <span className="font-mono text-[11px] text-[#4F8CFF]" dir="ltr">
                    React + Tailwind RTL
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeWeb.sections.map((sec, idx) => (
                    <div
                      key={sec}
                      className="rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-[#0D1220] p-3 text-xs flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-md bg-[#4F8CFF]/15 text-[#4F8CFF] font-bold flex items-center justify-center tabular-nums shrink-0">
                        {formatNumber(idx + 1)}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{sec}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-6">
                  ایجنت طراحی سایت کاوی هم‌زمان چیدمان دسکتاپ و موبایل، کنتراست تم روشن و تیره و متن‌های متقاعدکننده فارسی را آماده تحویل می‌کند.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: SEO Management */}
          {activeDomain === 'seo' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-between">
                  <span>فرصت‌های کلمات کلیدی پیشنهادی کاوی (دمو)</span>
                  <span className="text-[#4F8CFF] font-mono" dir="ltr">SERP Analysis</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 dark:bg-[#0D1220] text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">عبارت جستجو</th>
                        <th className="px-4 py-2.5 font-semibold">جستجوی ماهانه</th>
                        <th className="px-4 py-2.5 font-semibold">سختی رقابت</th>
                        <th className="px-4 py-2.5 font-semibold">نیت کاربر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {SEO_KEYWORDS.map((row) => (
                        <tr key={row.keyword}>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {row.keyword}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-300">
                            {row.volume}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-emerald-600 dark:text-emerald-400">
                            {row.difficulty}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{row.intent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] p-4 space-y-3">
                <div className="text-xs font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <Globe className="w-3.5 h-3.5 text-[#4F8CFF]" />
                  <span>چک‌لیست خودکار ایجنت سئو سایت</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>ممیزی کامل Title، Meta Description، Canonical و تگ‌های H1-H3</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>تولید اسکیما JSON-LD برای مقالات، محصولات و FAQ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>پیشنهاد نقشه لینک‌سازی داخلی و بهبود نرخ کلیک (CTR)</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 4: Trading Assistant */}
          {activeDomain === 'trading' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Watchlist & Analysis Preview */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {TRADING_PAIRS.map((item, idx) => (
                    <button
                      key={item.pair}
                      type="button"
                      onClick={() => setSelectedPairIdx(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        idx === selectedPairIdx
                          ? 'border-[#4F8CFF] bg-[#4F8CFF]/15 text-[#4F8CFF]'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span dir="ltr">{item.pair}</span>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" dir="ltr">{activePair.pair}</span>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      {activePair.timeframe}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-200">
                    وضعیت روند: <span className="font-semibold text-[#4F8CFF]">{activePair.bias}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs tabular-nums">
                    <div>
                      <span className="text-[11px] text-slate-500 block">حمایت کلیدی</span>
                      <span className="font-bold text-emerald-500" dir="ltr">{activePair.support}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">مقاومت کلیدی</span>
                      <span className="font-bold text-rose-500" dir="ltr">{activePair.resistance}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">شاخص RSI</span>
                      <span className="font-bold" dir="ltr">{activePair.rsi}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Risk & Position Sizing Calculator */}
              <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] p-4 space-y-3.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  ماشین‌حساب زنده حجم معامله و مدیریت ریسک
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label htmlFor="kavi-trade-cap" className="block text-[11px] text-slate-500 mb-1">
                      سرمایه (تتر)
                    </label>
                    <input
                      id="kavi-trade-cap"
                      type="number"
                      min="10"
                      value={capitalUsd}
                      onChange={(e) => setCapitalUsd(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0D1220] px-2.5 py-1.5 text-xs font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="kavi-trade-risk" className="block text-[11px] text-slate-500 mb-1">
                      ریسک مجاز (٪)
                    </label>
                    <input
                      id="kavi-trade-risk"
                      type="number"
                      step="0.25"
                      min="0.1"
                      max="10"
                      value={riskPct}
                      onChange={(e) => setRiskPct(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0D1220] px-2.5 py-1.5 text-xs font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="kavi-trade-sl" className="block text-[11px] text-slate-500 mb-1">
                      حد ضرر (٪)
                    </label>
                    <input
                      id="kavi-trade-sl"
                      type="number"
                      step="0.25"
                      min="0.2"
                      max="50"
                      value={stopLossPct}
                      onChange={(e) => setStopLossPct(e.target.value)}
                      dir="ltr"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0D1220] px-2.5 py-1.5 text-xs font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 dark:bg-[#0D1220] p-3 text-xs tabular-nums border border-slate-200/70 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-500 block">حداکثر ریسک</span>
                    <span className="font-bold text-amber-500" dir="ltr">${tradingCalc.maxRiskAmount}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">حجم پوزیشن</span>
                    <span className="font-bold text-[#4F8CFF]" dir="ltr">${tradingCalc.positionSize}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">سود هدف (2.5R)</span>
                    <span className="font-bold text-emerald-500" dir="ltr">+${tradingCalc.target2R}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
                  دستیار ترید صرفاً تحلیل آموزشی و محاسبه ریسک در حالت دمو ارائه می‌دهد و هیچ سفارش صرافی بدون تأیید صریح شما ثبت نمی‌شود.
                </p>
              </div>
            </div>
          )}

          {/* Action Bar: Send custom instruction to Hero Box or Launch Agent */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onLaunchAgent(resolvedPrompt, activeDomain);
            }}
            className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <input
              type="text"
              aria-label="هدف سفارشی برای این ایجنت کاوی"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="موضوع یا لینک پروژه خودت را بنویس (مثلاً آدرس سایت، موضوع پیج یا جفت‌ارز)..."
              className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F8CFF]"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSendToHeroBox(resolvedPrompt, activeDomain)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#4F8CFF]/60 hover:text-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap"
              >
                ارسال به باکس بالا
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] text-xs font-semibold text-white hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>سپردن به کاوی</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
