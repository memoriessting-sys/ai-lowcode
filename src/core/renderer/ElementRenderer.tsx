// src/core/renderer/ElementRenderer.tsx

import React from 'react';
import type {
  Element,
  ContainerElement,
  TextProps,
  ImageProps,
  ButtonProps,
  InputProps,
  ContainerProps,
  VideoProps,
  AudioProps,
  LinkProps,
  DividerProps,
  IconProps,
  CardProps,
  SelectProps,
} from '../../types/schema';
import { ElementWrapper } from '../../components/canvas/ElementWrapper';
import {
  TextElement,
  ImageElement,
  ButtonElement,
  InputElement,
  ContainerElement as ContainerElementComponent,
  VideoElement,
  AudioElement,
  LinkElement,
  DividerElement,
  IconElement,
  CardElement,
  SelectElement,
} from '../../components/elements';

interface ElementRendererProps {
  element: Element;
  readOnly?: boolean;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ element, readOnly = false }) => {
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return <TextElement props={element.props as TextProps} />;
      case 'image':
        return <ImageElement props={element.props as ImageProps} />;
      case 'button':
        return <ButtonElement props={element.props as ButtonProps} readOnly={readOnly} />;
      case 'input':
        return <InputElement props={element.props as InputProps} />;
      case 'container':
        const containerEl = element as ContainerElement;
        return (
          <ContainerElementComponent props={element.props as ContainerProps}>
            {containerEl.children?.map((child) => (
              <ElementRenderer key={child.id} element={child} readOnly={readOnly} />
            ))}
          </ContainerElementComponent>
        );
      case 'video':
        return <VideoElement props={element.props as VideoProps} />;
      case 'audio':
        return <AudioElement props={element.props as AudioProps} />;
      case 'link':
        return <LinkElement props={element.props as LinkProps} readOnly={readOnly} />;
      case 'divider':
        return <DividerElement props={element.props as DividerProps} />;
      case 'icon':
        return <IconElement props={element.props as IconProps} />;
      case 'card':
        return <CardElement props={element.props as CardProps} />;
      case 'select':
        return <SelectElement props={element.props as SelectProps} />;
      default:
        return null;
    }
  };

  return <ElementWrapper element={element} readOnly={readOnly}>{renderContent()}</ElementWrapper>;
};