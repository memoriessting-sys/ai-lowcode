// src/components/chat/ChatInput.tsx

import { useCallback, useRef, useState, useEffect } from 'react';
import { Send, Loader2, X, Sparkles, Palette, Wand2, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../store/chatStore';
import { useEditorStore } from '../../store/editorStore';
import { usePageStore } from '../../store/pageStore';
import { useHistoryStore } from '../../store/historyStore';
import { sendMessage, parseIncrementalChange, tryParseIncompleteJson } from '../../services/aiService';
import { saveToHistory } from '../history/HistoryModal';
import { trackStep, trackAIGeneration, UserStep } from '../../lib/posthog';

interface DroppedElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ChatInput: React.FC = () => {
  const { t } = useTranslation(['chat', 'common']);
  const { inputValue, setInputValue, addMessage, updateLastMessage, isStreaming, setStreaming } = useChatStore();
  const { loadSchema, elements, page } = useEditorStore();
  const { savePage, saveChatHistory } = useHistoryStore();
  const lastContentRef = useRef('');
  const lastUserMessageRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastRenderRef = useRef(0); // 上次渲染时间戳，用于节流
  const [droppedElements, setDroppedElements] = useState<DroppedElement[]>([]);
  const [hasLastMessage, setHasLastMessage] = useState(false);

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  // Quick command handler
  const handleQuickCommand = useCallback((prefix: string) => {
    setInputValue(prefix);
    textareaRef.current?.focus();
  }, [setInputValue]);

  // 生成页面元素总结
  const generateSummary = (schema: any): string => {
    if (!schema?.elements?.length) return t('input.pageGenerated');

    const elementCounts: Record<string, number> = {};
    schema.elements.forEach((el: any) => {
      elementCounts[el.type] = (elementCounts[el.type] || 0) + 1;
    });

    const summaryParts = Object.entries(elementCounts)
      .map(([type, count]) => t('input.typeSummary', { type, count }))
      .join('、');

    return t('input.generateSuccess', { summary: summaryParts });
  };

  // 处理拖放元素到聊天框
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const elementId = e.dataTransfer.getData('text/plain');
    if (elementId) {
      const element = (elements || []).find(el => el.id === elementId);
      if (element) {
        // 检查是否已经存在
        if (!droppedElements.find(el => el.id === elementId)) {
          setDroppedElements(prev => [...prev, {
            id: element.id,
            type: element.type,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          }]);
        }
      }
    }
  }, [elements, droppedElements]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 移除拖入的元素
  const removeDroppedElement = useCallback((id: string) => {
    setDroppedElements(prev => prev.filter(el => el.id !== id));
  }, []);

  // 构建完整的输入内容
  const buildFullMessage = useCallback(() => {
    let message = inputValue || '';
    if (droppedElements.length > 0) {
      const elementsInfo = droppedElements.map(el =>
        t('input.elementInfo', { id: el.id, type: t('common:elementLabels.' + el.type, el.type), x: Math.round(el.x), y: Math.round(el.y), width: Math.round(el.width), height: Math.round(el.height) })
      ).join('\n');
      message = message + (message ? '\n' : '') + elementsInfo;
    }
    return message;
  }, [inputValue, droppedElements, t]);

  const handleSend = useCallback(async () => {
    const fullMessage = buildFullMessage();
    if (!fullMessage.trim() || isStreaming) return;

    lastUserMessageRef.current = fullMessage;
    setHasLastMessage(true);
    addMessage({ role: 'user', content: fullMessage });
    setInputValue('');
    setDroppedElements([]);

    // 追踪首次 AI 提示
    trackStep(UserStep.FIRST_AI_PROMPT, { prompt_length: fullMessage.length });

    // 添加一个空的助手消息用于流式更新
    addMessage({ role: 'assistant', content: t('input.generating') });
    setStreaming(true);
    lastContentRef.current = '';

    // 构建消息历史
    const chatMessages = useChatStore.getState().messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      await sendMessage(
        chatMessages.slice(0, -1), // 不包含刚添加的空消息
        {
          onToken: (token) => {
            lastContentRef.current += token;
            // 不显示 JSON，只显示生成状态
            updateLastMessage(t('input.generating'));

            // 节流：每 100ms 最多触发一次 Canvas 渲染，避免卡顿
            const now = Date.now();
            if (now - lastRenderRef.current >= 100) {
              lastRenderRef.current = now;
              const schema = tryParseIncompleteJson(lastContentRef.current);
              if (schema) {
                loadSchema(schema as Parameters<typeof loadSchema>[0]);
              }
            }
          },
          onComplete: (fullResponse) => {
            setStreaming(false);
            // 最终解析并加载页面
            // 注意：从 store 实时读取 elements，而非使用闭包中的旧值
            // 因为流式过程中 onToken 已经通过 loadSchema 更新了 elements
            try {
              const currentElements = useEditorStore.getState().elements;
              const currentPage = useEditorStore.getState().page;
              const schema = parseIncrementalChange(fullResponse, [...(currentElements || [])], currentPage);
              loadSchema(schema as Parameters<typeof loadSchema>[0]);
              // 显示生成总结
              const summary = generateSummary(schema);
              updateLastMessage(summary);

              // 保存到编辑器本地历史
              saveToHistory(
                lastUserMessageRef.current.slice(0, 30) || t('input.aiPageName'),
                schema as Parameters<typeof loadSchema>[0]
              );

              // 保存到历史记录页面（user_pages）
              const pageName = usePageStore.getState().getActivePage()?.name || t('input.aiPageName');
              savePage(pageName, schema as Parameters<typeof loadSchema>[0]);

              // 保存对话历史（chat_histories）
              const allMessages = useChatStore.getState().messages
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }));
              saveChatHistory(null, allMessages);

              // 追踪成功
              trackStep(UserStep.AI_GENERATE_SUCCESS);
              trackAIGeneration(lastUserMessageRef.current, true, schema.elements?.length);
            } catch {
              updateLastMessage(t('input.generateComplete'));
              trackAIGeneration(lastUserMessageRef.current, true);
            }
          },
          onError: (error) => {
            setStreaming(false);
            updateLastMessage(`❌ ${error.message}`);
            trackStep(UserStep.AI_GENERATE_FAIL);
            trackAIGeneration(lastUserMessageRef.current, false);
          },
        },
        useChatStore.getState().selectedStyle,
      );
    } catch (error) {
      setStreaming(false);
      updateLastMessage(t('input.requestFailed', { error: error instanceof Error ? error.message : t('common:status.unknownError') }));
      trackStep(UserStep.AI_GENERATE_FAIL);
      trackAIGeneration(lastUserMessageRef.current, false);
    }
  }, [buildFullMessage, isStreaming, addMessage, setInputValue, updateLastMessage, setStreaming, loadSchema, elements, page, savePage, saveChatHistory, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Regenerate last message
  const handleRegenerate = useCallback(() => {
    if (lastUserMessageRef.current && !isStreaming) {
      setInputValue(lastUserMessageRef.current);
      // Need to use a timeout to allow state to update before sending
      // handleSend reads from buildFullMessage which depends on inputValue
      setTimeout(() => {
        handleSend();
      }, 0);
    }
  }, [isStreaming, setInputValue, handleSend]);

  const canSend = (inputValue || '').trim() || droppedElements.length > 0;

  return (
    <div className="p-3 border-t bg-white">
      {/* 拖入的元素标签 */}
      {droppedElements.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {droppedElements.map(el => (
            <div
              key={el.id}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
            >
              <span>{t('common:elementLabels.' + el.type, el.type)}</span>
              <span className="text-blue-500">({el.id.slice(-4)})</span>
              <button
                onClick={() => removeDroppedElement(el.id)}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Quick command buttons */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <button
          onClick={() => handleQuickCommand(t('input.quickCommands.modifySelectedPrefix'))}
          disabled={isStreaming}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={12} />
          {t('input.quickCommands.modifySelected')}
        </button>
        <button
          onClick={() => handleQuickCommand(t('input.quickCommands.adjustColorPrefix'))}
          disabled={isStreaming}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Palette size={12} />
          {t('input.quickCommands.adjustColor')}
        </button>
        <button
          onClick={() => handleQuickCommand(t('input.quickCommands.addAnimationPrefix'))}
          disabled={isStreaming}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Wand2 size={12} />
          {t('input.quickCommands.addAnimation')}
        </button>
        {hasLastMessage && (
          <button
            onClick={handleRegenerate}
            disabled={isStreaming}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw size={12} />
            {t('input.quickCommands.regenerate')}
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={t('input.placeholder')}
          value={inputValue || ''}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          disabled={isStreaming}
        />
        <button
          onClick={handleSend}
          disabled={!canSend || isStreaming}
          className="px-3 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">{t('input.tip')}</p>
    </div>
  );
};
