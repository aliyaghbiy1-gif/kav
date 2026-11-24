import React, { useMemo, useState } from 'react';
import { Download, Film, FolderOpen, Image as ImageIcon, Layers, RefreshCw, Search, Trash2, Volume2 } from 'lucide-react';
import type { AIModelRecord, GenerationJob, MediaAsset } from '../../types/vorta';
import { formatNumber, formatToman } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

export type StudioTabId = 'image' | 'video' | 'story' | 'audio' | 'library';

interface StudioViewProps {
  models: AIModelRecord[];
  assets: MediaAsset[];
  activeProjectId: string;
  initialPrompt?: string;
  initialTab?: StudioTabId;
  onConsumeInitialPrompt: () => void;
  onConsumeInitialTab?: () => void;
  onAddAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (id: string) => void;
}

export const StudioView: React.FC<StudioViewProps> = ({
  models,
  assets,
  activeProjectId,
  initialPrompt,
  initialTab,
  onConsumeInitialPrompt,
  onConsumeInitialTab,
  onAddAsset,
  onDeleteAsset,
}) => {
  const [tab, setTab] = useState<StudioTabId>(initialTab || 'image');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quality, setQuality] = useState('HD');
  const [seed, setSeed] = useState('42819');
  const [stylePreset, setStylePreset] = useState('معماری مدرن');
  const [durationSec, setDurationSec] = useState('6');
  const [storySlideCount, setStorySlideCount] = useState('3');
  const [storyGoal, setStoryGoal] = useState('لانچ محصول');
  const [audioMode, setAudioMode] = useState<'tts' | 'stt' | 'music' | 'sfx'>('tts');
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'image' | 'video' | 'story' | 'audio'>('all');
  const [librarySearch, setLibrarySearch] = useState('');

  React.useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
      if (initialTab === 'story') setAspectRatio('9:16');
      onConsumeInitialTab?.();
    }
  }, [initialTab, onConsumeInitialTab]);

  React.useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      onConsumeInitialPrompt();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  const studioModels = useMemo(() => {
    if (tab === 'image') return models.filter((m) => m.modalities.includes('image'));
    if (tab === 'video') return models.filter((m) => m.modalities.includes('video'));
    if (tab === 'story') return models.filter((m) => m.modalities.includes('image') || m.modalities.includes('video'));
    if (tab === 'audio') return models.filter((m) => m.modalities.includes('audio'));
    return models;
  }, [models, tab]);

  const [selectedModelId, setSelectedModelId] = useState<string>('vorta-vision-studio-demo');
  const activeModel =
    studioModels.find((m) => m.id === selectedModelId) || studioModels[0];

  const handleQueueJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !activeModel || tab === 'library') return;

    const jobId = `job_${Date.now()}`;
    const newJob: GenerationJob = {
      id: jobId,
      modality: tab,
      modelId: activeModel.id,
      prompt: prompt.trim(),
      status: 'running',
      progressPct: 35,
      estimatedCredits: activeModel.inputCreditsPer1K,
      createdAt: 'هم‌اکنون',
      isDemo: true,
    };
    setJobs((prev) => [newJob, ...prev]);

    // Transparent Demo async job progression
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: 'completed', progressPct: 100 } : j
        )
      );
      const previewImage =
        tab === 'video'
          ? '/src/assets/images/vorta_video_frame_1795241428852.jpg'
          : tab === 'story'
            ? '/src/assets/images/vorta_story_launch_hook_1795254855912.jpg'
            : '/src/assets/images/vorta_studio_kinetic_1795241429645.jpg';

      onAddAsset({
        id: `asset_${Date.now()}`,
        type: tab,
        title:
          tab === 'story'
            ? `استوری ${storySlideCount} اسلایدی: ${prompt.trim().slice(0, 24)} (خروجی دمو)`
            : `${prompt.trim().slice(0, 32)} (خروجی دمو)`,
        prompt: prompt.trim(),
        modelId: activeModel.id,
        url: previewImage,
        projectId: activeProjectId,
        createdAt: 'هم‌اکنون',
        aspectRatio: tab === 'story' ? '9:16' : aspectRatio,
        durationSec: tab === 'video' ? Number(durationSec) : undefined,
        isDemo: true,
      });
    }, 900);
  };

  const filteredLibrary = assets.filter(
    (a) =>
      (libraryFilter === 'all' || a.type === libraryFilter) &&
      (a.title.includes(librarySearch) || a.prompt.includes(librarySearch))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Kavi Studio — استودیوی خلاقیت کاوی</h1>
            <StatusText status="demo" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تولید تصویر، ویدیو، صوت و کتابخانه متمرکز دارایی‌ها (خروجی‌ها در حالت Demo و با برچسب شفاف ثبت می‌شوند).
          </p>
        </div>

        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#151B2B] self-start">
          {(
            [
              { id: 'image', label: 'عکس‌ساز', icon: ImageIcon },
              { id: 'video', label: 'ویدیوساز', icon: Film },
              { id: 'story', label: 'استوری‌ساز', icon: Layers },
              { id: 'audio', label: 'صوت و موسیقی', icon: Volume2 },
              { id: 'library', label: 'کتابخانه دارایی‌ها', icon: FolderOpen },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (t.id === 'story') setAspectRatio('9:16');
                  const first = models.find((m) =>
                    t.id === 'library'
                      ? true
                      : t.id === 'story'
                        ? m.modalities.includes('image') || m.modalities.includes('video')
                        : m.modalities.includes(t.id)
                  );
                  if (first) setSelectedModelId(first.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === t.id
                    ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab !== 'library' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Form driven by Registry */}
          <form
            onSubmit={handleQueueJob}
            className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4"
          >
            <div>
              <label htmlFor="studio-model" className="block text-xs font-semibold mb-1.5">
                انتخاب مدل از Registry
              </label>
              <select
                id="studio-model"
                value={activeModel?.id || ''}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              >
                {studioModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.providerName})
                  </option>
                ))}
              </select>
            </div>

            {tab === 'audio' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5">بخش استودیوی صوت</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'tts', label: 'متن به گفتار' },
                      { id: 'stt', label: 'صدا به متن' },
                      { id: 'music', label: 'ساخت موسیقی' },
                      { id: 'sfx', label: 'جلوه صوتی' },
                    ] as const
                  ).map((am) => (
                    <button
                      key={am.id}
                      type="button"
                      onClick={() => setAudioMode(am.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs border cursor-pointer ${
                        audioMode === am.id
                          ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#4F8CFF]'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {am.label}
                    </button>
                  ))}
                </div>
                <label className="mt-3 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={voiceConsent}
                    onChange={(e) => setVoiceConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>تأیید می‌کنم برای شبیه‌سازی یا تبدیل صدا، رضایت و مجوز قانونی مالک صدا را دارم.</span>
                </label>
              </div>
            )}

            <div>
              <label htmlFor="studio-prompt" className="block text-xs font-semibold mb-1.5">
                متن Prompt
              </label>
              <textarea
                id="studio-prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="توصیف دقیق صحنه، نورپردازی، سبک یا متن گفتار..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] p-3 text-xs"
              />
            </div>

            {activeModel?.supportsNegativePrompt && tab === 'image' && (
              <div>
                <label htmlFor="studio-neg" className="block text-xs font-semibold mb-1.5">
                  Negative Prompt (پشتیبانی‌شده توسط مدل)
                </label>
                <input
                  id="studio-neg"
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="موارد ناخواسته: تاری، متن اضافه..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="studio-aspect" className="block text-xs font-semibold mb-1.5">
                  نسبت تصویر
                </label>
                <select
                  id="studio-aspect"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                >
                  <option value="16:9">16:9</option>
                  <option value="4:3">4:3</option>
                  <option value="1:1">1:1</option>
                  <option value="9:16">9:16</option>
                </select>
              </div>
              <div>
                <label htmlFor="studio-quality" className="block text-xs font-semibold mb-1.5">
                  کیفیت
                </label>
                <select
                  id="studio-quality"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                >
                  <option value="HD">HD استاندارد</option>
                  <option value="2K">2K پیشرفته</option>
                </select>
              </div>
            </div>

            {tab === 'image' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="studio-style" className="block text-xs font-semibold mb-1.5">
                    سبک آماده
                  </label>
                  <select
                    id="studio-style"
                    value={stylePreset}
                    onChange={(e) => setStylePreset(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                  >
                    <option value="معماری مدرن">معماری مدرن</option>
                    <option value="عکاسی صنعتی">عکاسی صنعتی</option>
                    <option value="سه‌بعدی مینیمال">سه‌بعدی مینیمال</option>
                  </select>
                </div>
                {activeModel?.supportsSeed && (
                  <div>
                    <label htmlFor="studio-seed" className="block text-xs font-semibold mb-1.5">
                      Seed
                    </label>
                    <input
                      id="studio-seed"
                      type="text"
                      dir="ltr"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            )}

            {tab === 'video' && (
              <div>
                <label htmlFor="studio-duration" className="block text-xs font-semibold mb-1.5">
                  مدت زمان ویدیو (ثانیه)
                </label>
                <select
                  id="studio-duration"
                  value={durationSec}
                  onChange={(e) => setDurationSec(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                >
                  <option value="4">۴ ثانیه</option>
                  <option value="6">۶ ثانیه</option>
                  <option value="10">۱۰ ثانیه</option>
                </select>
              </div>
            )}

            {tab === 'story' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="studio-story-slides" className="block text-xs font-semibold mb-1.5">
                    تعداد اسلاید ۹:۱۶
                  </label>
                  <select
                    id="studio-story-slides"
                    value={storySlideCount}
                    onChange={(e) => setStorySlideCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                  >
                    <option value="3">۳ اسلاید (قلاب تا CTA)</option>
                    <option value="5">۵ اسلاید کامل</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="studio-story-goal" className="block text-xs font-semibold mb-1.5">
                    هدف روایت
                  </label>
                  <select
                    id="studio-story-goal"
                    value={storyGoal}
                    onChange={(e) => setStoryGoal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
                  >
                    <option value="لانچ محصول">لانچ محصول</option>
                    <option value="داستان برند">داستان برند</option>
                    <option value="آموزش سریع">آموزش سریع</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between tabular-nums">
              <span>هزینه تخمینی:</span>
              <span>
                {formatNumber(activeModel?.inputCreditsPer1K || 8)} کردیت (
                {formatToman((activeModel?.inputCreditsPer1K || 8) * (activeModel?.tomanPerCredit || 500))})
              </span>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] disabled:opacity-50 transition-colors cursor-pointer"
            >
              ثبت در صف پردازش (حالت دمو)
            </button>
          </form>

          {/* Job Queue & Recent Outputs */}
          <div className="lg:col-span-2 space-y-5">
            {jobs.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-4 space-y-3">
                <h2 className="text-sm font-bold">صف پردازش استودیو (Demo Queue)</h2>
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#151B2B] border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold truncate max-w-md">{j.prompt}</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {j.status === 'completed' ? 'تکمیل شد (دمو)' : `در حال پردازش ${j.progressPct}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-[#4F8CFF] transition-all"
                        style={{ width: `${j.progressPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assets
                .filter((a) => a.type === tab || (tab === 'audio' && a.type === 'audio'))
                .map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden flex flex-col"
                  >
                    <div className="aspect-video bg-slate-900">
                      <img
                        src={asset.url}
                        alt={asset.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{asset.aspectRatio || '16:9'} · خروجی دمو</span>
                        <span>{asset.createdAt}</span>
                      </div>
                      <h3 className="font-semibold text-sm">{asset.title}</h3>
                      <div className="flex items-center gap-3 pt-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setPrompt(asset.prompt)}
                          className="inline-flex items-center gap-1 text-[#4F8CFF] hover:underline cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>استفاده مجدد Prompt</span>
                        </button>
                        <a
                          href={asset.url}
                          download
                          className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#4F8CFF]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>دانلود</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Central Asset Library */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="جستجو در کتابخانه دارایی‌ها..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220]"
              />
            </div>
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#151B2B]">
              {(['all', 'image', 'video', 'story', 'audio'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLibraryFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs cursor-pointer ${
                    libraryFilter === f ? 'bg-white dark:bg-[#0D1220] font-semibold' : 'text-slate-500'
                  }`}
                >
                  {f === 'all'
                    ? 'همه'
                    : f === 'image'
                      ? 'تصویر'
                      : f === 'video'
                        ? 'ویدیو'
                        : f === 'story'
                          ? 'استوری'
                          : 'صوت'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLibrary.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden"
              >
                <div className="aspect-[4/3] bg-slate-900">
                  <img
                    src={asset.url}
                    alt={asset.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{asset.type} · {asset.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteAsset(asset.id)}
                      aria-label={`حذف ${asset.title}`}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="font-semibold text-sm">{asset.title}</div>
                  <p className="text-xs text-slate-500 line-clamp-2">{asset.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
