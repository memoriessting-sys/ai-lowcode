// src/components/elements/CardElement.tsx

import type { CardProps } from '../../types/schema';

interface CardElementProps {
  props: CardProps;
}

export const CardElement: React.FC<CardElementProps> = ({ props }) => {
  return (
    <div
      className="w-full h-full flex flex-col p-4"
      style={{
        backgroundColor: props.backgroundColor,
        borderRadius: props.borderRadius || 8,
        border: props.borderColor ? `${props.borderWidth || 1}px solid ${props.borderColor}` : 'none',
      }}
    >
      <h3
        className="font-bold mb-2"
        style={{ color: props.titleColor || '#1a1a1a' }}
      >
        {props.title}
      </h3>
      <p
        className="flex-1 text-sm"
        style={{ color: props.contentColor || '#666666' }}
      >
        {props.content}
      </p>
    </div>
  );
};