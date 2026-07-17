// src/components/library/LayerItem.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, X, Type, Image, Square, MinusSquare, SquareStack, Video, Music, Link, Minus, Star, CreditCard, ChevronDown } from 'lucide-react';
import type { ElementType } from '../../types/schema';

interface LayerItemProps {
  id: string;
  type: ElementType;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onHover: (id: string | null) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const elementIcons: Record<ElementType, React.ReactNode> = {
  text: <Type size={16} />,
  image: <Image size={16} />,
  button: <Square size={16} />,
  input: <MinusSquare size={16} />,
  container: <SquareStack size={16} />,
  video: <Video size={16} />,
  audio: <Music size={16} />,
  link: <Link size={16} />,
  divider: <Minus size={16} />,
  icon: <Star size={16} />,
  card: <CreditCard size={16} />,
  select: <ChevronDown size={16} />,
};

export const LayerItem: React.FC<LayerItemProps> = ({
  id,
  type,
  isSelected,
  isHovered,
  onSelect,
  onDelete,
  onHover,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const { t } = useTranslation(['editor', 'common']);
  const elementName = `${t('common:elementLabels.' + type)} ${id.slice(-4)}`;

  const getBackgroundColor = () => {
    if (isSelected) return 'bg-blue-100';
    if (isHovered) return 'bg-gray-100';
    return '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // 设置元素 ID，用于拖到聊天框
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'copy';
    // 调用原来的拖动处理（用于图层排序）
    onDragStart(e);
  };

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm ${getBackgroundColor()}`}
      onClick={onSelect}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      draggable
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag handle */}
      <div className="text-gray-400 cursor-grab" title={t('editor:layerPanel.dragToChat')}>
        <GripVertical size={16} />
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-gray-500 hover:text-red-500"
        aria-label={t('editor:layerPanel.deleteElement')}
      >
        <X size={16} />
      </button>

      {/* Element type icon */}
      <div className="text-gray-600">
        {elementIcons[type]}
      </div>

      {/* Element name */}
      <span>
        {elementName}
      </span>
    </div>
  );
};
