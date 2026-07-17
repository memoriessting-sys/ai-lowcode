// src/components/elements/ButtonElement.tsx

import React from 'react';
import type { ButtonProps } from '../../types/schema';
import { usePageStore } from '../../store/pageStore';
import { useTranslation } from 'react-i18next';

interface ButtonElementProps {
  props: ButtonProps;
  readOnly?: boolean;
}

export const ButtonElement: React.FC<ButtonElementProps> = ({ props, readOnly }) => {
  const { text, backgroundColor, textColor, borderRadius = 4, linkTo } = props;
  const { switchPage } = usePageStore();
  const { t } = useTranslation('common');

  const handleClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (linkTo) {
      e.stopPropagation();
      switchPage(linkTo);
    }
  };

  return (
    <button
      className="w-full h-full cursor-pointer"
      style={{
        backgroundColor,
        color: textColor,
        borderRadius: `${borderRadius}px`,
        border: 'none',
      }}
      onClick={handleClick}
      title={linkTo ? t('defaultContent.clickToJump') : undefined}
    >
      {text}
    </button>
  );
};