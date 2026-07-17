// src/store/editorStore.ts

import { create } from 'zustand';
import type { PageSchema, Element, PageConfig } from '../types/schema';

interface Snapshot {
  page: PageConfig;
  elements: Element[];
}

interface EditorState {
  // 状态
  page: PageConfig;
  elements: Element[];
  selectedId: string | null;
  selectedIds: string[]; // 多选
  hoveredId: string | null;
  showGrid: boolean; // 显示网格
  isLoadingFromHistory: boolean; // 是否正在从历史记录加载

  // 历史记录
  past: Snapshot[];
  future: Snapshot[];

  // 页面操作
  setPage: (page: PageConfig) => void;
  setElements: (elements: Element[]) => void;
  loadSchema: (schema: PageSchema) => void;
  setIsLoadingFromHistory: (loading: boolean) => void;

  // 元素操作
  addElement: (element: Element) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  updateElementProps: (id: string, props: Partial<Element['props']>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void; // 复制元素
  clearElements: () => void; // 清空所有元素

  // 选中操作
  selectElement: (id: string | null) => void;
  toggleSelectElement: (id: string) => void; // 切换多选
  clearSelection: () => void;

  // 悬停操作
  setHoveredId: (id: string | null) => void;

  // 图层操作
  toggleElementVisibility: (id: string) => void;
  reorderElements: (fromIndex: number, toIndex: number) => void;

  // 对齐操作
  alignElements: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeElements: (direction: 'horizontal' | 'vertical') => void;

  // 网格操作
  toggleGrid: () => void;

  // 历史操作
  undo: () => void;
  redo: () => void;
  saveSnapshot: () => void;
}

const initialPage: PageConfig = {
  id: 'page_1',
  width: 1200,
  height: 800,
  background: '#ffffff',
};

let snapshotTimer: ReturnType<typeof setTimeout> | null = null;

export const useEditorStore = create<EditorState>((set, get) => ({
  // 初始状态
  page: initialPage,
  elements: [],
  selectedId: null,
  selectedIds: [],
  hoveredId: null,
  showGrid: false,
  isLoadingFromHistory: false,
  past: [],
  future: [],

  // 页面操作
  setPage: (page) => {
    get().saveSnapshot();
    set({ page });
  },

  setElements: (elements) => {
    get().saveSnapshot();
    set({ elements });
  },

  clearElements: () => {
    get().saveSnapshot();
    set({ elements: [], selectedId: null, selectedIds: [] });
  },

  setIsLoadingFromHistory: (loading) => {
    set({ isLoadingFromHistory: loading });
  },

  loadSchema: (schema) => {
    // 过滤无效元素（没有 id 的元素），并规范化 props 字段名
    // AI 返回的字段名可能与组件期望的不一致，需要映射
    const validElements = (schema.elements || []).filter((el: Element) => el && el.id).map(normalizeElementProps);
    set({
      page: schema.page,
      elements: validElements,
      selectedId: null,
      selectedIds: [],
      hoveredId: null,
      past: [],
      future: [],
    });
  },

  // 元素操作
  addElement: (element) => {
    get().saveSnapshot();
    set((state) => ({
      elements: [...state.elements, element],
    }));
  },

  updateElement: (id, updates) => {
    get().saveSnapshot();
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  updateElementProps: (id, props) => {
    get().saveSnapshot();
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, props: { ...el.props, ...props } } : el
      ),
    }));
  },

  removeElement: (id) => {
    get().saveSnapshot();
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
  },

  duplicateElement: (id) => {
    const { elements } = get();
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    get().saveSnapshot();
    const newId = `elem_${Date.now()}`;
    const newElement: Element = {
      ...element,
      id: newId,
      x: element.x + 20,
      y: element.y + 20,
    };

    set((state) => ({
      elements: [...state.elements, newElement],
      selectedId: newId,
      selectedIds: [newId],
    }));
  },

  // 选中操作
  selectElement: (id) => {
    set({
      selectedId: id,
      selectedIds: id ? [id] : [],
    });
  },

  toggleSelectElement: (id) => {
    const { selectedIds, selectedId } = get();
    if (selectedIds.includes(id)) {
      const newIds = selectedIds.filter((sid) => sid !== id);
      set({
        selectedIds: newIds,
        selectedId: newIds.length === 1 ? newIds[0] : selectedId,
      });
    } else {
      set({
        selectedIds: [...selectedIds, id],
        selectedId: id,
      });
    }
  },

  clearSelection: () => {
    set({ selectedId: null, selectedIds: [] });
  },

  // 悬停操作
  setHoveredId: (id) => {
    set({ hoveredId: id });
  },

  // 图层操作
  toggleElementVisibility: (id) => {
    get().saveSnapshot();
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, visible: el.visible === false ? true : false } : el
      ),
    }));
  },

  reorderElements: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    get().saveSnapshot();
    set((state) => {
      const newElements = [...state.elements];
      const [element] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, element);
      return { elements: newElements };
    });
  },

  // 对齐操作
  alignElements: (alignment) => {
    const { elements, selectedIds } = get();
    if (selectedIds.length < 2) return;

    const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
    if (selectedElements.length < 2) return;

    get().saveSnapshot();

    let updates: { id: string; x?: number; y?: number }[] = [];

    switch (alignment) {
      case 'left': {
        const minX = Math.min(...selectedElements.map((el) => el.x));
        updates = selectedElements.map((el) => ({ id: el.id, x: minX }));
        break;
      }
      case 'center': {
        const centerX = selectedElements.reduce((sum, el) => sum + el.x + el.width / 2, 0) / selectedElements.length;
        updates = selectedElements.map((el) => ({ id: el.id, x: Math.round(centerX - el.width / 2) }));
        break;
      }
      case 'right': {
        const maxRight = Math.max(...selectedElements.map((el) => el.x + el.width));
        updates = selectedElements.map((el) => ({ id: el.id, x: maxRight - el.width }));
        break;
      }
      case 'top': {
        const minY = Math.min(...selectedElements.map((el) => el.y));
        updates = selectedElements.map((el) => ({ id: el.id, y: minY }));
        break;
      }
      case 'middle': {
        const centerY = selectedElements.reduce((sum, el) => sum + el.y + el.height / 2, 0) / selectedElements.length;
        updates = selectedElements.map((el) => ({ id: el.id, y: Math.round(centerY - el.height / 2) }));
        break;
      }
      case 'bottom': {
        const maxBottom = Math.max(...selectedElements.map((el) => el.y + el.height));
        updates = selectedElements.map((el) => ({ id: el.id, y: maxBottom - el.height }));
        break;
      }
    }

    set((state) => ({
      elements: state.elements.map((el) => {
        const update = updates.find((u) => u.id === el.id);
        return update ? { ...el, ...update } : el;
      }),
    }));
  },

  distributeElements: (direction) => {
    const { elements, selectedIds } = get();
    if (selectedIds.length < 3) return;

    const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
    if (selectedElements.length < 3) return;

    get().saveSnapshot();

    if (direction === 'horizontal') {
      const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
      const minX = sorted[0].x;
      const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
      const totalGap = maxX - minX - totalWidth;
      const gap = totalGap / (sorted.length - 1);

      let currentX = minX;
      const updates = sorted.map((el) => {
        const result = { id: el.id, x: currentX };
        currentX += el.width + gap;
        return result;
      });

      set((state) => ({
        elements: state.elements.map((el) => {
          const update = updates.find((u) => u.id === el.id);
          return update ? { ...el, ...update } : el;
        }),
      }));
    } else {
      const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
      const minY = sorted[0].y;
      const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
      const totalGap = maxY - minY - totalHeight;
      const gap = totalGap / (sorted.length - 1);

      let currentY = minY;
      const updates = sorted.map((el) => {
        const result = { id: el.id, y: currentY };
        currentY += el.height + gap;
        return result;
      });

      set((state) => ({
        elements: state.elements.map((el) => {
          const update = updates.find((u) => u.id === el.id);
          return update ? { ...el, ...update } : el;
        }),
      }));
    }
  },

  // 网格操作
  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  // 历史操作
  saveSnapshot: () => {
    if (snapshotTimer) clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(() => {
      const { page, elements, past } = get();
      const snapshot: Snapshot = {
        page: JSON.parse(JSON.stringify(page)),
        elements: JSON.parse(JSON.stringify(elements)),
      };
      set({
        past: [...past.slice(-49), snapshot], // 保留最近50条
        future: [],
      });
    }, 300);
  },

  undo: () => {
    const { past, future, page, elements } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const snapshot: Snapshot = { page, elements };

    set({
      page: previous.page,
      elements: previous.elements,
      past: newPast,
      future: [snapshot, ...future],
    });
  },

  redo: () => {
    const { past, future, page, elements } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const snapshot: Snapshot = { page, elements };

    set({
      page: next.page,
      elements: next.elements,
      past: [...past, snapshot],
      future: newFuture,
    });
  },
}));

