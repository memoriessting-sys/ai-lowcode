// src/store/templateStore.ts

import { create } from 'zustand';
import type { PageSchema } from '../types/schema';
import { useAuthStore } from './authStore';
import i18n from '../locales/i18n';

export type TemplateCategory = 'resume' | 'poster' | 'general' | 'ecommerce' | 'education' | 'corporate' | 'portfolio' | 'event';

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string | null;
  thumbnail_url: string | null;
  page_schema: PageSchema;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  use_count: number;
}

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

interface TemplateState {
  templates: Template[];
  loading: boolean;
  error: string | null;
  selectedCategory: TemplateCategory | 'all';

  fetchTemplates: () => Promise<void>;
  useTemplate: (templateId: string) => Promise<Template | null>;
  setCategory: (category: TemplateCategory | 'all') => void;
  getFilteredTemplates: () => Template[];
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,
  selectedCategory: 'all',

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/templates');

      if (!response.ok) {
        throw new Error(i18n.t('common:status.loadFailed'));
      }

      const rawData = await response.json();
      const data = extractData<any[]>(rawData);

      // Backend list endpoint returns partial fields (id, name, category, description, thumbnail_url, use_count)
      // page_schema is not included in the list response
      const templates: Template[] = (data || []).map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        thumbnail_url: t.thumbnail_url,
        page_schema: t.page_schema || { page: { id: 'page_1', width: 1200, height: 800, background: '#ffffff' }, elements: [] },
        is_public: true,
        created_by: null,
        created_at: t.created_at || new Date().toISOString(),
        use_count: t.use_count || 0,
      }));

      set({ templates, loading: false });
    } catch (err) {
      console.error('fetchTemplates error:', err);
      set({ error: i18n.t('common:status.loadFailed'), loading: false });
    }
  },

  useTemplate: async (templateId: string) => {
    try {
      // First get the full template with page_schema
      const response = await fetch(`/api/templates/${templateId}`);

      if (!response.ok) {
        throw new Error(i18n.t('common:status.loadFailed'));
      }

      const rawData = await response.json();
      const data = extractData<any>(rawData);

      // Increment use count via backend API (only for logged-in users)
      const { isGuest } = useAuthStore.getState();
      if (!isGuest) {
        try {
          const headers = await getAuthHeaders();
          await fetch(`/api/templates/${templateId}/use`, {
            method: 'POST',
            headers,
          });
        } catch (useErr) {
          console.warn('Failed to increment template use count:', useErr);
        }
      }

      return data as Template;
    } catch (err) {
      console.error('useTemplate error:', err);
      return null;
    }
  },

  setCategory: (category: TemplateCategory | 'all') => set({ selectedCategory: category }),

  getFilteredTemplates: () => {
    const { templates, selectedCategory } = get();
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  },
}));
