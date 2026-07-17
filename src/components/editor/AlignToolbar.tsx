// src/components/editor/AlignToolbar.tsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Grid3X3,
  Undo2,
  Redo2,
  Download,
  Palette,
  Share2,
  Link2,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { usePageStore } from '../../store/pageStore';
import { useAuthStore } from '../../store/authStore';
import { ColorPalette } from '../editor/ColorPalette';
import { ShareModal, ImportModal, ExportModal } from '../share';
import { TabBar } from '../layout/TabBar';

export const AlignToolbar: React.FC = () => {
  const { t } = useTranslation('editor');
  const { selectedIds, showGrid, alignElements, distributeElements, toggleGrid, past, future, undo, redo, elements } = useEditorStore();
  const { pages } = usePageStore();
  const { usage } = useAuthStore();
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const canAlign = selectedIds.length >= 2;
  const canDistribute = selectedIds.length >= 3;
  const hasElements = pages?.some((p) => p.schema?.elements?.length > 0) || false;
  const elementCount = elements?.length || 0;

  return (
    <>
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border-b">
        {/* 撤销/重做 */}
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('toolbar.undo')}
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('toolbar.redo')}
        >
          <Redo2 size={16} />
        </button>

        {/* AI 使用次数 */}
        {usage && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full ml-1">
            AI: {usage.remaining}/{usage.limit}
          </span>
        )}

        <div className="w-px h-4 bg-gray-200 mx-2" />

        {/* 对齐 */}
        <span className="text-xs text-gray-500 mr-1">{t('align.label')}</span>
        <button
          onClick={() => alignElements('left')}
          disabled={!canAlign}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.left')}
        >
          <AlignLeft size={16} />
        </button>
        <button
          onClick={() => alignElements('center')}
          disabled={!canAlign}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.horizontalCenter')}
        >
          <AlignCenter size={16} />
        </button>
        <button
          onClick={() => alignElements('right')}
          disabled={!canAlign}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.right')}
        >
          <AlignRight size={16} />
        </button>
        <button
          onClick={() => alignElements('top')}
          disabled={!canAlign}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.top')}
        >
          <AlignStartVertical size={16} />
        </button>
        <button
          onClick={() => alignElements('middle')}
          disabled={!canAlign}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.verticalCenter')}
        >
          <AlignCenterVertical size={16} />
        </button>
        <button
          onClick={() => alignElements('bottom')}
          disabled={!canAlign}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.bottom')}
        >
          <AlignEndVertical size={16} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* 分布 */}
        <span className="text-xs text-gray-500 mr-1">{t('align.distribute')}</span>
        <button
          onClick={() => distributeElements('horizontal')}
          disabled={!canDistribute}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.horizontalSpacing')}
        >
          <AlignHorizontalSpaceBetween size={16} />
        </button>
        <button
          onClick={() => distributeElements('vertical')}
          disabled={!canDistribute}
          className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('align.verticalSpacing')}
        >
          <AlignVerticalSpaceBetween size={16} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* 网格 */}
        <button
          onClick={toggleGrid}
          className={`p-1.5 rounded hover:bg-gray-200 ${showGrid ? 'bg-blue-100 text-blue-600' : ''}`}
          title={t('toolbar.showGrid')}
        >
          <Grid3X3 size={16} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-2" />

        {/* 功能按钮 */}
        <button
          onClick={() => setShowColorPalette(true)}
          disabled={elementCount === 0}
          className="flex items-center gap-1 px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          title={t('toolbar.smartColor')}
        >
          <Palette size={14} />
          {t('toolbar.colorBtn')}
        </button>
        <button
          onClick={() => setShowShare(true)}
          disabled={!hasElements}
          className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          title={t('toolbar.sharePage')}
        >
          <Share2 size={14} />
          {t('toolbar.shareBtn')}
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
          title={t('toolbar.importShare')}
        >
          <Link2 size={14} />
          {t('toolbar.importBtn')}
        </button>
        <button
          onClick={() => setShowExport(true)}
          disabled={!hasElements}
          className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
          title={t('toolbar.exportPage')}
        >
          <Download size={14} />
          {t('toolbar.exportBtn')}
        </button>
      </div>

      {/* 多页标签 */}
      <TabBar />

      {/* Modals */}
      {showColorPalette && <ColorPalette onClose={() => setShowColorPalette(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </>
  );
};
