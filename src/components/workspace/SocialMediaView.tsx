import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  FileText,
  Hash,
  Heart,
  Instagram,
  Loader2,
  MessageCircle,
  Plus,
  Repeat2,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Twitter,
} from 'lucide-react';
import type {
  SocialPostFormat,
  SocialPostItem,
  SocialPostStatus,
  SocialPlatform,
} from '../../types/vorta';
import { SOCIAL_ANALYTICS_30D, SOCIAL_ANALYTICS_7D } from '../../data/seedData';
import { formatNumber } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

interface SocialMediaViewProps {
  posts: SocialPostItem[];
  geminiServerReady: boolean;
  initialPrompt?: string;
  onConsumeInitialPrompt: () => void;
  onCreatePost: (post: SocialPostItem) => void;
  onUpdatePost: (id: string, updater: (prev: SocialPostItem) => SocialPostItem) => void;
  onDeletePost: (id: string) => void;
}

type SocialSubTab = 'schedule' | 'draft' | 'analytics';

const PLATFORM_FORMATS: Record<SocialPlatform, Array<{ id: SocialPostFormat; label: string }>> = {
  instagram: [
    { id: 'reel', label: 'ریلز ۹:۱۶' },
    { id: 'carousel', label: 'پست اسلایدی' },
    { id: 'story', label: 'استوری ۹:۱۶' },
  ],
  twitter: [
    { id: 'tweet', label: 'توییت کوتاه' },
    { id: 'thread', label: 'رشته‌توییت' },
  ],
};

const TONE_OPTIONS = [
  'حرفه‌ای و تخصصی',
  'صمیمی و تعاملی',
  'خبری و کوتاه',
  'فروش و دعوت به اقدام (CTA)',
];

const QUICK_HASHTAGS: Record<SocialPlatform, string[]> = {
  instagram: ['کارتو_به_کاوی_بسپار', 'kaviai', 'هوش_مصنوعی_فارسی', 'دیجیتال_مارکتینگ', 'تولید_محتوا'],
  twitter: ['kaviai', 'هوش_مصنوعی', 'استارتاپ', 'توییتر_فارسی', 'اتوماسیون'],
};

const SAMPLE_MEDIA_OPTIONS = [
  { id: 'none', label: 'بدون تصویر (متنی)', url: '' },
  {
    id: 'reel_cover',
    label: 'کاور ریلز محصول (۹:۱۶)',
    url: '/src/assets/images/vorta_reel_perfume_1795254371745.jpg',
  },
  {
    id: 'studio_shot',
    label: 'عکاسی محصول استودیویی',
    url: '/src/assets/images/vorta_img_studio_headphones_1795254854363.jpg',
  },
  {
    id: 'story_launch',
    label: 'استوری معرفی قابلیت',
    url: '/src/assets/images/vorta_story_launch_hook_1795254855912.jpg',
  },
];

const STATUS_LABEL: Record<SocialPostStatus, string> = {
  scheduled: 'زمان‌بندی‌شده',
  awaiting_approval: 'منتظر تأیید شما',
  published_demo: 'منتشرشده (دمو)',
  draft: 'پیش‌نویس',
};

const FORMAT_LABEL: Record<SocialPostFormat, string> = {
  reel: 'ریلز ۹:۱۶',
  carousel: 'اسلایدی',
  story: 'استوری ۹:۱۶',
  tweet: 'توییت',
  thread: 'رشته‌توییت',
};

