import React, { useState } from 'react';
import { AlertTriangle, CreditCard, Receipt, Wallet } from 'lucide-react';
import type { PricingPlan, WalletState } from '../../types/vorta';
import { calculatePlanPrice, formatNumber, formatToman, getTotalCredits } from '../../lib/vortaLogic';
import type { BillingCycle } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

interface WalletBillingViewProps {
  mode: 'wallet' | 'billing';
  wallet: WalletState;
  plans: PricingPlan[];
  currentPlanId: string;
  onTopUpSandbox: (credits: number, toman: number) => void;
  onChangePlan: (planId: string) => void;
}

export const WalletBillingView: React.FC<WalletBillingViewProps> = ({
  mode,
  wallet,
  plans,
  currentPlanId,
  onTopUpSandbox,
  onChangePlan,
}) => {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [topUpCredits, setTopUpCredits] = useState(1000);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const totalCredits = getTotalCredits(wallet);
  const isLowBalance = totalCredits <= wallet.lowBalanceThreshold;
  const topUpToman = topUpCredits * wallet.tomanPerCredit;

  // Group usage by model
  const usageByModel = wallet.ledger
    .filter((l) => l.type === 'usage')
    .reduce<Record<string, number>>((acc, item) => {
      const k = item.modelId || 'عمومی';
      acc[k] = Number(((acc[k] || 0) + Math.abs(item.amountCredits)).toFixed(2));
      return acc;
    }, {});

  const handleSandboxCheckout = () => {
    onTopUpSandbox(topUpCredits, topUpToman);
    setPaymentMessage(
      `تراکنش آزمایشی Sandbox به مبلغ ${formatToman(topUpToman)} ثبت شد و ${formatNumber(topUpCredits)} کردیت در Ledger افزوده گردید.`
    );
  };

  if (mode === 'billing') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">اشتراک من و مقایسه پلن‌ها</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              تمدید دوره‌ای و سهمیه اشتراک با قیمت‌های قابل تنظیم از پنل مدیریت.
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#151B2B]">
            {(
              [
                { id: 'monthly', label: 'ماهانه' },
                { id: 'quarterly', label: 'سه‌ماهه' },
                { id: 'semiannual', label: 'شش‌ماهه' },
                { id: 'annual', label: 'سالانه' },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCycle(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer ${
                  cycle === c.id ? 'bg-white dark:bg-[#0D1220] font-semibold' : 'text-slate-500'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => {
            const calc = calculatePlanPrice(p.monthlyPriceToman, cycle);
            const isCurrent = p.id === currentPlanId;
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-5 ${
                  isCurrent
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220]'
                }`}
              >
                <div>
                  <div className="text-xs text-slate-500 mb-1">{p.audience}</div>
                  <h2 className="font-bold text-base mb-2">{p.name}</h2>
                  <div className="text-lg font-extrabold tabular-nums mb-2">
                    {calc.effectiveMonthlyToman === null
                      ? 'قیمت سفارشی'
                      : calc.effectiveMonthlyToman === 0
                      ? 'رایگان'
                      : formatToman(calc.effectiveMonthlyToman)}
                  </div>
                  <div className="text-xs text-[#4F8CFF] font-semibold mb-3 tabular-nums">
                    {formatNumber(p.includedCredits)} کردیت
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {p.limits.map((lim) => (
                      <li key={lim}>• {lim}</li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => onChangePlan(p.id)}
                  className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default'
                      : 'bg-[#4F8CFF] text-white hover:bg-[#3e7af0]'
                  }`}
                >
                  {isCurrent ? 'پلن فعال فعلی' : 'تغییر به این پلن (Sandbox)'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">کیف پول، اعتبار و دفتر کل (Ledger)</h1>
            <StatusText status="demo" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تراکنش‌های اتمیک و مقاوم در برابر تکرار. پرداخت آنلاین تا اتصال درگاه زرین‌پال با برچسب Sandbox انجام می‌شود.
          </p>
        </div>
      </div>

      {isLowBalance && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>موجودی اعتبار شما به زیر آستانه هشدار ({formatNumber(wallet.lowBalanceThreshold)} کردیت) رسیده است.</span>
        </div>
      )}

      {paymentMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300">
          {paymentMessage}
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>موجودی کل قابل استفاده</span>
            <Wallet className="w-4 h-4 text-[#4F8CFF]" />
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{formatNumber(totalCredits)} کردیت</div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            معادل {formatToman(Math.round(totalCredits * wallet.tomanPerCredit))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5">
          <div className="text-xs text-slate-500 mb-2">اعتبار خریداری‌شده</div>
          <div className="text-2xl font-extrabold tabular-nums">{formatNumber(wallet.purchasedCredits)} کردیت</div>
          <div className="text-xs text-slate-500 mt-1">بدون انقضای کوتاه‌مدت</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5">
          <div className="text-xs text-slate-500 mb-2">اعتبار هدیه</div>
          <div className="text-2xl font-extrabold tabular-nums text-[#875BFF]">
            {formatNumber(wallet.giftCredits)} کردیت
          </div>
          <div className="text-xs text-slate-500 mt-1">انقضای مستقل: {wallet.giftExpiresAt}</div>
        </div>
      </div>

      {/* Sandbox Payment & Usage by Model */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#4F8CFF]" />
              <span>خرید بسته اعتبار (درگاه Sandbox آزمایشی)</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[500, 1000, 3000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setTopUpCredits(amt)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold tabular-nums cursor-pointer ${
                  topUpCredits === amt
                    ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#4F8CFF]'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {formatNumber(amt)} کردیت
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151B2B] flex items-center justify-between text-xs tabular-nums">
            <span>مبلغ قابل پرداخت (تست Sandbox):</span>
            <span className="font-bold text-sm">{formatToman(topUpToman)}</span>
          </div>

          <button
            type="button"
            onClick={handleSandboxCheckout}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] cursor-pointer"
          >
            پرداخت آزمایشی Sandbox (آداپتور زرین‌پال)
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4">
          <h2 className="font-bold text-sm">مصرف به تفکیک مدل هوش مصنوعی</h2>
          {Object.keys(usageByModel).length === 0 ? (
            <p className="text-xs text-slate-500">هنوز مصرفی ثبت نشده است.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(usageByModel).map(([mId, credits]) => (
                <div key={mId} className="space-y-1 text-xs">
                  <div className="flex justify-between tabular-nums">
                    <span className="font-mono">{mId}</span>
                    <span>{formatNumber(credits)} کردیت</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-[#151B2B] overflow-hidden">
                    <div
                      className="h-full bg-[#4F8CFF]"
                      style={{ width: `${Math.min(100, Math.max(8, credits * 2))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 font-bold text-sm">
          <Receipt className="w-4 h-4 text-[#4F8CFF]" />
          <span>تاریخچه تراکنش‌ها و فاکتورها (Credit Ledger)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 dark:bg-[#151B2B] text-slate-500">
              <tr>
                <th className="px-4 py-2.5">شرح</th>
                <th className="px-4 py-2.5">نوع سبد</th>
                <th className="px-4 py-2.5">کردیت</th>
                <th className="px-4 py-2.5">معادل تومانی</th>
                <th className="px-4 py-2.5">کلید Idempotency</th>
                <th className="px-4 py-2.5">زمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 tabular-nums">
              {wallet.ledger.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2.5 font-medium">{entry.description}</td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {entry.bucket === 'gift' ? 'هدیه' : 'خریداری‌شده'}
                  </td>
                  <td
                    className={`px-4 py-2.5 font-bold ${
                      entry.amountCredits >= 0 ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {entry.amountCredits > 0 ? `+${formatNumber(entry.amountCredits)}` : formatNumber(entry.amountCredits)}
                  </td>
                  <td className="px-4 py-2.5">{entry.amountToman ? formatToman(entry.amountToman) : '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">{entry.idempotencyKey}</td>
                  <td className="px-4 py-2.5 text-slate-500">{entry.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
