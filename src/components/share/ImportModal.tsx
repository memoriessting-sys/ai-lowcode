// src/components/share/ImportModal.tsx

import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getShare } from '../../services/shareService';
import { useEditorStore } from '../../store/editorStore';
import { usePageStore } from '../../store/pageStore';
import type { PageSchema } from '../../types/schema';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { t } = useTranslation(['share', 'common']);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    name: string;
    pageCount: number;
    creator: string;
  } | null>(null);
  const [shareData, setShareData] = useState<{
    pageSchema: PageSchema | PageSchema[];
    pageCount: number;
  } | null>(null);

  const { loadSchema } = useEditorStore();
  const { createPage, switchPage, pages } = usePageStore();

  const extractShareId = (url: string): string | null => {
    const match = url.match(/\/share\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const handleFetch = async () => {
    setError(null);
    setPreview(null);
    setShareData(null);

    const shareId = extractShareId(url);
    if (!shareId) {
      setError(t('importModal.invalidLink'));
      return;
    }

    setLoading(true);
    try {
      const data = await getShare(shareId);
      setShareData({
        pageSchema: data.pageSchema,
        pageCount: data.pageCount,
      });
      setPreview({
        name: data.name,
        pageCount: data.pageCount,
        creator: data.creator?.displayName || t('importModal.anonymousUser'),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('importModal.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!shareData) return;

    const schemas = Array.isArray(shareData.pageSchema)
      ? shareData.pageSchema
      : [shareData.pageSchema];

    schemas.forEach((schema, index) => {
      if (index === 0 && pages.length === 1 && pages[0].schema.elements.length === 0) {
        // 如果只有一个空白页面，直接覆盖
        loadSchema(schema);
      } else {
        // 创建新页面
        const newPageId = createPage();
        if (newPageId) {
          switchPage(newPageId);
          loadSchema(schema);
        }
      }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">{t('importModal.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('importModal.linkLabel')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('importModal.placeholder')}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={handleFetch}
                disabled={loading || !url}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : t('common:buttons.fetch')}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {preview && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm">{preview.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {t('importModal.preview', { count: preview.pageCount, creator: preview.creator })}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
          >
            {t('common:buttons.cancel')}
          </button>
          <button
            onClick={handleImport}
            disabled={!shareData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {t('importModal.importToProject')}
          </button>
        </div>
      </div>
    </div>
  );
};
