// src/components/donate/DonateModal.tsx

import React from 'react';
import { X, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DonateModalProps {
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ onClose }) => {
  const { t } = useTranslation('home');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="text-white" size={24} />
              <h2 className="text-xl font-bold text-white">{t('donate.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 text-center">
            {t('donate.body')}
          </p>

          {/* Donation Options */}
          <div className="space-y-4">
            {/* WeChat Pay */}
            <div className="border rounded-lg p-4 hover:border-pink-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{t('donate.wechatIcon')}</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{t('donate.wechatPay')}</h3>
                  <p className="text-sm text-gray-500">{t('donate.wechatScan')}</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <img src="/wx.jpg" alt={t('donate.wechatPay')} className="w-32 h-32 mx-auto rounded-lg" />
              </div>
            </div>

            {/* Alipay - 暂时隐藏 */}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('donate.footerMotivation')} 💪
            </p>
            <a
              href="https://github.com/memoriessting-sys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-pink-500 hover:text-pink-600 text-sm"
            >
              <Heart size={14} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
