import React, { useState } from 'react';
import { CalendarClock, Play, Plus, Trash2 } from 'lucide-react';
import type { AgentDefinition, AutomationJob } from '../../types/vorta';
import { formatNumber } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

interface AutomationsViewProps {
  automations: AutomationJob[];
  agents: AgentDefinition[];
  onCreateAutomation: (job: AutomationJob) => void;
  onToggleAutomation: (id: string) => void;
  onRunNow: (id: string) => void;
  onDeleteAutomation: (id: string) => void;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({
  automations,
  agents,
  onCreateAutomation,
  onToggleAutomation,
  onRunNow,
  onDeleteAutomation,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetUrl, setTargetUrl] = useState('https://example.ir/pricing');
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [maxCostCredits, setMaxCostCredits] = useState('50');
  const [notifyChannel, setNotifyChannel] = useState<'in_app' | 'email' | 'webhook'>('in_app');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateAutomation({
      id: `auto_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'وظیفه زمان‌بندی‌شده کاوی',
      scheduleTime,
      timezone,
      frequency,
      targetUrls: targetUrl.split(',').map((u) => u.trim()).filter(Boolean),
      agentId,
      maxCostCredits: Number(maxCostCredits) || 50,
      notifyChannel,
      isActive: true,
    });
    setName('');
    setDescription('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Kavi Automations — وظایف تکرارشونده</h1>
            <StatusText status="demo" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            زمان‌بندی مستقل با سقف مصرف و گزارش قابل ردیابی. نسخه بصری Workflow Builder (Trigger / Action / Condition) به‌زودی اضافه می‌شود.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3.5"
        >
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#4F8CFF]" />
            <span>ایجاد اتوماسیون جدید</span>
          </h2>

          <div>
            <label htmlFor="auto-name" className="block text-xs font-medium mb-1">نام اتوماسیون</label>
            <input
              id="auto-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="گزارش روزانه تغییرات وب‌سایت"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label htmlFor="auto-desc" className="block text-xs font-medium mb-1">توضیح وظیفه</label>
            <textarea
              id="auto-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] p-2.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="auto-time" className="block text-xs font-medium mb-1">ساعت اجرا</label>
              <input
                id="auto-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="auto-freq" className="block text-xs font-medium mb-1">تکرار</label>
              <select
                id="auto-freq"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              >
                <option value="daily">روزانه</option>
                <option value="weekly">هفتگی</option>
                <option value="monthly">ماهانه</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="auto-tz" className="block text-xs font-medium mb-1">منطقه زمانی</label>
              <select
                id="auto-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              >
                <option value="Asia/Tehran">Asia/Tehran</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <label htmlFor="auto-cap" className="block text-xs font-medium mb-1">سقف مصرف (کردیت)</label>
              <input
                id="auto-cap"
                type="number"
                value={maxCostCredits}
                onChange={(e) => setMaxCostCredits(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs tabular-nums"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auto-agent" className="block text-xs font-medium mb-1">ایجنت اجراکننده</label>
            <select
              id="auto-agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="auto-urls" className="block text-xs font-medium mb-1">URLهای هدف</label>
            <input
              id="auto-urls"
              type="text"
              dir="ltr"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs font-mono"
            />
          </div>

          <div>
            <label htmlFor="auto-notify" className="block text-xs font-medium mb-1">نحوه اطلاع‌رسانی</label>
            <select
              id="auto-notify"
              value={notifyChannel}
              onChange={(e) => setNotifyChannel(e.target.value as 'in_app' | 'email' | 'webhook')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            >
              <option value="in_app">اعلان داخل پنل</option>
              <option value="email">ایمیل</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] disabled:opacity-50 cursor-pointer"
          >
            ثبت زمان‌بندی
          </button>
        </form>

        {/* Scheduled Automations List */}
        <div className="lg:col-span-2 space-y-4">
          {automations.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="w-4 h-4 text-[#4F8CFF]" />
                  <h3 className="font-bold text-sm">{item.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => onToggleAutomation(item.id)}
                    className={`px-3 py-1 rounded-lg border cursor-pointer ${
                      item.isActive
                        ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-300 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {item.isActive ? 'فعال' : 'متوقف'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRunNow(item.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#4F8CFF]/10 text-[#4F8CFF] cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>اجرای آزمایشی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAutomation(item.id)}
                    aria-label={`حذف ${item.name}`}
                    className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>

              <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                <span>
                  زمان: {item.scheduleTime} ({item.timezone}) ·{' '}
                  {item.frequency === 'daily' ? 'روزانه' : item.frequency === 'weekly' ? 'هفتگی' : 'ماهانه'}
                </span>
                <span>سقف هزینه: {formatNumber(item.maxCostCredits)} کردیت</span>
                {item.lastRunAt && <span>آخرین اجرا: {item.lastRunAt} (دمو)</span>}
              </div>
            </div>
          ))}

          {/* Coming Soon Visual Workflow Builder Banner */}
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm">Visual Workflow Builder</span>
                <StatusText status="coming_soon" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                طراحی گراف بصری با گره‌های Trigger، Action، Condition و Output در فاز بعدی زیرساخت اضافه می‌شود.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
