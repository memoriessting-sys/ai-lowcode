// src/components/canvas/ResizeHandles.tsx

import React, { useState, useCallback } from 'react';

interface ResizeHandlesProps {
  onResize: (delta: { x: number; y: number }, handle: HandlePosition) => void;
}

export type HandlePosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

const handlePositions: { position: HandlePosition; cursor: string; style: React.CSSProperties }[] = [
  { position: 'top-left', cursor: 'nwse-resize', style: { top: -4, left: -4 } },
  { position: 'top', cursor: 'ns-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
  { position: 'top-right', cursor: 'nesw-resize', style: { top: -4, right: -4 } },
  { position: 'right', cursor: 'ew-resize', style: { top: '50%', right: -4, transform: 'translateY(-50%)' } },
  { position: 'bottom-right', cursor: 'nwse-resize', style: { bottom: -4, right: -4 } },
  { position: 'bottom', cursor: 'ns-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
  { position: 'bottom-left', cursor: 'nesw-resize', style: { bottom: -4, left: -4 } },
  { position: 'left', cursor: 'ew-resize', style: { top: '50%', left: -4, transform: 'translateY(-50%)' } },
];

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ onResize }) => {
  const [activeHandle, setActiveHandle] = useState<HandlePosition | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, position: HandlePosition) => {
      e.preventDefault();
      e.stopPropagation();
      setActiveHandle(position);
      setStartPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeHandle) return;

      const delta = {
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      };

      onResize(delta, activeHandle);
      setStartPos({ x: e.clientX, y: e.clientY });
    },
    [activeHandle, startPos, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  React.useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  return (
    <>
      {handlePositions.map(({ position, cursor, style }) => (
        <div
          key={position}
          className="absolute w-2 h-2 bg-white border-2 border-blue-500 rounded-sm z-10"
          style={{ cursor, ...style }}
          onMouseDown={(e) => handleMouseDown(e, position)}
        />
      ))}
    </>
  );
};
