// src/components/home/HistoryPage.tsx

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, MessageSquare, Trash2, Clock, Share2, Eye, Globe, Lock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHistoryStore, type ChatHistory } from '../../store/historyStore';
import { useAuthStore } from '../../store/authStore';
import { getMyShares, deleteShare, updateShare } from '../../services/shareService';
import type { MyShareItem } from '../../types/share';

interface HistoryPageProps {
  onBack: () => void;
  onLoadPage: () => void;
}

type TabType = 'pages' | 'chats' | 'shares';

export function HistoryPage({ onBack, onLoadPage }: HistoryPageProps) {
  const { pages, chatHistories, loading, fetchPages, fetchChatHistories, loadPage, deletePage, deleteChatHistory } = useHistoryStore();
  const { isGuest, user } = useAuthStore();
  const { t } = useTranslation(['home', 'common']);
  const [activeTab, setActiveTab] = useState<TabType>('pages');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 分享记录
  const [shares, setShares] = useState<MyShareItem[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
    fetchChatHistories();
  }, [fetchPages, fetchChatHistories]);

  // 切换到分享 tab 时加载
  useEffect(() => {
    if (activeTab === 'shares' && !isGuest && user) {
      loadShares();
    }
  }, [activeTab, isGuest, user]);

  const loadShares = async () => {
    setSharesLoading(true);
    try {
      const data = await getMyShares();
      setShares(data.shares);
    } catch {
      // 静默处理
    } finally {
      setSharesLoading(false);
    }
  };

  const handleLoadPage = async (pageId: string) => {
    await loadPage(pageId);
    onLoadPage();
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm(t('common:confirm.deletePage'))) return;
    setDeletingId(pageId);
    await deletePage(pageId);
    setDeletingId(null);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm(t('common:confirm.deleteChat'))) return;
    setDeletingId(chatId);
    await deleteChatHistory(chatId);
    setDeletingId(null);
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm(t('common:confirm.deleteShare'))) return;
    setDeletingId(shareId);
    try {
      await deleteShare(shareId);
      setShares(shares.filter(s => s.id !== shareId));
    } catch {
      alert(t('common:status.error'));
    }
    setDeletingId(null);
  };

  const handleToggleVisibility = async (share: MyShareItem) => {
    setUpdatingId(share.id);
    try {
      const updated = await updateShare(share.id, { isPublic: !share.isPublic });
      setShares(shares.map(s => s.id === share.id ? { ...s, isPublic: updated.isPublic } : s));
    } catch {
      alert(t('common:status.error'));
    }
    setUpdatingId(null);
  };

  const copyShareUrl = (id: string) => {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `${t('common:date.today')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `${t('common:date.yesterday')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return t('common:date.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessages = (messages: ChatHistory['messages'] | undefined | null) => {
    if (!messages || messages.length === 0) return t('home:history.emptyChat');
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg && firstUserMsg.content) {
      return firstUserMsg.content.length > 50
        ? firstUserMsg.content.slice(0, 50) + '...'
        : firstUserMsg.content;
    }
    return t('home:history.aiChat');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{t('home:history.title')}</h1>
          {isGuest && (
            <span className="text-xs text-gray-400 ml-2">{t('home:history.localOnly')}</span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('pages')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              {t('home:history.tabs.pages')} ({pages.length})
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              {t('home:history.tabs.chats')} ({chatHistories.length})
            </button>
            {!isGuest && (
              <button
                onClick={() => setActiveTab('shares')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'shares'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Share2 className="w-4 h-4 inline mr-2" />
                {t('home:history.tabs.shares')} ({shares.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading && activeTab !== 'shares' ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : activeTab === 'pages' ? (
          pages.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('home:history.emptyPages')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    {page.thumbnail_url ? (
                      <img
                        src={page.thumbnail_url}
                        alt={page.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">
                      {page.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(page.updated_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadPage(page.id)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {t('common:buttons.edit')}
                    </button>
                    <button
                      onClick={() => handleDeletePage(page.id)}
                      disabled={deletingId === page.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'chats' ? (
          chatHistories.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('home:history.emptyChats')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistories.map((chat) => (
                <div
                  key={chat.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-500" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 truncate">
                      {truncateMessages(chat.messages)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(chat.updated_at)}
                      <span className="text-gray-300">•</span>
                      {t('common:page.messageCount', { count: chat.messages?.length || 0 })}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    disabled={deletingId === chat.id}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'shares' ? (
          /* ===== 分享记录 ===== */
          sharesLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Share2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t('home:history.emptyShares')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className={`bg-white rounded-lg border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${
                    share.status === 'removed' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    share.status === 'removed' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {share.status === 'removed' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Share2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800 truncate">
                        {share.name}
                      </h3>
                      {share.status === 'removed' && (
                        <span className="px-1.5 py-0.5 text-xs font-medium text-red-600 bg-red-100 rounded">{t('common:share.offShelf')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {t('common:share.viewCount', { count: share.viewCount })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(share.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        {share.isPublic ? (
                          <>
                            <Globe className="w-3 h-3 text-green-500" />
                            <span className="text-green-600">{t('common:visibility.public')}</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-orange-500" />
                            <span className="text-orange-600">{t('common:visibility.private')}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* 复制链接 */}
                    <button
                      onClick={() => copyShareUrl(share.id)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t('common:share.copyShareLink')}
                    >
                      {t('common:share.copyLink')}
                    </button>

                    {/* 切换可见性 */}
                    {share.status !== 'removed' && (
                      <button
                        onClick={() => handleToggleVisibility(share)}
                        disabled={updatingId === share.id}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                          share.isPublic
                            ? 'text-orange-600 hover:bg-orange-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={share.isPublic ? t('common:visibility.setPrivate') : t('common:visibility.setPublic')}
                      >
                        {updatingId === share.id ? '...' : share.isPublic ? t('common:visibility.setPrivate') : t('common:visibility.setPublic')}
                      </button>
                    )}

                    {/* 删除 */}
                    <button
                      onClick={() => handleDeleteShare(share.id)}
                      disabled={deletingId === share.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title={t('common:share.deleteShare')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
