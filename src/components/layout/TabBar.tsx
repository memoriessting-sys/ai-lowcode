// src/components/layout/TabBar.tsx

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus } from "lucide-react";
import { usePageStore } from "../../store/pageStore";
import { useEditorStore } from "../../store/editorStore";
import { NewPageModal } from "../editor/NewPageModal";

export const TabBar: React.FC = () => {
  const { t } = useTranslation('editor');
  const {
    pages,
    activePageId,
    deletePage,
    switchPage,
    renamePage,
    reorderPages,
  } = usePageStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [showNewPageModal, setShowNewPageModal] = useState(false);

  const canCreate = pages.length < 20;

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleRenameSubmit = () => {
    if (editingId && editName.trim()) {
      renamePage(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditName("");
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (pages.length > 1) {
      deletePage(id);
    }
  };

  // 拖拽排序
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setDropIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderPages(dragIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleCreatePage = (options: { orientation: 'landscape' | 'portrait'; name: string }) => {
    if (!canCreate) return;

    // 设置页面尺寸
    const width = options.orientation === 'portrait' ? 794 : 1123; // A4 像素尺寸 (96 DPI)
    const height = options.orientation === 'portrait' ? 1123 : 794;

    // 先保存当前页面
    usePageStore.getState().saveCurrentPage();

    // 生成新页面 ID
    const id = `page_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // 创建新页面
    const newPage = {
      id,
      name: options.name,
      schema: {
        page: {
          id,
          width,
          height,
          background: '#ffffff',
        },
        elements: [],
      },
      createdAt: Date.now(),
    };

    // 添加到 pages 并设为活跃
    usePageStore.setState((state) => ({
      pages: [...state.pages, newPage],
      activePageId: id,
    }));

    // 加载新页面到 editorStore
    useEditorStore.getState().loadSchema(newPage.schema);
  };

  return (
    <>
      <div className="flex items-center bg-gray-100 border-b px-2 h-8">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {pages.map((page, index) => (
            <div
              key={page.id}
              draggable={editingId !== page.id}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => switchPage(page.id)}
              onDoubleClick={() => handleDoubleClick(page.id, page.name)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer min-w-[100px] max-w-[160px] transition-colors ${
                page.id === activePageId
                  ? "bg-white text-gray-900 border-t border-l border-r border-gray-200 -mb-px"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              } ${dragIndex === index ? "opacity-50" : ""} ${
                dropIndex === index ? "border-l-2 border-l-blue-500" : ""
              }`}
            >
              {editingId === page.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none outline-none text-sm font-medium"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="text-sm font-medium truncate flex-1">
                    {page.name}
                  </span>
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => handleDelete(e, page.id)}
                      className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 rounded p-0.5 transition-opacity"
                      title={t('tabBar.close')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowNewPageModal(true)}
          disabled={!canCreate}
          className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
            !canCreate ? "opacity-40 cursor-not-allowed" : ""
          }`}
          title={canCreate ? t('tabBar.newPage') : t('tabBar.maxPages')}
        >
          <Plus size={16} />
        </button>
      </div>

      {showNewPageModal && (
        <NewPageModal
          onClose={() => setShowNewPageModal(false)}
          onCreate={handleCreatePage}
        />
      )}
    </>
  );
};
