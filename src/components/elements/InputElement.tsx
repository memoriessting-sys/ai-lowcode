// src/components/elements/InputElement.tsx

import React from 'react';
import type { InputProps } from '../../types/schema';

interface InputElementProps {
  props: InputProps;
}

export const InputElement: React.FC<InputElementProps> = ({ props }) => {
  const {
    placeholder,
    borderColor,
    backgroundColor = '#ffffff',
  } = props;

  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full h-full px-2 outline-none"
      style={{
        borderColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor,
        borderRadius: '4px',
      }}
    />
  );
};