// src/components/elements/VideoElement.tsx

import type { VideoProps } from '../../types/schema';
import { useTranslation } from 'react-i18next';

interface VideoElementProps {
  props: VideoProps;
}

export const VideoElement: React.FC<VideoElementProps> = ({ props: _props }) => {
  const { t } = useTranslation('common');
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded">
      <div className="text-white text-sm flex items-center gap-2">
        <span>🎬</span>
        <span>{t('defaultContent.videoPlayer')}</span>
      </div>
    </div>
  );
};
