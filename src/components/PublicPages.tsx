import React, { useState } from 'react';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { BLOG_ARTICLES, SOLUTION_PAGES } from '../data/seedData';
import type { WorkspaceSection } from '../types/vorta';
import { VortaLogo } from './VortaLogo';

interface PublicPagesProps {
  page: 'blog' | 'docs' | 'legal' | 'solutions';
  slug?: string;
  onBackHome: () => void;
  onOpenSolution: (slug: string) => void;
  onEnterProduct: (section: WorkspaceSection) => void;
}

export const PublicPages: React.FC<PublicPagesProps> = ({
  page,
  slug,
  onBackHome,
  onOpenSolution,
  onEnterProduct,
}) => {
  const [blogSearch, setBlogSearch] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const activeSolution = SOLUTION_PAGES.find((s) => s.id === slug) || SOLUTION_PAGES[0];
  const filteredArticles = BLOG_ARTICLES.filter(
    (a) =>
      a.title.includes(blogSearch) ||
      a.category.includes(blogSearch) ||
      a.excerpt.includes(blogSearch)
  );
  const activeArticle = BLOG_ARTICLES.find((a) => a.id === selectedArticleId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060912] text-slate-900 dark:text-[#F8FAFC]">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0D1220]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <VortaLogo showEnglish />
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[#4F8CFF] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به صفحه اصلی</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {page === 'solutions' && (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              {SOLUTION_PAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onOpenSolution(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    s.id === activeSolution.id
                      ? 'bg-[#4F8CFF] text-white'
                      : 'bg-white dark:bg-[#0D1220] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-10 space-y-5">
              <p className="text-xs font-semibold text-[#4F8CFF]">{activeSolution.title}</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {activeSolution.h1}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-8">
                {activeSolution.description}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onEnterProduct(activeSolution.targetSection)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] transition-colors cursor-pointer"
                >
                  {activeSolution.cta}
                </button>
              </div>
            </article>
          </div>
        )}

        {page === 'blog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">بلاگ فنی و محصول کاوی</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  مقالات تخصصی درباره معماری Model Gateway، ایجنت‌ها و طراحی فارسی
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={blogSearch}
                  onChange={(e) => setBlogSearch(e.target.value)}
                  placeholder="جستجو در مقالات..."
                  className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220]"
                />
              </div>
            </div>

            {activeArticle ? (
              <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-8 space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedArticleId(null)}
                  className="text-xs text-[#4F8CFF] hover:underline cursor-pointer"
                >
                  بازگشت به فهرست مقالات
                </button>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activeArticle.category} · {activeArticle.author} · {activeArticle.publishedAt} · {activeArticle.readTime}
                </div>
                <h2 className="text-2xl font-bold">{activeArticle.title}</h2>
                <p className="text-sm leading-8 text-slate-700 dark:text-slate-200">
                  {activeArticle.body}
                </p>
              </article>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => setSelectedArticleId(article.id)}
                    className="text-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 hover:border-[#4F8CFF]/50 transition-colors cursor-pointer space-y-3"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {article.category} · {article.readTime}
                    </div>
                    <h2 className="font-bold text-base leading-6">{article.title}</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-6">
                      {article.excerpt}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {page === 'docs' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 text-[#4F8CFF]">
              <BookOpen className="w-5 h-5" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                راهنمای شروع سریع و اتصال ارائه‌دهندگان
              </h1>
            </div>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              کاوی (<span dir="ltr" className="font-mono">kaviai.ir</span>) بر پایه یک Model Gateway مرکزی در مسیر <code dir="ltr">/api/gateway/*</code> طراحی شده است. کلیدهای ارائه‌دهندگان فقط در متغیرهای محیطی سرور نگهداری می‌شوند.
            </p>
            <pre dir="ltr" className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto">
{`# .env configuration
GEMINI_API_KEY="..."        # Active & Functional
OPENAI_API_KEY=""           # Optional: activates OpenAI models
ANTHROPIC_API_KEY=""        # Optional: activates Claude models
DATABASE_URL="postgresql://..."`}
            </pre>
          </div>
        )}

        {page === 'legal' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-6 sm:p-8 space-y-4">
            <h1 className="text-2xl font-bold">شرایط استفاده، حریم خصوصی و شفافیت AI</h1>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              تمامی داده‌های گفتگو، کلیدهای API و عملیات ایجنت‌ها در نشست اختصاصی کاربر نگهداری می‌شوند. هیچ کلید ارائه‌دهنده‌ای به مرورگر ارسال نمی‌شود و عملیات حساس ایجنت‌ها تنها با تأیید صریح کاربر اجرا خواهند شد.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
