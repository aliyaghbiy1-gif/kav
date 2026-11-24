import React, { useEffect, useState } from 'react';
import {
  Bell,
  Bot,
  Building2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Command,
  Cpu,
  CreditCard,
  FolderKanban,
  FolderOpen,
  Globe,
  Home,
  Image as ImageIcon,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sun,
  Terminal,
  Wallet,
  Workflow,
  X,
} from 'lucide-react';
import type {
  Language,
  NotificationItem,
  ThemeMode,
  UserProfile,
  WalletState,
  WorkspaceProject,
  WorkspaceSection,
} from '../../types/vorta';
import { formatNumber, getTotalCredits } from '../../lib/vortaLogic';
import { VortaLogo } from '../VortaLogo';

interface WorkspaceShellProps {
  user: UserProfile;
  activeSection: WorkspaceSection;
  projects: WorkspaceProject[];
  activeProjectId: string;
  wallet: WalletState;
  notifications: NotificationItem[];
  theme: ThemeMode;
  lang: Language;
  onSelectSection: (sec: WorkspaceSection) => void;
  onSelectProject: (id: string) => void;
  onMarkNotificationsRead: () => void;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onBackLanding: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: WorkspaceSection;
  labelFa: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', labelFa: 'خانه', labelEn: 'Home', icon: Home },
  { id: 'chat', labelFa: 'چت هوشمند', labelEn: 'Kavi Chat', icon: MessageSquare },
  { id: 'studio', labelFa: 'استودیو', labelEn: 'Kavi Studio', icon: ImageIcon },
  { id: 'social', labelFa: 'شبکه‌های اجتماعی', labelEn: 'Social Agent', icon: Share2 },
  { id: 'agents', labelFa: 'ایجنت‌های کاوی', labelEn: 'Kavi Agents', icon: Bot },
  { id: 'automations', labelFa: 'اتوماسیون‌ها', labelEn: 'Automations', icon: Workflow },
  { id: 'code', labelFa: 'کدنویسی', labelEn: 'Kavi Code', icon: Code2 },
  { id: 'projects', labelFa: 'پروژه‌های من', labelEn: 'Projects', icon: FolderKanban },
  { id: 'files', labelFa: 'فایل‌ها و دارایی‌ها', labelEn: 'Files', icon: FolderOpen },
  { id: 'models', labelFa: 'مدل‌ها', labelEn: 'Models', icon: Cpu },
  { id: 'api', labelFa: 'API', labelEn: 'API Portal', icon: Terminal },
  { id: 'business', labelFa: 'تیم و سازمان', labelEn: 'Business', icon: Building2 },
  { id: 'wallet', labelFa: 'کیف پول و اعتبار', labelEn: 'Wallet', icon: Wallet },
  { id: 'billing', labelFa: 'اشتراک من', labelEn: 'Billing', icon: CreditCard },
  { id: 'admin', labelFa: 'پنل مدیریت', labelEn: 'Admin', icon: ShieldCheck },
  { id: 'settings', labelFa: 'تنظیمات', labelEn: 'Settings', icon: Settings },
];

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  user,
  activeSection,
  projects,
  activeProjectId,
  wallet,
  notifications,
  theme,
  lang,
  onSelectSection,
  onSelectProject,
  onMarkNotificationsRead,
  onToggleTheme,
  onToggleLang,
  onBackLanding,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const totalCredits = getTotalCredits(wallet);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      } else if (e.key === 'Escape') {
        setPaletteOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredNav = NAV_ITEMS.filter(
    (item) =>
      item.labelFa.includes(paletteQuery) ||
      item.labelEn.toLowerCase().includes(paletteQuery.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBackLanding}
          className="cursor-pointer"
          aria-label="بازگشت به صفحه معرفی کاوی"
        >
          {collapsed ? (
            <span className="font-extrabold text-lg text-[#4F8CFF]">ک</span>
          ) : (
            <VortaLogo showEnglish />
          )}
        </button>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
          className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav aria-label="منوی اصلی فضای کاری" className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B2B]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span>{lang === 'fa' ? item.labelFa : item.labelEn}</span>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="font-semibold truncate">{user.name}</div>
          <div className="text-[11px] text-slate-500 truncate font-mono" dir="ltr">
            {user.email}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#060912] text-slate-900 dark:text-[#F8FAFC]">
      {/* Desktop Sidebar (Right in RTL) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] transition-all ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="w-64 bg-white dark:bg-[#0D1220] border-l border-slate-200 dark:border-slate-800 h-full">
            {sidebarContent}
          </div>
          <button
            type="button"
            aria-label="بستن منو"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-black/50"
          />
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Header */}
        <header className="h-16 px-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-[#0D1220]/85 backdrop-blur-md flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="باز کردن منوی ناوبری"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Project / Workspace Selector */}
            <label htmlFor="ws-project-select" className="sr-only">
              انتخاب پروژه فعال
            </label>
            <select
              id="ws-project-select"
              value={activeProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] px-2.5 sm:px-3 py-1.5 text-xs font-medium min-w-0 w-full max-w-[140px] sm:max-w-xs truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-xs text-slate-500 hover:border-[#4F8CFF] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>جستجو یا فرمان</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono opacity-75">
                <Command className="w-3 h-3" />K
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectSection('wallet')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B] text-[11px] sm:text-xs font-semibold tabular-nums hover:border-[#4F8CFF] cursor-pointer whitespace-nowrap shrink-0"
            >
              {formatNumber(totalCredits)} کردیت
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  onMarkNotificationsRead();
                }}
                aria-label="اعلان‌ها"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#151B2B] cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4F8CFF] text-white text-[10px] flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-3 shadow-lg z-50 space-y-2">
                  <div className="text-xs font-bold px-1">اعلان‌ها</div>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#151B2B] text-xs space-y-1"
                    >
                      <div className="font-semibold">{n.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{n.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleLang}
              aria-label="تغییر زبان"
              className="hidden sm:inline-flex p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#151B2B] cursor-pointer"
            >
              <Globe className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="تغییر تم روشن یا تیره"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#151B2B] cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">{children}</main>
      </div>

      {/* Command Palette */}
      {paletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="فرمان سریع"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="نام بخش مورد نظر را تایپ کنید..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                aria-label="بستن"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      setPaletteOpen(false);
                      setPaletteQuery('');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-[#151B2B] cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2.5 font-medium">
                      <Icon className="w-4 h-4 text-[#4F8CFF]" />
                      <span>{item.labelFa}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{item.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
