// src/components/share/MySharesModal.tsx

import React, { useState, useEffect } from 'react';
import { X, Trash2, Globe, Lock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getMyShares, deleteShare } from '../../services/shareService';
import type { MyShareItem } from '../../types/share';

interface MySharesModalProps {
  onClose: () => void;
}

export const MySharesModal: React.FC<MySharesModalProps> = ({ onClose }) => {
  const { t } = useTranslation(['share', 'common']);
  const [shares, setShares] = useState<MyShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      const data = await getMyShares();
      setShares(data.shares);
    } catch (err) {
      console.error('Load shares error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common:confirm.deleteShare'))) return;

    setDeleting(id);
    try {
      await deleteShare(id);
      setShares(shares.filter(s => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('myShares.deleteFailed'));
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyShareUrl = (id: string) => {
    const url = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">{t('myShares.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {t('myShares.empty')}
            </div>
          ) : (
            <div className="space-y-2">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{share.name}</span>
                      {share.isPublic ? (
                        <Globe size={14} className="text-green-500" />
                      ) : (
                        <Lock size={14} className="text-orange-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(share.createdAt)} · {t('common:share.viewCount', { count: share.viewCount })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyShareUrl(share.id)}
                      className="px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded"
                    >
                      {t('common:share.copyLink')}
                    </button>
                    <button
                      onClick={() => handleDelete(share.id)}
                      disabled={deleting === share.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                      title={t('common:buttons.delete')}
                    >
                      {deleting === share.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
