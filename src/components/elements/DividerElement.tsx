// src/components/elements/DividerElement.tsx

import type { DividerProps } from '../../types/schema';

interface DividerElementProps {
  props: DividerProps;
}

export const DividerElement: React.FC<DividerElementProps> = ({ props }) => {
  return (
    <div className="w-full h-full flex items-center">
      <div
        className="w-full"
        style={{
          borderTop: `${props.thickness}px ${props.style || 'solid'} ${props.color}`,
        }}
      />
    </div>
  );
};