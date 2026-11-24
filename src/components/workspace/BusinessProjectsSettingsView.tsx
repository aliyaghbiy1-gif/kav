import React, { useState } from 'react';
import { Building2, FolderKanban, Globe, Moon, Plus, Sun, Users } from 'lucide-react';
import type {
  AIModelRecord,
  Language,
  OrgMember,
  ThemeMode,
  UserProfile,
  WorkspaceProject,
} from '../../types/vorta';
import { formatNumber } from '../../lib/vortaLogic';
import { StatusText } from '../StatusText';

interface BusinessViewProps {
  members: OrgMember[];
  onInviteMember: (member: OrgMember) => void;
  onUpdateRole: (id: string, role: OrgMember['role']) => void;
}

export const BusinessView: React.FC<BusinessViewProps> = ({
  members,
  onInviteMember,
  onUpdateRole,
}) => {
  const [orgName, setOrgName] = useState('گروه فناوری کاوی');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgMember['role']>('Member');
  const [enterpriseSent, setEnterpriseSent] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) return;
    onInviteMember({
      id: `mem_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: inviteRole,
      quotaCredits: 1000,
      usedCredits: 0,
    });
    setInviteEmail('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#4F8CFF]" />
          <span>پنل سازمانی و تیم‌ها ({orgName})</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          مدیریت نقش‌های دسترسی (Owner، Admin، Member، Viewer)، سهمیه اعضا و درخواست استقرار سازمانی.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleInvite}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4"
        >
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#4F8CFF]" />
            <span>دعوت عضو جدید</span>
          </h2>
          <div>
            <label htmlFor="org-name" className="block text-xs font-medium mb-1">نام سازمان</label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label htmlFor="inv-email" className="block text-xs font-medium mb-1">ایمیل عضو</label>
            <input
              id="inv-email"
              type="email"
              dir="ltr"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.ir"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label htmlFor="inv-role" className="block text-xs font-medium mb-1">نقش (RBAC)</label>
            <select
              id="inv-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgMember['role'])}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
            >
              <option value="Admin">Admin</option>
              <option value="Member">Member</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] cursor-pointer"
          >
            ارسال دعوت‌نامه
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
              اعضای Workspace مشترک
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {members.map((m) => (
                <div key={m.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-slate-500 font-mono" dir="ltr">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-slate-500">
                      مصرف: {formatNumber(m.usedCredits)} / {formatNumber(m.quotaCredits)}
                    </span>
                    <select
                      aria-label={`نقش ${m.name}`}
                      value={m.role}
                      onChange={(e) => onUpdateRole(m.id, e.target.value as OrgMember['role'])}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151B2B] px-2 py-1 text-xs"
                    >
                      <option value="Owner">Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Member">Member</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-sm">درخواست پلن سازمانی و SLA اختصاصی</div>
              <p className="text-xs text-slate-500 mt-1">
                برای استقرار اختصاصی یا تعرفه حجم بالا با تیم فروش سازمانی در ارتباط باشید.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnterpriseSent(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#875BFF] text-white cursor-pointer whitespace-nowrap"
            >
              {enterpriseSent ? 'درخواست ثبت شد' : 'ثبت درخواست تماس فروش'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProjectsView: React.FC<{
  projects: WorkspaceProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => void;
}> = ({ projects, activeProjectId, onSelectProject, onCreateProject }) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-[#4F8CFF]" />
        <span>پروژه‌های من</span>
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreateProject(name.trim(), desc.trim() || 'پروژه کاری کاوی');
          setName('');
          setDesc('');
        }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-4 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="نام پروژه جدید..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
        />
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="توضیح کوتاه..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-3 py-2 text-xs"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ساخت پروژه</span>
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((p) => {
          const active = p.id === activeProjectId;
          return (
            <div
              key={p.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 ${
                active
                  ? 'border-[#4F8CFF] bg-[#4F8CFF]/5'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220]'
              }`}
            >
              <div>
                <div className="font-bold text-base">{p.name}</div>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">به‌روزرسانی: {p.updatedAt}</span>
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className="text-[#4F8CFF] font-semibold cursor-pointer"
                >
                  {active ? 'پروژه فعال' : 'انتخاب به عنوان فعال'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ModelsExplorerView: React.FC<{ models: AIModelRecord[] }> = ({ models }) => (
  <div className="max-w-6xl mx-auto space-y-6">
    <div>
      <h1 className="text-xl font-bold">کاتالوگ مدل‌ها و AI Gateway</h1>
      <p className="text-xs text-slate-500 mt-1">
        مشخصات فنی، محدودیت کانتکست، تعرفه هر ۱٬۰۰۰ توکن و وضعیت واقعی اتصال هر مدل.
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">{m.providerName} · v{m.version}</div>
              <h2 className="font-bold text-base">{m.displayName}</h2>
            </div>
            <StatusText status={m.availability} />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-6">{m.description}</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 tabular-nums pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
            <span>کانتکست: {formatNumber(m.contextWindow)}</span>
            <span>ورودی: {m.inputCreditsPer1K} کردیت</span>
            <span>خروجی: {m.outputCreditsPer1K} کردیت</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SettingsView: React.FC<{
  user: UserProfile;
  theme: ThemeMode;
  lang: Language;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onLogout: () => void;
}> = ({ user, theme, lang, onToggleTheme, onToggleLang, onLogout }) => {
  const [sessions, setSessions] = useState([
    { id: 'ses_1', device: 'مرورگر فعلی (Desktop Chrome)', location: 'تهران', current: true },
    { id: 'ses_2', device: 'موبایل iOS Safari', location: 'تهران', current: false },
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">تنظیمات حساب، ظاهر و امنیت نشست‌ها</h1>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-bold text-sm">{user.name}</div>
            <div className="text-xs text-slate-500 font-mono" dir="ltr">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-rose-500/40 text-rose-500 cursor-pointer"
          >
            خروج از حساب
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === 'dark' ? 'تغییر به Light Mode' : 'تغییر به Dark Mode'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLang}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>{lang === 'fa' ? 'زبان فعلی: فارسی (RTL) · تغییر به EN' : 'Language: English (LTR) · Switch to FA'}</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 space-y-3">
        <h2 className="font-bold text-sm">دستگاه‌ها و نشست‌های فعال</h2>
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-xs py-2 border-b last:border-b-0 border-slate-200 dark:border-slate-800">
            <div>
              <div className="font-semibold">{s.device}</div>
              <div className="text-slate-500">{s.location}</div>
            </div>
            {s.current ? (
              <span className="text-emerald-500">نشست فعلی</span>
            ) : (
              <button
                type="button"
                onClick={() => setSessions((prev) => prev.filter((x) => x.id !== s.id))}
                className="text-rose-500 hover:underline cursor-pointer"
              >
                لغو نشست
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