// 规范化元素 props 字段名
// AI 系统提示词中定义的字段名与组件 TypeScript 类型不一致
// 这里做映射，确保 AI 返回的数据能正确渲染
function normalizeElementProps(el: Element): Element {
  if (!el.props || typeof el.props !== 'object') return el;

  const props = { ...el.props } as Record<string, unknown>;

  switch (el.type) {
    case 'text':
      // AI 返回 "text"，组件期望 "content"
      if ('text' in props && !('content' in props)) {
        props.content = props.text;
        delete props.text;
      }
      break;

    case 'button':
      // AI 返回 "background"，组件期望 "backgroundColor"
      if ('background' in props && !('backgroundColor' in props)) {
        props.backgroundColor = props.background;
        delete props.background;
      }
      // AI 返回 "color"，组件期望 "textColor"
      if ('color' in props && !('textColor' in props)) {
        props.textColor = props.color;
        delete props.color;
      }
      break;

    case 'input':
      // AI 返回 "border"，组件期望 "borderColor"
      if ('border' in props && !('borderColor' in props)) {
        props.borderColor = props.border;
        delete props.border;
      }
      // AI 返回 "background"，组件期望 "backgroundColor"
      if ('background' in props && !('backgroundColor' in props)) {
        props.backgroundColor = props.background;
        delete props.background;
      }
      break;

    case 'container':
      // AI 返回 "background"，组件期望 "backgroundColor"
      if ('background' in props && !('backgroundColor' in props)) {
        props.backgroundColor = props.background;
        delete props.background;
      }
      break;

    case 'card':
      // AI 返回 "background"，组件期望 "backgroundColor"
      if ('background' in props && !('backgroundColor' in props)) {
        props.backgroundColor = props.background;
        delete props.background;
      }
      break;

    case 'select':
      // AI 返回 "border"，组件期望 "borderColor"
      if ('border' in props && !('borderColor' in props)) {
        props.borderColor = props.border;
        delete props.border;
      }
      // AI 返回 "background"，组件期望 "backgroundColor"
      if ('background' in props && !('backgroundColor' in props)) {
        props.backgroundColor = props.background;
        delete props.background;
      }
      break;
  }

  // 递归处理 container 的 children
  if (el.type === 'container' && 'children' in el && Array.isArray((el as any).children)) {
    return {
      ...el,
      props: props as Element['props'],
      children: (el as any).children.map(normalizeElementProps),
    } as Element;
  }

  return { ...el, props: props as Element['props'] };
}