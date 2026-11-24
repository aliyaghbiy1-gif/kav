import React, { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import type {
  AIModelRecord,
  FeatureStatus,
  PricingPlan,
  ProviderRecord,
  SupportTicket,
} from '../../types/vorta';
import { formatToman } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

interface AdminViewProps {
  models: AIModelRecord[];
  providers: ProviderRecord[];
  plans: PricingPlan[];
  tickets: SupportTicket[];
  onUpdateModel: (id: string, patch: Partial<AIModelRecord>) => void;
  onAddModel: (model: AIModelRecord) => void;
  onUpdatePlanPrice: (planId: string, monthlyPriceToman: number) => void;
  onToggleProvider: (providerId: string) => void;
  onResolveTicket: (ticketId: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  models,
  providers,
  plans,
  tickets,
  onUpdateModel,
  onAddModel,
  onUpdatePlanPrice,
  onToggleProvider,
  onResolveTicket,
}) => {
  const [tab, setTab] = useState<'models' | 'providers' | 'plans' | 'tickets'>('models');
  const [newModelName, setNewModelName] = useState('');
  const [newModelId, setNewModelId] = useState('');
  const [newProvider, setNewProvider] = useState('OpenAI');
  const [newInputRate, setNewInputRate] = useState('1.2');
  const [newOutputRate, setNewOutputRate] = useState('3.6');

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelId.trim()) return;
    onAddModel({
      id: newModelId.trim(),
      displayName: newModelName.trim(),
      providerId: 'prov_custom',
      providerName: newProvider,
      version: '1.0',
      modalities: ['text', 'code'],
      features: ['افزوده‌شده از پنل مدیریت'],
      contextWindow: 128000,
      maxOutputTokens: 8192,
      inputCreditsPer1K: Number(newInputRate) || 1,
      outputCreditsPer1K: Number(newOutputRate) || 3,
      tomanPerCredit: 500,
      availability: 'demo',
      description: 'مدل جدید ثبت‌شده توسط مدیر سیستم بدون تغییر کد.',
    });
    setNewModelName('');
    setNewModelId('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#875BFF]">
            <ShieldCheck className="w-5 h-5" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              داشبورد مدیریت سیستم (Admin Panel)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تغییر قیمت‌ها، وضعیت مدل‌ها و سرویس‌ها بلافاصله در کل اپلیکیشن و صفحه معرفی اعمال می‌شود.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#151B2B]">
          {(
            [
              { id: 'models', label: 'مدل‌ها و نرخ‌ها' },
              { id: 'providers', label: 'ارائه‌دهندگان AI' },
              { id: 'plans', label: 'پلن‌ها و قیمت‌ها' },
              { id: 'tickets', label: 'تیکت‌ها و وضعیت' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer ${
                tab === t.id ? 'bg-white dark:bg-[#0D1220] font-semibold' : 'text-slate-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'models' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddModel}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label htmlFor="adm-mid" className="block text-xs font-medium mb-1">شناسه مدل</label>
              <input
                id="adm-mid"
                type="text"
                dir="ltr"
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                placeholder="llama-4-70b"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label htmlFor="adm-mname" className="block text-xs font-medium mb-1">نام نمایشی</label>
              <input
                id="adm-mname"
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Llama 4 70B"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="adm-mprov" className="block text-xs font-medium mb-1">ارائه‌دهنده</label>
              <input
                id="adm-mprov"
                type="text"
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="adm-in" className="block text-xs font-medium mb-1">نرخ ورودی</label>
                <input
                  id="adm-in"
                  type="number"
                  step="0.1"
                  value={newInputRate}
                  onChange={(e) => setNewInputRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-2 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="adm-out" className="block text-xs font-medium mb-1">نرخ خروجی</label>
                <input
                  id="adm-out"
                  type="number"
                  step="0.1"
                  value={newOutputRate}
                  onChange={(e) => setNewOutputRate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-2 py-2 text-xs tabular-nums"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن مدل</span>
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-[#151B2B] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">مدل</th>
                    <th className="px-4 py-3">ارائه‌دهنده</th>
                    <th className="px-4 py-3">نرخ ورودی (1K)</th>
                    <th className="px-4 py-3">نرخ خروجی (1K)</th>
                    <th className="px-4 py-3">وضعیت دسترسی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
                  {models.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 font-semibold">{m.displayName}</td>
                      <td className="px-4 py-3 text-slate-500">{m.providerName}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.05"
                          aria-label={`نرخ ورودی ${m.displayName}`}
                          value={m.inputCreditsPer1K}
                          onChange={(e) =>
                            onUpdateModel(m.id, { inputCreditsPer1K: Number(e.target.value) || 0 })
                          }
                          className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151B2B] px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.05"
                          aria-label={`نرخ خروجی ${m.displayName}`}
                          value={m.outputCreditsPer1K}
                          onChange={(e) =>
                            onUpdateModel(m.id, { outputCreditsPer1K: Number(e.target.value) || 0 })
                          }
                          className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151B2B] px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`وضعیت ${m.displayName}`}
                            value={m.availability}
                            onChange={(e) =>
                              onUpdateModel(m.id, { availability: e.target.value as FeatureStatus })
                            }
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151B2B] px-2 py-1 text-xs"
                          >
                            <option value="functional">متصل (Functional)</option>
                            <option value="demo">دمو (Demo)</option>
                            <option value="coming_soon">به‌زودی (Coming Soon)</option>
                          </select>
                          <StatusText status={m.availability} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{p.name}</span>
                  <StatusText status={p.status} />
                </div>
                <p className="text-xs text-slate-500">{p.description}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleProvider(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                  p.enabled
                    ? 'border-emerald-500/40 text-emerald-500'
                    : 'border-slate-300 text-slate-400'
                }`}
              >
                {p.enabled ? 'فعال' : 'غیرفعال'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans
            .filter((p) => p.monthlyPriceToman !== null)
            .map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3"
              >
                <div className="font-bold text-sm">{p.name}</div>
                <div className="flex items-center gap-3">
                  <label htmlFor={`plan-price-${p.id}`} className="text-xs text-slate-500">
                    قیمت ماهانه (تومان):
                  </label>
                  <input
                    id={`plan-price-${p.id}`}
                    type="number"
                    step="10000"
                    value={p.monthlyPriceToman ?? 0}
                    onChange={(e) => onUpdatePlanPrice(p.id, Number(e.target.value) || 0)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151B2B] px-3 py-1.5 text-xs tabular-nums"
                  />
                  <span className="text-xs text-[#4F8CFF] tabular-nums">
                    {formatToman(p.monthlyPriceToman ?? 0)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {tab === 'tickets' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] divide-y divide-slate-200 dark:divide-slate-800">
          {tickets.map((t) => (
            <div key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-sm">{t.subject}</div>
                <div className="text-slate-500 mt-0.5">
                  {t.userEmail} · {t.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={t.status === 'answered' ? 'text-emerald-500' : 'text-amber-500'}>
                  {t.status === 'answered' ? 'پاسخ داده‌شده' : 'باز'}
                </span>
                {t.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => onResolveTicket(t.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#4F8CFF] text-white cursor-pointer"
                  >
                    بستن و پاسخ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
