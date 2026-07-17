// src/components/elements/SelectElement.tsx

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SelectProps } from '../../types/schema';

interface SelectElementProps {
  props: SelectProps;
}

export const SelectElement: React.FC<SelectElementProps> = ({ props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>('');

  return (
    <div className="w-full h-full relative">
      <button
        className="w-full h-full flex items-center justify-between px-3 text-sm"
        style={{
          borderColor: props.borderColor,
          backgroundColor: props.backgroundColor || '#fff',
          border: `1px solid ${props.borderColor}`,
          borderRadius: 4,
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {selected || props.placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 mt-1"
          style={{ borderColor: props.borderColor }}
        >
          {props.options.map((option, index) => (
            <button
              key={index}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                setSelected(option);
                setIsOpen(false);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};