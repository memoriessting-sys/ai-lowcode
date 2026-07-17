// src/components/library/ElementItem.tsx

import { Type, Image, Square, MinusSquare, SquareStack, Video, Music, Link, Minus, Star, CreditCard, ChevronDown } from 'lucide-react';
import type { ElementType } from '../../types/schema';

interface ElementItemProps {
  type: ElementType;
  label: string;
  onClick: () => void;
}

const elementIcons: Record<ElementType, React.ReactNode> = {
  text: <Type size={24} />,
  image: <Image size={24} />,
  button: <Square size={24} />,
  input: <MinusSquare size={24} />,
  container: <SquareStack size={24} />,
  video: <Video size={24} />,
  audio: <Music size={24} />,
  link: <Link size={24} />,
  divider: <Minus size={24} />,
  icon: <Star size={24} />,
  card: <CreditCard size={24} />,
  select: <ChevronDown size={24} />,
};

export const ElementItem: React.FC<ElementItemProps> = ({ type, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
      title={label}
    >
      <div className="text-gray-600">{elementIcons[type]}</div>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </button>
  );
};
