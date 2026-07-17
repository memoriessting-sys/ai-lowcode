// src/components/elements/IconElement.tsx

import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { IconProps } from '../../types/schema';
import { useTranslation } from 'react-i18next';

interface IconElementProps {
  props: IconProps;
}

export const IconElement: React.FC<IconElementProps> = ({ props }) => {
  const { t } = useTranslation('common');
  const IconComponent = (icons as Record<string, LucideIcon>)[props.name];

  if (!IconComponent) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        {t('defaultContent.iconNotFound')}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <IconComponent size={props.size} color={props.color} />
    </div>
  );
};