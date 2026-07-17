// src/components/share/ExportModal.tsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Download, Loader2, FileText, FileArchive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageStore } from '../../store/pageStore';
import { useEditorStore } from '../../store/editorStore';
import { downloadZip, downloadHtml } from '../../utils/exportHtml';
import { trackStep, trackExport, UserStep } from '../../lib/posthog';
import { type EditorType } from '../layout/Navbar';
import type { LucideIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { t } = useTranslation(['share', 'common']);
  const { pages, activePageId, saveCurrentPage } = usePageStore();
  const { page: _page, elements: _elements } = useEditorStore();
  const location = useLocation();
  const [scope, setScope] = useState<'current' | 'all'>('current');
  const [format, setFormat] = useState<'html' | 'pdf'>('html');
  const [loading, setLoading] = useState(false);
  const [editorType, setEditorType] = useState<EditorType>('general');

  // 从 URL 获取编辑器类型
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlType = searchParams.get('type') as EditorType | null;
    if (urlType === 'web' || urlType === 'general') {
      setEditorType(urlType);
      setFormat(urlType === 'web' ? 'html' : 'pdf');
    }
  }, [location.search]);

  // 监听编辑器类型变化事件
  useEffect(() => {
    const handleEditorTypeChange = (e: CustomEvent<EditorType>) => {
      setEditorType(e.detail);
      setFormat(e.detail === 'web' ? 'html' : 'pdf');
    };
    window.addEventListener('editor-type-change', handleEditorTypeChange as EventListener);
    return () => {
      window.removeEventListener('editor-type-change', handleEditorTypeChange as EventListener);
    };
  }, []);

  const activePage = pages.find(p => p.id === activePageId);

  const handleExport = async () => {
    setLoading(true);
    saveCurrentPage();
    trackStep(UserStep.CLICK_EXPORT);

    try {
      const { pages: latestPages } = usePageStore.getState();
      const { page: currentPage, elements: currentElements } = useEditorStore.getState();

      if (format === 'pdf') {
        // PDF 导出：使用 html2canvas 截图 + jsPDF 生成
        const pageConfig = currentPage || { id: 'page', width: 1200, height: 800, background: '#ffffff' };
        const pageElements = currentElements || [];

        // 创建临时容器来渲染内容
        const container = document.createElement('div');
        container.style.cssText = `position: fixed; left: -9999px; top: 0; width: ${pageConfig.width}px; min-height: ${pageConfig.height}px; height: auto; background: ${pageConfig.background || '#fff'}; overflow: visible;`;
        container.id = 'pdf-export-container';
        document.body.appendChild(container);

        // 渲染元素
        const elementsHtml = generateElementsHtml(pageElements);
        container.innerHTML = elementsHtml;

        // 等待 DOM 渲染
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          // 使用 html2canvas 截图
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            backgroundColor: pageConfig.background || '#ffffff',
            logging: false,
            width: pageConfig.width,
            height: pageConfig.height,
            windowWidth: pageConfig.width,
            windowHeight: pageConfig.height,
          });

          // 计算 PDF 尺寸
          const imgWidth = pageConfig.width;
          const imgHeight = pageConfig.height;

          // 判断横向还是纵向
          const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';

          // 创建 PDF
          const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [imgWidth, imgHeight],
          });

          // 将 canvas 转为图片
          const imgData = canvas.toDataURL('image/png');

          // 添加图片到 PDF
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

          // 下载 PDF
          const filename = `${activePage?.name || t('exportModal.fallbacks.page')}.pdf`;
          pdf.save(filename);

          alert(t('exportModal.pdfDownloaded'));
        } catch (err) {
          console.error('PDF generation failed:', err);
          alert(t('exportModal.pdfFailed'));
        } finally {
          // 清理临时容器
          document.body.removeChild(container);
        }

        trackStep(UserStep.EXPORT_SINGLE);
        trackExport('pdf', 1);
        setLoading(false);
        onClose();
      } else if (scope === 'current') {
        // 单个页面直接导出 HTML 文件
        const pageConfig = currentPage || { id: 'page', width: 1200, height: 800, background: '#ffffff' };
        const pageElements = currentElements || [];
        const pageName = activePage?.name || t('exportModal.fallbacks.page');

        const safeName = pageName.replace(/[<>:"/\\|?*]/g, '_');
        downloadHtml(pageConfig, pageElements, `${safeName}.html`);

        trackStep(UserStep.EXPORT_SINGLE);
        trackExport('single', 1);
        setLoading(false);
        onClose();
      } else {
        // 多个页面打包成 ZIP
        const pagesData = latestPages.map((p) => ({
          name: p.name,
          page: p.schema.page,
          elements: p.schema.elements,
        }));
        await downloadZip(pagesData, 'pages.zip');

        trackStep(UserStep.EXPORT_MULTI);
        trackExport('multi', pagesData.length);
        setLoading(false);
        onClose();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(t('exportModal.exportFailed', { message: (error as Error).message }));
      setLoading(false);
    }
  };

  // 生成元素的 HTML（用于 PDF 导出）
  const generateElementsHtml = (pageElements: any[]) => {
    return pageElements.map(el => {
      const baseStyle = `position: absolute; left: ${el.x}px; top: ${el.y}px; width: ${el.width}px; height: ${el.height}px;`;

      if (el.type === 'text') {
        const props = el.props || {};
        return `<div style="${baseStyle} font-size: ${props.fontSize || 16}px; color: ${props.color || '#333'}; font-weight: ${props.fontWeight || 'normal'}; text-align: ${props.textAlign || 'left'}; display: flex; align-items: center; white-space: pre-wrap; word-wrap: break-word;">${props.content || ''}</div>`;
      } else if (el.type === 'button') {
        const props = el.props || {};
        return `<div style="${baseStyle} background-color: ${props.backgroundColor || '#3b82f6'}; color: ${props.textColor || '#fff'}; border-radius: ${props.borderRadius || 4}px; display: flex; align-items: center; justify-content: center; font-size: ${props.fontSize || 14}px; font-weight: 500;">${props.text || t('exportModal.fallbacks.button')}</div>`;
      } else if (el.type === 'image') {
        const props = el.props || {};
        return `<img src="${props.src || ''}" style="${baseStyle} object-fit: ${props.objectFit || 'cover'}; border-radius: ${props.borderRadius || 0}px;" alt="${props.alt || ''}" crossorigin="anonymous" />`;
      } else if (el.type === 'container') {
        const props = el.props || {};
        return `<div style="${baseStyle} background-color: ${props.backgroundColor || 'transparent'}; border-radius: ${props.borderRadius || 0}px; border: ${props.borderWidth || 0}px solid ${props.borderColor || 'transparent'};"></div>`;
      } else if (el.type === 'divider') {
        const props = el.props || {};
        return `<div style="${baseStyle} display: flex; align-items: center;"><div style="width: 100%; border-top: ${props.thickness || 1}px ${props.style || 'solid'} ${props.color || '#ccc'};"></div></div>`;
      } else if (el.type === 'icon') {
        const props = el.props || {};
        return `<div style="${baseStyle} display: flex; align-items: center; justify-content: center; color: ${props.color || '#333'}; font-size: ${props.size || 24}px;">●</div>`;
      } else if (el.type === 'link') {
        const props = el.props || {};
        return `<a href="${props.href || '#'}" style="${baseStyle} color: ${props.color || '#3b82f6'}; font-size: ${props.fontSize || 14}px; text-decoration: ${props.underline ? 'underline' : 'none'}; display: flex; align-items: center;">${props.text || t('exportModal.fallbacks.link')}</a>`;
      } else if (el.type === 'input') {
        const props = el.props || {};
        return `<div style="${baseStyle} border: 1px solid ${props.borderColor || '#ddd'}; border-radius: ${props.borderRadius || 4}px; background-color: ${props.backgroundColor || '#fff'}; padding: 8px; color: #999;">${props.placeholder || t('exportModal.fallbacks.input')}</div>`;
      } else if (el.type === 'card') {
        const props = el.props || {};
        return `<div style="${baseStyle} background-color: ${props.backgroundColor || '#fff'}; border-radius: ${props.borderRadius || 8}px; border: ${props.borderWidth || 1}px solid ${props.borderColor || '#ddd'}; padding: 16px;"><div style="font-size: 16px; font-weight: bold; color: ${props.titleColor || '#333'};">${props.title || t('exportModal.fallbacks.title')}</div><div style="font-size: 14px; color: ${props.contentColor || '#666'}; margin-top: 8px;">${props.content || t('exportModal.fallbacks.content')}</div></div>`;
      } else if (el.type === 'video') {
        return `<div style="${baseStyle} background: #000; display: flex; align-items: center; justify-content: center; color: #fff;">${t('exportModal.fallbacks.video')}</div>`;
      } else if (el.type === 'audio') {
        return `<div style="${baseStyle} background: #f3f4f6; display: flex; align-items: center; justify-content: center; border-radius: 8px;">${t('exportModal.fallbacks.audio')}</div>`;
      } else if (el.type === 'select') {
        const props = el.props || {};
        return `<div style="${baseStyle} border: 1px solid ${props.borderColor || '#ddd'}; border-radius: 4px; background-color: #fff; padding: 8px; color: #333;">${props.placeholder || t('exportModal.fallbacks.select')} ▼</div>`;
      }
      return '';
    }).join('');
  };

  // 根据编辑器类型决定可用的导出格式
  const availableFormats: { value: 'html' | 'pdf'; label: string; icon: LucideIcon }[] = editorType === 'web'
    ? [{ value: 'html', label: 'HTML', icon: Download }]
    : [{ value: 'pdf', label: 'PDF', icon: FileText }];

  // ZIP 导出对所有编辑器都可用
  const showScopeOption = format === 'html';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[400px]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">{t('exportModal.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 编辑器类型提示 */}
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            {t('exportModal.currentEditor')}<span className="font-medium text-gray-700">
              {editorType === 'web' ? t('exportModal.webEditor') : t('exportModal.generalEditor')}
            </span>
          </div>

          {/* 导出格式 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">{t('exportModal.formatLabel')}</label>
            <div className="flex gap-2">
              {availableFormats.map((fmt) => {
                const IconComponent = fmt.icon;
                return (
                  <button
                    key={fmt.value}
                    onClick={() => setFormat(fmt.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                      format === fmt.value
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent size={14} className="inline mr-1" />
                    {fmt.label}
                  </button>
                );
              })}
              {/* ZIP 导出选项 */}
              <button
                onClick={() => {
                  setFormat('html');
                  setScope('all');
                }}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  format === 'html' && scope === 'all'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FileArchive size={14} className="inline mr-1" />
                ZIP
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {format === 'pdf' ? t('exportModal.formatDesc.pdf') :
               (scope === 'all' ? t('exportModal.formatDesc.zip', { count: pages.length }) : t('exportModal.formatDesc.html'))}
            </p>
          </div>

          {/* 导出范围 - 只在 HTML 格式时显示 */}
          {showScopeOption && (
            <div>
              <label className="block text-sm text-gray-600 mb-2">{t('exportModal.scopeLabel')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setScope('current')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                    scope === 'current'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('common:page.currentPage')}
                </button>
                <button
                  onClick={() => setScope('all')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border ${
                    scope === 'all'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('common:page.allPages', { count: pages.length })}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {scope === 'current'
                  ? t('exportModal.scopeDesc.current', { name: activePage?.name || t('common:page.currentPage') })
                  : t('exportModal.scopeDesc.all', { count: pages.length })}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
          >
            {t('common:buttons.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {t('common:buttons.export')}
          </button>
        </div>
      </div>
    </div>
  );
};
