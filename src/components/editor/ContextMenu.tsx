// src/components/editor/ContextMenu.tsx

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Trash2, MoveUp, MoveDown, Eye, EyeOff, Edit } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface ContextMenuProps {
  x: number;
  y: number;
  elementId: string;
  onClose: () => void;
  onEdit?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, elementId, onClose }) => {
  const { t } = useTranslation('editor');
  const { elements, duplicateElement, removeElement, reorderElements, toggleElementVisibility } = useEditorStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const element = elements.find(el => el.id === elementId);
  const elementIndex = elements.findIndex(el => el.id === elementId);
  const isVisible = element?.visible !== false;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleCopy = () => {
    duplicateElement(elementId);
    onClose();
  };

  const handleDelete = () => {
    removeElement(elementId);
    onClose();
  };

  const handleMoveUp = () => {
    if (elementIndex < elements.length - 1) {
      reorderElements(elementIndex, elementIndex + 1);
    }
    onClose();
  };

  const handleMoveDown = () => {
    if (elementIndex > 0) {
      reorderElements(elementIndex, elementIndex - 1);
    }
    onClose();
  };

  const handleToggleVisibility = () => {
    toggleElementVisibility(elementId);
    onClose();
  };

  const handleSelectAll = () => {
    const allIds = elements.map(el => el.id);
    useEditorStore.setState({ selectedIds: allIds, selectedId: null });
    onClose();
  };

  const handleEdit = () => {
    // Element is already selected (right-click selects it),
    // the PropertyPanel shows automatically when selected
    onClose();
  };

  // 调整菜单位置，确保不超出屏幕
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 160),
    top: Math.min(y, window.innerHeight - 200),
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]"
    >
      <button
        onClick={handleEdit}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Edit size={14} />
        {t('contextMenu.edit')}
      </button>
      <button
        onClick={handleCopy}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Copy size={14} />
        {t('contextMenu.copy')}
      </button>
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <Trash2 size={14} />
        {t('contextMenu.delete')}
      </button>
      <div className="border-t my-1" />
      <button
        onClick={handleMoveUp}
        disabled={elementIndex >= elements.length - 1}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <MoveUp size={14} />
        {t('contextMenu.moveUp')}
      </button>
      <button
        onClick={handleMoveDown}
        disabled={elementIndex <= 0}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <MoveDown size={14} />
        {t('contextMenu.moveDown')}
      </button>
      <div className="border-t my-1" />
      <button
        onClick={handleToggleVisibility}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        {isVisible ? t('contextMenu.hideElement') : t('contextMenu.showElement')}
      </button>
      <button
        onClick={handleSelectAll}
        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        {t('contextMenu.selectAll')}
      </button>
    </div>
  );
};
