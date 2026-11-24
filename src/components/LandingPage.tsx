import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpLeft,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Cpu,
  Image as ImageIcon,
  Instagram,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Paperclip,
  Play,
  Send,
  Shield,
  Sparkles,
  Sun,
  Terminal,
  Twitter,
  Video,
  Volume2,
  Wand2,
  Workflow,
  X,
} from 'lucide-react';
import type {
  AIModelRecord,
  MediaAsset,
  PricingPlan,
  ThemeMode,
  WorkspaceSection,
} from '../types/vorta';
import { calculatePlanPrice, formatNumber, formatToman } from '../lib/vortaLogic';
import type { BillingCycle } from '../lib/vortaLogic';
import {
  FAQ_ITEMS,
  SOLUTION_PAGES,
  VORTA_IMAGE_SHOWCASE,
  VORTA_STORY_SEQUENCES,
  VORTA_VIDEO_SHOWCASE,
} from '../data/seedData';
import type {
  ShowcaseImageCategory,
  ShowcaseVideoCategory,
  ShowcaseVideoItem,
} from '../data/seedData';
import { VortaLogo } from './VortaLogo';
import { ParticleNetwork } from './ParticleNetwork';
import { StatusText } from './StatusText';
import { KaviAgentShowcase } from './KaviAgentShowcase';

interface LandingPageProps {
  models: AIModelRecord[];
  assets: MediaAsset[];
  plans: PricingPlan[];
  theme: ThemeMode;
  isAuthenticated: boolean;
  onToggleTheme: () => void;
  onStartAuth: (mode: 'login' | 'register', prompt?: string, quickAction?: string) => void;
  onEnterWorkspace: (section?: WorkspaceSection, prompt?: string, quickAction?: string) => void;
  onOpenPublicPage: (page: 'blog' | 'docs' | 'legal' | 'solutions', slug?: string) => void;
}

type ComposerModeId = 'agent' | 'content' | 'code' | 'research' | 'general';
type ContentSubTabId = 'image' | 'video' | 'story' | 'audio';

const HERO_MODES: Array<{
  id: ComposerModeId;
  label: string;
  placeholder: string;
  sample: string;
  submitLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'agent',
    label: 'ایجنت خودکار کاوی',
    placeholder: 'کارتو به کاوی بسپار... (مثلاً: تقویم اینستاگرام بساز، سایت طراحی کن، سئو را بررسی کن یا تحلیل ترید بده)',
    sample: 'مدیریت شبکه‌های اجتماعی برندم را بر عهده بگیر: تقویم ۷ روزه اینستاگرام، کپشن و ۳ استوری ۹:۱۶ بساز.',
    submitLabel: 'سپردن به کاوی',
    icon: Bot,
  },
  {
    id: 'content',
    label: 'تولید محتوا',
    placeholder: 'چه اثری بسازم؟ صحنه، سبک، نور یا حس اثر را توصیف کن...',
    sample: 'یک پوستر مینیمال تبلیغاتی برای محصول فناوری با نورپردازی آبی و بنفش بساز',
    submitLabel: 'ساخت',
    icon: Wand2,
  },
  {
    id: 'code',
    label: 'طراحی سایت و کد',
    placeholder: 'چه وب‌سایت یا کدی طراحی کنیم؟ ساختار صفحه، امکانات یا باگ را بنویس...',
    sample: 'یک صفحه فرود ریسپانسیو فارسی برای معرفی محصول با جدول تعرفه و فرم ثبت‌نام طراحی کن',
    submitLabel: 'طراحی و اجرا',
    icon: Code2,
  },
  {
    id: 'research',
    label: 'سئو و تحلیل بازار',
    placeholder: 'آدرس سایت یا جفت‌ارز مورد نظرت را برای سئو یا تحلیل ترید بنویس...',
    sample: 'ممیزی فنی سئو و کلمات کلیدی کم‌رقابت سایت فروشگاهیم را آماده کن و متاتگ‌های جدید بده',
    submitLabel: 'تحلیل و اجرا',
    icon: Cpu,
  },
  {
    id: 'general',
    label: 'گفتگوی آزاد',
    placeholder: 'هر ایده، برنامه یا پرسشی داری بنویس تا کاوی سریع و ساختاریافته پاسخ دهد...',
    sample: 'یک نقشه راه اجرایی ۹۰ روزه برای راه‌اندازی کسب‌وکار هوش مصنوعی در ایران بنویس',
    submitLabel: 'ارسال',
    icon: MessageSquare,
  },
];

const CONTENT_SUBTABS: Array<{
  id: ContentSubTabId;
  label: string;
  placeholder: string;
  sample: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'image',
    label: 'تصویر',
    placeholder: 'چه عکسی بسازم؟ صحنه، سبک، نور و جزئیات را توصیف کن...',
    sample: 'یک پوستر مینیمال تبلیغاتی برای محصول فناوری با نورپردازی آبی و بنفش بساز',
    icon: ImageIcon,
  },
  {
    id: 'video',
    label: 'ویدیو',
    placeholder: 'چه ویدیویی بسازم؟ حرکت دوربین، فضا و حس صحنه را بنویس...',
    sample: 'تیزر ۶ ثانیه‌ای از معماری مدرن شیشه‌ای در مه صبحگاهی با حرکت آرام دوربین بساز',
    icon: Video,
  },
  {
    id: 'story',
    label: 'استوری',
    placeholder: 'موضوع استوری چنداسلایدی ۹:۱۶ خودت را بنویس (هدف، محصول و CTA)...',
    sample: 'یک استوری ۳ اسلایدی ۹:۱۶ برای معرفی قهوه تخصصی اوبسیدین با تیتر قلاب تا لینک سفارش بساز',
    icon: Layers,
  },
  {
    id: 'audio',
    label: 'صوت',
    placeholder: 'متن گفتار یا فضای موسیقی و افکت صوتی مورد نظرت را بنویس...',
    sample: 'یک موسیقی پس‌زمینه الکترونیک آرام برای ویدیوی معرفی محصول فناوری بساز',
    icon: Volume2,
  },
];

const VIDEO_SHOWCASE_CATEGORIES: Array<{ id: ShowcaseVideoCategory; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'cinema', label: 'سینمایی' },
  { id: 'product', label: 'محصول و تبلیغات' },
  { id: 'nature', label: 'طبیعت و فضا' },
  { id: 'architecture', label: 'معماری و شهری' },
];

