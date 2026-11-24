import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { VortaLogo } from './VortaLogo';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  preservedPrompt?: string;
  onSuccess: (user: { name: string; email: string; role: 'user' | 'admin' }) => void;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  preservedPrompt,
  onSuccess,
  onBack,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('لطفاً یک نشانی ایمیل معتبر وارد کنید.');
      return;
    }
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    onSuccess({
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      role: email.toLowerCase().includes('admin') ? 'admin' : 'user',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50 dark:bg-[#060912]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <VortaLogo showEnglish />
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#4F8CFF] transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>بازگشت به خانه</span>
          </button>
        </div>

        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5">
          {mode === 'login' ? 'ورود به فضای کاری کاوی' : 'ساخت حساب کاربری کاوی'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {preservedPrompt
            ? 'درخواست شما ذخیره شده و بلافاصله پس از ورود باز می‌شود.'
            : 'با یک حساب کاربری به چت، استودیو، ایجنت‌ها و API دسترسی پیدا کنید.'}
        </p>

        {preservedPrompt && (
          <div className="mb-5 rounded-xl border border-[#4F8CFF]/30 bg-[#4F8CFF]/5 p-3 text-xs text-slate-700 dark:text-slate-200">
            <span className="font-semibold text-[#4F8CFF]">درخواست ذخیره‌شده: </span>
            <span className="line-clamp-2">{preservedPrompt}</span>
          </div>
        )}

        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#151B2B] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              mode === 'login'
                ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ورود به حساب
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              mode === 'register'
                ? 'bg-white dark:bg-[#0D1220] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ثبت‌نام رایگان
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                نام و نام خانوادگی
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="امیرحسین رضایی"
                  className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              نشانی ایمیل
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.ir"
                className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] text-left"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              رمز عبور
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F8CFF] text-left"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'ورود به کاوی' : 'ایجاد حساب و شروع'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ورود سریع آزمایشی (حالت ارزیابی محصول):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onSuccess({
                  name: 'امیرحسین رضایی',
                  email: 'amir@kaviai.ir',
                  role: 'user',
                })
              }
              className="py-2 px-3 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#151B2B] transition-colors whitespace-nowrap"
            >
              ورود کاربر نمونه
            </button>
            <button
              type="button"
              onClick={() =>
                onSuccess({
                  name: 'مدیر سیستم کاوی',
                  email: 'admin@kaviai.ir',
                  role: 'admin',
                })
              }
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border border-[#875BFF]/40 text-[#875BFF] hover:bg-[#875BFF]/10 transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ورود ادمین</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-5">
            معماری احراز هویت آماده اتصال Magic Link و OTP پیامکی با نشست امن HttpOnly است.
          </p>
        </div>
      </div>
    </div>
  );
};
