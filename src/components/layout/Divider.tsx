// src/components/layout/Divider.tsx

import { useCallback, useState } from 'react';

interface DividerProps {
  onDrag: (delta: number) => void;
  direction?: 'left' | 'right';
}

export const Divider: React.FC<DividerProps> = ({ onDrag, direction = 'left' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = direction === 'left' ? e.clientX - startX : startX - e.clientX;
      onDrag(delta);
      setStartX(e.clientX);
    },
    [isDragging, startX, onDrag, direction]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全局事件监听
  if (typeof window !== 'undefined') {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }

  return (
    <div
      className={`
        w-1 cursor-col-resize flex-shrink-0 transition-colors
        ${isDragging ? 'bg-blue-400' : 'bg-transparent hover:bg-gray-200'}
      `}
      onMouseDown={handleMouseDown}
    />
  );
};
