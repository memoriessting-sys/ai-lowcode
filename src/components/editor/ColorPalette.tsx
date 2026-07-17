// src/components/editor/ColorPalette.tsx

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Check, Settings } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

// 预设配色方案
const colorSchemes = [
  {
    key: 'freshBlue',
    primary: '#1890ff',
    secondary: '#69c0ff',
    background: '#e6f7ff',
    text: '#003a8c',
  },
  {
    key: 'vibrantOrange',
    primary: '#fa8c16',
    secondary: '#ffc069',
    background: '#fff7e6',
    text: '#ad4e00',
  },
  {
    key: 'natureGreen',
    primary: '#52c41a',
    secondary: '#95de64',
    background: '#f6ffed',
    text: '#237804',
  },
  {
    key: 'elegantPurple',
    primary: '#722ed1',
    secondary: '#b37feb',
    background: '#f9f0ff',
    text: '#391085',
  },
  {
    key: 'passionateRed',
    primary: '#f5222d',
    secondary: '#ff7875',
    background: '#fff1f0',
    text: '#a8071a',
  },
  {
    key: 'calmGray',
    primary: '#595959',
    secondary: '#8c8c8c',
    background: '#fafafa',
    text: '#262626',
  },
  {
    key: 'mintCyan',
    primary: '#13c2c2',
    secondary: '#5cdbd3',
    background: '#e6fffb',
    text: '#006d75',
  },
  {
    key: 'sunsetGold',
    primary: '#faad14',
    secondary: '#ffd666',
    background: '#fffbe6',
    text: '#ad6800',
  },
];

// 元素类型颜色配置
interface CustomColors {
  pageBackground: string;
  text: string;
  buttonBg: string;
  buttonText: string;
  inputBorder: string;
  inputBg: string;
  containerBg: string;
  containerBorder: string;
  linkColor: string;
  dividerColor: string;
  iconColor: string;
  cardBg: string;
  cardBorder: string;
  cardTitleColor: string;
  cardContentColor: string;
  selectBorder: string;
}

const defaultCustomColors: CustomColors = {
  pageBackground: '#ffffff',
  text: '#333333',
  buttonBg: '#1890ff',
  buttonText: '#ffffff',
  inputBorder: '#d9d9d9',
  inputBg: '#ffffff',
  containerBg: '#f5f5f5',
  containerBorder: '#d9d9d9',
  linkColor: '#1890ff',
  dividerColor: '#e5e5e5',
  iconColor: '#1890ff',
  cardBg: '#ffffff',
  cardBorder: '#d9d9d9',
  cardTitleColor: '#1a1a1a',
  cardContentColor: '#666666',
  selectBorder: '#d9d9d9',
};

