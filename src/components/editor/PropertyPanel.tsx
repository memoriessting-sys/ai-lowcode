// src/components/editor/PropertyPanel.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, Copy, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../../store/editorStore';
import { usePageStore } from '../../store/pageStore';
import type { Element, TextProps, ImageProps, ButtonProps, InputProps, ContainerProps, VideoProps, AudioProps, LinkProps, DividerProps, IconProps, CardProps, SelectProps } from '../../types/schema';

// --- NumberInput with keyboard micro-adjust ---
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function NumberInput({ label, value, onChange, min, max }: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      onChange(min !== undefined ? Math.max(min, val) : val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = value + step;
      onChange(max !== undefined ? Math.min(max, next) : next);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = value - step;
      onChange(min !== undefined ? Math.max(min, next) : next);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <label className="text-xs text-gray-500 w-6 shrink-0">{label}</label>
      <input
        type="number"
        className="w-full border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={Math.round(value)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// --- Collapsible Section ---
interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100">
      <button
        className="w-full flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

// --- ColorInput ---
interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="mb-2">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="w-7 h-7 border rounded cursor-pointer p-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="flex-1 border rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// --- TextInput ---
interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

function TextInput({ label, value, onChange, placeholder, multiline, rows = 3 }: TextInputProps) {
  return (
    <div className="mb-2">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {multiline ? (
        <textarea
          className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

// --- SelectInput ---
interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectInput({ label, value, onChange, options }: SelectInputProps) {
  return (
    <div className="mb-2">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        className="w-full border rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// --- Main PropertyPanel ---
export const PropertyPanel: React.FC = () => {
  const { t } = useTranslation(['editor', 'common']);
  const { elements, selectedId, updateElement, updateElementProps, removeElement, duplicateElement } = useEditorStore();
  const { pages, activePageId } = usePageStore();
  const [localProps, setLocalProps] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileAccept, setFileAccept] = useState('image/*');

  const selectedElement = elements.find((el) => el.id === selectedId) as Element | undefined;

  useEffect(() => {
    if (selectedElement) {
      setLocalProps(selectedElement.props as Record<string, any>);
    }
  }, [selectedElement]);

  // 处理本地文件上传
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handlePropChange('src', dataUrl);
    };
    reader.readAsDataURL(file);
  }, [selectedElement]);

  const triggerFileUpload = useCallback((accept: string) => {
    setFileAccept(accept);
    // Use setTimeout to ensure the accept attribute is set before clicking
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 0);
  }, []);

  // 实时更新属性
  const handlePropChange = useCallback((key: string, value: any) => {
    setLocalProps((prev) => ({ ...prev, [key]: value }));
    if (selectedElement) {
      updateElementProps(selectedElement.id, { [key]: value });
    }
  }, [selectedElement, updateElementProps]);

  // 位置/尺寸更新
  const handlePositionChange = useCallback((key: 'x' | 'y' | 'width' | 'height', value: number) => {
    if (selectedElement) {
      updateElement(selectedElement.id, { [key]: value });
    }
  }, [selectedElement, updateElement]);

  const handleClose = () => {
    useEditorStore.getState().selectElement(null);
  };

  const handleDelete = () => {
    if (selectedElement) {
      removeElement(selectedElement.id);
    }
  };

  const handleDuplicate = () => {
    if (selectedElement) {
      duplicateElement(selectedElement.id);
    }
  };

  if (!selectedElement) return null;

  // 渲染内容属性（根据元素类型）
  const renderContentFields = () => {
    switch (selectedElement.type) {
      case 'text': {
        const props = localProps as Partial<TextProps>;
        return (
          <>
            <TextInput
              label={t('editor:text.content')}
              value={props.content || ''}
              onChange={(v) => handlePropChange('content', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:text.fontSize')}</label>
              <NumberInput
                label=""
                value={props.fontSize || 16}
                onChange={(v) => handlePropChange('fontSize', v)}
                min={8}
                max={200}
              />
            </div>
            <ColorInput
              label={t('editor:text.color')}
              value={props.color || '#333333'}
              onChange={(v) => handlePropChange('color', v)}
            />
            <SelectInput
              label={t('editor:text.align')}
              value={props.textAlign || 'left'}
              onChange={(v) => handlePropChange('textAlign', v)}
              options={[
                { value: 'left', label: t('editor:text.alignLeft') },
                { value: 'center', label: t('editor:text.alignCenter') },
                { value: 'right', label: t('editor:text.alignRight') },
              ]}
            />
            <SelectInput
              label={t('editor:text.fontWeight')}
              value={props.fontWeight || 'normal'}
              onChange={(v) => handlePropChange('fontWeight', v)}
              options={[
                { value: 'normal', label: t('editor:text.weightNormal') },
                { value: 'bold', label: t('editor:text.weightBold') },
              ]}
            />
          </>
        );
      }

      case 'image': {
        const props = localProps as Partial<ImageProps>;
        return (
          <>
            <TextInput
              label={t('editor:image.src')}
              value={props.src || ''}
              onChange={(v) => handlePropChange('src', v)}
              placeholder="https://example.com/image.png"
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:image.uploadHint')}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={fileAccept}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => triggerFileUpload('image/*')}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700"
              >
                <Upload size={14} />
                {t('editor:image.selectImage')}
              </button>
              {props.src && props.src.startsWith('data:') && (
                <p className="text-xs text-green-600 mt-1">{t('editor:image.uploadedImage')}</p>
              )}
            </div>
            <TextInput
              label={t('editor:image.alt')}
              value={props.alt || ''}
              onChange={(v) => handlePropChange('alt', v)}
            />
            <SelectInput
              label={t('editor:image.fillMode')}
              value={props.objectFit || 'cover'}
              onChange={(v) => handlePropChange('objectFit', v)}
              options={[
                { value: 'cover', label: t('editor:image.cover') },
                { value: 'contain', label: t('editor:image.contain') },
                { value: 'fill', label: t('editor:image.fill') },
              ]}
            />
          </>
        );
      }

      case 'button': {
        const props = localProps as Partial<ButtonProps>;
        return (
          <>
            <TextInput
              label={t('editor:button.text')}
              value={props.text || ''}
              onChange={(v) => handlePropChange('text', v)}
            />
            <ColorInput
              label={t('editor:button.bgColor')}
              value={props.backgroundColor || '#1890ff'}
              onChange={(v) => handlePropChange('backgroundColor', v)}
            />
            <ColorInput
              label={t('editor:button.textColor')}
              value={props.textColor || '#ffffff'}
              onChange={(v) => handlePropChange('textColor', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:button.borderRadius')}</label>
              <NumberInput
                label=""
                value={props.borderRadius || 4}
                onChange={(v) => handlePropChange('borderRadius', v)}
                min={0}
                max={100}
              />
            </div>
          </>
        );
      }

      case 'input': {
        const props = localProps as Partial<InputProps>;
        return (
          <>
            <TextInput
              label={t('editor:input.placeholder')}
              value={props.placeholder || ''}
              onChange={(v) => handlePropChange('placeholder', v)}
            />
            <ColorInput
              label={t('editor:input.borderColor')}
              value={props.borderColor || '#d9d9d9'}
              onChange={(v) => handlePropChange('borderColor', v)}
            />
            <ColorInput
              label={t('editor:input.bgColor')}
              value={props.backgroundColor || '#ffffff'}
              onChange={(v) => handlePropChange('backgroundColor', v)}
            />
          </>
        );
      }

      case 'container': {
        const props = localProps as Partial<ContainerProps>;
        return (
          <>
            <ColorInput
              label={t('editor:container.bgColor')}
              value={props.backgroundColor || '#f5f5f5'}
              onChange={(v) => handlePropChange('backgroundColor', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:container.borderRadius')}</label>
              <NumberInput
                label=""
                value={props.borderRadius || 0}
                onChange={(v) => handlePropChange('borderRadius', v)}
                min={0}
                max={100}
              />
            </div>
            <ColorInput
              label={t('editor:container.borderColor')}
              value={props.borderColor || '#e5e5e5'}
              onChange={(v) => handlePropChange('borderColor', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:container.borderWidth')}</label>
              <NumberInput
                label=""
                value={props.borderWidth || 0}
                onChange={(v) => handlePropChange('borderWidth', v)}
                min={0}
                max={20}
              />
            </div>
          </>
        );
      }

      case 'video': {
        const props = localProps as Partial<VideoProps>;
        return (
          <>
            <TextInput
              label={t('editor:video.src')}
              value={props.src || ''}
              onChange={(v) => handlePropChange('src', v)}
              placeholder="https://example.com/video.mp4"
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:video.uploadHint')}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={fileAccept}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => triggerFileUpload('video/*')}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700"
              >
                <Upload size={14} />
                {t('editor:video.selectVideo')}
              </button>
              {props.src && props.src.startsWith('data:') && (
                <p className="text-xs text-green-600 mt-1">{t('editor:video.uploadedVideo')}</p>
              )}
            </div>
          </>
        );
      }

      case 'audio': {
        const props = localProps as Partial<AudioProps>;
        return (
          <>
            <TextInput
              label={t('editor:audio.src')}
              value={props.src || ''}
              onChange={(v) => handlePropChange('src', v)}
              placeholder="https://example.com/audio.mp3"
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:audio.uploadHint')}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept={fileAccept}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => triggerFileUpload('audio/*')}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700"
              >
                <Upload size={14} />
                {t('editor:audio.selectAudio')}
              </button>
              {props.src && props.src.startsWith('data:') && (
                <p className="text-xs text-green-600 mt-1">{t('editor:audio.uploadedAudio')}</p>
              )}
            </div>
          </>
        );
      }

      case 'link': {
        const props = localProps as Partial<LinkProps>;
        return (
          <>
            <TextInput
              label={t('editor:link.text')}
              value={props.text || ''}
              onChange={(v) => handlePropChange('text', v)}
            />
            <TextInput
              label={t('editor:link.href')}
              value={props.href || ''}
              onChange={(v) => handlePropChange('href', v)}
              placeholder="https://example.com"
            />
            <ColorInput
              label={t('editor:link.textColor')}
              value={props.color || '#1890ff'}
              onChange={(v) => handlePropChange('color', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:link.fontSize')}</label>
              <NumberInput
                label=""
                value={props.fontSize || 14}
                onChange={(v) => handlePropChange('fontSize', v)}
                min={8}
                max={200}
              />
            </div>
            <SelectInput
              label={t('editor:link.underline')}
              value={props.underline ? 'true' : 'false'}
              onChange={(v) => handlePropChange('underline', v === 'true')}
              options={[
                { value: 'false', label: t('editor:link.noUnderline') },
                { value: 'true', label: t('editor:link.hasUnderline') },
              ]}
            />
          </>
        );
      }

      case 'divider': {
        const props = localProps as Partial<DividerProps>;
        return (
          <>
            <ColorInput
              label={t('editor:divider.color')}
              value={props.color || '#e5e5e5'}
              onChange={(v) => handlePropChange('color', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:divider.thickness')}</label>
              <NumberInput
                label=""
                value={props.thickness || 1}
                onChange={(v) => handlePropChange('thickness', v)}
                min={1}
                max={20}
              />
            </div>
            <SelectInput
              label={t('editor:divider.style')}
              value={props.style || 'solid'}
              onChange={(v) => handlePropChange('style', v)}
              options={[
                { value: 'solid', label: t('editor:divider.solid') },
                { value: 'dashed', label: t('editor:divider.dashed') },
                { value: 'dotted', label: t('editor:divider.dotted') },
              ]}
            />
          </>
        );
      }

      case 'icon': {
        const props = localProps as Partial<IconProps>;
        return (
          <>
            <TextInput
              label={t('editor:icon.name')}
              value={props.name || ''}
              onChange={(v) => handlePropChange('name', v)}
              placeholder="Star, Heart, Home..."
            />
            <p className="text-xs text-gray-400 mb-2 -mt-1">{t('editor:icon.commonHint')}</p>
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:icon.size')}</label>
              <NumberInput
                label=""
                value={props.size || 32}
                onChange={(v) => handlePropChange('size', v)}
                min={8}
                max={200}
              />
            </div>
            <ColorInput
              label={t('editor:icon.color')}
              value={props.color || '#1890ff'}
              onChange={(v) => handlePropChange('color', v)}
            />
          </>
        );
      }

      case 'card': {
        const props = localProps as Partial<CardProps>;
        return (
          <>
            <TextInput
              label={t('editor:card.title')}
              value={props.title || ''}
              onChange={(v) => handlePropChange('title', v)}
            />
            <TextInput
              label={t('editor:card.content')}
              value={props.content || ''}
              onChange={(v) => handlePropChange('content', v)}
              multiline
              rows={3}
            />
            <ColorInput
              label={t('editor:card.bgColor')}
              value={props.backgroundColor || '#ffffff'}
              onChange={(v) => handlePropChange('backgroundColor', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:card.borderRadius')}</label>
              <NumberInput
                label=""
                value={props.borderRadius || 8}
                onChange={(v) => handlePropChange('borderRadius', v)}
                min={0}
                max={100}
              />
            </div>
            <ColorInput
              label={t('editor:card.borderColor')}
              value={props.borderColor || '#e5e5e5'}
              onChange={(v) => handlePropChange('borderColor', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:card.borderWidth')}</label>
              <NumberInput
                label=""
                value={props.borderWidth || 1}
                onChange={(v) => handlePropChange('borderWidth', v)}
                min={0}
                max={20}
              />
            </div>
            <ColorInput
              label={t('editor:card.titleColor')}
              value={props.titleColor || '#333333'}
              onChange={(v) => handlePropChange('titleColor', v)}
            />
            <ColorInput
              label={t('editor:card.contentColor')}
              value={props.contentColor || '#666666'}
              onChange={(v) => handlePropChange('contentColor', v)}
            />
          </>
        );
      }

      case 'select': {
        const props = localProps as Partial<SelectProps>;
        return (
          <>
            <TextInput
              label={t('editor:select.options')}
              value={(props.options || []).join('\n')}
              onChange={(v) => handlePropChange('options', v.split('\n').filter(Boolean))}
              multiline
              rows={4}
              placeholder={t('common:defaultContent.selectOptionsPlaceholder')}
            />
            <TextInput
              label={t('editor:select.placeholder')}
              value={props.placeholder || ''}
              onChange={(v) => handlePropChange('placeholder', v)}
            />
            <ColorInput
              label={t('editor:select.borderColor')}
              value={props.borderColor || '#d9d9d9'}
              onChange={(v) => handlePropChange('borderColor', v)}
            />
            <ColorInput
              label={t('editor:select.bgColor')}
              value={props.backgroundColor || '#ffffff'}
              onChange={(v) => handlePropChange('backgroundColor', v)}
            />
          </>
        );
      }

      default:
        return null;
    }
  };

  // 渲染高级属性（页面跳转等）
  const renderAdvancedFields = () => {
    if (selectedElement.type === 'button') {
      const props = localProps as Partial<ButtonProps>;
      return (
        <SelectInput
          label={t('editor:advanced.pageJump')}
          value={props.linkTo || ''}
          onChange={(v) => {
            const selectedPage = pages.find(p => p.id === v);
            handlePropChange('linkTo', v);
            handlePropChange('linkToName', selectedPage?.name || '');
          }}
          options={[
            { value: '', label: t('editor:advanced.noJump') },
            ...pages.filter(p => p.id !== activePageId).map(page => ({
              value: page.id,
              label: page.name,
            })),
          ]}
        />
      );
    }

    if (selectedElement.type === 'link') {
      const props = localProps as Partial<LinkProps>;
      return (
        <SelectInput
          label={t('editor:advanced.pageJump')}
          value={props.linkTo || ''}
          onChange={(v) => {
            const selectedPage = pages.find(p => p.id === v);
            handlePropChange('linkTo', v);
            handlePropChange('linkToName', selectedPage?.name || '');
          }}
          options={[
            { value: '', label: t('editor:advanced.useLink') },
            ...pages.filter(p => p.id !== activePageId).map(page => ({
              value: page.id,
              label: page.name,
            })),
          ]}
        />
      );
    }

    return null;
  };

  // 渲染样式属性
  const renderStyleFields = () => {
    switch (selectedElement.type) {
      case 'text': {
        const props = localProps as Partial<TextProps>;
        return (
          <>
            <SelectInput
              label={t('editor:text.fontWeight')}
              value={props.fontWeight || 'normal'}
              onChange={(v) => handlePropChange('fontWeight', v)}
              options={[
                { value: 'normal', label: t('editor:text.weightNormal') },
                { value: 'bold', label: t('editor:text.weightBold') },
              ]}
            />
          </>
        );
      }
      case 'button': {
        const props = localProps as Partial<ButtonProps>;
        return (
          <>
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:button.borderRadius')}</label>
              <NumberInput
                label=""
                value={props.borderRadius || 4}
                onChange={(v) => handlePropChange('borderRadius', v)}
                min={0}
                max={100}
              />
            </div>
          </>
        );
      }
      case 'container': {
        const props = localProps as Partial<ContainerProps>;
        return (
          <>
            <ColorInput
              label={t('editor:container.borderColor')}
              value={props.borderColor || '#e5e5e5'}
              onChange={(v) => handlePropChange('borderColor', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:container.borderWidth')}</label>
              <NumberInput
                label=""
                value={props.borderWidth || 0}
                onChange={(v) => handlePropChange('borderWidth', v)}
                min={0}
                max={20}
              />
            </div>
          </>
        );
      }
      case 'card': {
        const props = localProps as Partial<CardProps>;
        return (
          <>
            <ColorInput
              label={t('editor:card.borderColor')}
              value={props.borderColor || '#e5e5e5'}
              onChange={(v) => handlePropChange('borderColor', v)}
            />
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">{t('editor:card.borderWidth')}</label>
              <NumberInput
                label=""
                value={props.borderWidth || 1}
                onChange={(v) => handlePropChange('borderWidth', v)}
                min={0}
                max={20}
              />
            </div>
            <ColorInput
              label={t('editor:card.titleColor')}
              value={props.titleColor || '#333333'}
              onChange={(v) => handlePropChange('titleColor', v)}
            />
            <ColorInput
              label={t('editor:card.contentColor')}
              value={props.contentColor || '#666666'}
              onChange={(v) => handlePropChange('contentColor', v)}
            />
          </>
        );
      }
      case 'input': {
        const props = localProps as Partial<InputProps>;
        return (
          <>
            <ColorInput
              label={t('editor:input.bgColor')}
              value={props.backgroundColor || '#ffffff'}
              onChange={(v) => handlePropChange('backgroundColor', v)}
            />
          </>
        );
      }
      case 'select': {
        const props = localProps as Partial<SelectProps>;
        return (
          <>
            <ColorInput
              label={t('editor:select.bgColor')}
              value={props.backgroundColor || '#ffffff'}
              onChange={(v) => handlePropChange('backgroundColor', v)}
            />
          </>
        );
      }
      case 'image': {
        const props = localProps as Partial<ImageProps>;
        return (
          <>
            <SelectInput
              label={t('editor:image.fillMode')}
              value={props.objectFit || 'cover'}
              onChange={(v) => handlePropChange('objectFit', v)}
              options={[
                { value: 'cover', label: t('editor:image.cover') },
                { value: 'contain', label: t('editor:image.contain') },
                { value: 'fill', label: t('editor:image.fill') },
              ]}
            />
          </>
        );
      }
      case 'link': {
        const props = localProps as Partial<LinkProps>;
        return (
          <>
            <SelectInput
              label={t('editor:link.underline')}
              value={props.underline ? 'true' : 'false'}
              onChange={(v) => handlePropChange('underline', v === 'true')}
              options={[
                { value: 'false', label: t('editor:link.noUnderline') },
                { value: 'true', label: t('editor:link.hasUnderline') },
              ]}
            />
          </>
        );
      }
      default:
        return null;
    }
  };

  const hasAdvanced = selectedElement.type === 'button' || selectedElement.type === 'link';
  const hasStyle = ['text', 'button', 'container', 'card', 'input', 'select', 'image', 'link'].includes(selectedElement.type);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
        <h3 className="text-sm font-medium text-gray-800">
          {t('editor:editElement', { type: t('common:elementLabels.' + selectedElement.type) })}
        </h3>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded hover:bg-gray-100"
          title={t('editor:actions.deselect')}
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Position & Size Section */}
        <Section title={t('editor:sections.position')} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="X"
              value={selectedElement.x}
              onChange={(v) => handlePositionChange('x', v)}
            />
            <NumberInput
              label="Y"
              value={selectedElement.y}
              onChange={(v) => handlePositionChange('y', v)}
            />
            <NumberInput
              label={t('editor:position.width')}
              value={selectedElement.width}
              onChange={(v) => handlePositionChange('width', Math.max(20, v))}
              min={20}
            />
            <NumberInput
              label={t('editor:position.height')}
              value={selectedElement.height}
              onChange={(v) => handlePositionChange('height', Math.max(20, v))}
              min={20}
            />
          </div>
        </Section>

        {/* Content Section */}
        <Section title={t('editor:sections.content')} defaultOpen={true}>
          {renderContentFields()}
        </Section>

        {/* Style Section */}
        {hasStyle && (
          <Section title={t('editor:sections.style')} defaultOpen={false}>
            {renderStyleFields()}
          </Section>
        )}

        {/* Advanced Section */}
        {hasAdvanced && (
          <Section title={t('editor:sections.advanced')} defaultOpen={false}>
            {renderAdvancedFields()}
            {selectedElement.type === 'button' && (
              <p className="text-xs text-gray-400 mt-1">{t('editor:advanced.pageJumpHint')}</p>
            )}
            {selectedElement.type === 'link' && (
              <p className="text-xs text-gray-400 mt-1">{t('editor:advanced.selectPageHint')}</p>
            )}
          </Section>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-3 py-2 border-t shrink-0">
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          title={t('editor:actions.copyElement')}
        >
          <Copy size={14} />
          {t('common:buttons.copy')}
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
          title={t('editor:actions.deleteElement')}
        >
          <Trash2 size={14} />
          {t('common:buttons.delete')}
        </button>
      </div>
    </div>
  );
};
