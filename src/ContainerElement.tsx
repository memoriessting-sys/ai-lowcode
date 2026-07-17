// src/components/elements/ContainerElement.tsx

import React from 'react';
import type { ContainerProps } from '../../types/schema';

interface ContainerElementProps {
  props: ContainerProps;
  children?: React.ReactNode;
}

export const ContainerElement: React.FC<ContainerElementProps> = ({
  props,
  children,
}) => {
  const {
    backgroundColor,
    borderRadius = 0,
    borderColor,
    borderWidth = 0,
  } = props;

  return (
    <div
      className="w-full h-full overflow-hidden"
      style={{
        position: 'relative',
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        borderColor: borderColor || 'transparent',
        borderWidth: `${borderWidth}px`,
        borderStyle: borderWidth > 0 ? 'solid' : 'none',
      }}
    >
      {children}
    </div>
  );
};