interface ColorPaletteProps {
  onClose: () => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ onClose }) => {
  const { t } = useTranslation('editor');
  const { elements, page, setPage, updateElementProps } = useEditorStore();
  const [appliedScheme, setAppliedScheme] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customColors, setCustomColors] = useState<CustomColors>(defaultCustomColors);

  // 分析当前页面使用的颜色
  const currentColors = useMemo(() => {
    const colors: string[] = [page.background];
    elements.forEach((el) => {
      if ('color' in el.props) colors.push(el.props.color as string);
      if ('backgroundColor' in el.props) colors.push(el.props.backgroundColor as string);
      if ('textColor' in el.props) colors.push(el.props.textColor as string);
    });
    return [...new Set(colors)];
  }, [elements, page]);

  const applyScheme = (scheme: typeof colorSchemes[0]) => {
    // 更新页面背景
    setPage({ ...page, background: scheme.background });

    // 更新所有元素的颜色
    elements.forEach((el) => {
      const updates: Record<string, unknown> = {};

      if ('color' in el.props) {
        updates.color = scheme.text;
      }
      if ('backgroundColor' in el.props) {
        updates.backgroundColor = scheme.primary;
      }
      if ('textColor' in el.props) {
        updates.textColor = '#ffffff';
      }
      if ('background' in el.props) {
        updates.background = scheme.primary;
      }
      if ('borderColor' in el.props) {
        updates.borderColor = scheme.secondary;
      }

      if (Object.keys(updates).length > 0) {
        updateElementProps(el.id, updates);
      }
    });

    setAppliedScheme(scheme.key);
    setShowCustom(false);
  };

  const applyCustomColors = () => {
    // 更新页面背景
    setPage({ ...page, background: customColors.pageBackground });

    // 更新所有元素的颜色
    elements.forEach((el) => {
      const updates: Record<string, unknown> = {};

      switch (el.type) {
        case 'text':
          updates.color = customColors.text;
          break;
        case 'button':
          updates.backgroundColor = customColors.buttonBg;
          updates.textColor = customColors.buttonText;
          break;
        case 'input':
          updates.borderColor = customColors.inputBorder;
          updates.backgroundColor = customColors.inputBg;
          break;
        case 'container':
          updates.backgroundColor = customColors.containerBg;
          updates.borderColor = customColors.containerBorder;
          break;
        case 'link':
          updates.color = customColors.linkColor;
          break;
        case 'divider':
          updates.color = customColors.dividerColor;
          break;
        case 'icon':
          updates.color = customColors.iconColor;
          break;
        case 'card':
          updates.backgroundColor = customColors.cardBg;
          updates.borderColor = customColors.cardBorder;
          updates.titleColor = customColors.cardTitleColor;
          updates.contentColor = customColors.cardContentColor;
          break;
        case 'select':
          updates.borderColor = customColors.selectBorder;
          break;
      }

      if (Object.keys(updates).length > 0) {
        updateElementProps(el.id, updates);
      }
    });

    setAppliedScheme('custom');
  };

  const handleCustomColorChange = (key: keyof CustomColors, value: string) => {
    setCustomColors((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl p-4 w-[520px] max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette size={20} />
            {t('colorPalette.title')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">{t('colorPalette.currentPageColors')}</h4>
          <div className="flex flex-wrap gap-2">
            {currentColors.map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded border border-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">{t('colorPalette.selectScheme')}</h4>
          <div className="grid grid-cols-2 gap-3">
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.key}
                onClick={() => applyScheme(scheme)}
                className={`p-3 rounded-lg border-2 transition-all hover:border-blue-400 ${
                  appliedScheme === scheme.key && !showCustom ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t('colorPalette.schemes.' + scheme.key)}</span>
                  {appliedScheme === scheme.key && !showCustom && <Check size={16} className="text-blue-500" />}
                </div>
                <div className="flex gap-1">
                  <div
                    className="flex-1 h-6 rounded"
                    style={{ backgroundColor: scheme.primary }}
                  />
                  <div
                    className="flex-1 h-6 rounded"
                    style={{ backgroundColor: scheme.secondary }}
                  />
                  <div
                    className="flex-1 h-6 rounded border"
                    style={{ backgroundColor: scheme.background }}
                  />
                  <div
                    className="flex-1 h-6 rounded"
                    style={{ backgroundColor: scheme.text }}
                  />
                </div>
              </button>
            ))}

            {/* 自定义配色选项 */}
            <button
              onClick={() => setShowCustom(true)}
              className={`p-3 rounded-lg border-2 transition-all hover:border-blue-400 ${
                showCustom ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Settings size={14} />
                  {t('colorPalette.schemes.custom')}
                </span>
                {showCustom && <Check size={16} className="text-blue-500" />}
              </div>
              <div className="flex gap-1">
                <div className="flex-1 h-6 rounded bg-gradient-to-r from-red-400 via-green-400 to-blue-400" />
              </div>
            </button>
          </div>
        </div>

        {/* 自定义配色面板 */}
        {showCustom && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{t('colorPalette.customColors')}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.pageBg')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.pageBackground}
                  onChange={(e) => handleCustomColorChange('pageBackground', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.textColor')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.text}
                  onChange={(e) => handleCustomColorChange('text', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.btnBg')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.buttonBg}
                  onChange={(e) => handleCustomColorChange('buttonBg', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.btnText')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.buttonText}
                  onChange={(e) => handleCustomColorChange('buttonText', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.inputBorder')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.inputBorder}
                  onChange={(e) => handleCustomColorChange('inputBorder', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.inputBg')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.inputBg}
                  onChange={(e) => handleCustomColorChange('inputBg', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.containerBg')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.containerBg}
                  onChange={(e) => handleCustomColorChange('containerBg', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.containerBorder')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.containerBorder}
                  onChange={(e) => handleCustomColorChange('containerBorder', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.linkColor')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.linkColor}
                  onChange={(e) => handleCustomColorChange('linkColor', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.dividerColor')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.dividerColor}
                  onChange={(e) => handleCustomColorChange('dividerColor', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.iconColor')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.iconColor}
                  onChange={(e) => handleCustomColorChange('iconColor', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.cardBg')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.cardBg}
                  onChange={(e) => handleCustomColorChange('cardBg', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.cardBorder')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.cardBorder}
                  onChange={(e) => handleCustomColorChange('cardBorder', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.cardTitle')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.cardTitleColor}
                  onChange={(e) => handleCustomColorChange('cardTitleColor', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.cardContent')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.cardContentColor}
                  onChange={(e) => handleCustomColorChange('cardContentColor', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('colorPalette.elementColors.selectBorder')}</label>
                <input
                  type="color"
                  className="w-full h-7 border rounded"
                  value={customColors.selectBorder}
                  onChange={(e) => handleCustomColorChange('selectBorder', e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={applyCustomColors}
              className="mt-3 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              {t('colorPalette.applyCustom')}
            </button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          {t('colorPalette.applyTip')}
        </div>
      </div>
    </div>
  );
};
