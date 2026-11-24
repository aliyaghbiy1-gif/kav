import React, { useEffect, useState } from 'react';
import type {
  AIModelRecord,
  APIKeyRecord,
  APIRequestLog,
  AgentDefinition,
  AutomationJob,
  Conversation,
  Language,
  MediaAsset,
  NotificationItem,
  OrgMember,
  PricingPlan,
  ProviderRecord,
  SocialPostItem,
  SupportTicket,
  ThemeMode,
  UserProfile,
  WalletState,
  WorkspaceProject,
  WorkspaceSection,
} from './types/vorta';
import {
  INITIAL_AGENTS,
  INITIAL_API_KEYS,
  INITIAL_API_LOGS,
  INITIAL_AUTOMATIONS,
  INITIAL_CONVERSATIONS,
  INITIAL_MEDIA_ASSETS,
  INITIAL_MODELS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORG_MEMBERS,
  INITIAL_PLANS,
  INITIAL_PROJECTS,
  INITIAL_PROVIDERS,
  INITIAL_SOCIAL_POSTS,
  INITIAL_TICKETS,
  INITIAL_WALLET,
} from './data/seedData';
import { applyAtomicDebit, applyCreditRefund, routePromptIntent } from './lib/vortaLogic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { AuthScreen } from './components/AuthModal';
import { PublicPages } from './components/PublicPages';
import { WorkspaceShell } from './components/workspace/WorkspaceShell';
import { DashboardHomeView } from './components/workspace/DashboardHomeView';
import { ChatView } from './components/workspace/ChatView';
import { StudioView } from './components/workspace/StudioView';
import type { StudioTabId } from './components/workspace/StudioView';
import { SocialMediaView } from './components/workspace/SocialMediaView';
import { AgentsView } from './components/workspace/AgentsView';
import { AutomationsView } from './components/workspace/AutomationsView';
import { CodeView } from './components/workspace/CodeView';
import { ApiPortalView } from './components/workspace/ApiPortalView';
import { WalletBillingView } from './components/workspace/WalletBillingView';
import { AdminView } from './components/workspace/AdminView';
import {
  BusinessView,
  ModelsExplorerView,
  ProjectsView,
  SettingsView,
} from './components/workspace/BusinessProjectsSettingsView';

