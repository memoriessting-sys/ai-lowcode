// src/types/schema.ts

export type ElementType = 'text' | 'image' | 'button' | 'input' | 'container' | 'video' | 'audio' | 'link' | 'divider' | 'icon' | 'card' | 'select';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextProps {
  content: string;
  fontSize: number;
  color: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageProps {
  src: string;
  alt: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface ButtonProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  borderRadius?: number;
  linkTo?: string; // 跳转目标页面ID（用于画布内跳转）
  linkToName?: string; // 跳转目标页面名称（用于导出HTML）
}

export interface InputProps {
  placeholder: string;
  borderColor: string;
  backgroundColor?: string;
}

export interface ContainerProps {
  backgroundColor: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

export interface VideoProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export interface AudioProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export interface LinkProps {
  text: string;
  href: string;
  color: string;
  fontSize: number;
  underline?: boolean;
  linkTo?: string; // 跳转目标页面ID（用于画布内跳转）
  linkToName?: string; // 跳转目标页面名称（用于导出HTML）
}

export interface DividerProps {
  color: string;
  thickness: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface IconProps {
  name: string;
  size: number;
  color: string;
}

export interface CardProps {
  title: string;
  content: string;
  backgroundColor: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  titleColor?: string;
  contentColor?: string;
}

export interface SelectProps {
  options: string[];
  placeholder: string;
  borderColor: string;
  backgroundColor?: string;
}

export type ElementProps = TextProps | ImageProps | ButtonProps | InputProps | ContainerProps | VideoProps | AudioProps | LinkProps | DividerProps | IconProps | CardProps | SelectProps;

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  props: ElementProps;
  visible?: boolean;  // 新增：是否可见，默认true
}

export interface ContainerElement extends BaseElement {
  type: 'container';
  children: Element[];
}

export type Element = BaseElement | ContainerElement;

export interface PageConfig {
  id: string;
  width: number;
  height: number;
  background: string;
}

export interface PageSchema {
  page: PageConfig;
  elements: Element[];
}