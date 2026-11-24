import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAtomicDebit,
  applyCreditRefund,
  calculatePlanPrice,
  estimateChatCost,
  generateMaskedApiKey,
  getTotalCredits,
  routePromptIntent,
} from './vortaLogic';
import type { WalletState } from '../types/vorta';

const sampleWallet = (): WalletState => ({
  purchasedCredits: 500,
  giftCredits: 120,
  giftExpiresAt: '2027-01-01T00:00:00.000Z',
  lowBalanceThreshold: 100,
  tomanPerCredit: 500,
  ledger: [],
});

test('atomic debit consumes gift credits first and enforces idempotency', () => {
  const w1 = sampleWallet();
  const res1 = applyAtomicDebit(w1, {
    amountCredits: 150,
    idempotencyKey: 'req-1',
    description: 'چت با مدل کاوی',
    nowIso: '2026-11-20T10:00:00.000Z',
  });

  assert.equal(res1.ok, true);
  assert.equal(res1.wallet.giftCredits, 0);
  assert.equal(res1.wallet.purchasedCredits, 470);
  assert.equal(getTotalCredits(res1.wallet), 470);

  // Repeating same idempotency key must not double charge
  const resDup = applyAtomicDebit(res1.wallet, {
    amountCredits: 150,
    idempotencyKey: 'req-1',
    description: 'تکرار درخواست',
    nowIso: '2026-11-20T10:00:05.000Z',
  });
  assert.equal(resDup.ok, true);
  assert.equal(resDup.deduplicated, true);
  assert.equal(getTotalCredits(resDup.wallet), 470);
});

test('atomic debit rejects insufficient funds without mutating wallet', () => {
  const w = sampleWallet();
  const res = applyAtomicDebit(w, {
    amountCredits: 900,
    idempotencyKey: 'req-fail',
    description: 'درخواست سنگین',
    nowIso: '2026-11-20T10:00:00.000Z',
  });
  assert.equal(res.ok, false);
  assert.equal(getTotalCredits(res.wallet), 620);
});

test('refund restores purchased credits once per idempotency key', () => {
  const w = sampleWallet();
  const refunded = applyCreditRefund(w, {
    amountCredits: 25,
    idempotencyKey: 'refund-1',
    description: 'بازگشت هزینه خطای مدل',
  });
  assert.equal(refunded.purchasedCredits, 525);
  const refundedAgain = applyCreditRefund(refunded, {
    amountCredits: 25,
    idempotencyKey: 'refund-1',
    description: 'بازگشت تکراری',
  });
  assert.equal(refundedAgain.purchasedCredits, 525);
});

test('billing cycle pricing applies expected discounts and preserves enterprise null', () => {
  const monthly = calculatePlanPrice(1000000, 'monthly');
  assert.equal(monthly.totalToman, 1000000);
  assert.equal(monthly.discountPct, 0);

  const annual = calculatePlanPrice(1000000, 'annual');
  assert.equal(annual.discountPct, 22);
  assert.equal(annual.effectiveMonthlyToman, 780000);
  assert.equal(annual.totalToman, 780000 * 12);

  const enterprise = calculatePlanPrice(null, 'annual');
  assert.equal(enterprise.totalToman, null);
});

test('prompt intent router directs quick actions and Persian prompts to proper workspace module', () => {
  assert.equal(routePromptIntent('ساخت تصویر یک شهر آیندهنگر'), 'studio');
  assert.equal(routePromptIntent('ساخت استوری ۳ اسلایدی اینستاگرام'), 'social');
  assert.equal(routePromptIntent('ساخت استوری ۳ اسلایدی', 'story'), 'studio');
  assert.equal(routePromptIntent('هر روز قیمت رقبای من را بررسی کن'), 'agents');
  assert.equal(routePromptIntent('تقویم محتوای اینستاگرام و توییتر بساز'), 'social');
  assert.equal(routePromptIntent('طراحی سایت فروشگاهی مدرن با لندینگ'), 'agents');
  assert.equal(routePromptIntent('بهینه‌سازی سئو سایت و کلمات کلیدی گوگل'), 'agents');
  assert.equal(routePromptIntent('تحلیل تکنیکال بیت‌کوین و مدیریت ریسک ترید'), 'agents');
  assert.equal(routePromptIntent('هر متنی', 'social'), 'social');
  assert.equal(routePromptIntent('هر متنی', 'web'), 'agents');
  assert.equal(routePromptIntent('هر متنی', 'seo'), 'agents');
  assert.equal(routePromptIntent('هر متنی', 'trading'), 'agents');
  assert.equal(routePromptIntent('هر متنی', 'code'), 'code');
  assert.equal(routePromptIntent('هر متنی', 'content'), 'studio');
  assert.equal(routePromptIntent('هر متنی', 'story'), 'studio');
  assert.equal(routePromptIntent('هر متنی', 'audio'), 'studio');
  assert.equal(routePromptIntent('هر متنی', 'general'), 'chat');
  assert.equal(routePromptIntent('خلاصه مقاله اقتصاد دیجیتال'), 'chat');
});

test('chat cost estimator computes non-zero credits from dynamic registry rates', () => {
  const est = estimateChatCost(
    { inputCreditsPer1K: 0.4, outputCreditsPer1K: 1.2, tomanPerCredit: 500 },
    'یک برنامه استراتژیک برای رشد استارتاپ هوش مصنوعی بنویس.',
    500
  );
  assert.ok(est.inputTokens >= 12);
  assert.ok(est.estimatedCredits > 0);
  assert.ok(est.estimatedToman > 0);
});

test('API key generator produces kvi_live prefix and masked display', () => {
  const { rawKey, prefix } = generateMaskedApiKey();
  assert.ok(rawKey.startsWith('kvi_live_'));
  assert.ok(prefix.includes('••••'));
  assert.notEqual(rawKey, prefix);
});
