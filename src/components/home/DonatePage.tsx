// src/components/home/DonatePage.tsx

import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export function DonatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <h1 className="text-xl font-semibold text-gray-800">{t('donate.title')}</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t('donate.heading')}
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {t('donate.body')}
          </p>

          {/* QR Codes */}
          <div className="flex justify-center">
            <div className="border rounded-xl p-6">
              <img
                src="/wx.jpg"
                alt={t('donate.wechatPay')}
                className="w-40 h-40 rounded-lg mx-auto mb-4 object-cover"
              />
              <p className="text-sm text-gray-500">{t('donate.wechatScan')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
