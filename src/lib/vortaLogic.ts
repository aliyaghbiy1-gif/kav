import type {
  AIModelRecord,
  LedgerEntry,
  WalletState,
  WorkspaceSection,
} from '../types/vorta';

export type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  semiannual: 6,
  annual: 12,
};

const CYCLE_DISCOUNT: Record<BillingCycle, number> = {
  monthly: 0,
  quarterly: 0.08,
  semiannual: 0.14,
  annual: 0.22,
};

export function calculatePlanPrice(
  monthlyPriceToman: number | null,
  cycle: BillingCycle
): { totalToman: number | null; effectiveMonthlyToman: number | null; discountPct: number } {
  if (monthlyPriceToman === null) {
    return { totalToman: null, effectiveMonthlyToman: null, discountPct: 0 };
  }
  const months = CYCLE_MONTHS[cycle];
  const discount = CYCLE_DISCOUNT[cycle];
  const effectiveMonthlyToman = Math.round(monthlyPriceToman * (1 - discount));
  const totalToman = effectiveMonthlyToman * months;
  return {
    totalToman,
    effectiveMonthlyToman,
    discountPct: Math.round(discount * 100),
  };
}

export function estimateChatCost(
  model: Pick<AIModelRecord, 'inputCreditsPer1K' | 'outputCreditsPer1K' | 'tomanPerCredit'>,
  inputText: string,
  expectedOutputTokens = 400
): { inputTokens: number; estimatedCredits: number; estimatedToman: number } {
  const trimmed = inputText.trim();
  // Conservative token estimate (~1 token per 2.6 chars for Persian/English mixed prose)
  const inputTokens = trimmed ? Math.max(12, Math.ceil(trimmed.length / 2.6)) : 0;
  const inputCost = (inputTokens / 1000) * model.inputCreditsPer1K;
  const outputCost = (expectedOutputTokens / 1000) * model.outputCreditsPer1K;
  const estimatedCredits = Number((inputCost + outputCost).toFixed(2));
  const estimatedToman = Math.round(estimatedCredits * model.tomanPerCredit);
  return { inputTokens, estimatedCredits, estimatedToman };
}

export function getTotalCredits(wallet: Pick<WalletState, 'purchasedCredits' | 'giftCredits'>): number {
  return Number((wallet.purchasedCredits + wallet.giftCredits).toFixed(2));
}

export interface DebitResult {
  ok: boolean;
  wallet: WalletState;
  error?: string;
  deduplicated?: boolean;
}

/**
 * Atomic, idempotent credit debit.
 * Consumes expiring gift credits first, then purchased credits.
 */
export function applyAtomicDebit(
  wallet: WalletState,
  params: {
    amountCredits: number;
    idempotencyKey: string;
    description: string;
    modelId?: string;
    projectId?: string;
    nowIso?: string;
  }
): DebitResult {
  if (params.amountCredits <= 0) {
    return { ok: true, wallet };
  }

  const alreadyExists = wallet.ledger.some(
    (entry) => entry.idempotencyKey === params.idempotencyKey
  );
  if (alreadyExists) {
    return { ok: true, wallet, deduplicated: true };
  }

  const totalAvailable = getTotalCredits(wallet);
  if (totalAvailable < params.amountCredits) {
    return {
      ok: false,
      wallet,
      error: 'موجودی اعتبار کافی نیست. لطفاً کیف پول خود را شارژ کنید.',
    };
  }

  const now = params.nowIso ?? new Date().toISOString();
  const giftValid = !wallet.giftExpiresAt || new Date(wallet.giftExpiresAt).getTime() > new Date(now).getTime();
  const usableGift = giftValid ? wallet.giftCredits : 0;

  let remainingToDebit = params.amountCredits;
  let newGift = wallet.giftCredits;
  let newPurchased = wallet.purchasedCredits;
  const newEntries: LedgerEntry[] = [];

  if (usableGift > 0) {
    const fromGift = Math.min(usableGift, remainingToDebit);
    newGift = Number((newGift - fromGift).toFixed(2));
    remainingToDebit = Number((remainingToDebit - fromGift).toFixed(2));
    newEntries.push({
      id: `ldg_${Date.now()}_g`,
      type: 'usage',
      amountCredits: -fromGift,
      bucket: 'gift',
      amountToman: Math.round(fromGift * wallet.tomanPerCredit),
      idempotencyKey: `${params.idempotencyKey}:gift`,
      description: params.description,
      modelId: params.modelId,
      projectId: params.projectId,
      createdAt: now,
    });
  }

  if (remainingToDebit > 0) {
    newPurchased = Number((newPurchased - remainingToDebit).toFixed(2));
    newEntries.push({
      id: `ldg_${Date.now()}_p`,
      type: 'usage',
      amountCredits: -remainingToDebit,
      bucket: 'purchased',
      amountToman: Math.round(remainingToDebit * wallet.tomanPerCredit),
      idempotencyKey: `${params.idempotencyKey}:purchased`,
      description: params.description,
      modelId: params.modelId,
      projectId: params.projectId,
      createdAt: now,
    });
  }

  // Record primary idempotency key marker if split
  if (newEntries.length === 1) {
    newEntries[0].idempotencyKey = params.idempotencyKey;
  } else if (newEntries.length === 2) {
    newEntries[0].idempotencyKey = params.idempotencyKey;
  }

  return {
    ok: true,
    wallet: {
      ...wallet,
      giftCredits: newGift,
      purchasedCredits: newPurchased,
      ledger: [...newEntries, ...wallet.ledger],
    },
  };
}

