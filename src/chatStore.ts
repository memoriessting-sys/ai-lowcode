// src/store/chatStore.ts

import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';
import i18n from '../locales/i18n';

let messageIdCounter = 0;

const generateMessageId = () => {
  messageIdCounter += 1;
  return `msg_${Date.now()}_${messageIdCounter}`;
};

interface ChatState {
  messages: ChatMessage[];
  inputValue: string;
  isStreaming: boolean;
  streamingContent: string;
  abortController: AbortController | null;
  selectedStyle: string;
  isGenerating: boolean;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setInputValue: (value: string) => void;
  setStreaming: (streaming: boolean, content?: string) => void;
  clearMessages: () => void;
  setAbortController: (controller: AbortController | null) => void;
  setSelectedStyle: (style: string) => void;
  setIsGenerating: (generating: boolean) => void;
  cancelGeneration: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: i18n.t('chat:panel.title') + '！' + i18n.t('chat:panel.unsatisfiedHint'),
      timestamp: Date.now(),
    },
  ],
  inputValue: '',
  isStreaming: false,
  streamingContent: '',
  abortController: null,
  selectedStyle: 'simple',
  isGenerating: false,

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateMessageId(),
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    });
  },

  setInputValue: (value) => {
    set({ inputValue: value });
  },

  setStreaming: (streaming, content = '') => {
    set({ isStreaming: streaming, streamingContent: content });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setAbortController: (controller) => {
    set({ abortController: controller });
  },

  setSelectedStyle: (style) => {
    set({ selectedStyle: style });
  },

  setIsGenerating: (generating) => {
    set({ isGenerating: generating });
  },

  cancelGeneration: () => {
    const controller = useChatStore.getState().abortController;
    if (controller) {
      controller.abort();
    }
    set({ abortController: null, isGenerating: false });
  },
}));