const STORAGE_KEY = 'kavi_ai_state_v1';

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => loadPersisted('theme', 'dark'));
  const [lang, setLang] = useState<Language>(() => loadPersisted('lang', 'fa'));
  const [user, setUser] = useState<UserProfile | null>(() => loadPersisted('user', null));

  const [viewMode, setViewMode] = useState<'landing' | 'auth' | 'workspace' | 'blog' | 'docs' | 'legal' | 'solutions'>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
      return 'workspace';
    }
    return user ? 'workspace' : 'landing';
  });
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('register');
  const [publicSlug, setPublicSlug] = useState<string>('chat');
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(() =>
    loadPersisted('section', 'dashboard')
  );

  // Preserved pre-login prompt & intent
  const [preservedPrompt, setPreservedPrompt] = useState<string>('');
  const [preservedAction, setPreservedAction] = useState<string | undefined>(undefined);
  const [sectionPrompt, setSectionPrompt] = useState<string>('');
  const [studioInitialTab, setStudioInitialTab] = useState<StudioTabId | undefined>(undefined);

  // Dynamic Application State
  const [providers, setProviders] = useState<ProviderRecord[]>(() =>
    loadPersisted('providers', INITIAL_PROVIDERS)
  );
  const [models, setModels] = useState<AIModelRecord[]>(() =>
    loadPersisted('models', INITIAL_MODELS)
  );
  const [plans, setPlans] = useState<PricingPlan[]>(() => loadPersisted('plans', INITIAL_PLANS));
  const [projects, setProjects] = useState<WorkspaceProject[]>(() =>
    loadPersisted('projects', INITIAL_PROJECTS)
  );
  const [activeProjectId, setActiveProjectId] = useState<string>(() =>
    loadPersisted('activeProjectId', INITIAL_PROJECTS[0].id)
  );
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadPersisted('conversations', INITIAL_CONVERSATIONS)
  );
  const [activeConvId, setActiveConvId] = useState<string>(() =>
    loadPersisted('activeConvId', INITIAL_CONVERSATIONS[0].id)
  );
  const [assets, setAssets] = useState<MediaAsset[]>(() =>
    loadPersisted('assets', INITIAL_MEDIA_ASSETS)
  );
  const [agents, setAgents] = useState<AgentDefinition[]>(() =>
    loadPersisted('agents', INITIAL_AGENTS)
  );
  const [socialPosts, setSocialPosts] = useState<SocialPostItem[]>(() =>
    loadPersisted('socialPosts', INITIAL_SOCIAL_POSTS)
  );
  const [automations, setAutomations] = useState<AutomationJob[]>(() =>
    loadPersisted('automations', INITIAL_AUTOMATIONS)
  );
  const [wallet, setWallet] = useState<WalletState>(() =>
    loadPersisted('wallet', INITIAL_WALLET)
  );
  const [apiKeys, setApiKeys] = useState<APIKeyRecord[]>(() =>
    loadPersisted('apiKeys', INITIAL_API_KEYS)
  );
  const [apiLogs, setApiLogs] = useState<APIRequestLog[]>(() =>
    loadPersisted('apiLogs', INITIAL_API_LOGS)
  );
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>(() =>
    loadPersisted('orgMembers', INITIAL_ORG_MEMBERS)
  );
  const [tickets, setTickets] = useState<SupportTicket[]>(() =>
    loadPersisted('tickets', INITIAL_TICKETS)
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [geminiServerReady, setGeminiServerReady] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // If ?autostart=1, ensure a demo user exists
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.search.includes('autostart=1') &&
      !user
    ) {
      setUser({
        id: 'usr_demo',
        name: 'امیرحسین رضایی',
        email: 'amir@kaviai.ir',
        role: 'admin',
        planId: 'plan_pro',
      });
      setViewMode('workspace');
    }
  }, [user]);

  // Sync theme & RTL/LTR on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.dir = lang === 'fa' ? 'rtl' : 'ltr';
    root.lang = lang;
    localStorage.setItem(`${STORAGE_KEY}:theme`, JSON.stringify(theme));
    localStorage.setItem(`${STORAGE_KEY}:lang`, JSON.stringify(lang));
  }, [theme, lang]);

  // Persist mutable workspace slices
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}:user`, JSON.stringify(user));
    localStorage.setItem(`${STORAGE_KEY}:section`, JSON.stringify(activeSection));
    localStorage.setItem(`${STORAGE_KEY}:providers`, JSON.stringify(providers));
    localStorage.setItem(`${STORAGE_KEY}:models`, JSON.stringify(models));
    localStorage.setItem(`${STORAGE_KEY}:plans`, JSON.stringify(plans));
    localStorage.setItem(`${STORAGE_KEY}:projects`, JSON.stringify(projects));
    localStorage.setItem(`${STORAGE_KEY}:activeProjectId`, JSON.stringify(activeProjectId));
    localStorage.setItem(`${STORAGE_KEY}:conversations`, JSON.stringify(conversations));
    localStorage.setItem(`${STORAGE_KEY}:activeConvId`, JSON.stringify(activeConvId));
    localStorage.setItem(`${STORAGE_KEY}:assets`, JSON.stringify(assets));
    localStorage.setItem(`${STORAGE_KEY}:agents`, JSON.stringify(agents));
    localStorage.setItem(`${STORAGE_KEY}:socialPosts`, JSON.stringify(socialPosts));
    localStorage.setItem(`${STORAGE_KEY}:automations`, JSON.stringify(automations));
    localStorage.setItem(`${STORAGE_KEY}:wallet`, JSON.stringify(wallet));
    localStorage.setItem(`${STORAGE_KEY}:apiKeys`, JSON.stringify(apiKeys));
    localStorage.setItem(`${STORAGE_KEY}:apiLogs`, JSON.stringify(apiLogs));
    localStorage.setItem(`${STORAGE_KEY}:orgMembers`, JSON.stringify(orgMembers));
    localStorage.setItem(`${STORAGE_KEY}:tickets`, JSON.stringify(tickets));
  }, [
    user,
    activeSection,
    providers,
    models,
    plans,
    projects,
    activeProjectId,
    conversations,
    activeConvId,
    assets,
    agents,
    socialPosts,
    automations,
    wallet,
    apiKeys,
    apiLogs,
    orgMembers,
    tickets,
  ]);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d: { geminiConfigured?: boolean }) => {
        setGeminiServerReady(Boolean(d.geminiConfigured));
      })
      .catch(() => setGeminiServerReady(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleStartAuth = (mode: 'login' | 'register', prompt?: string, quickAction?: string) => {
    setAuthInitialMode(mode);
    if (prompt) setPreservedPrompt(prompt);
    if (quickAction) setPreservedAction(quickAction);
    setViewMode('auth');
  };

  const handleAuthSuccess = (info: { name: string; email: string; role: 'user' | 'admin' }) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: info.name,
      email: info.email,
      role: info.role,
      planId: 'plan_pro',
    };
    setUser(newUser);
    setViewMode('workspace');
    if (preservedPrompt) {
      const target = routePromptIntent(preservedPrompt, preservedAction);
      if (
        target === 'studio' &&
        (preservedAction === 'image' ||
          preservedAction === 'video' ||
          preservedAction === 'story' ||
          preservedAction === 'audio')
      ) {
        setStudioInitialTab(preservedAction);
      }
      setSectionPrompt(preservedPrompt);
      setActiveSection(target);
      setPreservedPrompt('');
      setPreservedAction(undefined);
    }
    showToast(`خوش آمدید ${info.name}`);
  };

  const handleEnterWorkspace = (
    section?: WorkspaceSection,
    prompt?: string,
    quickAction?: string
  ) => {
    if (!user) {
      handleStartAuth('register', prompt, quickAction);
      return;
    }
    if (
      quickAction === 'image' ||
      quickAction === 'video' ||
      quickAction === 'story' ||
      quickAction === 'audio'
    ) {
      setStudioInitialTab(quickAction);
    }
    if (prompt) {
      const target = section ?? routePromptIntent(prompt, quickAction);
      setSectionPrompt(prompt);
      setActiveSection(target);
    } else if (section) {
      setActiveSection(section);
    }
    setViewMode('workspace');
  };

  const handleDebitCredits = (
    amount: number,
    idempotencyKey: string,
    description: string,
    modelId: string
  ): boolean => {
    const result = applyAtomicDebit(wallet, {
      amountCredits: amount,
      idempotencyKey,
      description,
      modelId,
      projectId: activeProjectId,
    });
    if (!result.ok) {
      showToast(result.error || 'موجودی اعتبار کافی نیست.');
      return false;
    }
    setWallet(result.wallet);
    return true;
  };

  const handleRefundCredits = (amount: number, idempotencyKey: string, description: string) => {
    setWallet((prev) => applyCreditRefund(prev, { amountCredits: amount, idempotencyKey, description }));
  };

  return (
    <ErrorBoundary>
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-lg"
        >
          {toast}
        </div>
      )}

      {viewMode === 'landing' && (
        <LandingPage
          models={models}
          assets={assets}
          plans={plans}
          theme={theme}
          isAuthenticated={Boolean(user)}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onStartAuth={handleStartAuth}
          onEnterWorkspace={handleEnterWorkspace}
          onOpenPublicPage={(page, slug) => {
            if (slug) setPublicSlug(slug);
            setViewMode(page);
          }}
        />
      )}

      {viewMode === 'auth' && (
        <AuthScreen
          initialMode={authInitialMode}
          preservedPrompt={preservedPrompt}
          onSuccess={handleAuthSuccess}
          onBack={() => setViewMode('landing')}
        />
      )}

      {(viewMode === 'blog' ||
        viewMode === 'docs' ||
        viewMode === 'legal' ||
        viewMode === 'solutions') && (
        <PublicPages
          page={viewMode}
          slug={publicSlug}
          onBackHome={() => setViewMode('landing')}
          onOpenSolution={(s) => setPublicSlug(s)}
          onEnterProduct={(sec) => handleEnterWorkspace(sec)}
        />
      )}

      {viewMode === 'workspace' && user && (
        <WorkspaceShell
          user={user}
          activeSection={activeSection}
          projects={projects}
          activeProjectId={activeProjectId}
          wallet={wallet}
          notifications={notifications}
          theme={theme}
          lang={lang}
          onSelectSection={setActiveSection}
          onSelectProject={setActiveProjectId}
          onMarkNotificationsRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
          }
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onToggleLang={() => setLang((l) => (l === 'fa' ? 'en' : 'fa'))}
          onBackLanding={() => setViewMode('landing')}
        >
          {activeSection === 'dashboard' && (
            <DashboardHomeView
              user={user}
              projects={projects}
              conversations={conversations}
              agents={agents}
              wallet={wallet}
              onNavigate={setActiveSection}
              onLaunchPrompt={(prompt, target) => {
                setSectionPrompt(prompt);
                setActiveSection(target);
              }}
            />
          )}

          {activeSection === 'chat' && (
            <ChatView
              models={models}
              conversations={conversations}
              activeConversationId={activeConvId}
              activeProjectId={activeProjectId}
              wallet={wallet}
              geminiServerReady={geminiServerReady}
              initialPrompt={sectionPrompt}
              onConsumeInitialPrompt={() => setSectionPrompt('')}
              onSelectConversation={setActiveConvId}
              onCreateConversation={(modelId) => {
                const newId = `conv_${Date.now()}`;
                setConversations((prev) => [
                  {
                    id: newId,
                    title: 'گفتگوی جدید',
                    folder: 'عمومی',
                    projectId: activeProjectId,
                    modelId,
                    updatedAt: 'هم‌اکنون',
                    messages: [],
                  },
                  ...prev,
                ]);
                setActiveConvId(newId);
                return newId;
              }}
              onUpdateConversation={(id, updater) =>
                setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
              }
              onDeleteConversation={(id) => {
                setConversations((prev) => {
                  const next = prev.filter((c) => c.id !== id);
                  if (activeConvId === id && next[0]) setActiveConvId(next[0].id);
                  return next;
                });
              }}
              onDebitCredits={handleDebitCredits}
              onRefundCredits={handleRefundCredits}
            />
          )}

          {(activeSection === 'studio' || activeSection === 'files') && (
            <StudioView
              models={models}
              assets={assets}
              activeProjectId={activeProjectId}
              initialPrompt={sectionPrompt}
              initialTab={studioInitialTab}
              onConsumeInitialPrompt={() => setSectionPrompt('')}
              onConsumeInitialTab={() => setStudioInitialTab(undefined)}
              onAddAsset={(a) => {
                setAssets((prev) => [a, ...prev]);
                showToast('دارایی جدید در کتابخانه ذخیره شد.');
              }}
              onDeleteAsset={(id) => setAssets((prev) => prev.filter((a) => a.id !== id))}
            />
          )}

          {activeSection === 'social' && (
            <SocialMediaView
              posts={socialPosts}
              geminiServerReady={geminiServerReady}
              initialPrompt={sectionPrompt}
              onConsumeInitialPrompt={() => setSectionPrompt('')}
              onCreatePost={(post) => {
                setSocialPosts((prev) => [post, ...prev]);
                showToast(
                  post.status === 'draft'
                    ? 'پیش‌نویس در صف ذخیره شد.'
                    : 'پست در تقویم انتشار زمان‌بندی شد.'
                );
              }}
              onUpdatePost={(id, updater) => {
                setSocialPosts((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
                showToast('وضعیت پست به‌روزرسانی شد.');
              }}
              onDeletePost={(id) => {
                setSocialPosts((prev) => prev.filter((p) => p.id !== id));
                showToast('پست از صف حذف شد.');
              }}
            />
          )}

          {activeSection === 'agents' && (
            <AgentsView
              agents={agents}
              models={models}
              initialPrompt={sectionPrompt}
              onConsumeInitialPrompt={() => setSectionPrompt('')}
              onCreateAgent={(ag) => {
                setAgents((prev) => [ag, ...prev]);
                showToast('ایجنت جدید با موفقیت ساخته شد.');
              }}
              onUpdateAgent={(id, updater) =>
                setAgents((prev) => prev.map((a) => (a.id === id ? updater(a) : a)))
              }
            />
          )}

          {activeSection === 'automations' && (
            <AutomationsView
              automations={automations}
              agents={agents}
              onCreateAutomation={(job) => {
                setAutomations((prev) => [job, ...prev]);
                showToast('اتوماسیون زمان‌بندی‌شده ثبت شد.');
              }}
              onToggleAutomation={(id) =>
                setAutomations((prev) =>
                  prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
                )
              }
              onRunNow={(id) => {
                setAutomations((prev) =>
                  prev.map((a) =>
                    a.id === id
                      ? { ...a, lastRunAt: 'هم‌اکنون', lastRunStatus: 'demo' }
                      : a
                  )
                );
                showToast('اجرای آزمایشی اتوماسیون ثبت شد.');
              }}
              onDeleteAutomation={(id) =>
                setAutomations((prev) => prev.filter((a) => a.id !== id))
              }
            />
          )}

          {activeSection === 'code' && (
            <CodeView
              initialPrompt={sectionPrompt}
              onConsumeInitialPrompt={() => setSectionPrompt('')}
            />
          )}

          {activeSection === 'projects' && (
            <ProjectsView
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                showToast('پروژه فعال تغییر کرد.');
              }}
              onCreateProject={(name, description) => {
                const newP: WorkspaceProject = {
                  id: `proj_${Date.now()}`,
                  name,
                  description,
                  updatedAt: 'هم‌اکنون',
                };
                setProjects((prev) => [newP, ...prev]);
                setActiveProjectId(newP.id);
              }}
            />
          )}

          {activeSection === 'models' && <ModelsExplorerView models={models} />}

          {activeSection === 'api' && (
            <ApiPortalView
              models={models}
              apiKeys={apiKeys}
              logs={apiLogs}
              onCreateKey={(k) => setApiKeys((prev) => [k, ...prev])}
              onRevokeKey={(id) =>
                setApiKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked: true } : k)))
              }
              onAddLog={(lg) => setApiLogs((prev) => [lg, ...prev])}
            />
          )}

          {activeSection === 'business' && (
            <BusinessView
              members={orgMembers}
              onInviteMember={(m) => {
                setOrgMembers((prev) => [...prev, m]);
                showToast('دعوت‌نامه عضو جدید ارسال شد.');
              }}
              onUpdateRole={(id, role) =>
                setOrgMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
              }
            />
          )}

          {(activeSection === 'wallet' || activeSection === 'billing') && (
            <WalletBillingView
              mode={activeSection}
              wallet={wallet}
              plans={plans}
              currentPlanId={user.planId}
              onTopUpSandbox={(credits, toman) => {
                setWallet((prev) => ({
                  ...prev,
                  purchasedCredits: prev.purchasedCredits + credits,
                  ledger: [
                    {
                      id: `ldg_${Date.now()}`,
                      type: 'purchase',
                      amountCredits: credits,
                      bucket: 'purchased',
                      amountToman: toman,
                      idempotencyKey: `sbx_${Date.now()}`,
                      description: 'افزایش اعتبار آزمایشی (Sandbox زرین‌پال)',
                      createdAt: 'هم‌اکنون',
                      isSandbox: true,
                    },
                    ...prev.ledger,
                  ],
                }));
              }}
              onChangePlan={(planId) => {
                setUser((prev) => (prev ? { ...prev, planId } : prev));
                showToast('پلن اشتراک در حالت Sandbox به‌روزرسانی شد.');
              }}
            />
          )}

          {activeSection === 'admin' && (
            <AdminView
              models={models}
              providers={providers}
              plans={plans}
              tickets={tickets}
              onUpdateModel={(id, patch) => {
                setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
                showToast('تنظیمات مدل به‌روزرسانی شد.');
              }}
              onAddModel={(m) => {
                setModels((prev) => [m, ...prev]);
                showToast('مدل جدید به Registry اضافه شد.');
              }}
              onUpdatePlanPrice={(planId, monthlyPriceToman) =>
                setPlans((prev) =>
                  prev.map((p) => (p.id === planId ? { ...p, monthlyPriceToman } : p))
                )
              }
              onToggleProvider={(pid) =>
                setProviders((prev) =>
                  prev.map((p) => (p.id === pid ? { ...p, enabled: !p.enabled } : p))
                )
              }
              onResolveTicket={(tid) =>
                setTickets((prev) =>
                  prev.map((t) => (t.id === tid ? { ...t, status: 'answered' } : t))
                )
              }
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              user={user}
              theme={theme}
              lang={lang}
              onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              onToggleLang={() => setLang((l) => (l === 'fa' ? 'en' : 'fa'))}
              onLogout={() => {
                setUser(null);
                setViewMode('landing');
              }}
            />
          )}
        </WorkspaceShell>
      )}
    </ErrorBoundary>
  );
}
