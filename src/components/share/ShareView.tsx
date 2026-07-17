// src/components/share/ShareView.tsx

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Copy, Share2, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getShare } from '../../services/shareService';
import { Canvas } from '../canvas';
import { useEditorStore } from '../../store/editorStore';
import { usePageStore } from '../../store/pageStore';
import { useAuthStore } from '../../store/authStore';
import { ReportModal } from './ReportModal';
import type { ShareData } from '../../types/share';

interface ShareViewProps {
  shareId: string;
}

export const ShareView: React.FC<ShareViewProps> = ({ shareId }) => {
  const { t } = useTranslation(['share', 'common']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { loadSchema } = useEditorStore();
  const { createPage, switchPage } = usePageStore();
  const { user, isGuest } = useAuthStore();

  useEffect(() => {
    loadShare();
  }, [shareId]);

  const loadShare = async () => {
    try {
      const data = await getShare(shareId);
      setShareData(data);

      // 加载第一个页面
      const schemas = Array.isArray(data.pageSchema)
        ? data.pageSchema
        : [data.pageSchema];

      if (schemas.length > 0) {
        loadSchema(schemas[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shareView.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToProject = () => {
    if (!shareData) return;

    const schemas = Array.isArray(shareData.pageSchema)
      ? shareData.pageSchema
      : [shareData.pageSchema];

    schemas.forEach(() => {
      createPage();
    });

    // 加载到新页面
    const { pages: newPages } = usePageStore.getState();
    schemas.forEach((schema, index) => {
      const targetPage = newPages[newPages.length - schemas.length + index];
      if (targetPage) {
        switchPage(targetPage.id);
        loadSchema(schema);
      }
    });

    // 跳转到主页
    window.location.href = '/';
  };

  const handleShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-600 text-lg">{error}</p>
        <a href="/" className="mt-4 text-blue-500 hover:underline text-sm">{t('shareView.backHome')}</a>
      </div>
    );
  }

  const schemas = Array.isArray(shareData?.pageSchema)
    ? shareData?.pageSchema
    : shareData ? [shareData.pageSchema] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部信息栏 */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{shareData?.name}</h1>
            {shareData?.creator && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {shareData.creator.avatarUrl && (
                  <img
                    src={shareData.creator.avatarUrl}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{shareData.creator.displayName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {schemas.length > 1 && (
              <div className="flex gap-1 mr-4">
                {schemas.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentPageIndex(index);
                      loadSchema(schemas[index]);
                    }}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPageIndex === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {t('common:page.pageName', { number: index + 1 })}
                  </button>
                ))}
              </div>
            )}

            {/* 分享按钮 */}
            <button
              onClick={handleShareLink}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              <Share2 size={16} />
              {shareCopied ? t('common:buttons.copied') : t('common:buttons.share')}
            </button>

            {/* 复制到我的项目 */}
            {(user || isGuest) && (
              <button
                onClick={handleCopyToProject}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                <Copy size={16} />
                {t('shareView.copyToProject')}
              </button>
            )}

            {/* 举报按钮 */}
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-gray-400 rounded-lg text-sm hover:text-red-500 hover:bg-red-50 transition-colors"
              title={t('shareView.reportTitle')}
            >
              <Flag size={16} />
              {t('shareView.reportBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* 画布区域 */}
      <div className="flex-1 overflow-hidden">
        <Canvas readOnly />
      </div>

      {/* 举报 Modal */}
      {showReportModal && shareData && (
        <ReportModal
          targetType="share"
          targetId={shareData.id}
          targetName={shareData.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};
