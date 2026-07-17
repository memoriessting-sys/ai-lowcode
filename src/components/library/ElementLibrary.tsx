// src/components/library/ElementLibrary.tsx

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { ElementItem } from './ElementItem';
import { LayerPanel } from './LayerPanel';
import { type EditorType } from '../layout/Navbar';
import type { ElementType } from '../../types/schema';
import {
  createTextElement,
  createImageElement,
  createButtonElement,
  createInputElement,
  createContainerElement,
  createVideoElement,
  createAudioElement,
  createLinkElement,
  createDividerElement,
  createIconElement,
  createCardElement,
  createSelectElement,
} from '../../utils/helpers';

// 网页编辑器元素（支持 HTML 导出）
const webElementTypeKeys: ElementType[] = [
  'text', 'image', 'button', 'input', 'container', 'video', 'audio', 'link', 'divider', 'icon', 'card', 'select',
];

// 通用编辑器元素（支持 PDF 导出）
const generalElementTypeKeys: ElementType[] = [
  'text', 'image', 'container', 'divider', 'icon', 'card',
];

export const ElementLibrary: React.FC = () => {
  const { t } = useTranslation(['editor', 'common']);
  const { page, addElement } = useEditorStore();
  const location = useLocation();
  const [editorType, setEditorType] = useState<EditorType>('general');

  // 从 URL 获取编辑器类型
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlType = searchParams.get('type') as EditorType | null;
    if (urlType === 'web' || urlType === 'general') {
      setEditorType(urlType);
    }
  }, [location.search]);

  // 监听编辑器类型变化事件
  useEffect(() => {
    const handleEditorTypeChange = (e: CustomEvent<EditorType>) => {
      setEditorType(e.detail);
    };
    window.addEventListener('editor-type-change', handleEditorTypeChange as EventListener);
    return () => {
      window.removeEventListener('editor-type-change', handleEditorTypeChange as EventListener);
    };
  }, []);

  const elementTypeKeys = editorType === 'web' ? webElementTypeKeys : generalElementTypeKeys;

  const handleAddElement = (type: ElementType) => {
    // 在画布中心位置添加元素
    const centerX = (page.width - 200) / 2;
    const centerY = (page.height - 100) / 2;

    let element;
    switch (type) {
      case 'text':
        element = createTextElement(centerX, centerY);
        break;
      case 'image':
        element = createImageElement(centerX, centerY);
        break;
      case 'button':
        element = createButtonElement(centerX, centerY);
        break;
      case 'input':
        element = createInputElement(centerX, centerY);
        break;
      case 'container':
        element = createContainerElement(centerX, centerY);
        break;
      case 'video':
        element = createVideoElement(centerX, centerY);
        break;
      case 'audio':
        element = createAudioElement(centerX, centerY);
        break;
      case 'link':
        element = createLinkElement(centerX, centerY);
        break;
      case 'divider':
        element = createDividerElement(centerX, centerY);
        break;
      case 'icon':
        element = createIconElement(centerX, centerY);
        break;
      case 'card':
        element = createCardElement(centerX, centerY);
        break;
      case 'select':
        element = createSelectElement(centerX, centerY);
        break;
    }

    if (element) {
      addElement(element);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 元素库 */}
      <div className="px-3 py-2 border-b font-medium text-sm text-gray-700">
        {t('editor:elementLibrary.title')}
        {editorType === 'general' && (
          <span className="ml-2 text-xs text-gray-400">{t('editor:elementLibrary.pdfCompatible')}</span>
        )}
      </div>
      <div className="p-3 border-b overflow-y-auto max-h-[200px]">
        <div className="grid grid-cols-2 gap-2">
          {elementTypeKeys.map((type) => (
            <ElementItem
              key={type}
              type={type}
              label={t('common:elementLabels.' + type)}
              onClick={() => handleAddElement(type)}
            />
          ))}
        </div>
      </div>

      {/* 图层面板 */}
      <LayerPanel />
    </div>
  );
};
