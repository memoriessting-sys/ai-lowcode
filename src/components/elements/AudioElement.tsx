// src/components/elements/AudioElement.tsx

import type { AudioProps } from '../../types/schema';
import { useTranslation } from 'react-i18next';

interface AudioElementProps {
  props: AudioProps;
}

export const AudioElement: React.FC<AudioElementProps> = ({ props: _props }) => {
  const { t } = useTranslation('common');
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
      <div className="text-gray-500 text-sm flex items-center gap-2">
        <span>🎵</span>
        <span>{t('defaultContent.audioPlayer')}</span>
      </div>
    </div>
  );
};
