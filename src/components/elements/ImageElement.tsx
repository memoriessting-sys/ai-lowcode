// src/components/elements/ImageElement.tsx

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { ImageProps } from '../../types/schema';
import { useTranslation } from 'react-i18next';

interface ImageElementProps {
  props: ImageProps;
}

export const ImageElement: React.FC<ImageElementProps> = ({ props }) => {
  const { src, alt, objectFit = 'cover' } = props;
  const [error, setError] = useState(false);
  const { t } = useTranslation('common');

  // 如果没有图片地址或加载失败，显示占位符
  if (!src || error) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
        <ImageIcon size={32} />
        <span className="text-xs mt-1">{alt || t('defaultContent.image')}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full"
      style={{ objectFit }}
      draggable={false}
      onError={() => setError(true)}
    />
  );
};