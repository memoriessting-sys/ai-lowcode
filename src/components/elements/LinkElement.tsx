// src/components/elements/LinkElement.tsx

import React from 'react';
import type { LinkProps } from '../../types/schema';
import { usePageStore } from '../../store/pageStore';
import { useTranslation } from 'react-i18next';

interface LinkElementProps {
  props: LinkProps;
  readOnly?: boolean;
}

export const LinkElement: React.FC<LinkElementProps> = ({ props, readOnly }) => {
  const { switchPage } = usePageStore();
  const { t } = useTranslation('common');

  const handleClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (props.linkTo) {
      e.stopPropagation();
      switchPage(props.linkTo);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center cursor-pointer"
      style={{
        color: props.color,
        fontSize: props.fontSize,
        textDecoration: props.underline ? 'underline' : 'none',
      }}
      onClick={handleClick}
      title={props.linkTo ? t('defaultContent.clickToJump') : undefined}
    >
      {props.text}
    </div>
  );
};