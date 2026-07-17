// src/components/share/ShareModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/editorStore';
import { usePageStore } from '../../store/pageStore';
import { createShare } from '../../services/shareService';
import type { PageSchema } from '../../types/schema';

interface ShareModalProps {
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose }) => {
  const { t } = useTranslation(['share', 'common']);
  const { page, elements } = useEditorStore();
  const { pages, activePageId, saveCurrentPage } = usePageStore();

  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [isPublic, setIsPublic] = useState(true);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      }).then(setQrDataUrl).catch(() => {});
    }
  }, [shareUrl]);

  const activePage = pages.find(p => p.id === activePageId);
  const defaultName = activePage?.name || t('shareModal.defaultName');

  const handleCreate = async () => {
    setError(null);
    setLoading(true);

    try {
      // 先保存当前页面
      saveCurrentPage();
      const { pages: latestPages } = usePageStore.getState();

      let pageSchema: PageSchema | PageSchema[];
      let pageCount: number;

      if (scope === 'current') {
        const current = latestPages.find(p => p.id === activePageId);
        pageSchema = current?.schema || { page, elements };
        pageCount = 1;
      } else {
        pageSchema = latestPages.map(p => p.schema);
        pageCount = latestPages.length;
      }

      const result = await createShare({
        name: name || defaultName,
        isPublic,
        pageSchema,
        pageCount,
      });

      setShareUrl(`${window.location.origin}${result.shareUrl}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('shareModal.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">{t('shareModal.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {shareUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">{t('shareModal.linkGenerated')}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t('common:buttons.copied') : t('common:buttons.copy')}
                </button>
              </div>
              {qrDataUrl && (
                <div className="flex flex-col items-center mt-4">
                  <img src={qrDataUrl} alt={t('shareModal.qrcodeAlt')} className="w-[200px] h-[200px] rounded-lg border border-gray-200" />
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = qrDataUrl;
                      a.download = t('shareModal.qrcodeFilename');
                      a.click();
                    }}
                    className="mt-2 text-sm text-blue-500 hover:text-blue-600"
                  >
                    {t('shareModal.downloadQR')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('shareModal.nameLabel')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={defaultName}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">{t('shareModal.scopeLabel')}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setScope('current')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                      scope === 'current'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t('shareModal.currentPage')}
                  </button>
                  <button
                    onClick={() => setScope('all')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                      scope === 'all'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t('shareModal.allPages')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">{t('shareModal.accessLabel')}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                      isPublic
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t('common:visibility.public')}
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                      !isPublic
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {t('common:visibility.private')}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {isPublic ? t('common:visibility.publicDesc') : t('common:visibility.privateDesc')}
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          {shareUrl ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              {t('common:buttons.close')}
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                {t('common:buttons.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {t('shareModal.title')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
