import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Edit3,
  Folder,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AIModelRecord,
  ChatAttachment,
  ChatMessage,
  Conversation,
  WalletState,
} from '../../types/vorta';
import { estimateChatCost, formatNumber, formatToman } from '../../lib/vortaLogic';
import { MarkdownView } from '../MarkdownView';
import { StatusText } from '../StatusText';

interface ChatViewProps {
  models: AIModelRecord[];
  conversations: Conversation[];
  activeConversationId: string;
  activeProjectId: string;
  wallet: WalletState;
  geminiServerReady: boolean;
  initialPrompt?: string;
  onConsumeInitialPrompt: () => void;
  onSelectConversation: (id: string) => void;
  onCreateConversation: (modelId: string) => string;
  onUpdateConversation: (id: string, updater: (prev: Conversation) => Conversation) => void;
  onDeleteConversation: (id: string) => void;
  onDebitCredits: (amount: number, idempotencyKey: string, desc: string, modelId: string) => boolean;
  onRefundCredits: (amount: number, idempotencyKey: string, desc: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  models,
  conversations,
  activeConversationId,
  activeProjectId,
  wallet,
  geminiServerReady,
  initialPrompt,
  onConsumeInitialPrompt,
  onSelectConversation,
  onCreateConversation,
  onUpdateConversation,
  onDeleteConversation,
  onDebitCredits,
  onRefundCredits,
}) => {
  const textModels = useMemo(
    () => models.filter((m) => m.modalities.includes('text')),
    [models]
  );

  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const [input, setInput] = useState('');
  const [searchHistory, setSearchHistory] = useState('');
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [fastMode, setFastMode] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      onConsumeInitialPrompt();
    }
  }, [initialPrompt, onConsumeInitialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConv?.messages.length, isStreaming]);

  const currentModel =
    textModels.find((m) => m.id === activeConv?.modelId) || textModels[0];

  const costEstimate = useMemo(() => {
    if (!currentModel) return { inputTokens: 0, estimatedCredits: 0, estimatedToman: 0 };
    return estimateChatCost(currentModel, input);
  }, [currentModel, input]);

  const filteredConversations = conversations.filter(
    (c) =>
      c.title.includes(searchHistory) ||
      c.folder.includes(searchHistory) ||
      c.messages.some((m) => m.content.includes(searchHistory))
  );

  const filteredModels = textModels.filter(
    (m) =>
      m.displayName.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.providerName.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const loaded: ChatAttachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 4 * 1024 * 1024) continue;
      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.readAsDataURL(file);
        });
        loaded.push({
          id: `att_${Date.now()}_${file.name}`,
          name: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          dataUrl,
        });
      } else {
        let textPreview = '';
        if (
          file.type.startsWith('text/') ||
          /\.(txt|csv|json|md)$/i.test(file.name)
        ) {
          textPreview = (await file.text()).slice(0, 6000);
        } else {
          textPreview = `[فایل پیوست ${file.name} با فرمت ${file.type || 'سند'} - استخراج متن سمت سرور در نسخه تولیدی با Worker انجام می‌شود.]`;
        }
        loaded.push({
          id: `att_${Date.now()}_${file.name}`,
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          textPreview,
        });
      }
    }
    setAttachments((prev) => [...prev, ...loaded]);
    e.target.value = '';
  };

  const sendMessage = async (textOverride?: string, truncateFromMessageId?: string) => {
    if (!activeConv || !currentModel || isStreaming) return;
    const promptText = (textOverride ?? input).trim();
    if (!promptText) return;

    const reqId = `chat_${Date.now()}`;
    const est = estimateChatCost(currentModel, promptText, 300);
    const reserveAmount = Math.max(0.2, est.estimatedCredits);

    const debited = onDebitCredits(
      reserveAmount,
      reqId,
      `گفتگو با ${currentModel.displayName}`,
      currentModel.id
    );
    if (!debited) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: promptText,
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const assistantMsgId = `msg_a_${Date.now() + 1}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      modelId: currentModel.id,
      createdAt: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'streaming',
    };

    let baseMessages = activeConv.messages;
    if (truncateFromMessageId) {
      const idx = baseMessages.findIndex((m) => m.id === truncateFromMessageId);
      if (idx > -1) baseMessages = baseMessages.slice(0, idx);
    }

    const updatedHistory = [...baseMessages, userMsg];
    const shouldRetitle = activeConv.messages.length === 0 || activeConv.title === 'گفتگوی جدید';

    onUpdateConversation(activeConv.id, (prev) => ({
      ...prev,
      title: shouldRetitle ? promptText.slice(0, 38) : prev.title,
      updatedAt: 'هم‌اکنون',
      messages: [...updatedHistory, placeholderAssistant],
    }));

    if (!textOverride) setInput('');
    const sentAttachments = [...attachments];
    setAttachments([]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/gateway/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: currentModel.id,
          messages: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
          fastMode,
          attachments: sentAttachments,
        }),
      });

      if (!response.ok || !response.body) {
        let errText = 'خطا در ارتباط با Model Gateway.';
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errText = errJson.error;
        } catch {
          // ignore
        }
        onRefundCredits(reserveAmount, `refund_${reqId}`, `بازگشت اعتبار ناموفق (${currentModel.displayName})`);
        onUpdateConversation(activeConv.id, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, status: 'error', errorText: errText, content: '' }
              : m
          ),
        }));
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const payload = JSON.parse(line.slice(5).trim()) as {
            type: 'delta' | 'done' | 'error';
            text?: string;
            error?: string;
            inputTokens?: number;
            outputTokens?: number;
          };

          if (payload.type === 'delta' && payload.text) {
            accumulated += payload.text;
            onUpdateConversation(activeConv.id, (prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulated } : m
              ),
            }));
          } else if (payload.type === 'error') {
            onRefundCredits(reserveAmount, `refund_${reqId}`, 'بازگشت اعتبار خطای استریم');
            onUpdateConversation(activeConv.id, (prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, status: 'error', errorText: payload.error || 'خطا در تولید پاسخ' }
                  : m
              ),
            }));
          } else if (payload.type === 'done') {
            onUpdateConversation(activeConv.id, (prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      status: 'done',
                      inputTokens: payload.inputTokens,
                      outputTokens: payload.outputTokens,
                      costCredits: reserveAmount,
                    }
                  : m
              ),
            }));
          }
        }
      }
    } catch {
      onRefundCredits(reserveAmount, `refund_${reqId}`, 'بازگشت اعتبار خطای شبکه');
      onUpdateConversation(activeConv.id, (prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                status: 'error',
                errorText: 'ارتباط با سرور برقرار نشد. هزینه رزروشده به کیف پول بازگشت.',
              }
            : m
        ),
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeConv) return;
    const md = activeConv.messages
      .map((m) => `### ${m.role === 'user' ? 'کاربر' : 'کاوی'}\n\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConv.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-4">
      {/* Conversation Sidebar */}
      <aside className="w-full lg:w-72 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <button
            type="button"
            onClick={() => onCreateConversation(currentModel?.id || 'gemini-4-hydrogen')}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>گفتگوی جدید</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              placeholder="جستجو در گفتگوها..."
              aria-label="جستجو در تاریخچه گفتگوها"
              className="w-full pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((conv) => {
            const isActive = conv.id === activeConv?.id;
            return (
              <div
                key={conv.id}
                className={`group rounded-xl p-2.5 transition-colors ${
                  isActive
                    ? 'bg-[#4F8CFF]/10 border border-[#4F8CFF]/30'
                    : 'hover:bg-slate-100 dark:hover:bg-[#151B2B] border border-transparent'
                }`}
              >
                {renamingId === conv.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 text-xs px-2 py-1 rounded bg-white dark:bg-[#060912] border border-slate-300 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (renameValue.trim()) {
                          onUpdateConversation(conv.id, (p) => ({ ...p, title: renameValue.trim() }));
                        }
                        setRenamingId(null);
                      }}
                      className="p-1 text-emerald-500 cursor-pointer"
                      aria-label="ذخیره نام"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectConversation(conv.id)}
                      className="text-right flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="text-xs font-semibold truncate">{conv.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Folder className="w-3 h-3" />
                        <span>{conv.folder}</span>
                        <span>·</span>
                        <span>{conv.updatedAt}</span>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingId(conv.id);
                          setRenameValue(conv.title);
                        }}
                        aria-label={`تغییر نام ${conv.title}`}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {conversations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteConversation(conv.id)}
                          aria-label={`حذف ${conv.title}`}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Pane */}
      <section className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] flex flex-col overflow-hidden">
        {/* Top Bar: Model Selector + Connection & Export */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModelPickerOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#151B2B] text-xs font-semibold hover:border-[#4F8CFF] transition-colors cursor-pointer"
            >
              <span>{currentModel?.displayName}</span>
              <span className="text-slate-400">·</span>
              <StatusText status={currentModel?.availability || 'demo'} />
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setFastMode((f) => !f)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                fastMode
                  ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 text-[#4F8CFF]'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              {fastMode ? 'حالت پاسخ سریع: فعال' : 'استدلال متعادل'}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {geminiServerReady
                ? 'وضعیت Gateway: متصل'
                : 'هشدار: GEMINI_API_KEY در سرور یافت نشد'}
            </span>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B2B] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی MD</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <div className="text-base font-bold">گفتگوی جدید با {currentModel?.displayName}</div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-6">
                می‌توانید فایل متنی، CSV یا تصویر پیوست کنید و در طول گفتگو مدل را تغییر دهید. برای پاسخ واقعی زنده، مدل «Gemini 4 Hydrogen» متصل است.
              </p>
            </div>
          ) : (
            activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-stretch'}`}
              >
                <div
                  className={`rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-[#4F8CFF]/10 border border-[#4F8CFF]/25 max-w-2xl'
                      : 'bg-slate-50 dark:bg-[#151B2B]/70 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {msg.role === 'user'
                        ? 'شما'
                        : models.find((m) => m.id === msg.modelId)?.displayName || 'کاوی'}
                    </span>
                    <div className="flex items-center gap-2 tabular-nums">
                      {msg.costCredits !== undefined && (
                        <span>{formatNumber(msg.costCredits)} کردیت</span>
                      )}
                      <span>{msg.createdAt}</span>
                    </div>
                  </div>

                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
                      {msg.attachments.map((att) => (
                        <span key={att.id} className="inline-flex items-center gap-1 underline">
                          <Paperclip className="w-3 h-3" />
                          <span>{att.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {editingMsgId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060912]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextText = editingText.trim();
                            setEditingMsgId(null);
                            if (nextText) sendMessage(nextText, msg.id);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4F8CFF] text-white cursor-pointer"
                        >
                          ارسال مجدد
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMsgId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : msg.status === 'error' ? (
                    <div className="flex items-start gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{msg.errorText}</span>
                    </div>
                  ) : msg.status === 'streaming' && !msg.content ? (
                    <div className="text-xs text-slate-500 animate-pulse">
                      در حال دریافت پاسخ جریانی از Model Gateway...
                    </div>
                  ) : (
                    <MarkdownView content={msg.content} />
                  )}

                  {/* Message Actions */}
                  {msg.status !== 'streaming' && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3 text-[11px] text-slate-500">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(msg.content);
                            setCopiedId(msg.id);
                            setTimeout(() => setCopiedId(null), 1400);
                          } catch {
                            // ignore
                          }
                        }}
                        className="inline-flex items-center gap-1 hover:text-[#4F8CFF] cursor-pointer"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === msg.id ? 'کپی شد' : 'کپی'}</span>
                      </button>

                      {msg.role === 'user' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMsgId(msg.id);
                            setEditingText(msg.content);
                          }}
                          className="inline-flex items-center gap-1 hover:text-[#4F8CFF] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>ویرایش و اجرا</span>
                        </button>
                      )}

                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => {
                            const prevUser = [...activeConv.messages]
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (prevUser) sendMessage(prevUser.content, prevUser.id);
                          }}
                          className="inline-flex items-center gap-1 hover:text-[#4F8CFF] cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>تولید دوباره</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#060912]/60">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#151B2B] border border-slate-200 dark:border-slate-700"
                >
                  <Paperclip className="w-3 h-3 text-[#4F8CFF]" />
                  <span>{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((p) => p.filter((x) => x.id !== att.id))}
                    aria-label={`حذف ${att.name}`}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.csv,.json,.md,.pdf,.docx,.xlsx,image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="پیوست فایل یا تصویر"
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] text-slate-600 dark:text-slate-300 hover:border-[#4F8CFF] cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="پیام خود را بنویسید (برای خط جدید Shift+Enter بزنید)..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]"
              />

              <button
                type="submit"
                disabled={isStreaming || !input.trim()}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#4F8CFF] hover:bg-[#3e7af0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="ارسال پیام"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1 tabular-nums">
              <span>
                پروژه فعال: {activeProjectId} · ورودی تقریبی: {formatNumber(costEstimate.inputTokens)} توکن
              </span>
              <span>
                هزینه تخمینی پیش از ارسال: {formatNumber(costEstimate.estimatedCredits)} کردیت ({formatToman(costEstimate.estimatedToman)}) · موجودی:{' '}
                {formatNumber(wallet.purchasedCredits + wallet.giftCredits)}
              </span>
            </div>
          </form>
        </div>
      </section>

      {/* Model Selector & Comparison Modal */}
      {modelPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="انتخاب و مقایسه مدل هوش مصنوعی"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1220] p-5 sm:p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold">انتخاب و مقایسه مدل از Registry</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تعرفه‌ها و وضعیت اتصال مستقیماً از پنل مدیریت دریافت می‌شوند.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModelPickerOpen(false)}
                aria-label="بستن پنجره انتخاب مدل"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#151B2B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="جستجو بر اساس نام مدل یا ارائه‌دهنده..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151B2B]"
              />
            </div>

            <div className="overflow-y-auto space-y-2.5">
              {filteredModels.map((m) => {
                const selected = m.id === currentModel?.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (activeConv) {
                        onUpdateConversation(activeConv.id, (p) => ({ ...p, modelId: m.id }));
                      }
                      setModelPickerOpen(false);
                    }}
                    className={`w-full text-right rounded-xl border p-4 transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#4F8CFF] bg-[#4F8CFF]/5'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{m.displayName}</span>
                        <span className="text-xs text-slate-500">({m.providerName})</span>
                      </div>
                      <StatusText status={m.availability} />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                      {m.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>قابلیت‌ها: {m.features.join(' · ')}</span>
                      <span>کانتکست: {formatNumber(m.contextWindow)}</span>
                      <span>
                        ورودی: {m.inputCreditsPer1K} / خروجی: {m.outputCreditsPer1K} کردیت (هر 1K)
                      </span>
                    </div>
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