function buildFallbackCaption(
  platform: SocialPlatform,
  format: SocialPostFormat,
  topic: string,
  tone: string
): { caption: string; hashtags: string[] } {
  const cleanTopic = topic.trim() || 'معرفی دستیار هوشمند کاوی در kaviai.ir';
  if (platform === 'twitter') {
    const prefix = format === 'thread' ? '۱/۴ ' : '';
    const text =
      tone === 'خبری و کوتاه'
        ? `${prefix}${cleanTopic} — همین حالا با ایجنت کاوی زمان‌بندی و تحلیل عملکرد خودکار را فعال کنید: kaviai.ir`
        : `${prefix}اگر زمان زیادی صرف نوشتن کپشن و زمان‌بندی پست‌ها می‌کنید، روی «${cleanTopic}» با کاوی تمرکز کنید؛ پیش‌نویس، هشتگ و تقویم آماده در چند ثانیه.`;
    return {
      caption: text.slice(0, 260),
      hashtags: ['kaviai', 'هوش_مصنوعی', 'توییتر_فارسی'],
    };
  }
  const hook =
    format === 'reel'
      ? 'در ۳۰ ثانیه ببینید چطور کارهای روزانه برندتان خودکار می‌شود:'
      : format === 'story'
      ? 'یک نظر سریع بده تا قالب آماده برایت ارسال شود:'
      : 'این پست را ذخیره کن تا در استراتژی محتوای این هفته استفاده کنی:';
  return {
    caption: `${hook}\n\n${cleanTopic}\n\nبا ایجنت مدیریت شبکه‌های اجتماعی کاوی (kaviai.ir)، لحن برندتان را یکپارچه نگه دارید، بهترین زمان انتشار را انتخاب کنید و نرخ تعامل واقعی را دنبال کنید. کارتو به کاوی بسپار.`,
    hashtags: ['کارتو_به_کاوی_بسپار', 'مدیریت_اینستاگرام', 'تولید_محتوا', 'kaviai'],
  };
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({
  posts,
  geminiServerReady,
  initialPrompt,
  onConsumeInitialPrompt,
  onCreatePost,
  onUpdatePost,
  onDeletePost,
}) => {
  const [activeTab, setActiveTab] = useState<SocialSubTab>('schedule');
  const [igConnected, setIgConnected] = useState(true);
  const [twConnected, setTwConnected] = useState(true);

  // Queue Filters
  const [queuePlatformFilter, setQueuePlatformFilter] = useState<'all' | SocialPlatform>('all');
  const [queueStatusFilter, setQueueStatusFilter] = useState<'all' | SocialPostStatus>('all');

  // Composer / Caption Drafter State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [format, setFormat] = useState<SocialPostFormat>('reel');
  const [tone, setTone] = useState<string>(TONE_OPTIONS[1]);
  const [topic, setTopic] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>(['کارتو_به_کاوی_بسپار', 'kaviai']);
  const [customTag, setCustomTag] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('2026-11-26');
  const [scheduledTime, setScheduledTime] = useState<string>('19:00');
  const [requireApproval, setRequireApproval] = useState<boolean>(true);
  const [mediaUrl, setMediaUrl] = useState<string>(SAMPLE_MEDIA_OPTIONS[1].url);
  const [isDraftingAI, setIsDraftingAI] = useState<boolean>(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Analytics Filters
  const [analyticsPlatform, setAnalyticsPlatform] = useState<'all' | SocialPlatform>('all');
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setTopic(initialPrompt.trim());
      if (/توییتر|ایکس|twitter|توییت/i.test(initialPrompt)) {
        setPlatform('twitter');
        setFormat('tweet');
        setMediaUrl('');
      } else {
        setPlatform('instagram');
        setFormat('reel');
      }
      setActiveTab('draft');
      onConsumeInitialPrompt();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  const handlePlatformSwitch = (next: SocialPlatform) => {
    setPlatform(next);
    const validFormats = PLATFORM_FORMATS[next];
    if (!validFormats.some((f) => f.id === format)) {
      setFormat(validFormats[0].id);
    }
    if (next === 'twitter' && mediaUrl === SAMPLE_MEDIA_OPTIONS[1].url) {
      setMediaUrl('');
    }
  };

  const toggleHashtag = (tag: string) => {
    const normalized = tag.replace(/^#/, '').trim();
    if (!normalized) return;
    setHashtags((prev) =>
      prev.includes(normalized) ? prev.filter((t) => t !== normalized) : [...prev, normalized]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customTag.replace(/^#/, '').replace(/\s+/g, '_').trim();
    if (!cleaned) return;
    if (!hashtags.includes(cleaned)) {
      setHashtags((prev) => [...prev, cleaned]);
    }
    setCustomTag('');
  };

  const handleGenerateCaptionAI = async () => {
    const cleanTopic = topic.trim() || 'معرفی قابلیت‌های اتوماسیون هوشمند کاوی';
    setIsDraftingAI(true);
    setDraftNotice(null);

    const charRule =
      platform === 'twitter'
        ? 'حداکثر ۲۴۰ کاراکتر بنویس تا برای توییتر جا بماند.'
        : 'کپشن جذاب اینستاگرام با قلاب خط اول، متن اصلی کوتاه و دعوت به اقدام (CTA) در پایان بنویس.';

    const aiPrompt = `به عنوان ایجنت شبکه‌های اجتماعی کاوی (kaviai.ir)، یک پیش‌نویس آماده انتشار به زبان فارسی بنویس.
پلتفرم: ${platform === 'instagram' ? 'اینستاگرام' : 'توییتر / X'}
فرمت: ${FORMAT_LABEL[format]}
لحن: ${tone}
موضوع: ${cleanTopic}
${charRule}
فقط متن اصلی کپشن را برگردان (بدون مقدمه یا توضیح اضافه) و در خط آخر ۳ تا ۴ هشتگ مرتبط بنویس.`;

    if (!geminiServerReady) {
      const fb = buildFallbackCaption(platform, format, cleanTopic, tone);
      setCaption(fb.caption);
      setHashtags(fb.hashtags);
      setDraftNotice('پیش‌نویس با موتور نمونه دمو آماده شد (تنظیم کلید Gemini روی سرور برای خروجی زنده فعال نیست).');
      setIsDraftingAI(false);
      return;
    }

    try {
      const response = await fetch('/api/gateway/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'gemini-4-hydrogen',
          messages: [{ role: 'user', content: aiPrompt }],
          fastMode: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('gateway unavailable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const payload = JSON.parse(line.slice(5).trim()) as {
            type: 'delta' | 'done' | 'error';
            text?: string;
          };
          if (payload.type === 'delta' && payload.text) {
            accumulated += payload.text;
            setCaption(accumulated.trim());
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error('empty output');
      }

      // Extract hashtags if model included them in text
      const extractedTags = Array.from(accumulated.matchAll(/#([\p{L}\p{N}_]+)/gu)).map((m) => m[1]);
      if (extractedTags.length > 0) {
        setHashtags(extractedTags.slice(0, 6));
        setCaption(accumulated.replace(/#[\p{L}\p{N}_]+/gu, '').trim());
      }
      setDraftNotice('کپشن با مدل زنده کاوی تولید شد و آماده پیش‌نمایش یا زمان‌بندی است.');
    } catch {
      const fb = buildFallbackCaption(platform, format, cleanTopic, tone);
      setCaption(fb.caption);
      setHashtags(fb.hashtags);
      setDraftNotice('پاسخ زنده در دسترس نبود؛ پیش‌نویس با قالب نمونه دمو ساخته شد.');
    } finally {
      setIsDraftingAI(false);
    }
  };

  const resetComposer = () => {
    setEditingPostId(null);
    setTopic('');
    setCaption('');
    setDraftNotice(null);
  };

  const handleSavePost = (mode: 'draft' | 'schedule') => {
    const cleanCaption = caption.trim();
    if (!cleanCaption) {
      setDraftNotice('لطفاً ابتدا متن کپشن را بنویسید یا با هوش مصنوعی تولید کنید.');
      return;
    }

    const nextStatus: SocialPostStatus =
      mode === 'draft'
        ? 'draft'
        : requireApproval
        ? 'awaiting_approval'
        : 'scheduled';

    if (editingPostId) {
      onUpdatePost(editingPostId, (prev) => ({
        ...prev,
        platform,
        format,
        tone,
        topic: topic.trim() || cleanCaption.slice(0, 48),
        caption: cleanCaption,
        hashtags: [...hashtags],
        scheduledDate,
        scheduledTime,
        requireApproval,
        mediaUrl: mediaUrl || undefined,
        status: nextStatus,
      }));
      setEditingPostId(null);
    } else {
      const created: SocialPostItem = {
        id: `soc_${Date.now()}`,
        platform,
        format,
        tone,
        topic: topic.trim() || cleanCaption.slice(0, 48),
        caption: cleanCaption,
        hashtags: [...hashtags],
        scheduledDate,
        scheduledTime,
        requireApproval,
        mediaUrl: mediaUrl || undefined,
        status: nextStatus,
      };
      onCreatePost(created);
    }

    setTopic('');
    setCaption('');
    setDraftNotice(null);
    setActiveTab('schedule');
  };

  const handleEditInComposer = (post: SocialPostItem) => {
    setEditingPostId(post.id);
    setPlatform(post.platform);
    setFormat(post.format);
    setTone(post.tone);
    setTopic(post.topic);
    setCaption(post.caption);
    setHashtags(post.hashtags);
    setScheduledDate(post.scheduledDate);
    setScheduledTime(post.scheduledTime);
    setRequireApproval(post.requireApproval);
    setMediaUrl(post.mediaUrl || '');
    setDraftNotice('در حال ویرایش پست انتخاب‌شده هستید.');
    setActiveTab('draft');
  };

  const handleApproveAndPublishDemo = (postId: string) => {
    onUpdatePost(postId, (prev) => ({
      ...prev,
      status: 'published_demo',
      requireApproval: false,
      metrics: prev.metrics ?? {
        impressions: prev.platform === 'instagram' ? 9450 : 6180,
        likes: prev.platform === 'instagram' ? 740 : 395,
        comments: prev.platform === 'instagram' ? 84 : 39,
        sharesOrRetweets: prev.platform === 'instagram' ? 162 : 128,
        savesOrBookmarks: prev.platform === 'instagram' ? 410 : 245,
        clicks: prev.platform === 'instagram' ? 280 : 196,
      },
    }));
  };

  const handleCopyCaption = async (id: string, text: string, tags: string[]) => {
    const full = `${text}\n\n${tags.map((t) => `#${t}`).join(' ')}`.trim();
    try {
      await navigator.clipboard.writeText(full);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // clipboard blocked
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (queuePlatformFilter !== 'all' && p.platform !== queuePlatformFilter) return false;
      if (queueStatusFilter !== 'all' && p.status !== queueStatusFilter) return false;
      return true;
    });
  }, [posts, queuePlatformFilter, queueStatusFilter]);

  const charLimit = platform === 'twitter' ? 280 : 2200;
  const fullPreviewLength =
    caption.length + (hashtags.length > 0 ? hashtags.map((h) => `#${h}`).join(' ').length + 2 : 0);
  const charOverLimit = fullPreviewLength > charLimit;

  // Analytics Computation
  const analyticsSeries = analyticsRange === '7d' ? SOCIAL_ANALYTICS_7D : SOCIAL_ANALYTICS_30D;
  const publishedPosts = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.status === 'published_demo' &&
          p.metrics &&
          (analyticsPlatform === 'all' || p.platform === analyticsPlatform)
      ),
    [posts, analyticsPlatform]
  );

  const kpiSummary = useMemo(() => {
    const seriesReachIg = analyticsSeries.reduce((s, d) => s + d.instagramReach, 0);
    const seriesImpTw = analyticsSeries.reduce((s, d) => s + d.twitterImpressions, 0);
    const postBonusImpressions = publishedPosts.reduce((s, p) => s + (p.metrics?.impressions ?? 0), 0);

    const totalImpressions =
      analyticsPlatform === 'instagram'
        ? seriesReachIg + postBonusImpressions
        : analyticsPlatform === 'twitter'
        ? seriesImpTw + postBonusImpressions
        : seriesReachIg + seriesImpTw + postBonusImpressions;

    const avgEng =
      analyticsSeries.reduce((s, d) => {
        if (analyticsPlatform === 'instagram') return s + d.instagramEngagementPct;
        if (analyticsPlatform === 'twitter') return s + d.twitterEngagementPct;
        return s + (d.instagramEngagementPct + d.twitterEngagementPct) / 2;
      }, 0) / analyticsSeries.length;

    const totalSavesOrRetweets = publishedPosts.reduce(
      (s, p) => s + (p.metrics?.savesOrBookmarks ?? 0) + (p.metrics?.sharesOrRetweets ?? 0),
      0
    );
    const totalClicks = publishedPosts.reduce((s, p) => s + (p.metrics?.clicks ?? 0), 0);

    return {
      totalImpressions,
      avgEngagementPct: Number(avgEng.toFixed(1)),
      totalSavesOrRetweets,
      totalClicks,
    };
  }, [analyticsSeries, analyticsPlatform, publishedPosts]);

  const maxChartValue = useMemo(() => {
    let maxVal = 1;
    for (const d of analyticsSeries) {
      if (analyticsPlatform !== 'twitter') maxVal = Math.max(maxVal, d.instagramReach);
      if (analyticsPlatform !== 'instagram') maxVal = Math.max(maxVal, d.twitterImpressions);
    }
    return maxVal;
  }, [analyticsSeries, analyticsPlatform]);

  const scheduledCount = posts.filter((p) => p.status === 'scheduled' || p.status === 'awaiting_approval').length;
  const awaitingCount = posts.filter((p) => p.status === 'awaiting_approval').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Module Header & Connected Accounts */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#4F8CFF]">
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ایجنت شبکه‌های اجتماعی کاوی</span>
              </span>
              <span aria-hidden="true">·</span>
              <StatusText status="demo" />
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatNumber(scheduledCount)} پست در صف</span>
              {awaitingCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium tabular-nums">
                    {formatNumber(awaitingCount)} منتظر تأیید
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              مدیریت اینستاگرام و توییتر / X
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              تولید کپشن با هوش مصنوعی، زمان‌بندی انتشار با کنترل انسانی و تحلیل عملکرد هر دو شبکه در یک میز کار.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIgConnected((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                igConnected
                  ? 'border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-slate-500'
              }`}
            >
              <Instagram className="w-3.5 h-3.5 shrink-0" />
              <span dir="ltr">@kaviai.ir</span>
              <span aria-hidden="true">·</span>
              <span>{igConnected ? 'متصل (دمو)' : 'قطع‌شده'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTwConnected((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                twConnected
                  ? 'border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-slate-500'
              }`}
            >
              <Twitter className="w-3.5 h-3.5 shrink-0" />
              <span dir="ltr">@kaviai_ir</span>
              <span aria-hidden="true">·</span>
              <span>{twConnected ? 'متصل (دمو)' : 'قطع‌شده'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="بخش‌های مدیریت شبکه‌های اجتماعی"
            className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#151B2B]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'schedule'}
              onClick={() => setActiveTab('schedule')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'schedule'
                  ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5 text-[#4F8CFF]" />
              <span>تقویم و صف انتشار</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'draft'}
              onClick={() => setActiveTab('draft')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'draft'
                  ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#875BFF]" />
              <span>کپشن‌ساز و پیش‌نمایش</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
              <span>آنالیتیکس اینستاگرام و توییتر</span>
            </button>
          </div>

          {activeTab !== 'draft' && (
            <button
              type="button"
              onClick={() => {
                resetComposer();
                setActiveTab('draft');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ساخت و زمان‌بندی پست جدید</span>
            </button>
          )}
        </div>
      </section>

      {/* TAB 1: POST SCHEDULER & QUEUE */}
      {activeTab === 'schedule' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
              {(
                [
                  { id: 'all', label: 'همه شبکه‌ها' },
                  { id: 'instagram', label: 'اینستاگرام' },
                  { id: 'twitter', label: 'توییتر / X' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQueuePlatformFilter(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    queuePlatformFilter === item.id
                      ? 'bg-[#4F8CFF] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B2B]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
              {(
                [
                  { id: 'all', label: 'همه وضعیت‌ها' },
                  { id: 'awaiting_approval', label: 'منتظر تأیید' },
                  { id: 'scheduled', label: 'زمان‌بندی‌شده' },
                  { id: 'published_demo', label: 'منتشرشده' },
                  { id: 'draft', label: 'پیش‌نویس' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setQueueStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    queueStatusFilter === st.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B2B]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                پستی مطابق این فیلتر در صف وجود ندارد.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                می‌توانید فیلترها را بازنشانی کنید یا اولین پست خود را در بخش کپشن‌ساز زمان‌بندی نمایید.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('draft')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3d7bf2] cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن پست جدید</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPosts.map((post) => {
                const isIg = post.platform === 'instagram';
                const statusColor =
                  post.status === 'published_demo'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : post.status === 'awaiting_approval'
                    ? 'text-amber-600 dark:text-amber-400'
                    : post.status === 'scheduled'
                    ? 'text-[#4F8CFF]'
                    : 'text-slate-500 dark:text-slate-400';

                return (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                          {isIg ? (
                            <Instagram className="w-4 h-4 text-fuchsia-500 shrink-0" />
                          ) : (
                            <Twitter className="w-4 h-4 text-sky-500 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {isIg ? 'اینستاگرام' : 'توییتر / X'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="whitespace-nowrap">{FORMAT_LABEL[post.format]}</span>
                          <span aria-hidden="true">·</span>
                          <span className={`font-semibold whitespace-nowrap ${statusColor}`}>
                            {STATUS_LABEL[post.status]}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0" dir="ltr">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          <span>{post.scheduledDate}</span>
                          <span>{post.scheduledTime}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {post.mediaUrl && (
                          <div className="w-16 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-[#151B2B]">
                            <img
                              src={post.mediaUrl}
                              alt={post.topic}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <h2 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {post.topic}
                          </h2>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-6 line-clamp-3">
                            {post.caption}
                          </p>
                        </div>
                      </div>

                      {post.hashtags.length > 0 && (
                        <div className="text-[11px] text-[#4F8CFF] truncate" dir="rtl">
                          {post.hashtags.map((h) => `#${h}`).join('  ')}
                        </div>
                      )}

                      {post.status === 'published_demo' && post.metrics && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>بازدید: {formatNumber(post.metrics.impressions)}</span>
                          <span aria-hidden="true">·</span>
                          <span>لایک: {formatNumber(post.metrics.likes)}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {isIg ? 'ذخیره' : 'ریتوییت'}:{' '}
                            {formatNumber(isIg ? post.metrics.savesOrBookmarks : post.metrics.sharesOrRetweets)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>کلیک: {formatNumber(post.metrics.clicks)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {(post.status === 'awaiting_approval' || post.status === 'scheduled') && (
                          <button
                            type="button"
                            onClick={() => handleApproveAndPublishDemo(post.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تأیید و انتشار (دمو)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEditInComposer(post)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>ویرایش</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyCaption(post.id, post.caption, post.hashtags)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedId === post.id ? 'کپی شد' : 'کپی'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeletePost(post.id)}
                        aria-label={`حذف ${post.topic}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: CAPTION DRAFTER + LIVE PREVIEW */}
      {activeTab === 'draft' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left/Right Main Composer (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPostId ? 'ویرایش و زمان‌بندی مجدد پست' : 'کپشن‌ساز هوشمند و زمان‌بندی'}
              </h2>
              {editingPostId && (
                <button
                  type="button"
                  onClick={resetComposer}
                  className="text-xs text-slate-500 hover:text-[#4F8CFF] cursor-pointer whitespace-nowrap"
                >
                  انصراف از ویرایش
                </button>
              )}
            </div>

            {/* Platform + Format Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  پلتفرم مقصد
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlatformSwitch('instagram')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      platform === 'instagram'
                        ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Instagram className="w-4 h-4 shrink-0" />
                    <span>اینستاگرام</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePlatformSwitch('twitter')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      platform === 'twitter'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Twitter className="w-4 h-4 shrink-0" />
                    <span>توییتر / X</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="social-format-select"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  فرمت محتوا
                </label>
                <div id="social-format-select" className="flex flex-wrap gap-1.5">
                  {PLATFORM_FORMATS[platform].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        format === f.id
                          ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#4F8CFF] font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topic + Tone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label
                  htmlFor="social-topic-input"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  موضوع یا ایده پست
                </label>
                <input
                  id="social-topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثلاً: معرفی دستیار سئو کاوی برای فروشگاه‌های آنلاین..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="social-tone-select"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  لحن نگارش
                </label>
                <select
                  id="social-tone-select"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Generate Action */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={isDraftingAI}
                onClick={handleGenerateCaptionAI}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-l from-[#4F8CFF] to-[#875BFF] hover:opacity-95 disabled:opacity-60 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
              >
                {isDraftingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {isDraftingAI ? 'در حال نگارش کپشن...' : 'تولید کپشن و هشتگ با هوش مصنوعی'}
                </span>
              </button>

              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {geminiServerReady
                  ? 'متصل به مدل زنده کاوی (Gemini 4 Hydrogen)'
                  : 'پیش‌نویس هوشمند دمو (بدون کلید سرور)'}
              </span>
            </div>

            {draftNotice && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3.5 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                {draftNotice}
              </div>
            )}

            {/* Caption Editor + Character Limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="social-caption-textarea"
                  className="font-semibold text-slate-600 dark:text-slate-300"
                >
                  متن کپشن / توییت
                </label>
                <span
                  className={`font-mono tabular-nums ${
                    charOverLimit
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  dir="ltr"
                >
                  {formatNumber(fullPreviewLength)} / {formatNumber(charLimit)}
                </span>
              </div>
              <textarea
                id="social-caption-textarea"
                rows={5}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="متن کپشن یا توییت را بنویسید یا از دکمه تولید هوشمند بالا استفاده کنید..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3.5 py-3 text-xs sm:text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Hash className="w-3.5 h-3.5 text-[#4F8CFF]" />
                  <span>هشتگ‌های پیشنهادی (برای انتخاب کلیک کنید)</span>
                </span>
                <form onSubmit={handleAddCustomTag} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="هشتگ جدید..."
                    className="w-28 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#4F8CFF]"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:border-[#4F8CFF] cursor-pointer whitespace-nowrap"
                  >
                    افزودن
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set([...QUICK_HASHTAGS[platform], ...hashtags])).map((tag) => {
                  const selected = hashtags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleHashtag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        selected
                          ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/40'
                          : 'bg-slate-100 dark:bg-[#151B2B] text-slate-600 dark:text-slate-400 border border-transparent'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media + Date/Time + Approval */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <label
                  htmlFor="social-media-select"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  رسانه پیوست (نمونه)
                </label>
                <select
                  id="social-media-select"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                >
                  {SAMPLE_MEDIA_OPTIONS.map((m) => (
                    <option key={m.id} value={m.url}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="social-date-input"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  تاریخ انتشار
                </label>
                <input
                  id="social-date-input"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="social-time-input"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  ساعت (تهران)
                </label>
                <input
                  id="social-time-input"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="rounded border-slate-300 text-[#4F8CFF]"
                />
                <span>پیش از انتشار نهایی، تأیید صریح من گرفته شود</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePost('draft')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-[#4F8CFF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  ذخیره پیش‌نویس
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePost('schedule')}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3d7bf2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingPostId ? 'به‌روزرسانی زمان‌بندی' : 'زمان‌بندی در صف انتشار'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Platform Preview Card (5 cols) */}
          <aside className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                پیش‌نمایش زنده در {platform === 'instagram' ? 'اینستاگرام' : 'توییتر / X'}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {FORMAT_LABEL[format]}
              </span>
            </div>

            {platform === 'instagram' ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D18] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4F8CFF] to-[#875BFF] flex items-center justify-center text-white text-xs font-bold">
                      ک
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white" dir="ltr">
                        kaviai.ir
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        تهران · زمان‌بندی {scheduledTime}
                      </div>
                    </div>
                  </div>
                  <Instagram className="w-4 h-4 text-fuchsia-500" />
                </div>

                {mediaUrl ? (
                  <div className="aspect-[4/3] w-full bg-slate-200 dark:bg-[#151B2B] overflow-hidden">
                    <img
                      src={mediaUrl}
                      alt={topic || 'پیش‌نمایش پست اینستاگرام'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] w-full bg-gradient-to-br from-[#4F8CFF]/15 to-[#875BFF]/15 flex items-center justify-center p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    بدون تصویر انتخاب‌شده — پست متنی / ریلز از استودیو
                  </div>
                )}

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4" />
                      <MessageCircle className="w-4 h-4" />
                      <Send className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-slate-400">پیش‌نمایش تعامل</span>
                  </div>
                  <p className="text-xs leading-6 text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {caption.trim() ||
                      'متن کپشن اینستاگرام شما به صورت زنده در این بخش نمایش داده می‌شود...'}
                  </p>
                  {hashtags.length > 0 && (
                    <p className="text-xs text-[#4F8CFF] leading-5">
                      {hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D18] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4F8CFF] to-[#875BFF] flex items-center justify-center text-white text-xs font-bold">
                      ک
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        کاوی | Kavi AI
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">
                        @kaviai_ir
                      </div>
                    </div>
                  </div>
                  <Twitter className="w-4 h-4 text-sky-500" />
                </div>

                <p className="text-xs sm:text-sm leading-7 text-slate-900 dark:text-slate-100 whitespace-pre-line">
                  {caption.trim() || 'متن توییت یا رشته‌توییت شما اینجا نمایش داده می‌شود...'}
                </p>

                {hashtags.length > 0 && (
                  <p className="text-xs text-sky-500 leading-5">
                    {hashtags.map((h) => `#${h}`).join(' ')}
                  </p>
                )}

                {mediaUrl && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[16/9]">
                    <img
                      src={mediaUrl}
                      alt={topic || 'پیش‌نمایش تصویر توییت'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>پاسخ</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span>ریتوییت</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>پسند</span>
                  </span>
                  <span dir="ltr">
                    {scheduledDate} · {scheduledTime}
                  </span>
                </div>
              </div>
            )}

            {charOverLimit && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                تعداد کاراکترها از سقف مجاز {platform === 'twitter' ? '۲۸۰ کاراکتر توییتر' : '۲۲۰۰ کاراکتر اینستاگرام'} بیشتر است.
              </p>
            )}
          </aside>
        </section>
      )}

      {/* TAB 3: PERFORMANCE ANALYTICS (INSTAGRAM & TWITTER) */}
      {activeTab === 'analytics' && (
        <section className="space-y-6">
          {/* Analytics Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
              {(
                [
                  { id: 'all', label: 'مقایسه هر دو پلتفرم' },
                  { id: 'instagram', label: 'اینستاگرام' },
                  { id: 'twitter', label: 'توییتر / X' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAnalyticsPlatform(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    analyticsPlatform === item.id
                      ? 'bg-[#4F8CFF] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B2B]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAnalyticsRange('7d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                    analyticsRange === '7d'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ۷ روز گذشته
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsRange('30d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                    analyticsRange === '30d'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ۳۰ روز گذشته
                </button>
              </div>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">ایمپرشن و دسترسی کل</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatNumber(kpiSummary.totalImpressions)}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                +۱۸.۴٪ نسبت به دوره قبل (دمو)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">میانگین نرخ تعامل</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {kpiSummary.avgEngagementPct.toLocaleString('fa-IR')}٪
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                نسبت لایک، نظر و ذخیره به بازدید
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">ذخیره و ریتوییت پست‌ها</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatNumber(kpiSummary.totalSavesOrRetweets)}
              </div>
              <div className="text-xs text-[#4F8CFF] tabular-nums">
                از {formatNumber(publishedPosts.length)} پست منتشرشده
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">کلیک روی لینک و پروفایل</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {formatNumber(kpiSummary.totalClicks)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                هدایت ترافیک به kaviai.ir
              </div>
            </div>
          </div>

          {/* Comparison Bar Chart + Channel Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    روند دسترسی و ایمپرشن روزانه ({analyticsRange === '7d' ? '۷ روز اخیر' : '۴ هفته اخیر'})
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    مقایسه عملکرد محتوای اینستاگرام و توییتر / X در بازه انتخابی (داده‌های نمونه دمو)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  {analyticsPlatform !== 'twitter' && (
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#875BFF] inline-block" />
                      <span>اینستاگرام</span>
                    </span>
                  )}
                  {analyticsPlatform !== 'instagram' && (
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#4F8CFF] inline-block" />
                      <span>توییتر / X</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 border-b border-slate-200 dark:border-slate-800 pb-2">
                {analyticsSeries.map((bucket) => {
                  const igPct = Math.max(8, Math.round((bucket.instagramReach / maxChartValue) * 100));
                  const twPct = Math.max(8, Math.round((bucket.twitterImpressions / maxChartValue) * 100));
                  return (
                    <div
                      key={bucket.dayLabel}
                      className="flex-1 h-full flex flex-col items-center justify-end gap-2 min-w-0"
                    >
                      <div className="w-full flex-1 flex items-end justify-center gap-1 sm:gap-1.5">
                        {analyticsPlatform !== 'twitter' && (
                          <div
                            title={`اینستاگرام (${bucket.dayLabel}): ${formatNumber(bucket.instagramReach)}`}
                            style={{ height: `${igPct}%` }}
                            className="w-3 sm:w-5 rounded-t-md bg-[#875BFF] transition-opacity hover:opacity-85"
                          />
                        )}
                        {analyticsPlatform !== 'instagram' && (
                          <div
                            title={`توییتر (${bucket.dayLabel}): ${formatNumber(bucket.twitterImpressions)}`}
                            style={{ height: `${twPct}%` }}
                            className="w-3 sm:w-5 rounded-t-md bg-[#4F8CFF] transition-opacity hover:opacity-85"
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                        {bucket.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                {analyticsSeries.slice(-4).map((b) => (
                  <div
                    key={b.dayLabel}
                    className="rounded-xl bg-slate-50 dark:bg-[#151B2B] px-3 py-2 space-y-0.5"
                  >
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{b.dayLabel}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      IG: {formatNumber(b.instagramReach)} · X: {formatNumber(b.twitterImpressions)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Summary Cards */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Instagram className="w-4 h-4 text-fuchsia-500" />
                    <span>عملکرد اینستاگرام</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                    @kaviai.ir
                  </span>
                </div>
                <div className="space-y-2 text-xs tabular-nums">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">فرمت پربازده</span>
                    <span className="font-semibold">اسلایدی و ریلز ۹:۱۶</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">بهترین ساعت انتشار</span>
                    <span className="font-semibold" dir="ltr">18:30 – 20:30</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">نرخ ذخیره میانگین</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">۳.۷٪</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Twitter className="w-4 h-4 text-sky-500" />
                    <span>عملکرد توییتر / X</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                    @kaviai_ir
                  </span>
                </div>
                <div className="space-y-2 text-xs tabular-nums">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">فرمت پربازده</span>
                    <span className="font-semibold">رشته‌توییت‌های ۵ بخشی</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">بهترین ساعت انتشار</span>
                    <span className="font-semibold" dir="ltr">20:00 – 22:00</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">نرخ کلیک لینک</span>
                    <span className="font-semibold text-[#4F8CFF]">۳.۳٪</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Posts Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                پست‌های منتشرشده با بیشترین تعامل
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {formatNumber(publishedPosts.length)} مورد ثبت‌شده
              </span>
            </div>

            {publishedPosts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                هنوز پست منتشرشده‌ای در این پلتفرم ثبت نشده است. از تب «تقویم و صف انتشار» یک پست را تأیید و منتشر کنید.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-[#151B2B] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">پلتفرم و موضوع</th>
                      <th className="py-3 px-4 font-semibold">فرمت</th>
                      <th className="py-3 px-4 font-semibold">ایمپرشن</th>
                      <th className="py-3 px-4 font-semibold">لایک</th>
                      <th className="py-3 px-4 font-semibold">ذخیره / ریتوییت</th>
                      <th className="py-3 px-4 font-semibold">کلیک لینک</th>
                      <th className="py-3 px-4 font-semibold">اقدام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                    {publishedPosts.map((post) => {
                      const isIg = post.platform === 'instagram';
                      return (
                        <tr
                          key={post.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-[#151B2B]/60 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 min-w-[200px]">
                              {isIg ? (
                                <Instagram className="w-4 h-4 text-fuchsia-500 shrink-0" />
                              ) : (
                                <Twitter className="w-4 h-4 text-sky-500 shrink-0" />
                              )}
                              <span className="font-medium text-slate-900 dark:text-white line-clamp-1">
                                {post.topic}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {FORMAT_LABEL[post.format]}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            {formatNumber(post.metrics?.impressions ?? 0)}
                          </td>
                          <td className="py-3 px-4">{formatNumber(post.metrics?.likes ?? 0)}</td>
                          <td className="py-3 px-4">
                            {formatNumber(
                              isIg
                                ? post.metrics?.savesOrBookmarks ?? 0
                                : post.metrics?.sharesOrRetweets ?? 0
                            )}
                          </td>
                          <td className="py-3 px-4">{formatNumber(post.metrics?.clicks ?? 0)}</td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPostId(null);
                                setPlatform(post.platform);
                                setFormat(post.format);
                                setTopic(`نسخه جدید بر اساس: ${post.topic}`);
                                setCaption('');
                                setActiveTab('draft');
                              }}
                              className="text-[#4F8CFF] hover:underline font-medium cursor-pointer whitespace-nowrap"
                            >
                              ساخت پست مشابه
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
