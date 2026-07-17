// src/components/home/TemplateMarket.tsx

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Image, Layout, X, ShoppingCart, GraduationCap, Building2, Briefcase, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTemplateStore, type Template, type TemplateCategory } from '../../store/templateStore';
import { useEditorStore } from '../../store/editorStore';
import { usePageStore } from '../../store/pageStore';

interface TemplateMarketProps {
  onBack: () => void;
  onUseTemplate: () => void;
}

const TEMPLATE_CATEGORIES: (TemplateCategory | 'all')[] = [
  'all',
  'ecommerce',
  'education',
  'corporate',
  'portfolio',
  'event',
  'general',
];

const categoryIcons: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  resume: FileText,
  poster: Image,
  general: Layout,
  ecommerce: ShoppingCart,
  education: GraduationCap,
  corporate: Building2,
  portfolio: Briefcase,
  event: Calendar,
};

export function TemplateMarket({ onBack, onUseTemplate }: TemplateMarketProps) {
  const { loading, fetchTemplates, useTemplate, selectedCategory, setCategory, getFilteredTemplates } = useTemplateStore();
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const { t } = useTranslation(['home', 'common']);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleUseTemplate = async (template: Template) => {
    setUsingTemplate(template.id);
    try {
      const result = await useTemplate(template.id);
      if (result) {
        // 加载模板 schema 到编辑器
        useEditorStore.getState().loadSchema(result.page_schema);
        // 更新页面名称
        usePageStore.getState().renamePage(usePageStore.getState().activePageId, result.name);
        // 重置 currentPageId（这是一个新页面）
        usePageStore.getState().setCurrentPageId(null);
        // 通知父组件
        onUseTemplate();
      } else {
        console.error('useTemplate returned null');
      }
    } catch (err) {
      console.error('handleUseTemplate error:', err);
    } finally {
      setUsingTemplate(null);
    }
  };

  const handlePreviewUse = async () => {
    if (!previewTemplate) return;
    setPreviewTemplate(null);
    await handleUseTemplate(previewTemplate);
  };

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{t('home:templateMarket.title')}</h1>
        </div>
      </header>

      {/* Category Filter - horizontally scrollable pill buttons */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto py-3 px-6">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t(`common:templateCategories.${cat}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {t('home:templateMarket.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const IconComponent = categoryIcons[template.category] || Layout;
              return (
                <div
                  key={template.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setPreviewTemplate(template)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {template.thumbnail_url ? (
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconComponent className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-white/90 rounded text-xs text-gray-600">
                        {t(`common:templateCategories.${template.category}`, t('common:templateCategories.general'))}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 mb-1">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {t('common:share.timesUsed', { count: template.use_count })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                        disabled={usingTemplate === template.id}
                        className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {usingTemplate === template.id ? t('common:buttons.loading') : t('common:buttons.use')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium">{previewTemplate.name}</h3>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                  {t(`common:templateCategories.${previewTemplate.category}`, t('common:templateCategories.general'))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviewUse}
                  disabled={usingTemplate === previewTemplate.id}
                  className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {usingTemplate === previewTemplate.id ? t('common:buttons.loading') : t('home:templateMarket.useTemplate')}
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              {previewTemplate.thumbnail_url ? (
                <img
                  src={previewTemplate.thumbnail_url}
                  alt={previewTemplate.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                  {(() => {
                    const IconComponent = categoryIcons[previewTemplate.category] || Layout;
                    return <IconComponent className="w-24 h-24" />;
                  })()}
                  <p className="text-sm">{t('home:templateMarket.noPreview')}</p>
                  {previewTemplate.description && (
                    <p className="text-sm text-gray-500 max-w-md text-center">{previewTemplate.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
