// src/components/canvas/Canvas.tsx

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { ElementRenderer } from '../../core/renderer/ElementRenderer';
import { useTranslation } from 'react-i18next';

interface CanvasProps {
  readOnly?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({ readOnly = false }) => {
  const { page, elements, clearSelection, showGrid } = useEditorStore();
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { t } = useTranslation('common');

  // 从 URL 获取编辑器类型
  const editorType = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('type') || 'general';
  }, [location.search]);

  // 是否是通用编辑器
  const isGeneralEditor = editorType === 'general';

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // 只有点击画布背景时才清除选择
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-content')) {
      clearSelection();
    }
  }, [clearSelection]);

  const pageWidth = page?.width || 1200;
  const pageHeight = page?.height || 800;

  // 计算画布实际需要的高度
  const canvasHeight = useMemo(() => {
    const maxElementY = (elements || []).reduce((max, el) => {
      const bottom = (el?.y || 0) + (el?.height || 0);
      return bottom > max ? bottom : max;
    }, 0);

    return Math.max(pageHeight, maxElementY + 100);
  }, [elements, pageHeight]);

  // 缩放控制
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
  const handleZoomReset = () => setZoom(1);

  // 键盘快捷键缩放
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative h-full flex flex-col">
      {/* 缩放控制栏 */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-1 bg-white rounded-lg shadow px-2 py-1">
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
          title={t('defaultContent.zoomOut')}
        >
          −
        </button>
        <span className="text-xs text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
          title={t('defaultContent.zoomIn')}
        >
          +
        </button>
        <button
          onClick={handleZoomReset}
          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-xs"
          title={t('defaultContent.zoomReset')}
        >
          ⟲
        </button>
      </div>

      {/* 画布容器 */}
      <div
        ref={containerRef}
        className="flex-1 bg-gray-100 overflow-auto"
        onClick={handleCanvasClick}
      >
        <div
          className="canvas-content relative bg-white shadow-lg mx-auto my-8"
          style={{
            width: pageWidth,
            minHeight: canvasHeight,
            backgroundColor: page?.background || '#ffffff',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {/* 网格层 - 在元素上方 */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-50"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(229, 231, 235, 0.5) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(229, 231, 235, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />
          )}

          {/* 通用编辑器：显示页面右边界线 */}
          {isGeneralEditor && (
            <div
              className="absolute top-0 bottom-0 border-r-2 border-dashed border-blue-300 pointer-events-none z-30"
              style={{ left: pageWidth }}
            />
          )}

          {(elements || []).map((element) => (
            <ElementRenderer key={element.id} element={element} readOnly={readOnly} />
          ))}
        </div>
      </div>
    </div>
  );
};
