// src/store/historyStore.ts

import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useEditorStore } from './editorStore';
import { usePageStore } from './pageStore';
import type { PageSchema } from '../types/schema';
import i18n from '../locales/i18n';

export interface UserPage {
  id: string;
  user_id: string;
  name: string;
  page_schema: PageSchema;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatHistory {
  id: string;
  user_id: string;
  page_id: string | null;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  created_at: string;
  updated_at: string;
}

interface HistoryState {
  pages: UserPage[];
  chatHistories: ChatHistory[];
  loading: boolean;
  error: string | null;

  fetchPages: () => Promise<void>;
  fetchChatHistories: () => Promise<void>;
  loadPage: (pageId: string) => Promise<void>;
  savePage: (name: string, schema: PageSchema) => Promise<UserPage | null>;
  deletePage: (pageId: string) => Promise<void>;
  saveChatHistory: (pageId: string | null, messages: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<void>;
  deleteChatHistory: (chatId: string) => Promise<void>;
}

// localStorage key for guest users
const GUEST_PAGES_KEY = 'ai-lowcode-guest-pages';
const GUEST_CHATS_KEY = 'ai-lowcode-guest-chats';

// Extract data from NestJS TransformInterceptor response wrapper { data: ... }
function extractData<T>(response: any): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  return response as T;
}

// Get auth headers from Supabase session
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  pages: [],
  chatHistories: [],
  loading: false,
  error: null,

