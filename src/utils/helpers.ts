// src/utils/helpers.ts

import type { Element, PageSchema } from '../types/schema';
import i18n from '../locales/i18n';

let elementIdCounter = 0;

export const generateElementId = (): string => {
  elementIdCounter += 1;
  return `elem_${Date.now()}_${elementIdCounter}`;
};

export const createTextElement = (
  x: number,
  y: number,
  content: string = ''
): Element => ({
  id: generateElementId(),
  type: 'text',
  x,
  y,
  width: 200,
  height: 40,
  props: {
    content: content || i18n.t('common:defaultContent.text'),
    fontSize: 16,
    color: '#333333',
  },
});

export const createImageElement = (
  x: number,
  y: number,
  src: string = ''
): Element => ({
  id: generateElementId(),
  type: 'image',
  x,
  y,
  width: 200,
  height: 150,
  props: {
    src,
    alt: i18n.t('common:defaultContent.image'),
  },
});

export const createButtonElement = (
  x: number,
  y: number,
  text: string = ''
): Element => ({
  id: generateElementId(),
  type: 'button',
  x,
  y,
  width: 120,
  height: 44,
  props: {
    text: text || i18n.t('common:defaultContent.button'),
    backgroundColor: '#1890ff',
    textColor: '#ffffff',
  },
});

export const createInputElement = (
  x: number,
  y: number,
  placeholder: string = ''
): Element => ({
  id: generateElementId(),
  type: 'input',
  x,
  y,
  width: 200,
  height: 36,
  props: {
    placeholder: placeholder || i18n.t('common:defaultContent.input'),
    borderColor: '#d9d9d9',
  },
});

export const createContainerElement = (
  x: number,
  y: number
): Element => ({
  id: generateElementId(),
  type: 'container',
  x,
  y,
  width: 300,
  height: 200,
  props: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  children: [],
});

export const createVideoElement = (
  x: number,
  y: number,
  src: string = ''
): Element => ({
  id: generateElementId(),
  type: 'video',
  x,
  y,
  width: 320,
  height: 180,
  props: {
    src,
    controls: true,
    autoplay: false,
    loop: false,
    muted: false,
  },
});

export const createAudioElement = (
  x: number,
  y: number,
  src: string = ''
): Element => ({
  id: generateElementId(),
  type: 'audio',
  x,
  y,
  width: 300,
  height: 50,
  props: {
    src,
    controls: true,
    autoplay: false,
    loop: false,
  },
});

export const createLinkElement = (
  x: number,
  y: number,
  text: string = '',
  href: string = '#'
): Element => ({
  id: generateElementId(),
  type: 'link',
  x,
  y,
  width: 100,
  height: 30,
  props: {
    text: text || i18n.t('common:defaultContent.link'),
    href,
    color: '#1890ff',
    fontSize: 14,
    underline: true,
  },
});

export const createDividerElement = (
  x: number,
  y: number
): Element => ({
  id: generateElementId(),
  type: 'divider',
  x,
  y,
  width: 200,
  height: 20,
  props: {
    color: '#e5e5e5',
    thickness: 1,
    style: 'solid',
  },
});

export const createIconElement = (
  x: number,
  y: number,
  name: string = 'Star'
): Element => ({
  id: generateElementId(),
  type: 'icon',
  x,
  y,
  width: 48,
  height: 48,
  props: {
    name,
    size: 32,
    color: '#1890ff',
  },
});

export const createCardElement = (
  x: number,
  y: number,
  title: string = '',
  content: string = ''
): Element => ({
  id: generateElementId(),
  type: 'card',
  x,
  y,
  width: 280,
  height: 160,
  props: {
    title: title || i18n.t('common:defaultContent.cardTitle'),
    content: content || i18n.t('common:defaultContent.cardContent'),
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderColor: '#e5e5e5',
    borderWidth: 1,
    titleColor: '#1a1a1a',
    contentColor: '#666666',
  },
});

export const createSelectElement = (
  x: number,
  y: number,
  options: string[] = []
): Element => ({
  id: generateElementId(),
  type: 'select',
  x,
  y,
  width: 200,
  height: 36,
  props: {
    options: options.length > 0 ? options : [i18n.t('common:defaultContent.selectOption', { number: 1 }), i18n.t('common:defaultContent.selectOption', { number: 2 }), i18n.t('common:defaultContent.selectOption', { number: 3 })],
    placeholder: i18n.t('common:defaultContent.selectPlaceholder'),
    borderColor: '#d9d9d9',
  },
});

export const createDefaultSchema = (): PageSchema => ({
  page: {
    id: 'page_1',
    width: 1200,
    height: 800,
    background: '#ffffff',
  },
  elements: [],
});

export const validateSchema = (schema: unknown): schema is PageSchema => {
  if (typeof schema !== 'object' || schema === null) return false;

  const obj = schema as Record<string, unknown>;

  if (typeof obj.page !== 'object' || obj.page === null) return false;
  if (!Array.isArray(obj.elements)) return false;

  return true;
};
