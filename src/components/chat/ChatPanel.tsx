// src/components/chat/ChatPanel.tsx

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../../store/chatStore';

const styleKeys = ['simple', 'business', 'lively', 'tech', 'chinese'] as const;

export const ChatPanel: React.FC = () => {
  const { selectedStyle, setSelectedStyle, isGenerating, cancelGeneration, messages } = useChatStore();
  const { t } = useTranslation(['chat', 'common']);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b font-medium text-sm text-gray-700">
        {t('panel.title')}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
        <span className="text-xs text-gray-500 flex-shrink-0">{t('panel.styleLabel')}</span>
        {styleKeys.map((key) => (
          <button
            key={key}
            onClick={() => setSelectedStyle(key)}
            className={`px-2 py-0.5 text-xs rounded-full transition-colors flex-shrink-0 ${
              selectedStyle === key
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {t('panel.styles.' + key)}
          </button>
        ))}
      </div>
      <ChatHistory />
      {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isGenerating && (
        <div className="text-center text-xs text-gray-400 py-1">
          {t('panel.unsatisfiedHint')}
        </div>
      )}
      {isGenerating && (
        <div className="flex justify-center py-2">
          <button
            onClick={cancelGeneration}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <X size={14} />
            {t('panel.cancelGenerate')}
          </button>
        </div>
      )}
      <ChatInput />
    </div>
  );
};