  fetchPages: async () => {
    set({ loading: true, error: null });
    const { isGuest, user } = useAuthStore.getState();

    try {
      if (isGuest || !user) {
        // 游客：从 localStorage 获取
        const stored = localStorage.getItem(GUEST_PAGES_KEY);
        const pages = stored ? JSON.parse(stored) : [];
        set({ pages, loading: false });
      } else {
        // 登录用户：从后端 API 获取
        const headers = await getAuthHeaders();
        const response = await fetch('/api/pages', { headers });

        if (!response.ok) {
          throw new Error(i18n.t('common:status.loadFailed'));
        }

        const rawData = await response.json();
        const data = extractData<any[]>(rawData);

        // Backend returns partial fields (id, name, thumbnail_url, created_at, updated_at),
        // we need to add user_id and default page_schema for compatibility
        const pages: UserPage[] = (data || []).map(p => ({
          id: p.id,
          user_id: user.id,
          name: p.name,
          page_schema: p.page_schema || { page: { id: 'page_1', width: 1200, height: 800, background: '#ffffff' }, elements: [] },
          thumbnail_url: p.thumbnail_url,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));

        set({ pages, loading: false });
      }
    } catch (err) {
      console.error('fetchPages error:', err);
      set({ error: i18n.t('common:status.loadFailed'), loading: false });
    }
  },

  fetchChatHistories: async () => {
    set({ loading: true, error: null });
    const { isGuest, user } = useAuthStore.getState();

    try {
      if (isGuest || !user) {
        // 游客：从 localStorage 获取
        const stored = localStorage.getItem(GUEST_CHATS_KEY);
        const chats = stored ? JSON.parse(stored) : [];
        set({ chatHistories: chats, loading: false });
      } else {
        // 登录用户：从后端 API 获取
        const headers = await getAuthHeaders();
        const response = await fetch('/api/chat-histories', { headers });

        if (!response.ok) {
          throw new Error(i18n.t('common:status.loadFailed'));
        }

        const rawData = await response.json();
        const data = extractData<any[]>(rawData);

        // Backend returns partial fields (id, page_id, created_at, updated_at),
        // messages are not included in list endpoint
        const chats: ChatHistory[] = (data || []).map(c => ({
          id: c.id,
          user_id: user.id,
          page_id: c.page_id,
          messages: c.messages || [],
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));

        set({ chatHistories: chats, loading: false });
      }
    } catch (err) {
      console.error('fetchChatHistories error:', err);
      set({ error: i18n.t('common:status.loadFailed'), loading: false });
    }
  },

  loadPage: async (pageId: string) => {
    const { pages } = get();
    const page = pages.find((p) => p.id === pageId);

    if (page) {
      // 确保 page_schema 有正确的结构
      const schema = page.page_schema;
      if (schema && schema.elements) {
        // 设置加载标志，防止自动保存覆盖
        useEditorStore.getState().setIsLoadingFromHistory(true);

        // 创建一个新的 page tab 来承载历史记录的页面
        const newPageId = `history_${pageId}_${Date.now()}`;
        const newPageTab = {
          id: newPageId,
          name: page.name,
          schema: schema,
          createdAt: Date.now(),
        };

        // 添加到 pageStore 并设为活跃
        const currentPages = usePageStore.getState().pages;
        usePageStore.setState({
          pages: [...currentPages, newPageTab],
          activePageId: newPageId,
          currentPageId: pageId,
        });

        // 加载 schema 到编辑器
        useEditorStore.getState().loadSchema(schema);

        // 延迟重置加载标志
        setTimeout(() => {
          useEditorStore.getState().setIsLoadingFromHistory(false);
        }, 1000);
      } else {
        console.error('Invalid page_schema:', schema);
      }
    }
  },

  savePage: async (name: string, schema: PageSchema) => {
    const { isGuest, user } = useAuthStore.getState();
    const currentPageId = usePageStore.getState().currentPageId;

    try {
      if (isGuest || !user) {
        // 游客：保存到 localStorage
        const stored = localStorage.getItem(GUEST_PAGES_KEY);
        const pages: UserPage[] = stored ? JSON.parse(stored) : [];

        const now = new Date().toISOString();
        const newPage: UserPage = {
          id: currentPageId || `guest_page_${Date.now()}`,
          user_id: 'guest',
          name,
          page_schema: schema,
          thumbnail_url: null,
          created_at: now,
          updated_at: now,
        };

        // 如果是更新现有页面
        const existingIndex = pages.findIndex((p) => p.id === newPage.id);
        if (existingIndex >= 0) {
          pages[existingIndex] = { ...pages[existingIndex], name, page_schema: schema, updated_at: now };
        } else {
          pages.unshift(newPage);
        }

        localStorage.setItem(GUEST_PAGES_KEY, JSON.stringify(pages));
        set({ pages });
        return newPage;
      } else {
        // 登录用户：保存到后端 API
        const headers = await getAuthHeaders();

        if (currentPageId && !currentPageId.startsWith('page_') && !currentPageId.startsWith('history_')) {
          // 更新现有页面 (only real DB IDs, not local tab IDs)
          const response = await fetch(`/api/pages/${currentPageId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ name, pageSchema: schema }),
          });

          if (!response.ok) {
            throw new Error(i18n.t('common:status.error'));
          }

          get().fetchPages();
          return null; // Updated, no new page object needed
        } else {
          // 创建新页面
          const response = await fetch('/api/pages', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, pageSchema: schema }),
          });

          if (!response.ok) {
            throw new Error(i18n.t('common:status.error'));
          }

          const rawData = await response.json();
          const data = extractData<{ id: string; name: string; created_at: string }>(rawData);

          if (data) {
            usePageStore.getState().setCurrentPageId(data.id);
          }
          get().fetchPages();

          return data ? {
            id: data.id,
            user_id: user.id,
            name: data.name,
            page_schema: schema,
            thumbnail_url: null,
            created_at: data.created_at,
            updated_at: data.created_at,
          } : null;
        }
      }
    } catch (err) {
      console.error('savePage error:', err);
      return null;
    }
  },

  deletePage: async (pageId: string) => {
    const { isGuest, user } = useAuthStore.getState();

    try {
      if (isGuest || !user) {
        // 游客：从 localStorage 删除
        const stored = localStorage.getItem(GUEST_PAGES_KEY);
        const pages: UserPage[] = stored ? JSON.parse(stored) : [];
        const filtered = pages.filter((p) => p.id !== pageId);
        localStorage.setItem(GUEST_PAGES_KEY, JSON.stringify(filtered));
        set({ pages: filtered });
      } else {
        // 登录用户：从后端 API 删除
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/pages/${pageId}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error(i18n.t('common:status.error'));
        }

        get().fetchPages();
      }
    } catch (err) {
      console.error('deletePage error:', err);
    }
  },

  saveChatHistory: async (pageId: string | null, messages: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    const { isGuest, user } = useAuthStore.getState();

    try {
      if (isGuest || !user) {
        // 游客：保存到 localStorage
        const stored = localStorage.getItem(GUEST_CHATS_KEY);
        const chats: ChatHistory[] = stored ? JSON.parse(stored) : [];

        const now = new Date().toISOString();
        const newChat: ChatHistory = {
          id: `guest_chat_${Date.now()}`,
          user_id: 'guest',
          page_id: pageId,
          messages,
          created_at: now,
          updated_at: now,
        };

        chats.unshift(newChat);
        // 只保留最近 20 条
        const trimmed = chats.slice(0, 20);
        localStorage.setItem(GUEST_CHATS_KEY, JSON.stringify(trimmed));
        set({ chatHistories: trimmed });
      } else {
        // 登录用户：保存到后端 API
        const headers = await getAuthHeaders();
        const response = await fetch('/api/chat-histories', {
          method: 'POST',
          headers,
          body: JSON.stringify({ pageId, messages }),
        });

        if (!response.ok) {
          throw new Error(i18n.t('common:status.error'));
        }

        get().fetchChatHistories();
      }
    } catch (err) {
      console.error('saveChatHistory error:', err);
    }
  },

  deleteChatHistory: async (chatId: string) => {
    const { isGuest, user } = useAuthStore.getState();

    try {
      if (isGuest || !user) {
        // 游客：从 localStorage 删除
        const stored = localStorage.getItem(GUEST_CHATS_KEY);
        const chats: ChatHistory[] = stored ? JSON.parse(stored) : [];
        const filtered = chats.filter((c) => c.id !== chatId);
        localStorage.setItem(GUEST_CHATS_KEY, JSON.stringify(filtered));
        set({ chatHistories: filtered });
      } else {
        // 登录用户：从后端 API 删除
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/chat-histories/${chatId}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error(i18n.t('common:status.error'));
        }

        get().fetchChatHistories();
      }
    } catch (err) {
      console.error('deleteChatHistory error:', err);
    }
  },
}));
