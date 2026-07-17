// src/store/pageStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageSchema } from '../types/schema';
import { useEditorStore } from './editorStore';
import i18n from '../locales/i18n';

export interface PageTab {
  id: string;
  name: string;
  schema: PageSchema;
  createdAt: number;
}

interface PageState {
  pages: PageTab[];
  activePageId: string;
  currentPageId: string | null; // 用于历史记录加载的页面ID

  createPage: () => string;
  deletePage: (id: string) => void;
  switchPage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  saveCurrentPage: () => void;
  getActivePage: () => PageTab | undefined;
  setCurrentPageId: (id: string | null) => void;
  setPageName: (name: string) => void;
}

const generateId = () => `page_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const createEmptySchema = (id: string): PageSchema => ({
  page: {
    id,
    width: 1200,
    height: 800,
    background: '#ffffff',
  },
  elements: [],
});

const DEFAULT_PAGE_ID = 'page_default';

export const usePageStore = create<PageState>()(
  persist(
    (set, get) => ({
      pages: [
        {
          id: DEFAULT_PAGE_ID,
          name: i18n.t('common:page.pageName', { number: 1 }),
          schema: createEmptySchema(DEFAULT_PAGE_ID),
          createdAt: Date.now(),
        },
      ],
      activePageId: DEFAULT_PAGE_ID,
      currentPageId: null,

      createPage: () => {
        const { pages } = get();
        if (pages.length >= 20) {
          return '';
        }

        // 先保存当前页面
        get().saveCurrentPage();

        const id = generateId();
        const pageNumber = pages.length + 1;
        const newPage: PageTab = {
          id,
          name: i18n.t('common:page.pageName', { number: pageNumber }),
          schema: createEmptySchema(id),
          createdAt: Date.now(),
        };

        set((state) => ({
          pages: [...state.pages, newPage],
          activePageId: id,
        }));

        // 加载新页面到 editorStore
        useEditorStore.getState().loadSchema(newPage.schema);

        return id;
      },

      deletePage: (id) => {
        const { pages, activePageId } = get();
        if (pages.length <= 1) return;

        const pageIndex = pages.findIndex((p) => p.id === id);
        if (pageIndex === -1) return;

        const newPages = pages.filter((p) => p.id !== id);
        let newActiveId = activePageId;

        if (id === activePageId) {
          // 切换到相邻标签
          const nextIndex = Math.min(pageIndex, newPages.length - 1);
          newActiveId = newPages[nextIndex].id;
          useEditorStore.getState().loadSchema(newPages[nextIndex].schema);
        }

        set({
          pages: newPages,
          activePageId: newActiveId,
        });
      },

      switchPage: (id) => {
        const { pages, activePageId } = get();
        if (id === activePageId) return;

        const page = pages.find((p) => p.id === id);
        if (!page) return;

        // 保存当前页面
        get().saveCurrentPage();

        set({ activePageId: id });

        // 加载目标页面
        useEditorStore.getState().loadSchema(page.schema);
      },

      renamePage: (id, name) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        }));
      },

      reorderPages: (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;
        set((state) => {
          const newPages = [...state.pages];
          const [page] = newPages.splice(fromIndex, 1);
          newPages.splice(toIndex, 0, page);
          return { pages: newPages };
        });
      },

      saveCurrentPage: () => {
        const { activePageId } = get();
        const editorState = useEditorStore.getState();

        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === activePageId
              ? {
                  ...p,
                  schema: {
                    page: editorState.page,
                    elements: editorState.elements,
                  },
                }
              : p
          ),
        }));
      },

      getActivePage: () => {
        const { pages, activePageId } = get();
        return pages.find((p) => p.id === activePageId);
      },

      setCurrentPageId: (id) => set({ currentPageId: id }),

      setPageName: (name) => {
        const { activePageId } = get();
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === activePageId ? { ...p, name } : p
          ),
        }));
      },
    }),
    {
      name: 'ai-lowcode-pages',
    }
  )
);
