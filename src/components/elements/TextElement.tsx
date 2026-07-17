// src/components/elements/TextElement.tsx

import React from 'react';
import type { TextProps } from '../../types/schema';

interface TextElementProps {
  props: TextProps;
}

export const TextElement: React.FC<TextElementProps> = ({ props }) => {
  const {
    content,
    fontSize,
    color,
    fontWeight = 'normal',
    textAlign = 'left',
  } = props;

  return (
    <div
      className="w-full h-full flex items-center overflow-hidden"
      style={{
        fontSize: `${fontSize}px`,
        color,
        fontWeight,
      }}
    >
      <div
        className="w-full"
        style={{
          textAlign,
        }}
      >
        {content}
      </div>
    </div>
  );
};