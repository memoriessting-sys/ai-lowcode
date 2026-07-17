// src/components/canvas/ElementWrapper.tsx

import React, { useCallback, useState, useMemo } from 'react';
import Draggable from 'react-draggable';
import type { DraggableEvent, DraggableData } from 'react-draggable';
import type { Element } from '../../types/schema';
import { ResizeHandles } from './ResizeHandles';
import type { HandlePosition } from './ResizeHandles';
import { useEditorStore } from '../../store/editorStore';
import { ContextMenu } from '../editor/ContextMenu';
import { useLocation } from 'react-router-dom';

interface ElementWrapperProps {
  element: Element;
  children: React.ReactNode;
  readOnly?: boolean;
}

export const ElementWrapper: React.FC<ElementWrapperProps> = ({
  element,
  children,
  readOnly = false,
}) => {
  const { selectedIds, hoveredId, selectElement, toggleSelectElement, updateElement, setHoveredId, page } = useEditorStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const location = useLocation();
  const isSelected = selectedIds.includes(element.id);
  const isHovered = hoveredId === element.id;
  const isVisible = element.visible !== false;

  // 从 URL 获取编辑器类型
  const editorType = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('type') || 'general';
  }, [location.search]);

  // 是否启用边界限制（通用编辑器启用）
  const enableBounds = editorType === 'general';

  // 如果元素不可见，不渲染
  if (!isVisible) {
    return null;
  }

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+点击：多选切换
        toggleSelectElement(element.id);
      } else {
        // 单击：单选
        selectElement(element.id);
      }
    },
    [element.id, selectElement, toggleSelectElement]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectElement(element.id);
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    [element.id, selectElement]
  );

  // 计算元素边界限制（通用编辑器：限制左、上、右，下不限制）
  const getBoundedPosition = useCallback((x: number, y: number, width: number, _height: number) => {
    if (!enableBounds || !page) {
      return { x, y };
    }

    const pageWidth = page.width || 1200;

    // 只限制左、上、右边界，下边界不限制
    const boundedX = Math.max(0, Math.min(x, pageWidth - width));
    const boundedY = Math.max(0, y); // 只限制上边界，下边界不限制

    return { x: boundedX, y: boundedY };
  }, [enableBounds, page]);

  // Draggable 的 bounds 限制
  const dragBounds = useMemo(() => {
    if (!enableBounds || !page) {
      return undefined;
    }
    const pageWidth = page.width || 1200;
    return {
      left: 0,
      top: 0,
      right: pageWidth - element.width,
      bottom: Infinity, // 不限制下边界
    };
  }, [enableBounds, page, element.width]);

  const handleDrag = useCallback(
    (_e: DraggableEvent, data: DraggableData) => {
      // 如果是多选，移动所有选中的元素
      if (selectedIds.length > 1 && selectedIds.includes(element.id)) {
        selectedIds.forEach((id) => {
          const el = useEditorStore.getState().elements.find((e) => e.id === id);
          if (el) {
            const newX = el.x + data.deltaX;
            const newY = el.y + data.deltaY;

            // 应用边界限制
            const bounded = getBoundedPosition(newX, newY, el.width, el.height);

            useEditorStore.getState().updateElement(id, {
              x: bounded.x,
              y: bounded.y,
            });
          }
        });
      } else {
        const newX = element.x + data.deltaX;
        const newY = element.y + data.deltaY;

        // 应用边界限制
        const bounded = getBoundedPosition(newX, newY, element.width, element.height);

        updateElement(element.id, {
          x: bounded.x,
          y: bounded.y,
        });
      }
    },
    [element.id, element.x, element.y, element.width, element.height, updateElement, selectedIds, getBoundedPosition]
  );

  const handleResize = useCallback(
    (delta: { x: number; y: number }, handle: HandlePosition) => {
      let newX = element.x;
      let newY = element.y;
      let newWidth = element.width;
      let newHeight = element.height;

      // 根据控制点位置计算新尺寸
      if (handle.includes('left')) {
        newX += delta.x;
        newWidth -= delta.x;
      }
      if (handle.includes('right')) {
        newWidth += delta.x;
      }
      if (handle.includes('top')) {
        newY += delta.y;
        newHeight -= delta.y;
      }
      if (handle.includes('bottom')) {
        newHeight += delta.y;
      }

      // 最小尺寸限制
      if (newWidth >= 20 && newHeight >= 20) {
        // 边界限制（通用编辑器）
        if (enableBounds && page) {
          const pageWidth = page.width || 1200;
          // 左边界限制
          if (newX < 0) {
            newWidth = newWidth + newX;
            newX = 0;
          }
          // 右边界限制
          if (newX + newWidth > pageWidth) {
            newWidth = pageWidth - newX;
          }
          // 上边界限制
          if (newY < 0) {
            newHeight = newHeight + newY;
            newY = 0;
          }
          // 下边界不限制
        }

        // 再次检查最小尺寸
        if (newWidth >= 20 && newHeight >= 20) {
          updateElement(element.id, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          });
        }
      }
    },
    [element, updateElement, enableBounds, page]
  );

  const nodeRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      <Draggable
        nodeRef={nodeRef}
        position={{ x: element.x, y: element.y }}
        onDrag={handleDrag}
        disabled={readOnly || !isSelected}
        bounds={dragBounds}
      >
        <div
          ref={nodeRef}
          className="absolute"
          style={{
            width: element.width,
            height: element.height,
          }}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onMouseEnter={() => setHoveredId(element.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* 选中边框 */}
          {isSelected && (
            <div
              className="absolute inset-0 border-2 border-blue-500 pointer-events-none"
              style={{ zIndex: 1 }}
            />
          )}

          {/* 悬停高亮边框 */}
          {isHovered && !isSelected && (
            <div
              className="absolute inset-0 border-2 border-blue-300 pointer-events-none"
              style={{ zIndex: 1 }}
            />
          )}

          {/* 元素内容 */}
          <div className="w-full h-full overflow-hidden">{children}</div>

          {/* 缩放控制点 */}
          {!readOnly && isSelected && selectedIds.length === 1 && <ResizeHandles onResize={handleResize} />}
        </div>
      </Draggable>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={element.id}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};