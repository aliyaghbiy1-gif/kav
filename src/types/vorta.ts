export type FeatureStatus = 'functional' | 'demo' | 'coming_soon';

export type Language = 'fa' | 'en';
export type ThemeMode = 'dark' | 'light';

export type WorkspaceSection =
  | 'dashboard'
  | 'chat'
  | 'studio'
  | 'social'
  | 'agents'
  | 'automations'
  | 'code'
  | 'projects'
  | 'files'
  | 'models'
  | 'api'
  | 'business'
  | 'wallet'
  | 'billing'
  | 'admin'
  | 'settings';

export type PublicPage =
  | 'landing'
  | 'auth'
  | 'pricing'
  | 'solutions'
  | 'blog'
  | 'docs'
  | 'legal';

export type Modality = 'text' | 'image' | 'video' | 'audio' | 'code' | 'reasoning';

export interface ProviderRecord {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  status: FeatureStatus;
  description: string;
}

export interface AIModelRecord {
  id: string;
  displayName: string;
  providerId: string;
  providerName: string;
  version: string;
  modalities: Modality[];
  features: string[];
  contextWindow: number;
  maxOutputTokens: number;
  inputCreditsPer1K: number;
  outputCreditsPer1K: number;
  tomanPerCredit: number;
  availability: FeatureStatus;
  supportsNegativePrompt?: boolean;
  supportsSeed?: boolean;
  supportsEndFrame?: boolean;
  description: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  textPreview?: string;
  dataUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  createdAt: string;
  inputTokens?: number;
  outputTokens?: number;
  costCredits?: number;
  attachments?: ChatAttachment[];
  status?: 'streaming' | 'done' | 'error';
  errorText?: string;
  isDemoOutput?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  folder: string;
  projectId: string;
  modelId: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'story' | 'audio';
  title: string;
  prompt: string;
  modelId: string;
  url: string;
  projectId: string;
  createdAt: string;
  durationSec?: number;
  aspectRatio?: string;
  isDemo: boolean;
}

export interface GenerationJob {
  id: string;
  modality: 'image' | 'video' | 'story' | 'audio';
  modelId: string;
  prompt: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progressPct: number;
  estimatedCredits: number;
  createdAt: string;
  resultUrl?: string;
  isDemo: boolean;
}

export interface AgentStep {
  id: string;
  index: number;
  title: string;
  detail: string;
  status: 'done' | 'running' | 'pending' | 'awaiting_approval';
  timestamp: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  status: 'running' | 'paused' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  costCredits: number;
  pendingApprovalAction?: string;
  finalReport?: string;
  errorText?: string;
  sandboxUrl?: string;
  steps: AgentStep[];
}

export interface AgentDefinition {
  id: string;
  name: string;
  goal: string;
  instructions: string;
  modelId: string;
  allowedTools: string[];
  dataSources: string[];
  maxCostCredits: number;
  requireApproval: boolean;
  runs: AgentRun[];
}

export interface AutomationJob {
  id: string;
  name: string;
  description: string;
  scheduleTime: string;
  timezone: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetUrls: string[];
  agentId: string;
  maxCostCredits: number;
  notifyChannel: 'in_app' | 'email' | 'webhook';
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: 'completed' | 'cancelled' | 'demo';
}

export interface LedgerEntry {
  id: string;
  type: 'purchase' | 'gift' | 'usage' | 'refund';
  amountCredits: number;
  bucket: 'purchased' | 'gift';
  amountToman?: number;
  expiresAt?: string;
  idempotencyKey: string;
  description: string;
  modelId?: string;
  projectId?: string;
  createdAt: string;
  isSandbox?: boolean;
}

export interface WalletState {
  purchasedCredits: number;
  giftCredits: number;
  giftExpiresAt: string;
  lowBalanceThreshold: number;
  tomanPerCredit: number;
  ledger: LedgerEntry[];
}

export interface APIKeyRecord {
  id: string;
  name: string;
  prefix: string;
  rateLimitRpm: number;
  monthlyCapCredits: number;
  usedCredits: number;
  revoked: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface APIRequestLog {
  id: string;
  endpoint: string;
  modelId: string;
  statusCode: number;
  latencyMs: number;
  credits: number;
  idempotencyKey: string;
  createdAt: string;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  quotaCredits: number;
  usedCredits: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  audience: string;
  monthlyPriceToman: number | null;
  includedCredits: number;
  isPopular?: boolean;
  isEnterprise?: boolean;
  pricePlaceholder?: string;
  limits: string[];
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  priority: 'normal' | 'high';
  createdAt: string;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  publishedAt: string;
  readTime: string;
  excerpt: string;
  body: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  planId: string;
}

export type SocialPlatform = 'instagram' | 'twitter';
export type SocialPostFormat = 'reel' | 'carousel' | 'story' | 'tweet' | 'thread';
export type SocialPostStatus = 'scheduled' | 'awaiting_approval' | 'published_demo' | 'draft';

export interface SocialPostItem {
  id: string;
  platform: SocialPlatform;
  format: SocialPostFormat;
  topic: string;
  caption: string;
  hashtags: string[];
  scheduledDate: string;
  scheduledTime: string;
  status: SocialPostStatus;
  requireApproval: boolean;
  mediaUrl?: string;
  tone: string;
  metrics?: {
    impressions: number;
    likes: number;
    comments: number;
    sharesOrRetweets: number;
    savesOrBookmarks: number;
    clicks: number;
  };
}

export interface SocialDailyAnalytics {
  dayLabel: string;
  instagramReach: number;
  twitterImpressions: number;
  instagramEngagementPct: number;
  twitterEngagementPct: number;
}