export function applyCreditRefund(
  wallet: WalletState,
  params: {
    amountCredits: number;
    idempotencyKey: string;
    description: string;
    nowIso?: string;
  }
): WalletState {
  if (
    params.amountCredits <= 0 ||
    wallet.ledger.some((e) => e.idempotencyKey === params.idempotencyKey)
  ) {
    return wallet;
  }
  const now = params.nowIso ?? new Date().toISOString();
  const refundEntry: LedgerEntry = {
    id: `ldg_ref_${Date.now()}`,
    type: 'refund',
    amountCredits: params.amountCredits,
    bucket: 'purchased',
    amountToman: Math.round(params.amountCredits * wallet.tomanPerCredit),
    idempotencyKey: params.idempotencyKey,
    description: params.description,
    createdAt: now,
  };
  return {
    ...wallet,
    purchasedCredits: Number((wallet.purchasedCredits + params.amountCredits).toFixed(2)),
    ledger: [refundEntry, ...wallet.ledger],
  };
}

export function routePromptIntent(
  prompt: string,
  quickAction?: string
): WorkspaceSection {
  if (
    quickAction === 'image' ||
    quickAction === 'video' ||
    quickAction === 'story' ||
    quickAction === 'audio' ||
    quickAction === 'content'
  ) {
    return 'studio';
  }
  if (quickAction === 'social') {
    return 'social';
  }
  if (
    quickAction === 'agent' ||
    quickAction === 'web' ||
    quickAction === 'seo' ||
    quickAction === 'trading'
  ) {
    return 'agents';
  }
  if (quickAction === 'code') return 'code';
  if (quickAction === 'research' || quickAction === 'general') return 'chat';

  const normalized = prompt.toLowerCase();
  if (
    /اینستاگرام|توییتر|ایکس|twitter|instagram|شبکه اجتماعی|شبکه‌های اجتماعی|تقویم محتوا|کپشن|رشته‌توییت|توییت/.test(
      normalized
    )
  ) {
    return 'social';
  }
  if (
    /ایجنت|بررسی روزانه|رقبا|مانیتور|تلگرام|لینکدین|سئو|seo|کلمات کلیدی|کیورد|گوگل|اسکیما|طراحی سایت|وبسایت|لندینگ|ترید|ارز دیجیتال|بیتکوین|بیت‌کوین|تحلیل تکنیکال|حد ضرر|مدیریت ریسک|بورس|فارکس/.test(
      normalized
    )
  ) {
    return 'agents';
  }
  if (/تصویر|عکس|پوستر|لوگو|ویدیو|تیزر|استوری|اسلاید|موزیک|صدا/.test(normalized)) {
    return 'studio';
  }
  if (/کد|برنامه|ریکت|پایتون|تایپاسکریپت|typescript|react|api/.test(normalized)) {
    return 'code';
  }
  return 'chat';
}

export function generateMaskedApiKey(): { rawKey: string; prefix: string } {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let secret = '';
  for (let i = 0; i < 28; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  const rawKey = `kvi_live_${secret}`;
  const prefix = `${rawKey.slice(0, 14)}••••${rawKey.slice(-4)}`;
  return { rawKey, prefix };
}

export function formatToman(amount: number, lang: 'fa' | 'en' = 'fa'): string {
  const formatted = new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(amount);
  return lang === 'fa' ? `${formatted} تومان` : `${formatted} Toman`;
}

export function formatNumber(value: number, lang: 'fa' | 'en' = 'fa'): string {
  return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(value);
}
