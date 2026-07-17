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
        // 后端不可用时使用本地 fallback 模板
        console.warn('Templates API unavailable, using fallback templates');
        set({ templates: getFallbackTemplates(), loading: false });
        return;
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
      // 网络错误时也使用 fallback 模板
      set({ templates: getFallbackTemplates(), loading: false, error: null });
    }
  },

  useTemplate: async (templateId: string) => {
    try {
      // First get the full template with page_schema
      const response = await fetch(`/api/templates/${templateId}`);

      if (!response.ok) {
        // 后端不可用时，从本地 fallback 中查找
        const fallback = getFallbackTemplates().find(t => t.id === templateId);
        if (fallback) return fallback;
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
      // 尝试从本地 fallback 中查找
      const fallback = getFallbackTemplates().find(t => t.id === templateId);
      if (fallback) return fallback;
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

// 本地 fallback 模板数据，当后端不可用时使用
function getFallbackTemplates(): Template[] {
  return [
    {
      id: 'fallback_resume_simple',
      name: '简约简历',
      category: 'resume',
      description: '单列布局，黑白配色，适合传统行业求职',
      thumbnail_url: null,
      page_schema: {
        page: { id: 'resume_simple', width: 800, height: 1000, background: '#ffffff' },
        elements: [
          { id: 'header', type: 'container', x: 50, y: 50, width: 700, height: 120, props: { backgroundColor: '#2c3e50' }, children: [
            { id: 'name', type: 'text', x: 20, y: 20, width: 660, height: 40, props: { content: '您的姓名', fontSize: 28, color: '#ffffff', fontWeight: 'bold' } },
            { id: 'title', type: 'text', x: 20, y: 70, width: 660, height: 30, props: { content: '职位名称', fontSize: 16, color: '#ecf0f1' } }
          ]},
          { id: 'section1', type: 'container', x: 50, y: 200, width: 700, height: 200, props: { backgroundColor: '#ffffff' }, children: [
            { id: 'section1_title', type: 'text', x: 0, y: 0, width: 700, height: 30, props: { content: '工作经历', fontSize: 18, color: '#2c3e50', fontWeight: 'bold' } },
            { id: 'job1', type: 'text', x: 0, y: 50, width: 700, height: 150, props: { content: '公司名称 - 职位 - 时间', fontSize: 14, color: '#34495e' } }
          ]},
          { id: 'section2', type: 'container', x: 50, y: 420, width: 700, height: 200, props: { backgroundColor: '#ffffff' }, children: [
            { id: 'section2_title', type: 'text', x: 0, y: 0, width: 700, height: 30, props: { content: '教育背景', fontSize: 18, color: '#2c3e50', fontWeight: 'bold' } },
            { id: 'edu1', type: 'text', x: 0, y: 50, width: 700, height: 150, props: { content: '学校名称 - 专业 - 学位 - 时间', fontSize: 14, color: '#34495e' } }
          ]},
          { id: 'section3', type: 'container', x: 50, y: 640, width: 700, height: 200, props: { backgroundColor: '#ffffff' }, children: [
            { id: 'section3_title', type: 'text', x: 0, y: 0, width: 700, height: 30, props: { content: '技能特长', fontSize: 18, color: '#2c3e50', fontWeight: 'bold' } },
            { id: 'skills', type: 'text', x: 0, y: 50, width: 700, height: 150, props: { content: '技能1, 技能2, 技能3', fontSize: 14, color: '#34495e' } }
          ]}
        ]
      },
      is_public: true,
      created_by: null,
      created_at: new Date().toISOString(),
      use_count: 0,
    },
    {
      id: 'fallback_poster_event',
      name: '活动海报',
      category: 'poster',
      description: '大标题 + 时间地点，适合活动宣传',
      thumbnail_url: null,
      page_schema: {
        page: { id: 'poster_event', width: 600, height: 800, background: '#1a1a2e' },
        elements: [
          { id: 'hero', type: 'container', x: 0, y: 0, width: 600, height: 400, props: { backgroundColor: '#667eea' }, children: [
            { id: 'title', type: 'text', x: 50, y: 100, width: 500, height: 80, props: { content: '活动名称', fontSize: 48, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' } },
            { id: 'subtitle', type: 'text', x: 50, y: 200, width: 500, height: 40, props: { content: '活动主题描述', fontSize: 20, color: '#ecf0f1', textAlign: 'center' } }
          ]},
          { id: 'info', type: 'container', x: 50, y: 450, width: 500, height: 200, props: { backgroundColor: '#16213e' }, children: [
            { id: 'date', type: 'text', x: 30, y: 30, width: 440, height: 40, props: { content: '日期: 2024年XX月XX日', fontSize: 18, color: '#ffffff' } },
            { id: 'time', type: 'text', x: 30, y: 80, width: 440, height: 40, props: { content: '时间: XX:XX - XX:XX', fontSize: 18, color: '#ffffff' } },
            { id: 'location', type: 'text', x: 30, y: 130, width: 440, height: 40, props: { content: '地点: 活动地点', fontSize: 18, color: '#ffffff' } }
          ]},
          { id: 'cta', type: 'button', x: 150, y: 700, width: 300, height: 60, props: { text: '立即报名', backgroundColor: '#e94560', textColor: '#ffffff', borderRadius: 8 } }
        ]
      },
      is_public: true,
      created_by: null,
      created_at: new Date().toISOString(),
      use_count: 0,
    },
    {
      id: 'fallback_landing',
      name: '产品落地页',
      category: 'general',
      description: '产品介绍 + 功能展示，适合产品推广',
      thumbnail_url: null,
      page_schema: {
        page: { id: 'landing_page', width: 1200, height: 900, background: '#ffffff' },
        elements: [
          { id: 'hero', type: 'container', x: 0, y: 0, width: 1200, height: 400, props: { backgroundColor: '#667eea' }, children: [
            { id: 'hero_title', type: 'text', x: 100, y: 80, width: 1000, height: 80, props: { content: '产品名称', fontSize: 48, color: '#ffffff', fontWeight: 'bold', textAlign: 'center' } },
            { id: 'hero_desc', type: 'text', x: 100, y: 180, width: 1000, height: 60, props: { content: '简短的产品描述，突出核心价值', fontSize: 24, color: '#ecf0f1', textAlign: 'center' } },
            { id: 'hero_cta', type: 'button', x: 450, y: 280, width: 300, height: 60, props: { text: '立即体验', backgroundColor: '#ffffff', textColor: '#667eea', borderRadius: 30 } }
          ]},
          { id: 'features', type: 'container', x: 100, y: 450, width: 1000, height: 200, props: { backgroundColor: '#f8f9fa' }, children: [
            { id: 'feat1', type: 'card', x: 50, y: 30, width: 280, height: 140, props: { title: '功能1', content: '功能描述', backgroundColor: '#ffffff', borderRadius: 8 } },
            { id: 'feat2', type: 'card', x: 360, y: 30, width: 280, height: 140, props: { title: '功能2', content: '功能描述', backgroundColor: '#ffffff', borderRadius: 8 } },
            { id: 'feat3', type: 'card', x: 670, y: 30, width: 280, height: 140, props: { title: '功能3', content: '功能描述', backgroundColor: '#ffffff', borderRadius: 8 } }
          ]}
        ]
      },
      is_public: true,
      created_by: null,
      created_at: new Date().toISOString(),
      use_count: 0,
    },
    {
      id: 'fallback_invitation',
      name: '邀请函',
      category: 'general',
      description: '活动邀请 + RSVP，适合活动邀请',
      thumbnail_url: null,
      page_schema: {
        page: { id: 'invitation', width: 600, height: 800, background: '#fef9e7' },
        elements: [
          { id: 'border', type: 'container', x: 30, y: 30, width: 540, height: 740, props: { backgroundColor: '#ffffff', borderRadius: 8 }, children: [
            { id: 'title', type: 'text', x: 50, y: 60, width: 440, height: 80, props: { content: '诚挚邀请', fontSize: 36, color: '#f39c12', fontWeight: 'bold', textAlign: 'center' } },
            { id: 'event_name', type: 'text', x: 50, y: 160, width: 440, height: 60, props: { content: '活动名称', fontSize: 28, color: '#2c3e50', textAlign: 'center' } },
            { id: 'message', type: 'text', x: 50, y: 240, width: 440, height: 150, props: { content: '尊敬的嘉宾：我们诚挚地邀请您参加本次活动', fontSize: 16, color: '#34495e', textAlign: 'center' } },
            { id: 'rsvp', type: 'button', x: 170, y: 500, width: 200, height: 50, props: { text: '确认出席', backgroundColor: '#f39c12', textColor: '#ffffff', borderRadius: 8 } }
          ]}
        ]
      },
      is_public: true,
      created_by: null,
      created_at: new Date().toISOString(),
      use_count: 0,
    },
  ];
}
