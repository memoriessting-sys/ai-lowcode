// src/components/history/HistoryModal.tsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import type { PageSchema } from '../../types/schema';

interface HistoryRecord {
  id: string;
  name: string;
  schema: PageSchema;
  createdAt: number;
}

const HISTORY_KEY = 'ai-lowcode-history';

export const HistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation(['editor', 'common']);
  const { loadSchema } = useEditorStore();
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) {
      setHistory(JSON.parse(data));
    }
  };

  const handleRestore = (record: HistoryRecord) => {
    loadSchema(record.schema);
    onClose();
  };

  const handleDelete = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleClearAll = () => {
    if (confirm(t('common:confirm.clearAll') as string)) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <Clock size={18} />
            {t('editor:history.title')}
          </h3>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-red-500 hover:text-red-600"
              >
                {t('editor:history.clearAll')}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {t('editor:history.empty')}
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{record.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatDate(record.createdAt)} · {t('common:page.elementCount', { count: record.schema.elements.length })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(record)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      title={t('editor:history.restore')}
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title={t('editor:history.delete')}
                    >
                      <Trash2 size={16} />
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

// 保存历史记录
export const saveToHistory = (name: string, schema: PageSchema) => {
  const data = localStorage.getItem(HISTORY_KEY);
  const history: HistoryRecord[] = data ? JSON.parse(data) : [];

  const newRecord: HistoryRecord = {
    id: `history_${Date.now()}`,
    name,
    schema,
    createdAt: Date.now(),
  };

  // 只保留最近 50 条
  const newHistory = [newRecord, ...history].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};
