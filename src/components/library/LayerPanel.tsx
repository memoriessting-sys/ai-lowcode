// src/components/library/LayerPanel.tsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/editorStore';
import { LayerItem } from './LayerItem';

export const LayerPanel: React.FC = () => {
  const { t } = useTranslation('editor');
  const {
    elements,
    selectedId,
    hoveredId,
    selectElement,
    setHoveredId,
    removeElement,
    reorderElements,
  } = useEditorStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Reverse display: bottom layer at top
  const displayElements = [...(elements || [])].reverse();

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) return;

    const elementsArray = elements || [];
    // Convert display index to actual index
    const actualFromIndex = elementsArray.length - 1 - dragIndex;
    const actualToIndex = elementsArray.length - 1 - targetIndex;

    reorderElements(actualFromIndex, actualToIndex);
    setDragIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-3 py-2 border-b font-medium text-sm text-gray-700">
        {t('layerPanel.title')}
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayElements.length === 0 ? (
          <div className="p-3 text-sm text-gray-400 text-center">
            {t('layerPanel.empty')}
          </div>
        ) : (
          displayElements.filter(el => el && el.id).map((element, displayIndex) => (
            <LayerItem
              key={element.id}
              id={element.id}
              type={element.type}
              isSelected={selectedId === element.id}
              isHovered={hoveredId === element.id}
              onSelect={() => selectElement(element.id)}
              onDelete={() => removeElement(element.id)}
              onHover={setHoveredId}
              onDragStart={handleDragStart(displayIndex)}
              onDragOver={handleDragOver}
              onDrop={handleDrop(displayIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
};