const IMAGE_SHOWCASE_CATEGORIES: Array<{ id: ShowcaseImageCategory; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'product', label: 'عکاسی محصول' },
  { id: 'architecture', label: 'معماری و فضا' },
  { id: 'portrait', label: 'پرتره استودیویی' },
  { id: 'abstract', label: 'انتزاعی و برند' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  models,
  assets,
  plans,
  theme,
  isAuthenticated,
  onToggleTheme,
  onStartAuth,
  onEnterWorkspace,
  onOpenPublicPage,
}) => {
  const [composerText, setComposerText] = useState('');
  const [composerMode, setComposerMode] = useState<ComposerModeId>('agent');
  const [contentSubTab, setContentSubTab] = useState<ContentSubTabId>('image');
  const [agentAssistEnabled, setAgentAssistEnabled] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id ?? 'gemini-4-hydrogen');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'chat' | 'studio' | 'agents' | 'automations'>('chat');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [videoShowcaseCategory, setVideoShowcaseCategory] = useState<ShowcaseVideoCategory>('all');
  const [selectedShowcaseVideoId, setSelectedShowcaseVideoId] = useState<string | null>(null);
  const [activePreviewVideo, setActivePreviewVideo] = useState<ShowcaseVideoItem | null>(null);

  const [imageShowcaseCategory, setImageShowcaseCategory] = useState<ShowcaseImageCategory>('all');
  const [selectedShowcaseImageId, setSelectedShowcaseImageId] = useState<string>(
    VORTA_IMAGE_SHOWCASE[0].id
  );
  const [customImagePrompt, setCustomImagePrompt] = useState('');

  const [selectedStorySeqId, setSelectedStorySeqId] = useState<string>(VORTA_STORY_SEQUENCES[0].id);
  const [selectedStorySlideIdx, setSelectedStorySlideIdx] = useState<number>(0);
  const [customStoryTopic, setCustomStoryTopic] = useState('');

  const [footerNewsletterEmail, setFooterNewsletterEmail] = useState('');
  const [footerNewsletterStatus, setFooterNewsletterStatus] = useState<'idle' | 'error' | 'subscribed'>('idle');
  const [copiedFooterEmail, setCopiedFooterEmail] = useState(false);

  const filteredShowcaseVideos = useMemo(
    () =>
      videoShowcaseCategory === 'all'
        ? VORTA_VIDEO_SHOWCASE
        : VORTA_VIDEO_SHOWCASE.filter((vid) => vid.category === videoShowcaseCategory),
    [videoShowcaseCategory]
  );

  const visibleShowcaseVideos = useMemo(() => {
    if (videoShowcaseCategory !== 'all' || showAllVideos) {
      return filteredShowcaseVideos;
    }
    return filteredShowcaseVideos.slice(0, 8);
  }, [filteredShowcaseVideos, videoShowcaseCategory, showAllVideos]);

  const filteredShowcaseImages = useMemo(
    () =>
      imageShowcaseCategory === 'all'
        ? VORTA_IMAGE_SHOWCASE
        : VORTA_IMAGE_SHOWCASE.filter((item) => item.category === imageShowcaseCategory),
    [imageShowcaseCategory]
  );

  const activeShowcaseImage = useMemo(
    () =>
      filteredShowcaseImages.find((item) => item.id === selectedShowcaseImageId) ||
      filteredShowcaseImages[0] ||
      VORTA_IMAGE_SHOWCASE[0],
    [filteredShowcaseImages, selectedShowcaseImageId]
  );

  const activeStorySequence = useMemo(
    () =>
      VORTA_STORY_SEQUENCES.find((seq) => seq.id === selectedStorySeqId) ||
      VORTA_STORY_SEQUENCES[0],
    [selectedStorySeqId]
  );

  const activeStorySlide =
    activeStorySequence.slides[selectedStorySlideIdx] || activeStorySequence.slides[0];

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModelMenuOpen(false);
        setActivePreviewVideo(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const modeFilteredModels = useMemo(() => {
    if (composerMode === 'content') {
      const matched = models.filter((m) =>
        contentSubTab === 'story'
          ? m.modalities.includes('image') || m.modalities.includes('video')
          : m.modalities.includes(contentSubTab)
      );
      return matched.length > 0 ? matched : models;
    }
    if (composerMode === 'code') {
      const matched = models.filter((m) => m.modalities.includes('code'));
      return matched.length > 0 ? matched : models;
    }
    if (composerMode === 'research') {
      const matched = models.filter((m) => m.modalities.includes('reasoning') || m.modalities.includes('text'));
      return matched.length > 0 ? matched : models;
    }
    const textModels = models.filter((m) => m.modalities.includes('text'));
    return textModels.length > 0 ? textModels : models;
  }, [models, composerMode, contentSubTab]);

  useEffect(() => {
    if (!modeFilteredModels.some((m) => m.id === selectedModelId)) {
      const preferred =
        modeFilteredModels.find((m) => m.availability === 'functional') ?? modeFilteredModels[0];
      if (preferred) setSelectedModelId(preferred.id);
    }
  }, [modeFilteredModels, selectedModelId]);

  const activeModel =
    models.find((m) => m.id === selectedModelId) ?? modeFilteredModels[0] ?? models[0];

  const activeModeMeta = HERO_MODES.find((m) => m.id === composerMode) ?? HERO_MODES[0];
  const activeSubTabMeta =
    CONTENT_SUBTABS.find((t) => t.id === contentSubTab) ?? CONTENT_SUBTABS[0];

  const activePlaceholder =
    composerMode === 'content' ? activeSubTabMeta.placeholder : activeModeMeta.placeholder;
  const activeSample =
    composerMode === 'content' ? activeSubTabMeta.sample : activeModeMeta.sample;
  const activeSubmitLabel =
    composerMode === 'content' ? 'ساخت' : activeModeMeta.submitLabel;

  const resolvedQuickAction =
    composerMode === 'content'
      ? contentSubTab
      : agentAssistEnabled || composerMode === 'agent'
      ? 'agent'
      : composerMode;

  const handleComposerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawPrompt = composerText.trim();
    if (!rawPrompt) return;
    const finalPrompt = attachedFileName
      ? `${rawPrompt}\n[فایل پیوست: ${attachedFileName}]`
      : rawPrompt;
    if (isAuthenticated) {
      onEnterWorkspace(undefined, finalPrompt, resolvedQuickAction);
    } else {
      onStartAuth('register', finalPrompt, resolvedQuickAction);
    }
  };

  const filteredAssets = assets.filter((a) => galleryFilter === 'all' || a.type === galleryFilter);

  const capabilityCards: Array<{
    id: WorkspaceSection;
    title: string;
    subtitle: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    span: string;
  }> = [
    {
      id: 'agents',
      title: 'Kavi Agents',
      subtitle: 'ایجنت‌های خودکار شبکه‌های اجتماعی، سئو و ترید',
      desc: 'هدف را بدهید تا کاوی تقویم محتوای اینستاگرام، ممیزی سئو یا تحلیل ترید را با سقف هزینه و تأیید انسانی اجرا کند.',
      icon: Bot,
      span: 'lg:col-span-2',
    },
    {
      id: 'code',
      title: 'Kavi Web & Code',
      subtitle: 'طراحی سایت هوشمند و برنامه‌نویسی',
      desc: 'تولید وایرفریم، طراحی صفحه فرود فارسی ریسپانسیو، ویرایشگر کد و بررسی Diff در فضای ابری.',
      icon: Code2,
      span: 'lg:col-span-1',
    },
    {
      id: 'studio',
      title: 'Kavi Studio',
      subtitle: 'ریلز، عکس‌ساز و استوری‌ساز ۹:۱۶',
      desc: 'تولید ویدیو، عکس تبلیغاتی، استوری ۳ اسلایدی و صوت با ذخیره مستقیم در کتابخانه پروژه.',
      icon: ImageIcon,
      span: 'lg:col-span-1',
    },
    {
      id: 'chat',
      title: 'Kavi Chat',
      subtitle: 'گفتگوی زنده و تحلیل فایل',
      desc: 'گفتگوی جریانی با انتخابگر مدل‌های هوش مصنوعی، پیوست فایل و برآورد شفاف هزینه پیش از ارسال.',
      icon: MessageSquare,
      span: 'lg:col-span-1',
    },
    {
      id: 'automations',
      title: 'Kavi Automations',
      subtitle: 'اجرای زمان‌بندی‌شده شبانه‌روزی',
      desc: 'پایش مداوم سئو، بازار و رقبا با زمان‌بندی دقیق تهران، سقف مصرف و گزارش اجرای مستقل.',
      icon: Workflow,
      span: 'lg:col-span-1',
    },
    {
      id: 'api',
      title: 'Kavi API',
      subtitle: 'پورتال توسعه‌دهندگان kaviai.ir',
      desc: 'کلیدهای امن، پشتیبانی Idempotency Key، مستندات OpenAPI 3.1، Playground زنده و Webhooks.',
      icon: Terminal,
      span: 'lg:col-span-3',
    },
  ];

  return (
    <div className="min-h-screen relative bg-slate-50 dark:bg-[#060912] text-slate-900 dark:text-[#F8FAFC]">
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <ParticleNetwork theme={theme} />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 20%, transparent 28%, var(--bg-canvas) 96%)',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Top Bar Contract: Brand — 5 single-line links — 1 Primary Action */}
        <header className="sticky top-0 z-40 vorta-glass border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a href="#top" className="whitespace-nowrap shrink-0">
            <VortaLogo showEnglish />
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#kavi-agents" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              ایجنت‌های کاوی
            </a>
            <a href="#models" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              مدل‌ها
            </a>
            <a href="#video-showcase" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              استودیو محتوا
            </a>
            <a href="#api-spotlight" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              API
            </a>
            <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
              تعرفه‌ها
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => onStartAuth('login')}
                className="hidden sm:inline-flex px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-[#4F8CFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                ورود
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                isAuthenticated ? onEnterWorkspace('dashboard') : onStartAuth('register')
              }
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F8CFF]"
            >
              {isAuthenticated ? 'ورود به پنل' : 'شروع رایگان'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="relative min-h-[88vh] flex flex-col justify-center overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <p className="text-xs sm:text-sm font-medium text-[#4F8CFF] tracking-wide mb-3.5">
            کاوی (<span dir="ltr" className="font-mono">kaviai.ir</span>) · پلتفرم ایجنت‌های هوشمند خودکار
          </p>

          <h1
            className="font-extrabold text-slate-900 dark:text-white leading-tight mb-5 mx-auto max-w-3xl"
            style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.85rem)', textWrap: 'balance' }}
          >
            کارتو به <span className="vorta-gradient-text">کاوی</span> بسپار
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-8 mb-8">
            کاوی یک ایجنت هوشمند اجرایی است؛ از مدیریت شبکه‌های اجتماعی، طراحی سایت و سئو تا دستیار ترید و ساخت ویدیو و عکس، خودش مرحله‌به‌مرحله برایتان انجام می‌دهد.
          </p>

          {/* Interactive Rectangular Prompt Composer with Exclusive Rotating Neon Border */}
          <div className="max-w-4xl mx-auto text-right">
            {composerMode === 'content' && (
              <div
                role="tablist"
                aria-label="نوع تولید محتوا"
                className="flex items-end justify-start gap-1.5 mb-2 pr-1"
              >
                {CONTENT_SUBTABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isTabActive = contentSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isTabActive}
                      onClick={() => setContentSubTab(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isTabActive
                          ? 'bg-white dark:bg-[#0D1220] text-[#4F8CFF] dark:text-[#60A5FA] font-semibold border-[#4F8CFF]/45 shadow-xs'
                          : 'bg-white/60 dark:bg-[#0D1220]/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200/80 dark:border-slate-800/80'
                      }`}
                    >
                      <TabIcon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="vorta-neon-box relative z-10">
              <div className="vorta-neon-box-inner bg-white/95 dark:bg-[#0D1220]/95 backdrop-blur-xl">
                <form onSubmit={handleComposerSubmit} className="px-4 py-3 sm:px-5 sm:py-3.5">
                  <label htmlFor="hero-prompt-composer" className="sr-only">
                    درخواست خود را بنویسید
                  </label>
                  <textarea
                    id="hero-prompt-composer"
                    rows={2}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleComposerSubmit();
                      }
                    }}
                    placeholder={activePlaceholder}
                    className="w-full min-h-[56px] resize-none bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none leading-6"
                  />

                {attachedFileName && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4F8CFF]/10 border border-[#4F8CFF]/25 text-xs text-[#4F8CFF]">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="max-w-[200px] truncate">{attachedFileName}</span>
                      <button
                        type="button"
                        aria-label="حذف فایل پیوست"
                        onClick={() => setAttachedFileName(null)}
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                )}

                {/* Inner bottom toolbar: start = tools/model, end = primary submit */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAttachedFileName(file.name);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="پیوست فایل"
                      title="پیوست فایل"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-slate-600 dark:text-slate-300 hover:text-[#4F8CFF] hover:border-[#4F8CFF]/40 transition-colors cursor-pointer shrink-0"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Model selector dropdown inside composer */}
                    <div ref={modelMenuRef} className="relative">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={isModelMenuOpen}
                        onClick={() => setIsModelMenuOpen((prev) => !prev)}
                        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl border border-[#4F8CFF]/25 bg-[#4F8CFF]/10 hover:bg-[#4F8CFF]/15 text-xs font-medium text-slate-800 dark:text-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#4F8CFF]" />
                        <span>{activeModel?.displayName ?? 'Gemini 4 Hydrogen'}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </button>

                      {isModelMenuOpen && (
                        <div
                          role="listbox"
                          aria-label="انتخاب مدل هوش مصنوعی"
                          className="absolute right-0 bottom-full mb-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] shadow-xl p-1.5 z-50 text-right"
                        >
                          <div className="px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                            مدل‌های در دسترس برای این حالت
                          </div>
                          {modeFilteredModels.map((m) => {
                            const selected = m.id === activeModel?.id;
                            const isComingSoon = m.availability === 'coming_soon';
                            return (
                              <button
                                key={m.id}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                disabled={isComingSoon}
                                onClick={() => {
                                  setSelectedModelId(m.id);
                                  setIsModelMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-right ${
                                  isComingSoon
                                    ? 'opacity-50 cursor-not-allowed'
                                    : selected
                                    ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] font-semibold cursor-pointer'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B] cursor-pointer'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <Check
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      selected ? 'opacity-100 text-[#4F8CFF]' : 'opacity-0'
                                    }`}
                                  />
                                  <span className="truncate">{m.displayName}</span>
                                </span>
                                <StatusText status={m.availability} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {composerMode !== 'content' && (
                      <button
                        type="button"
                        onClick={() => setAgentAssistEnabled((prev) => !prev)}
                        aria-pressed={agentAssistEnabled || composerMode === 'agent'}
                        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          agentAssistEnabled || composerMode === 'agent'
                            ? 'border-[#875BFF]/50 bg-[#875BFF]/15 text-[#875BFF] dark:text-[#A78BFA]'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>ایجنت</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setComposerText(activeSample)}
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#151B2B]/80 text-xs text-slate-600 dark:text-slate-300 hover:text-[#4F8CFF] hover:border-[#4F8CFF]/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>پرامپت نمونه</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!composerText.trim()}
                    className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                      composerText.trim()
                        ? 'bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] text-white hover:opacity-95 shadow-sm shadow-[#4F8CFF]/30 cursor-pointer'
                        : 'bg-slate-100 dark:bg-[#151B2B] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{activeSubmitLabel}</span>
                  </button>
                </div>
              </form>
              </div>
            </div>

            {/* Row of 5 Mode Buttons Underneath the Box */}
            <div
              role="group"
              aria-label="حالت‌های کاری کاوی"
              className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
            >
              {HERO_MODES.map((mode) => {
                const ModeIcon = mode.icon;
                const isActive = composerMode === mode.id;
                const isAgentEndBtn = mode.id === 'agent';

                if (isAgentEndBtn) {
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        setComposerMode(mode.id);
                        setAgentAssistEnabled(true);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] text-white ring-2 ring-[#4F8CFF]/35 shadow-sm'
                          : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white shadow-sm'
                      }`}
                    >
                      <ModeIcon className="w-4 h-4" />
                      <span>{mode.label}</span>
                      <ArrowUpLeft className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  );
                }

                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setComposerMode(mode.id);
                      setAgentAssistEnabled(false);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 sm:py-2 rounded-full border text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? mode.id === 'content'
                          ? 'border-[#4F8CFF]/50 bg-[#4F8CFF]/15 text-[#2563EB] dark:text-[#60A5FA] shadow-xs'
                          : 'border-[#4F8CFF]/45 bg-white dark:bg-[#151B2B] text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0D1220]/80 text-slate-700 dark:text-slate-300 hover:border-[#4F8CFF]/35 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ModeIcon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[#4F8CFF]' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Yara-inspired AI Models Marquee Strip immediately after Hero Composer */}
      <section
        id="models"
        className="py-10 sm:py-12 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/55 dark:bg-[#060912]/45"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            دنیای مدل‌های هوش مصنوعی، در یک جا
          </p>

          <div
            dir="ltr"
            aria-label="مدل‌های هوش مصنوعی پشتیبانی‌شده در کاوی"
            className="vorta-marquee-mask overflow-hidden py-2"
          >
            <div className="vorta-marquee-track items-center gap-10 sm:gap-14">
              {[0, 1].map((dupIndex) => (
                <ul
                  key={dupIndex}
                  aria-hidden={dupIndex === 1}
                  className="flex items-center gap-10 sm:gap-14 shrink-0 pr-10 sm:pr-14"
                >
                  {models.map((model) => (
                    <li key={`${dupIndex}-${model.id}`} className="shrink-0">
                      <button
                        type="button"
                        tabIndex={dupIndex === 1 ? -1 : 0}
                        onClick={() => {
                          setSelectedModelId(model.id);
                          if (model.modalities.includes('video')) {
                            setComposerMode('content');
                            setContentSubTab('video');
                          } else if (model.modalities.includes('image') && !model.modalities.includes('text')) {
                            setComposerMode('content');
                            setContentSubTab('image');
                          } else if (model.modalities.includes('audio')) {
                            setComposerMode('content');
                            setContentSubTab('audio');
                          } else if (model.modalities.includes('code') && model.id.includes('claude')) {
                            setComposerMode('code');
                          }
                          document.getElementById('hero-prompt-composer')?.focus();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group inline-flex items-center gap-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-[#4F8CFF] transition-colors">
                          {model.providerName === 'Google' ? (
                            <Sparkles className="w-4 h-4" />
                          ) : model.providerName === 'OpenAI' ? (
                            <Cpu className="w-4 h-4" />
                          ) : model.providerName === 'Anthropic' ? (
                            <Code2 className="w-4 h-4" />
                          ) : model.providerName === 'DeepSeek' ? (
                            <Bot className="w-4 h-4" />
                          ) : model.modalities.includes('video') ? (
                            <Video className="w-4 h-4" />
                          ) : model.modalities.includes('audio') ? (
                            <Volume2 className="w-4 h-4" />
                          ) : (
                            <Wand2 className="w-4 h-4" />
                          )}
                        </span>
                        <span className="text-sm sm:text-base font-semibold tracking-tight">
                          {model.displayName}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() =>
                isAuthenticated ? onEnterWorkspace('models') : onStartAuth('login')
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-[#4F8CFF] transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>مشاهده مشخصات کامل مدل‌ها و تعرفه توکن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Kavi 4 Autonomous Agent Domains Showcase (#kavi-agents) */}
      <KaviAgentShowcase
        onSendToHeroBox={(prompt) => {
          setComposerMode('agent');
          setAgentAssistEnabled(true);
          setComposerText(prompt);
          document.getElementById('hero-prompt-composer')?.focus();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLaunchAgent={(prompt, domain) => {
          const targetSection = domain === 'social' ? 'social' : 'agents';
          if (isAuthenticated) {
            onEnterWorkspace(targetSection, prompt, domain);
          } else {
            onStartAuth('register', prompt, domain);
          }
        }}
      />

      {/* AI Sample Videos Showcase (Pinterest-style scrollable 9:16 Reels wall) */}
      <section
        id="video-showcase"
        className="scroll-mt-20 py-14 sm:py-16 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/55 dark:bg-[#080D19]/50"
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-[#4F8CFF] mb-1.5">
              نمونه ریلز استودیوی ویدیو · ابعاد عمودی ۹:۱۶ (حالت دمو)
            </p>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              نمونه ویدیوهای ساخته‌شده با کاوی
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-xl mx-auto">
              در میان ریلزهای عمودی اسکرول کنید، هر ویدیو را برای پیش‌نمایش باز کنید یا پرامپت آن را انتخاب کنید.
            </p>
          </div>

          {/* Pinterest-style category filter strip */}
          <div
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-6"
            role="tablist"
            aria-label="دسته‌بندی نمونه ویدیوها"
          >
            {VIDEO_SHOWCASE_CATEGORIES.map((cat) => {
              const isActive = videoShowcaseCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? VORTA_VIDEO_SHOWCASE.length
                  : VORTA_VIDEO_SHOWCASE.filter((item) => item.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setVideoShowcaseCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#4F8CFF]/15 border-[#4F8CFF]/60 text-[#4F8CFF]'
                      : 'bg-white/80 dark:bg-[#0D1220] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-75 font-mono tabular-nums">
                    ({formatNumber(count)})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4 items-start pb-2 md:pb-5">
            {visibleShowcaseVideos.map((vid, idx) => {
              const isSelected = selectedShowcaseVideoId === vid.id;
              const staggerClass = idx % 2 === 1 ? 'md:translate-y-4' : '';
              return (
                <article key={vid.id} className={`group flex flex-col ${staggerClass}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShowcaseVideoId(vid.id);
                      setActivePreviewVideo(vid);
                    }}
                    className={`relative aspect-[9/16] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#0D1220] via-[#151B2B] to-[#1E293B] border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4F8CFF] ${
                      isSelected
                        ? 'border-[#4F8CFF] ring-2 ring-[#4F8CFF]/50 shadow-md shadow-[#4F8CFF]/15'
                        : 'border-slate-200 dark:border-slate-800 hover:border-[#4F8CFF]/60'
                    }`}
                    aria-label={`پخش و انتخاب ${vid.title}`}
                  >
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                    <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-2.5 sm:px-3 pt-2.5 sm:pt-3 text-[10px] sm:text-[11px] text-white/95 pointer-events-none">
                      <span className="font-mono tabular-nums" dir="ltr">
                        00:0{vid.durationSec}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4F8CFF] text-white">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                      )}
                    </div>

                    <span className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-110">
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current mr-0.5" />
                      </span>
                    </span>

                    <div className="absolute bottom-2 right-2.5 left-2.5 z-10 hidden sm:flex items-center justify-between text-[10px] text-slate-200 pointer-events-none">
                      <span className="truncate">{vid.cameraMotion}</span>
                    </div>
                  </button>

                  <div className="pt-2 px-0.5 text-right flex-1 flex flex-col justify-between gap-1">
                    <h3 className="text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-100 leading-4 sm:leading-5 line-clamp-1 sm:line-clamp-2">
                      {vid.title}
                    </h3>
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums"
                        dir="ltr"
                      >
                        9:16
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedShowcaseVideoId(vid.id);
                          setComposerMode('content');
                          setContentSubTab('video');
                          setComposerText(vid.prompt);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isSelected ? 'text-[#38D9FF]' : 'text-[#4F8CFF] hover:underline'
                        }`}
                      >
                        <span>{isSelected ? 'انتخاب شد' : 'انتخاب پرامپت'}</span>
                        <ArrowLeft className="w-3 h-3 hidden sm:inline" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {videoShowcaseCategory === 'all' && filteredShowcaseVideos.length > 8 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllVideos((prev) => !prev)}
                aria-expanded={showAllVideos}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1220] text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-[#4F8CFF]/60 hover:text-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap"
              >
                {showAllVideos ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>نمایش کمتر</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>
                      نمایش بیشتر ({formatNumber(filteredShowcaseVideos.length - 8)} ویدیوی دیگر)
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* AI Image Maker Showcase (#image-maker) */}
      <section
        id="image-maker"
        className="scroll-mt-20 py-14 sm:py-16 border-b border-slate-200/70 dark:border-slate-800/70"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-[#4F8CFF] mb-1.5">
              عکس‌ساز استودیو · رندر تبلیغاتی، معماری و پرتره (حالت دمو)
            </p>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              عکس‌ساز هوشمند کاوی
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl mx-auto">
              توصیف فارسی بنویسید یا یکی از سبک‌های استودیویی را انتخاب کنید؛ نورپردازی، لنز و نسبت تصویر دقیق در اختیار شماست.
            </p>
          </div>

          {/* Interactive style filter buttons */}
          <div
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-7"
            role="tablist"
            aria-label="فیلتر سبک‌های عکس‌ساز"
          >
            {IMAGE_SHOWCASE_CATEGORIES.map((cat) => {
              const isActive = imageShowcaseCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setImageShowcaseCategory(cat.id);
                    const firstMatch =
                      cat.id === 'all'
                        ? VORTA_IMAGE_SHOWCASE[0]
                        : VORTA_IMAGE_SHOWCASE.find((item) => item.category === cat.id);
                    if (firstMatch) setSelectedShowcaseImageId(firstMatch.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#4F8CFF]/15 border-[#4F8CFF]/60 text-[#4F8CFF]'
                      : 'bg-white dark:bg-[#0D1220] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Featured Image Canvas */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#0D1220] overflow-hidden flex flex-col justify-between relative min-h-[340px] sm:min-h-[430px]">
              <img
                src={activeShowcaseImage.imageUrl}
                alt={activeShowcaseImage.title}
                referrerPolicy="no-referrer"
                className={`absolute inset-0 w-full h-full object-cover ${
                  activeShowcaseImage.category === 'portrait' ? 'object-top' : 'object-center'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 pointer-events-none" />

              <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between text-[11px] text-slate-200">
                <span>
                  {activeShowcaseImage.styleLabel} · {activeShowcaseImage.lightingNote}
                </span>
                <span className="font-mono tabular-nums" dir="ltr">
                  {activeShowcaseImage.aspectRatio}
                </span>
              </div>

              <div className="relative z-10 p-4 sm:p-6 space-y-3">
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-xl font-bold text-white leading-snug">
                    {activeShowcaseImage.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200/95 leading-6 line-clamp-3">
                    {activeShowcaseImage.prompt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setComposerMode('content');
                      setContentSubTab('image');
                      setComposerText(activeShowcaseImage.prompt);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/25 bg-black/50 text-xs font-semibold text-white hover:border-[#4F8CFF] hover:text-[#38D9FF] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>استفاده از پرامپت در باکس</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAuthenticated) {
                        onEnterWorkspace('studio', activeShowcaseImage.prompt, 'image');
                      } else {
                        onStartAuth('register', activeShowcaseImage.prompt, 'image');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>ساخت عکس در استودیو</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Selectable Image Cards + Quick Idea Form */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                {filteredShowcaseImages.map((item) => {
                  const isSelected = item.id === activeShowcaseImage.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedShowcaseImageId(item.id)}
                      className={`group relative rounded-xl overflow-hidden border text-right transition-all cursor-pointer bg-[#0D1220] aspect-[4/3] ${
                        isSelected
                          ? 'border-[#4F8CFF] ring-2 ring-[#4F8CFF]/45'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#4F8CFF]/60'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          item.category === 'portrait' ? 'object-top' : 'object-center'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                      {isSelected && (
                        <span className="absolute top-2 left-2 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4F8CFF] text-white">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      <div className="absolute bottom-2 inset-x-2.5 z-10 text-right pointer-events-none">
                        <div className="text-[10px] text-slate-300">{item.styleLabel}</div>
                        <div className="text-xs font-semibold text-white line-clamp-1">
                          {item.title}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const promptToSend = customImagePrompt.trim() || activeShowcaseImage.prompt;
                  if (isAuthenticated) {
                    onEnterWorkspace('studio', promptToSend, 'image');
                  } else {
                    onStartAuth('register', promptToSend, 'image');
                  }
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-3.5 space-y-2.5"
              >
                <label
                  htmlFor="landing-quick-image-prompt"
                  className="block text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  پرامپت سریع عکس‌ساز
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="landing-quick-image-prompt"
                    type="text"
                    value={customImagePrompt}
                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                    placeholder="مثلاً: عکاسی محصول عطر لوکس روی سنگ مرمر مشکی..."
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F8CFF]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-[#4F8CFF] hover:bg-[#3e7af0] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    ساخت عکس
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* AI Story Maker Showcase (#story-maker) */}
      <section
        id="story-maker"
        className="scroll-mt-20 py-14 sm:py-16 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/55 dark:bg-[#080D19]/50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-[#4F8CFF] mb-1.5">
              استوری‌ساز ۹:۱۶ · سناریو و اسلایدهای هماهنگ (حالت دمو)
            </p>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              استوری‌ساز هوشمند برای اینستاگرام و شبکه‌ها
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl mx-auto">
              با یک موضوع، دنباله‌ای ۳ اسلایدی در ابعاد ۹:۱۶ شامل قلاب تصویری، تیتر آماده و دعوت به اقدام (CTA) تحویل بگیرید.
            </p>
          </div>

          {/* Scenario switcher tabs */}
          <div
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-7"
            role="tablist"
            aria-label="سناریوهای آماده استوری‌ساز"
          >
            {VORTA_STORY_SEQUENCES.map((seq) => {
              const isActive = seq.id === activeStorySequence.id;
              return (
                <button
                  key={seq.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setSelectedStorySeqId(seq.id);
                    setSelectedStorySlideIdx(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#4F8CFF]/15 border-[#4F8CFF]/60 text-[#4F8CFF]'
                      : 'bg-white dark:bg-[#0D1220] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {seq.scenarioLabel}
                </button>
              );
            })}
          </div>

          {/* 3 Sequential 9:16 Story Frames */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5 max-w-4xl mx-auto">
            {activeStorySequence.slides.map((slide, idx) => {
              const isActiveSlide = idx === selectedStorySlideIdx;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setSelectedStorySlideIdx(idx)}
                  aria-pressed={isActiveSlide}
                  className={`group relative aspect-[9/16] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#0D1220] via-[#151B2B] to-[#1E293B] border text-right transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4F8CFF] ${
                    isActiveSlide
                      ? 'border-[#4F8CFF] ring-2 ring-[#4F8CFF]/50 shadow-lg shadow-[#4F8CFF]/15'
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#4F8CFF]/60'
                  }`}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.headlineOverlay}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-32 sm:h-40 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none" />

                  {/* Story progress bars pinned at top edge */}
                  <div className="absolute top-0 inset-x-0 z-10 p-2 sm:p-3 space-y-1.5 pointer-events-none">
                    <div className="grid grid-cols-3 gap-1">
                      {activeStorySequence.slides.map((bar, barIdx) => (
                        <span
                          key={bar.id}
                          className={`h-0.5 sm:h-1 rounded-full ${
                            barIdx <= idx ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-white/90">
                      <span className="truncate">{slide.roleLabel}</span>
                      <span className="font-mono tabular-nums" dir="ltr">
                        9:16
                      </span>
                    </div>
                  </div>

                  {/* Story Headline & CTA overlay at bottom */}
                  <div className="absolute bottom-0 inset-x-0 z-10 p-2 sm:p-4 text-right space-y-1 pointer-events-none">
                    <div className="text-[11px] sm:text-sm font-bold text-white leading-snug line-clamp-2">
                      {slide.headlineOverlay}
                    </div>
                    <div className="hidden sm:block text-[11px] text-slate-200 line-clamp-1">
                      {slide.sublineOverlay}
                    </div>
                    <div className="hidden sm:inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm border border-white/25 text-[10px] font-medium text-white">
                      {slide.ctaBadge}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Story Script & Builder Bar */}
          <div className="max-w-4xl mx-auto mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="text-xs text-[#4F8CFF] font-semibold">
                  {activeStorySequence.title} · {activeStorySlide.roleLabel}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  {activeStorySlide.visualPrompt}
                </p>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                دعوت به اقدام: {activeStorySlide.ctaBadge}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const storyPrompt = customStoryTopic.trim() || activeStorySequence.topicPrompt;
                if (isAuthenticated) {
                  onEnterWorkspace('studio', storyPrompt, 'story');
                } else {
                  onStartAuth('register', storyPrompt, 'story');
                }
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <input
                type="text"
                aria-label="موضوع استوری سفارشی"
                value={customStoryTopic}
                onChange={(e) => setCustomStoryTopic(e.target.value)}
                placeholder="موضوع استوری خودت را بنویس (مثلاً: معرفی مجموعه جدید یا تخفیف آخر هفته)..."
                className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F8CFF]"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const storyPrompt = customStoryTopic.trim() || activeStorySequence.topicPrompt;
                    setComposerMode('content');
                    setContentSubTab('story');
                    setComposerText(storyPrompt);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#4F8CFF]/60 hover:text-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap"
                >
                  ارسال به باکس بالا
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ساخت استوری در استودیو</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Six Capabilities Bento Grid */}
      <section id="capabilities" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            شش محیط یکپارچه برای کل چرخه کار
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-7">
            از گفتگوی روزمره و تولید رسانه تا ساخت ایجنت‌های خودکار و اتصال مستقیم به API با حسابداری دقیق تومانی.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilityCards.map((cap) => {
            const Icon = cap.icon;
            return (
              <button
                key={cap.id}
                type="button"
                onClick={() =>
                  isAuthenticated ? onEnterWorkspace(cap.id) : onStartAuth('register')
                }
                className={`${cap.span} text-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 hover:border-[#4F8CFF]/50 transition-all group cursor-pointer flex flex-col justify-between gap-4`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {cap.subtitle}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#4F8CFF] transition-colors" dir="ltr">
                      {cap.title}
                    </h3>
                  </div>
                  <span className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#151B2B] text-[#4F8CFF]">
                    <Icon className="w-5 h-5" />
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-6">
                  {cap.desc}
                </p>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F8CFF]">
                  <span>باز کردن {cap.title}</span>
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Interactive Product Experience Preview */}
      <section className="py-16 border-y border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1220]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#875BFF] mb-1">دموی محصول · داده نمونه</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                پیش‌نمایش تعاملی فضای کاری کاوی
              </h2>
            </div>

            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#151B2B] self-start">
              {(
                [
                  { id: 'chat', label: 'Chat' },
                  { id: 'studio', label: 'Studio' },
                  { id: 'agents', label: 'Agents' },
                  { id: 'automations', label: 'Automations' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPreviewTab(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    previewTab === t.id
                      ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060912] p-5 sm:p-6">
            {previewTab === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-1 space-y-2 border-b lg:border-b-0 lg:border-l border-slate-200 dark:border-slate-800 pb-4 lg:pb-0 lg:pl-5">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    تاریخچه گفتگوها (دموی محصول)
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D1220] border border-[#4F8CFF]/40 text-xs font-medium">
                    تحلیل بازار و استراتژی قیمت‌گذاری ۱۴۰۵
                  </div>
                  <div className="p-3 rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                    بهینه‌سازی کوئری PostgreSQL برای Ledger
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>مدل انتخابی: Gemini 4 Hydrogen</span>
                    <span className="tabular-nums">برآورد هزینه: ۰.۴۵ کردیت (۲۲۵ تومان)</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#151B2B] text-sm">
                    ساختار جدول تعرفه سه‌سطحی با امکان تغییر دوره ماهانه و سالانه را طراحی کن.
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    پیشنهاد می‌شود سه پلن «رایگان»، «حرفه‌ای» و «سازمانی» با ضریب تخفیف ۲۲ درصدی برای دوره سالانه تعریف شوند و مصرف مازاد از طریق Credit Ledger اتمیک محاسبه شود.
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'studio' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    دموی محصول · استودیوی تصویر
                  </div>
                  <h3 className="text-lg font-bold">کنترل دقیق پارامترهای رندر</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-7">
                    تنظیم Prompt و Negative Prompt، نسبت تصویر ۱۶:۹ یا ۴:۳، Seed ثابت و ذخیره خودکار در کتابخانه دارایی‌های پروژه.
                  </p>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono" dir="ltr">
                    Aspect: 16:9 · Seed: 42819 · Model: Kavi Vision Pro
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-900">
                  <img
                    src={assets[0]?.url}
                    alt={assets[0]?.title || 'پیش‌نمایش استودیو'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {previewTab === 'agents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">ایجنت پایشگر قیمت رقبا (دموی محصول)</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    منتظر تأیید صریح کاربر
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
                    ۱. اجرای Sandbox ایزوله و استخراج قیمت‌ها
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
                    ۲. شناسایی ۳ تغییر قیمت نسبت به دیروز
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0D1220] border border-amber-500/40">
                    ۳. توقف پیش از ارسال ایمیل خارجی تا تأیید شما
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'automations' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-sm mb-1">زمان‌بندی</div>
                  <p className="text-slate-500 dark:text-slate-400">روزانه · ساعت ۰۸:۳۰ · Asia/Tehran</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-sm mb-1">سقف هزینه مجاز</div>
                  <p className="text-slate-500 dark:text-slate-400 tabular-nums">حداکثر ۵۰ کردیت در هر اجرا</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-sm mb-1">گزارش اجرا (دموی محصول)</div>
                  <p className="text-slate-500 dark:text-slate-400">قابل ردیابی و لغو آنی در هر مرحله</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How Kavi Works (3 Steps) & Tools Comparison */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        <div>
          <h2 className="text-2xl font-bold mb-8">کاوی چطور کار می‌کند؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '۰۱. کارت را به زبان فارسی بنویس',
                text: 'مثلاً مدیریت اینستاگرام، طراحی سایت جدید، ممیزی سئو یا بررسی یک جفت‌ارز را در باکس کاوی وارد کن.',
              },
              {
                num: '۰۲. ایجنت تخصصی برنامه‌ریزی و اجرا می‌کند',
                text: 'کاوی هدف را به مراحل دقیق می‌شکند، هزینه را شفاف نشان می‌دهد و در محیط ایزوله اجرا می‌کند.',
              },
              {
                num: '۰۳. بازبینی نهایی و تأیید با یک کلیک',
                text: 'پیش از هر اقدام حساس مثل انتشار پست، تغییر سئو یا ثبت پلن، گزارش آماده را تأیید و در پروژه ذخیره کنید.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220]"
              >
                <h3 className="font-bold text-base mb-2">{step.num}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-7">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div>
          <h2 className="text-2xl font-bold mb-6">مقایسه کاربردی ایجنت‌ها و ابزارهای کاوی</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220]">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-100 dark:bg-[#151B2B] text-xs text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">ماژول</th>
                  <th className="px-4 py-3 font-semibold">کاربرد اصلی</th>
                  <th className="px-4 py-3 font-semibold">نحوه محاسبه مصرف</th>
                  <th className="px-4 py-3 font-semibold">وضعیت فعلی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
                <tr>
                  <td className="px-4 py-3 font-semibold">Kavi Chat</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">تحلیل متن، کد و فایل با استریم زنده</td>
                  <td className="px-4 py-3 tabular-nums">بر اساس ۱٬۰۰۰ توکن ورودی و خروجی</td>
                  <td className="px-4 py-3"><StatusText status="functional" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Kavi Agents (شبکه اجتماعی · سایت · سئو · ترید)</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">اجرای چندمرحله‌ای خودکار با تأیید انسانی</td>
                  <td className="px-4 py-3 tabular-nums">سقف هزینه مجاز در هر Run</td>
                  <td className="px-4 py-3"><StatusText status="demo" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Kavi Studio</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">تولید ریلز ۹:۱۶، عکس تبلیغاتی و استوری</td>
                  <td className="px-4 py-3 tabular-nums">تعرفه ثابت هر Job رسانه‌ای</td>
                  <td className="px-4 py-3"><StatusText status="demo" /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">Kavi API</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">اتصال مستقیم به محصولات و سرویس‌ها</td>
                  <td className="px-4 py-3 tabular-nums">متصل به Ledger با Idempotency Key</td>
                  <td className="px-4 py-3"><StatusText status="functional" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Output Gallery with Filters */}
      <section className="py-16 border-t border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1220]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold">گالری خروجی‌های استودیو</h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                نمونه دارایی‌های تولیدی با امکان فیلتر تصویر، ویدیو و صوت
              </p>
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#151B2B] self-start">
              {(
                [
                  { id: 'all', label: 'همه' },
                  { id: 'image', label: 'تصویر' },
                  { id: 'video', label: 'ویدیو' },
                  { id: 'audio', label: 'صوت' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setGalleryFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    galleryFilter === f.id
                      ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
              <Volume2 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              نمونه صوتی هنوز اضافه نشده است. در استودیوی صوتی می‌توانید اولین فایل را بسازید.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredAssets.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D1220] overflow-hidden flex flex-col"
                >
                  <div className="aspect-[4/3] bg-slate-900 overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {item.type === 'image' ? 'تصویر' : 'ویدیو'} · {item.aspectRatio}
                      </div>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Agents & API Spotlights */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          id="agents-spotlight"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-8 flex flex-col justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#875BFF] mb-2">
              <Shield className="w-4 h-4" />
              <span>کنترل انسانی و Sandbox ایزوله</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">ایجنت‌های هوشمند با تأیید صریح</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-7">
              برای هر ایجنت هدف، دستورالعمل، سقف هزینه و ابزارهای مجاز تعریف کنید. ایجنت پیش از هر اقدام خارجی حساس منتظر تأیید شما می‌ماند و نشست مرورگر هر کاربر کاملاً ایزوله است.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => (isAuthenticated ? onEnterWorkspace('agents') : onStartAuth('register'))}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#875BFF] hover:bg-[#7548f0] transition-colors cursor-pointer"
            >
              مدیریت ایجنت‌ها
            </button>
          </div>
        </div>

        <div
          id="api-spotlight"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-8 flex flex-col justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4F8CFF] mb-2">
              <Terminal className="w-4 h-4" />
              <span>OpenAPI 3.1 + Idempotency Key</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">زیرساخت API برای توسعه‌دهندگان</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-7 mb-4">
              با یک کلید API به دروازه مدل‌های کاوی (<span dir="ltr" className="font-mono">kaviai.ir</span>) متصل شوید. کلیدها فقط هنگام ایجاد نمایش داده می‌شوند و برای جلوگیری از کسر مضاعف اعتبار، Idempotency Key پشتیبانی می‌شود.
            </p>
            <pre
              dir="ltr"
              className="p-3.5 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800"
            >
{`curl -X POST https://api.kaviai.ir/api/gateway/playground \\
  -H "Idempotency-Key: req_2026_01" \\
  -d '{"modelId":"gemini-4-hydrogen","prompt":"سلام کاوی"}'`}
            </pre>
          </div>
          <div>
            <button
              type="button"
              onClick={() => (isAuthenticated ? onEnterWorkspace('api') : onStartAuth('register'))}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] transition-colors cursor-pointer"
            >
              ورود به پورتال توسعه‌دهندگان
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 border-t border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1220]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">تعرفه‌ها و پلن‌های اشتراک</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                پرداخت بر اساس تومان · قیمت‌ها مستقیماً از پنل مدیریت سیستم قابل ویرایش هستند.
              </p>
            </div>

            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#151B2B] self-start">
              {(
                [
                  { id: 'monthly', label: 'ماهانه' },
                  { id: 'quarterly', label: 'سه‌ماهه (۸٪)' },
                  { id: 'semiannual', label: 'شش‌ماهه (۱۴٪)' },
                  { id: 'annual', label: 'سالانه (۲۲٪)' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setBillingCycle(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    billingCycle === c.id
                      ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const calc = calculatePlanPrice(plan.monthlyPriceToman, billingCycle);
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between gap-6 ${
                    plan.isPopular
                      ? 'border-[#4F8CFF] bg-white dark:bg-[#0D1220]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D1220]'
                  }`}
                >
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {plan.audience}
                    </div>
                    <h3 className="text-lg font-bold mb-3">{plan.name}</h3>

                    <div className="mb-4">
                      {calc.effectiveMonthlyToman === null ? (
                        <div className="text-xl font-bold text-[#875BFF]">قیمت توافقی</div>
                      ) : calc.effectiveMonthlyToman === 0 ? (
                        <div className="text-2xl font-extrabold tabular-nums">رایگان</div>
                      ) : (
                        <div>
                          <div className="text-2xl font-extrabold tabular-nums">
                            {formatToman(calc.effectiveMonthlyToman)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            ماهانه · مجموع دوره: {formatToman(calc.totalToman ?? 0)}
                          </div>
                        </div>
                      )}
                      {plan.pricePlaceholder && (
                        <p className="text-[11px] text-slate-400 mt-1">{plan.pricePlaceholder}</p>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-[#4F8CFF] mb-3 tabular-nums">
                      شامل {formatNumber(plan.includedCredits)} کردیت
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-5">
                      {plan.limits.map((lim) => (
                        <li key={lim}>• {lim}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      isAuthenticated
                        ? onEnterWorkspace(plan.isEnterprise ? 'business' : 'billing')
                        : onStartAuth('register')
                    }
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      plan.isPopular
                        ? 'bg-[#4F8CFF] hover:bg-[#3e7af0] text-white'
                        : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#151B2B]'
                    }`}
                  >
                    {plan.isEnterprise ? 'تماس با فروش سازمانی' : 'انتخاب این پلن'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold mb-6 text-center">سؤالات متداول</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={item.q}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-right flex items-center justify-between gap-4 text-sm font-semibold cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-7 border-t border-slate-200/70 dark:border-slate-800/70 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0D1220]/60">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            کارتو به کاوی بسپار
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6">
            همین حالا با ۲۵۰ کردیت هدیه وارد فضای کاری <span dir="ltr" className="font-mono">kaviai.ir</span> شوید و مدیریت شبکه‌های اجتماعی، طراحی سایت، سئو یا دستیار ترید خود را راه‌اندازی کنید.
          </p>
          <button
            type="button"
            onClick={() =>
              isAuthenticated ? onEnterWorkspace('dashboard') : onStartAuth('register')
            }
            className="px-7 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F8CFF]"
          >
            شروع رایگان با کاوی
          </button>
        </div>
      </section>

      {/* Interactive Vertical 9:16 Reels Video Preview Modal */}
      {activePreviewVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePreviewVideo.title}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setActivePreviewVideo(null)}
        >
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] shadow-2xl grid grid-cols-1 md:grid-cols-[290px_1fr]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[9/16] w-full max-w-[290px] mx-auto md:max-w-none bg-slate-950 overflow-hidden">
              <img
                src={activePreviewVideo.thumbnailUrl}
                alt={activePreviewVideo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover vorta-kenburns"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 pointer-events-none" />
              <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[11px] text-slate-200">
                <span>{activePreviewVideo.cameraMotion}</span>
                <span className="font-mono tabular-nums" dir="ltr">
                  00:0{activePreviewVideo.durationSec} · {activePreviewVideo.resolution}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex flex-col justify-between gap-5 text-right">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#4F8CFF] mb-1">
                      {activePreviewVideo.modelName} · پیش‌نمایش ریلز ۹:۱۶
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-7">
                      {activePreviewVideo.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    aria-label="بستن پیش‌نمایش"
                    onClick={() => setActivePreviewVideo(null)}
                    className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B]/70 p-3.5">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    پرامپت استفاده‌شده:
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-7">
                    «{activePreviewVideo.prompt}»
                  </p>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-6">
                  حرکت دوربین: <span className="text-slate-800 dark:text-slate-200 font-medium">{activePreviewVideo.cameraMotion}</span>
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200/70 dark:border-slate-800/70">
                <span className="block text-xs text-amber-600 dark:text-amber-400">
                  پیش‌نمایش حرکتی استودیو (حالت دمو)
                </span>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePreviewVideo(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    بستن
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const promptToUse = activePreviewVideo.prompt;
                      setSelectedShowcaseVideoId(activePreviewVideo.id);
                      setActivePreviewVideo(null);
                      setComposerMode('content');
                      setContentSubTab('video');
                      setComposerText(promptToUse);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#4F8CFF]/40 bg-[#4F8CFF]/10 text-xs font-semibold text-[#4F8CFF] cursor-pointer"
                  >
                    استفاده از پرامپت در باکس
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const promptToUse = activePreviewVideo.prompt;
                      setActivePreviewVideo(null);
                      if (isAuthenticated) {
                        onEnterWorkspace('studio', promptToUse, 'video');
                      } else {
                        onStartAuth('register', promptToUse, 'video');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] text-xs font-semibold text-white cursor-pointer"
                  >
                    ساخت ویدیوی مشابه در استودیو
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Obsidian Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#060912]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10 space-y-12 text-xs">
          {/* Top Tier: Brand Identity + Product Updates Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-200/80 dark:border-slate-800/80 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <a href="#top" className="inline-flex">
                  <VortaLogo showEnglish />
                </a>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs font-semibold text-[#4F8CFF]">کارتو به کاوی بسپار</span>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-7 max-w-xl">
                پلتفرم یکپارچه ایجنت‌های هوشمند فارسی در{' '}
                <span dir="ltr" className="font-mono text-slate-800 dark:text-slate-200">kaviai.ir</span>
                ؛ برای مدیریت شبکه‌های اجتماعی، طراحی سایت، ممیزی سئو، دستیار تحلیل و ریسک ترید و استودیوی تولید تصویر، ویدیو و استوری.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    isAuthenticated ? onEnterWorkspace('dashboard') : onStartAuth('register')
                  }
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isAuthenticated ? 'ورود به فضای کاری' : 'شروع رایگان با ۲۵۰ کردیت'}
                </button>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#4F8CFF]/50 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 lg:max-w-lg lg:mr-auto w-full rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-[#0D1220]/75 p-5 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  دریافت خبرنامه مهندسی و ایجنت‌های جدید کاوی
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-5">
                  اطلاع از مدل‌های تازه، قابلیت‌های اتوماسیون و راهنماهای کاربردی هفتگی (بدون اسپم).
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const trimmed = footerNewsletterEmail.trim();
                  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                    setFooterNewsletterStatus('error');
                    return;
                  }
                  setFooterNewsletterStatus('subscribed');
                  setFooterNewsletterEmail('');
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <label htmlFor="footer-newsletter-email" className="sr-only">
                  ایمیل برای عضویت در خبرنامه
                </label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  dir="ltr"
                  value={footerNewsletterEmail}
                  onChange={(e) => {
                    setFooterNewsletterEmail(e.target.value);
                    if (footerNewsletterStatus !== 'idle') setFooterNewsletterStatus('idle');
                  }}
                  placeholder="name@company.ir"
                  className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151B2B] px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#4F8CFF]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3d7bf2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>عضویت</span>
                </button>
              </form>

              {footerNewsletterStatus === 'subscribed' && (
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  ایمیل شما در فهرست به‌روزرسانی‌های کاوی ثبت شد.
                </p>
              )}
              {footerNewsletterStatus === 'error' && (
                <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                  لطفاً یک نشانی ایمیل معتبر وارد کنید.
                </p>
              )}
            </div>
          </div>

          {/* Middle Tier: 5-Column Directory */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3.5">راهکارهای تخصصی</h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                {SOLUTION_PAGES.map((sp) => (
                  <li key={sp.id}>
                    <button
                      type="button"
                      onClick={() => onOpenPublicPage('solutions', sp.id)}
                      className="text-right hover:text-[#4F8CFF] transition-colors cursor-pointer"
                    >
                      {sp.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3.5">فضای کاری کاوی</h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                {(
                  [
                    { label: 'مدیریت شبکه‌های اجتماعی', section: 'social' },
                    { label: 'چت هوشمند Kavi Chat', section: 'chat' },
                    { label: 'استودیو تصویر و ویدیو', section: 'studio' },
                    { label: 'ایجنت‌های خودکار', section: 'agents' },
                    { label: 'محیط کدنویسی Kavi Code', section: 'code' },
                    { label: 'پورتال API توسعه‌دهندگان', section: 'api' },
                  ] as const
                ).map((item) => (
                  <li key={item.section}>
                    <button
                      type="button"
                      onClick={() =>
                        isAuthenticated
                          ? onEnterWorkspace(item.section)
                          : onStartAuth('register')
                      }
                      className="text-right hover:text-[#4F8CFF] transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3.5">بخش‌های محصول</h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                <li>
                  <a href="#models" className="hover:text-[#4F8CFF] transition-colors">
                    مدل‌های هوش مصنوعی
                  </a>
                </li>
                <li>
                  <a href="#kavi-agents" className="hover:text-[#4F8CFF] transition-colors">
                    دموی چهار ایجنت کاوی
                  </a>
                </li>
                <li>
                  <a href="#video-showcase" className="hover:text-[#4F8CFF] transition-colors">
                    نمونه ریلز و ویدیوها
                  </a>
                </li>
                <li>
                  <a href="#image-maker" className="hover:text-[#4F8CFF] transition-colors">
                    عکس‌ساز هوشمند
                  </a>
                </li>
                <li>
                  <a href="#story-maker" className="hover:text-[#4F8CFF] transition-colors">
                    استوری‌ساز ۹:۱۶
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[#4F8CFF] transition-colors">
                    تعرفه‌ها و پلن‌ها
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-3.5">منابع و پشتیبانی</h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPublicPage('blog')}
                    className="hover:text-[#4F8CFF] transition-colors cursor-pointer"
                  >
                    بلاگ مهندسی کاوی
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPublicPage('docs')}
                    className="hover:text-[#4F8CFF] transition-colors cursor-pointer"
                  >
                    راهنمای اتصال و مستندات
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPublicPage('legal')}
                    className="hover:text-[#4F8CFF] transition-colors cursor-pointer"
                  >
                    قوانین و حریم خصوصی
                  </button>
                </li>
                <li>
                  <a href="#capabilities" className="hover:text-[#4F8CFF] transition-colors">
                    مقایسه ابزارها و مصرف کردیت
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onStartAuth('login')}
                    className="hover:text-[#4F8CFF] transition-colors cursor-pointer"
                  >
                    ورود به حساب کاربری
                  </button>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3.5">ارتباط و شبکه‌ها</h3>
              <ul className="space-y-2.5 text-slate-600 dark:text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText('hello@kaviai.ir');
                        setCopiedFooterEmail(true);
                        setTimeout(() => setCopiedFooterEmail(false), 1800);
                      } catch {
                        // ignore clipboard restriction
                      }
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[#4F8CFF] transition-colors cursor-pointer font-mono"
                    dir="ltr"
                  >
                    <Copy className="w-3 h-3 shrink-0" />
                    <span>{copiedFooterEmail ? 'Copied: hello@kaviai.ir' : 'hello@kaviai.ir'}</span>
                  </button>
                </li>
                <li dir="ltr" className="text-right font-mono text-slate-500 dark:text-slate-400">
                  https://kaviai.ir
                </li>
                <li className="inline-flex items-start gap-1.5 leading-5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                  <span>تهران · مرکز نوآوری هوش مصنوعی</span>
                </li>
                <li className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      isAuthenticated ? onEnterWorkspace('social') : onStartAuth('register', '', 'social')
                    }
                    aria-label="اینستاگرام کاوی"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#4F8CFF]/60 hover:text-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span dir="ltr">@kaviai.ir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isAuthenticated ? onEnterWorkspace('social') : onStartAuth('register', '', 'social')
                    }
                    aria-label="توییتر کاوی"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-[#4F8CFF]/60 hover:text-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    <span dir="ltr">@kaviai_ir</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Tier: Copyright & Clean Utility Links */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="text-center sm:text-right">
              © ۱۴۰۵ کاوی (<span dir="ltr" className="font-mono">kaviai.ir</span>) · تمامی حقوق محفوظ است · کارتو به کاوی بسپار
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onOpenPublicPage('legal')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                حریم خصوصی و امنیت
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onOpenPublicPage('docs')}
                className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                مستندات API
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1 hover:text-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>بازگشت به بالا</span>
                <ArrowUp className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};
