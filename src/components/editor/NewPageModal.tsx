// src/components/editor/NewPageModal.tsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface NewPageModalProps {
  onClose: () => void;
  onCreate: (options: { orientation: 'landscape' | 'portrait'; name: string }) => void;
}

export const NewPageModal: React.FC<NewPageModalProps> = ({ onClose, onCreate }) => {
  const { t } = useTranslation(['editor', 'common']);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');
  const [name, setName] = useState(t('editor:newPage.defaultName'));

  const handleCreate = () => {
    onCreate({ orientation, name });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{t('editor:newPage.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 尺寸选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('editor:newPage.pageSize')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrientation('portrait')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  orientation === 'portrait'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-8 h-11 border-2 border-current rounded mb-2" />
                  <span className="text-sm font-medium">{t('editor:newPage.portraitA4')}</span>
                  <span className="text-xs text-gray-500">210 × 297 mm</span>
                </div>
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  orientation === 'landscape'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-11 h-8 border-2 border-current rounded mb-2" />
                  <span className="text-sm font-medium">{t('editor:newPage.landscapeA4')}</span>
                  <span className="text-xs text-gray-500">297 × 210 mm</span>
                </div>
              </button>
            </div>
          </div>

          {/* 页面名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('editor:newPage.pageName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('editor:newPage.namePlaceholder')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common:buttons.cancel')}
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            {t('common:buttons.create')}
          </button>
        </div>
      </div>
    </div>
  );
};